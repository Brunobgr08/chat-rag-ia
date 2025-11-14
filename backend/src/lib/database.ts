import { Pool } from 'pg';
import config from '../config/env';

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

// Testar conexão
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    return false;
  }
};

// Inicializar tabelas
export const initializeTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Tabela de configurações
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        open_router_api_key TEXT,
        selected_model TEXT DEFAULT '${config.defaults.model}',
        system_prompt TEXT DEFAULT '${config.defaults.systemPrompt.replace(/'/g, "''")}',
        evolution_api_url TEXT DEFAULT '${config.evolution.defaultApiUrl}',
        evolution_api_key TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    // Tabela de documentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        metadata JSONB,
        embedding VECTOR(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabela de conversas
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Índice para busca semântica (se usar pgvector)
    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_embedding_idx
      ON documents USING ivfflat (embedding vector_cosine_ops)
    `);

    await client.query('COMMIT');
    console.log('✅ Tabelas inicializadas com sucesso');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inicializar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
};
