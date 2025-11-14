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
  
  // Outras configurações
  environment: import.meta.env.MODE,
  isDevelopment,
  isProduction: import.meta.env.PROD,
};

// Helper para construir URLs da API
export const getApiUrl = (path: string) => {
  const baseUrl = config.apiUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export default config;

