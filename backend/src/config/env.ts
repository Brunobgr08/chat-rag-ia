/**
 * Configuração centralizada de variáveis de ambiente
 *
 * Este arquivo centraliza todas as variáveis de ambiente usadas no backend,
 * fornecendo valores padrão e validação.
 */

import dotenv from 'dotenv';

dotenv.config();

// Helper para converter string para número
const toNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper para converter string para boolean
const toBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper para converter string separada por vírgula em array
const toArray = (value: string | undefined, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map((item) => item.trim());
};

export const config = {
  // ============================================
  // POSTGRESQL DATABASE
  // ============================================
  database: {
    host: process.env.PG_HOST || 'localhost',
    port: toNumber(process.env.PG_PORT, 5432),
    database: process.env.PG_DATABASE || 'rag_chat',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'password',
    ssl: toBoolean(process.env.PG_SSL, false),
  },

  // ============================================
  // SERVER CONFIGURATION
  // ============================================
  server: {
    port: toNumber(process.env.PORT, 3001),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || '',
    jsonLimit: process.env.JSON_LIMIT || '10mb',
  },

  // ============================================
  // CORS CONFIGURATION
  // ============================================
  cors: {
    origins: toArray(
      process.env.CORS_ORIGINS,
      ['http://localhost:5173', 'http://localhost:5174']
    ),
  },

  // ============================================
  // OPENROUTER API
  // ============================================
  openRouter: {
    apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    maxTokens: toNumber(process.env.OPENROUTER_MAX_TOKENS, 2000),
    temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
    validateUrl: process.env.OPENROUTER_VALIDATE_URL ||'https://openrouter.ai/api/v1/auth/key',
  },

  // ============================================
  // EVOLUTION API (WhatsApp)
  // ============================================
  evolution: {
    defaultApiUrl: process.env.DEFAULT_EVOLUTION_API_URL || 'https://evodevs.cordex.ai',
    defaultApiKey: process.env.DEFAULT_EVOLUTION_API_KEY || '',
  },

  // ============================================
  // FILE UPLOAD
  // ============================================
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: toNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024), // 10MB
    allowedTypes: toArray(
      process.env.ALLOWED_FILE_TYPES,
      ['application/pdf', 'text/plain', 'text/markdown']
    ),
  },

  // ============================================
  // DEFAULT APP CONFIG
  // ============================================
  defaults: {
    systemPrompt:
      process.env.DEFAULT_SYSTEM_PROMPT ||
      'Você é um assistente útil que responde perguntas com base no contexto fornecido.',
    model: process.env.DEFAULT_MODEL || 'openai/gpt-3.5-turbo',
  },

  // ============================================
  // HELPERS
  // ============================================
  isDevelopment: () => config.server.nodeEnv === 'development',
  isProduction: () => config.server.nodeEnv === 'production',
};

export default config;

