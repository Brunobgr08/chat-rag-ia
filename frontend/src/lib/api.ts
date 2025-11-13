/**
 * API Client
 * 
 * Centraliza todas as chamadas de API da aplicação
 * Usa a configuração para determinar a URL base (localhost ou produção)
 */

import { getApiUrl } from '../config';

/**
 * Helper para fazer requisições HTTP
 */
async function request<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}

/**
 * API Client
 */
export const api = {
  // Health check
  health: () => request('/api/health'),

  // Config
  config: {
    get: () => request('/api/config'),
    save: (config: any) => request('/api/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    validateApiKey: (apiKey: string) => request('/api/config/validate-api-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    }),
  },

  // Chat
  chat: {
    send: (message: string, conversationId?: string | null) => 
      request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      }),
    getConversations: () => request('/api/chat/conversations'),
    getConversation: (id: string) => request(`/api/chat/conversations/${id}`),
    deleteConversation: (id: string) => request(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    }),
  },

  // Documents
  documents: {
    list: (page = 1, limit = 10) => 
      request(`/api/documents?page=${page}&limit=${limit}`),
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const url = getApiUrl('/api/documents/upload');
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      return response.json();
    },
    delete: (id: string) => request(`/api/documents/${id}`, {
      method: 'DELETE',
    }),
    stats: () => request('/api/documents/stats/summary'),
  },
};

export default api;

