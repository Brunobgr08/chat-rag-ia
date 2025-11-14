/**
 * Configuração da aplicação
 *
 * Em desenvolvimento: usa localhost
 * Em produção: usa a variável de ambiente VITE_API_URL
 */

const isDevelopment = import.meta.env.DEV;

export const config = {
  // URL da API
  apiUrl: isDevelopment
    ? 'http://localhost:3001'
    : import.meta.env.VITE_API_URL || 'http://localhost:3001',

  // Configurações da aplicação
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Chat RAG IA',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Assistente Inteligente',
  },

  // Outras configurações
  environment: import.meta.env.MODE,
  isDevelopment,
  isProduction: import.meta.env.PROD,
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
};

// Helper para construir URLs da API
export const getApiUrl = (path: string) => {
  const baseUrl = config.apiUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Helper para logs de debug
export const debug = (...args: any[]) => {
  if (config.enableDebug) {
    console.log('[DEBUG]', ...args);
  }
};

export default config;
