import express from 'express';
import { ragService } from '../services/ragService';
import { evolutionService } from '../services/evolutionService';
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

// Webhook para receber mensagens do WhatsApp
router.post('/webhook/:instance', async (req, res) => {
  try {
    const { instance } = req.params;
    const webhookData = req.body;

    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Verificar se é uma mensagem recebida (MESSAGES_UPSERT)
    if (webhookData.event === 'messages.upsert') {
      const message = webhookData.data;

      // Ignorar mensagens enviadas por nós mesmos
      if (message.key?.fromMe) {
        return res.status(200).json({ success: true, message: 'Message from me, ignored' });
      }

      // Extrair informações da mensagem
      const remoteJid = message.key?.remoteJid;
      const messageId = message.key?.id;
      const messageText =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        '';

      if (!messageText || !remoteJid) {
        return res.status(200).json({ success: true, message: 'No text message' });
      }

      // Marcar mensagem como lida
      await evolutionService.markMessageAsRead(instance, messageId, remoteJid);

      // Obter configurações
      const config = await getAppConfig();

      if (!config?.open_router_api_key) {
        await evolutionService.sendTextMessage(
          instance,
          remoteJid,
          '❌ Sistema não configurado. Por favor, configure a API Key do OpenRouter.',
        );
        return res.status(200).json({ success: true, message: 'API Key not configured' });
      }

      // Buscar documentos relevantes (RAG)
      const relevantDocs = await ragService.searchRelevantDocuments(messageText);
      const context = ragService.buildContextFromDocuments(relevantDocs);

      // Preparar mensagens para o LLM
      const messages = [
        {
          role: 'system',
          content: ragService.generatePromptWithContext(messageText, context, config.system_prompt),
        },
        {
          role: 'user',
          content: messageText,
        },
      ];

      // Chamar Open Router API
      const aiResponse = await callOpenRouterAPI(messages, config);

      // Enviar resposta via Evolution API
      await evolutionService.sendTextMessage(instance, remoteJid, aiResponse);

      // Salvar conversa no banco
      const convId = uuidv4();
      await pool.query(
        `INSERT INTO conversations (id, title, messages, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          convId,
          `WhatsApp: ${remoteJid} - ${messageText.substring(0, 50)}`,
          JSON.stringify([
            { role: 'user', content: messageText, timestamp: new Date(), from: remoteJid },
            { role: 'assistant', content: aiResponse, timestamp: new Date() },
          ]),
        ],
      );

      return res.status(200).json({
        success: true,
        message: 'Message processed successfully',
        conversationId: convId,
      });
    }

    // Outros eventos (CONNECTION_UPDATE, QRCODE_UPDATED, etc.)
    return res.status(200).json({ success: true, message: 'Event received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Endpoint para testar envio de mensagem
router.post('/send-test', async (req, res) => {
  try {
    const { instance, number, message } = req.body;

    if (!instance || !number || !message) {
      return res.status(400).json({
        success: false,
        error: 'instance, number e message são obrigatórios',
      });
    }

    const result = await evolutionService.sendTextMessage(instance, number, message);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;

