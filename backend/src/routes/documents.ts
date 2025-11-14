import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import fs from 'fs/promises';
import { pool } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';
import envConfig from '../config/env';

const router = express.Router();

// Configuração do Multer para upload
const storage = multer.diskStorage({
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
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = envConfig.upload.allowedTypes;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`));
    }
  },
});

// Extrair texto de PDF
const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error('Erro ao extrair texto do PDF');
  }
};

// Extrair texto de arquivo de texto
const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
  try {
    const buffer = await fs.readFile(filePath);

    if (mimetype === 'text/markdown' || mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error('Tipo de arquivo não suportado');
  } catch (error) {
    throw new Error('Erro ao ler arquivo de texto');
  }
};

// Upload de documento
router.post('/upload', upload.single('document'), async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const { originalname, mimetype, size, path } = req.file;

    // Extrair texto baseado no tipo de arquivo
    let content = '';
    if (mimetype === 'application/pdf') {
      content = await extractTextFromPDF(path);
    } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
      content = await extractTextFromFile(path, mimetype);
    }

    if (!content.trim()) {
      throw new Error('Não foi possível extrair conteúdo do arquivo');
    }

    // Salvar no banco de dados
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

    // Limpar arquivo temporário
    await fs.unlink(path);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Documento processado com sucesso',
    });
  } catch (error) {
    console.error('Error uploading document:', error);

    // Limpar arquivo temporário em caso de erro
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
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
});

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
