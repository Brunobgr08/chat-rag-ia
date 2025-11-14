import { pool } from '../lib/database';

export class RAGService {
  // Buscar documentos relevantes para uma consulta
  async searchRelevantDocuments(query: string, limit: number = 3): Promise<any[]> {
    try {
      // Estratégia 1: Full-Text Search (mais preciso)
      const ftsResult = await pool.query(
        `SELECT id, name, content, metadata,
                TS_RANK(TO_TSVECTOR('portuguese', content), PLAINTO_TSQUERY('portuguese', $1)) as rank
         FROM documents
         WHERE TO_TSVECTOR('portuguese', content) @@ PLAINTO_TSQUERY('portuguese', $1)
         ORDER BY rank DESC
         LIMIT $2`,
        [query, limit],
      );

      // Estratégia 2: Busca por substring (mais flexível)
      // Extrai palavras-chave da query (remove palavras comuns)
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3) // Remove palavras muito curtas
        .filter(
          (word) =>
            ![
              'qual',
              'como',
              'onde',
              'quando',
              'porque',
              'para',
              'sobre',
              'este',
              'essa',
              'isso',
            ].includes(word),
        );

      if (keywords.length > 0) {
        // Busca por qualquer palavra-chave no conteúdo
        const likeParams = keywords.map((k) => `%${k}%`);

        const likeResult = await pool.query(
          `SELECT id, name, content, metadata, 0.7 as rank
           FROM documents
           WHERE ${keywords.map((_, i) => `content ILIKE $${i + 1}`).join(' OR ')}
           ORDER BY created_at DESC
           LIMIT $${keywords.length + 1}`,
          [...likeParams, limit],
        );
      }

      // Estratégia 3: Fallback - retornar todos os documentos
      const fallbackResult = await pool.query(
        `SELECT id, name, content, metadata, 0.5 as rank
         FROM documents
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      );

      return fallbackResult.rows;
    } catch (error) {
      console.error('[RAG Service] Error searching documents:', error);
      return [];
    }
  }

  // Buscar todos os documentos (fallback)
  async getAllDocuments(limit: number = 5): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, content, metadata
         FROM documents
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching all documents:', error);
      return [];
    }
  }

  // Construir contexto a partir dos documentos
  buildContextFromDocuments(documents: any[]): string {
    if (documents.length === 0) {
      return 'Não há documentos disponíveis para consulta.';
    }

    let context = 'Contexto dos documentos:\n\n';

    documents.forEach((doc, index) => {
      const contentPreview =
        doc.content.length > 1000 ? doc.content.substring(0, 1000) + '...' : doc.content;

      context += `Documento ${index + 1}: ${doc.name}\n`;
      context += `Conteúdo: ${contentPreview}\n\n`;
    });

    return context;
  }

  // Gerar prompt com contexto
  generatePromptWithContext(query: string, context: string, systemPrompt: string): string {
    return `${systemPrompt}

${context}

Pergunta do usuário: ${query}

Instruções:
- Baseie sua resposta principalmente no contexto fornecido
- Se a informação não estiver no contexto, indique isso claramente
- Mantenha a resposta precisa e útil
- Use markdown para formatação quando apropriado

Resposta:`;
  }
}

export const ragService = new RAGService();
