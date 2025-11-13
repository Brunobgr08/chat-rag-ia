-- Configurações da aplicação
CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    open_router_api_key TEXT,
    selected_model TEXT DEFAULT 'openai/gpt-3.5-turbo',
    system_prompt TEXT DEFAULT 'Você é um assistente útil que responde perguntas com base no contexto fornecido.',
    evolution_api_url TEXT DEFAULT 'https://evodevs.cordex.ai',
    evolution_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Documentos para o RAG
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(1536), -- Para pgvector
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca semântica (requer extensão vector)
CREATE INDEX IF NOT EXISTS documents_embedding_idx
ON documents USING ivfflat (embedding vector_cosine_ops);

-- Atualização do schema para suportar full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Função para busca case-insensitive e sem acentos
CREATE OR REPLACE FUNCTION portuguese_tsvector(text TEXT)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('portuguese', unaccent(lower(text)));
END;
$$ LANGUAGE plpgsql;

-- Índice para full-text search
CREATE INDEX IF NOT EXISTS documents_content_fts_idx
ON documents USING gin(portuguese_tsvector(content));