import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Search, BarChart3 } from 'lucide-react';
import api from '../lib/api';

interface Document {
  id: string;
  name: string;
  type: string;
  metadata: any;
  created_at: string;
}

interface DocumentsResponse {
  success: boolean;
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    total: number;
    byType: { type: string; count: number }[];
    totalChars: number;
  };
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [pagination.page]);

  const loadDocuments = async () => {
    try {
      const data: DocumentsResponse = await api.documents.list(pagination.page, pagination.limit);

      if (data.success) {
        setDocuments(data.data);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data: StatsResponse = await api.documents.stats();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await api.documents.upload(file);

      if (data.success) {
        alert('Documento enviado com sucesso!');
        loadDocuments();
        loadStats();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erro ao enviar documento');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const deleteDocument = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) {
      return;
    }

    try {
      const data = await api.documents.delete(id);

      if (data.success) {
        alert('Documento deletado com sucesso!');
        loadDocuments();
        loadStats();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erro ao deletar documento');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📕';
    if (type.includes('text')) return '📄';
    if (type.includes('markdown')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Estatísticas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Documentos</h2>
            <p className="text-gray-600">Faça upload e gerencie documentos para o RAG</p>
          </div>

          <div className="flex items-center space-x-4">
            {stats && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>{stats.total} documentos</span>
                <span>•</span>
                <span>{(stats.totalChars / 1000).toFixed(0)}k caracteres</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
          <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
            Arraste arquivos PDF, TXT ou MD aqui, ou clique para selecionar
          </p>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
          </label>
          <p className="text-xs text-gray-500 mt-2">Máx: 10MB • PDF, TXT, MD</p>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold">Documentos</h3>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center placeholder:text-center"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando documentos...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento enviado ainda'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 hover:bg-gray-50"
                >
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {getFileIcon(doc.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500 mt-1">
                        <span className="truncate">{doc.type}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">
                          {doc.metadata?.size
                            ? formatFileSize(doc.metadata.size)
                            : 'Tamanho desconhecido'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => deleteDocument(doc.id, doc.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Deletar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="p-6 border-t flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Mostrando {documents.length} de {pagination.total} documentos
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
