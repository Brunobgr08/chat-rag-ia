import { pool } from '../lib/database';

export class RAGService {
  // Buscar documentos relevantes para uma consulta
  async searchRelevantDocuments(query: string, limit: number = 3): Promise<any[]> {
    try {
      // Busca simples por similaridade de texto (para começar)
      // Posteriormente pode ser substituído por embeddings com pgvector
      const result = await pool.query(
        `SELECT id, name, content, metadata,
                TS_RANK(TO_TSVECTOR('portuguese', content), PLAINTO_TSQUERY('portuguese', $1)) as rank
         FROM documents
         WHERE TO_TSVECTOR('portuguese', content) @@ PLAINTO_TSQUERY('portuguese', $1)
         ORDER BY rank DESC
         LIMIT $2`,
        [query, limit],
      );

      return result.rows;
    } catch (error) {
      console.error('Error searching documents:', error);
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
