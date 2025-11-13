import { pool } from '../lib/database';

// Obter configurações da Evolution API
async function getEvolutionConfig() {
  const result = await pool.query('SELECT evolution_api_url, evolution_api_key FROM app_config WHERE id = 1');
  return result.rows[0];
}

// Enviar mensagem de texto via Evolution API
export async function sendTextMessage(instanceName: string, number: string, text: string) {
  try {
    const config = await getEvolutionConfig();

    if (!config?.evolution_api_url || !config?.evolution_api_key) {
      throw new Error('Evolution API não configurada');
    }

    const url = `${config.evolution_api_url}/message/sendText/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.evolution_api_key,
      },
      body: JSON.stringify({
        number: number,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message via Evolution API:', error);
    throw error;
  }
}

// Verificar se é um número WhatsApp válido
export async function checkIsWhatsApp(instanceName: string, number: string) {
  try {
    const config = await getEvolutionConfig();

    if (!config?.evolution_api_url || !config?.evolution_api_key) {
      throw new Error('Evolution API não configurada');
    }

    const url = `${config.evolution_api_url}/chat/checkIsWhatsapp/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.evolution_api_key,
      },
      body: JSON.stringify({
        number: number,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking WhatsApp number:', error);
    return false;
  }
}

// Marcar mensagem como lida
export async function markMessageAsRead(instanceName: string, messageId: string, remoteJid: string) {
  try {
    const config = await getEvolutionConfig();

    if (!config?.evolution_api_url || !config?.evolution_api_key) {
      throw new Error('Evolution API não configurada');
    }

    const url = `${config.evolution_api_url}/chat/markMessageAsRead/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.evolution_api_key,
      },
      body: JSON.stringify({
        read_messages: [
          {
            id: messageId,
            fromMe: false,
            remoteJid: remoteJid,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Failed to mark message as read');
    }

    return response.ok;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

export const evolutionService = {
  sendTextMessage,
  checkIsWhatsApp,
  markMessageAsRead,
};

