import express from 'express';
import { ragService } from '../services/ragService';
import { pool } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Obter configurações atuais
async function getAppConfig() {
  const result = await pool.query('SELECT * FROM app_config WHERE id = 1');
  return result.rows[0];
}

// Serviço simples de chat com Open Router
async function callOpenRouterAPI(messages: any[], config: any) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.open_router_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.selected_model,
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Endpoint de chat com RAG
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Mensagem é obrigatória' });
    }

    // Obter configurações
    const config = await getAppConfig();

    if (!config?.open_router_api_key) {
      return res.status(400).json({
        success: false,
        error: 'Open Router API Key não configurada',
      });
    }

    // Buscar documentos relevantes
    const relevantDocs = await ragService.searchRelevantDocuments(message);
    const context = ragService.buildContextFromDocuments(relevantDocs);

    // Preparar mensagens para o LLM
    const messages = [
      {
        role: 'system',
        content: ragService.generatePromptWithContext(message, context, config.system_prompt),
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // Chamar Open Router API
    const response = await callOpenRouterAPI(messages, config);

    // Salvar conversa no banco
    const convId = conversationId || uuidv4();

    if (!conversationId) {
      // Nova conversa
      await client.query(
        `INSERT INTO conversations (id, title, messages, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          convId,
          message.substring(0, 50),
          JSON.stringify([
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() },
          ]),
        ],
      );
    } else {
      // Atualizar conversa existente
      const convResult = await client.query('SELECT messages FROM conversations WHERE id = $1', [
        convId,
      ]);

      if (convResult.rows.length > 0) {
        const existingMessages = convResult.rows[0].messages || [];
        existingMessages.push(
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() },
        );

        await client.query(
          'UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(existingMessages), convId],
        );
      }
    }

    res.json({
      success: true,
      data: {
        response,
        conversationId: convId,
        sources: relevantDocs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          relevance: doc.rank,
        })),
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  } finally {
    client.release();
  }
});

// Listar conversas
router.get('/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM conversations
       ORDER BY updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, (Number(page) - 1) * Number(limit)],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Buscar conversa específica
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
