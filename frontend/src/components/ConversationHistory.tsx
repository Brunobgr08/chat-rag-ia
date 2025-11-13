import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Clock, Loader2, RefreshCw } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onSelectConversation,
  selectedConversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/chat/conversations');
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      } else {
        setError(data.error || 'Erro ao carregar conversas');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja deletar esta conversa?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        if (selectedConversationId === id) {
          onSelectConversation('');
        }
      } else {
        alert(data.error || 'Erro ao deletar conversa');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Erro ao deletar conversa');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
          Histórico
        </h2>
        <button
          onClick={fetchConversations}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600 text-sm">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Inicie uma conversa no chat</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Deletar conversa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;

