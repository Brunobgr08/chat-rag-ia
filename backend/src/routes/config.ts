import express from 'express';
import { pool } from '../lib/database';

const router = express.Router();

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', contextLength: 8192 },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', contextLength: 4096 },
  { id: 'anthropic/claude-2', name: 'Claude 2', provider: 'Anthropic', contextLength: 100000 },
  { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B', provider: 'Meta', contextLength: 4096 },
  { id: 'google/palm-2-chat-bison', name: 'PaLM 2 Chat', provider: 'Google', contextLength: 4096 },
];

// Buscar configurações
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM app_config WHERE id = 1
    `);

    const defaultConfig = {
      open_router_api_key: '',
      selected_model: 'openai/gpt-3.5-turbo',
      system_prompt:
        'Você é um assistente útil que responde perguntas com base no contexto fornecido.',
      evolution_api_url: 'https://evodevs.cordex.ai',
      evolution_api_key: 'V0e3EBKbaJFnKREYfFCqOnoi904vAPV7',
    };

    const config = result.rows[0] || defaultConfig;

    res.json({
      success: true,
      data: config,
      availableModels: AVAILABLE_MODELS,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Salvar configurações
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      open_router_api_key,
      selected_model,
      system_prompt,
      evolution_api_url,
      evolution_api_key,
    } = req.body;

    await client.query('BEGIN');

    // Verificar se já existe configuração
    const checkResult = await client.query('SELECT id FROM app_config WHERE id = 1');

    let result;
    if (checkResult.rows.length > 0) {
      // Update
      result = await client.query(
        `
        UPDATE app_config
        SET open_router_api_key = $1, selected_model = $2, system_prompt = $3,
            evolution_api_url = $4, evolution_api_key = $5, updated_at = NOW()
        WHERE id = 1
        RETURNING *
      `,
        [open_router_api_key, selected_model, system_prompt, evolution_api_url, evolution_api_key],
      );
    } else {
      // Insert
      result = await client.query(
        `
        INSERT INTO app_config
        (id, open_router_api_key, selected_model, system_prompt, evolution_api_url, evolution_api_key)
        VALUES (1, $1, $2, $3, $4, $5)
        RETURNING *
      `,
        [open_router_api_key, selected_model, system_prompt, evolution_api_url, evolution_api_key],
      );
    }

    await client.query('COMMIT');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Validar API Key (mantido igual)
router.post('/validate-api-key', async (req, res) => {
  try {
    const { api_key } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      res.json({ success: true, valid: true, data: data.data });
    } else {
      res.json({ success: true, valid: false, error: 'Invalid API key' });
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    res.json({ success: false, valid: false, error: 'Validation failed' });
  }
});

export default router;
