import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import fs from 'fs/promises';
import { pool } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';
import envConfig from '../config/env';

const router = express.Router();

// Detectar ambiente Vercel
const isVercel = process.env.VERCEL === '1';

// Configuração do Multer para upload
// No Vercel, usar memoryStorage; localmente, usar diskStorage
const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = envConfig.upload.directory;
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    });

const upload = multer({
  storage,
  limits: {
    fileSize: envConfig.upload.maxFileSize,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 [Multer] Validando arquivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const allowedTypes = envConfig.upload.allowedTypes;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error('[Multer] Tipo de arquivo não permitido:', file.mimetype);
      cb(new Error(`Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`));
    }
  },
});

// Extrair texto de PDF (aceita Buffer ou caminho de arquivo)
const extractTextFromPDF = async (input: Buffer | string): Promise<string> => {
  try {
    const dataBuffer = typeof input === 'string' ? await fs.readFile(input) : input;
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error('Erro ao extrair texto do PDF');
  }
};

// Extrair texto de arquivo de texto (aceita Buffer ou caminho de arquivo)
const extractTextFromFile = async (input: Buffer | string, mimetype: string): Promise<string> => {
  try {
    const buffer = typeof input === 'string' ? await fs.readFile(input) : input;

    if (mimetype === 'text/markdown' || mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error('Tipo de arquivo não suportado');
  } catch (error) {
    throw new Error('Erro ao ler arquivo de texto');
  }
};

// Middleware para capturar erros do Multer
const handleMulterError = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    console.error('[Multer] Erro:', err.code, err.message);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Arquivo muito grande. Tamanho máximo: ${
          envConfig.upload.maxFileSize / 1024 / 1024
        }MB`,
      });
    }

    return res.status(400).json({
      success: false,
      error: `Erro no upload: ${err.message}`,
    });
  }

  if (err) {
    console.error('[Upload] Erro geral:', err.message);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
};

// Upload de documento
router.post(
  '/upload',
  upload.single('document'),
  handleMulterError,
  async (req: express.Request, res: express.Response) => {
    const client = await pool.connect();
    let tempFilePath: string | null = null;

    try {
      console.log('[Upload] Iniciando upload de documento...');
      console.log('[Upload] Ambiente Vercel:', isVercel);

      if (!req.file) {
        console.error('[Upload] Nenhum arquivo recebido');
        return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
      }

      const { originalname, mimetype, size } = req.file;
      console.log('[Upload] Arquivo recebido:', { originalname, mimetype, size });

      // Extrair texto baseado no tipo de arquivo
      let content = '';

      if (isVercel) {
        console.log('[Upload] Processando no Vercel (memoryStorage)');
        // No Vercel, usar buffer da memória
        if (!req.file.buffer) {
          throw new Error('Buffer do arquivo não disponível');
        }

        console.log('[Upload] Buffer size:', req.file.buffer.length);

        if (mimetype === 'application/pdf') {
          console.log('[Upload] Extraindo texto de PDF...');
          content = await extractTextFromPDF(req.file.buffer);
        } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
          console.log('[Upload] Extraindo texto de arquivo de texto...');
          content = await extractTextFromFile(req.file.buffer, mimetype);
        }
      } else {
        console.log('[Upload] Processando localmente (diskStorage)');
        // Localmente, usar arquivo no disco
        if (!req.file.path) {
          throw new Error('Caminho do arquivo não disponível');
        }

        tempFilePath = req.file.path;
        console.log('[Upload] Arquivo salvo em:', tempFilePath);

        if (mimetype === 'application/pdf') {
          console.log('[Upload] Extraindo texto de PDF...');
          content = await extractTextFromPDF(tempFilePath as string);
        } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
          console.log('[Upload] Extraindo texto de arquivo de texto...');
          content = await extractTextFromFile(tempFilePath as string, mimetype);
        }
      }

      console.log('[Upload] Texto extraído:', content.length, 'caracteres');

      if (!content.trim()) {
        throw new Error('Não foi possível extrair conteúdo do arquivo');
      }

      // Salvar no banco de dados
      console.log('[Upload] Salvando no banco de dados...');
      const result = await client.query(
        `INSERT INTO documents (name, type, content, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, type, created_at`,
        [
          originalname,
          mimetype,
          content,
          JSON.stringify({
            size,
            extracted: true,
            content_length: content.length,
            chunks: Math.ceil(content.length / 1000),
          }),
        ],
      );

      console.log('[Upload] Documento salvo com ID:', result.rows[0].id);

      // Limpar arquivo temporário (apenas local)
      if (tempFilePath) {
        console.log('[Upload] Limpando arquivo temporário...');
        await fs.unlink(tempFilePath);
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Documento processado com sucesso',
      });
    } catch (error) {
      console.error('[Upload] Erro ao processar documento:', error);
      console.error('[Upload] Stack:', error instanceof Error ? error.stack : 'N/A');

      // Limpar arquivo temporário em caso de erro (apenas local)
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    } finally {
      client.release();
    }
  },
);

// Listar documentos
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT id, name, type, metadata, created_at
       FROM documents
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM documents');

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Buscar documento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, type, content, metadata, created_at
       FROM documents
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Deletar documento
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const result = await client.query('DELETE FROM documents WHERE id = $1 RETURNING id, name', [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }

    res.json({
      success: true,
      message: 'Documento deletado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Estatísticas dos documentos
router.get('/stats/summary', async (req, res) => {
  try {
    const totalDocs = await pool.query('SELECT COUNT(*) FROM documents');
    const byType = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM documents
      GROUP BY type
    `);
    const totalContent = await pool.query(`
      SELECT SUM(LENGTH(content)) as total_chars
      FROM documents
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(totalDocs.rows[0].count),
        byType: byType.rows,
        totalChars: parseInt(totalContent.rows[0].total_chars || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
