import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, FileText, AlertCircle, Trash2 } from 'lucide-react';
import ConversationHistory from './ConversationHistory';
import api from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: { id: string; name: string; relevance: number }[];
}

interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    conversationId: string;
    sources: { id: string; name: string; relevance: number }[];
  };
  error?: string;
}

interface ChatInterfaceProps {
  showHistory?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ showHistory = true }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const data: ChatResponse = await api.chat.send(inputMessage, conversationId);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      if (data.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          sources: data.data.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setConversationId(data.data.conversationId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');

      // Adicionar mensagem de erro
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm('Tem certeza que deseja limpar o chat?')) {
      setMessages([]);
      setConversationId(null);
      setError(null);
    }
  };

  const handleLoadConversation = async (convId: string) => {
    if (!convId) {
      handleClearChat();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.chat.getConversation(convId);

      if (data.success) {
        const loadedMessages = data.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
        setConversationId(convId);
      } else {
        setError(data.error || 'Erro ao carregar conversa');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Erro ao carregar conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
      {/* Conversation History - Hidden on mobile, shown on large screens */}
      {showHistory && (
        <div className="hidden lg:block lg:col-span-1">
          <ConversationHistory
            onSelectConversation={handleLoadConversation}
            selectedConversationId={conversationId}
          />
        </div>
      )}

      {/* Chat Interface */}
      <div
        className={`${
          showHistory ? 'lg:col-span-3' : 'lg:col-span-4'
        } bg-white rounded-lg shadow h-full flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chat com IA + RAG</h2>
            <p className="text-sm text-gray-500">
              {conversationId ? `Conversa: ${conversationId.substring(0, 8)}...` : 'Nova conversa'}
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Limpar chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bem-vindo ao Chat com RAG</h3>
              <p className="text-gray-600 max-w-md">
                Faça perguntas e o sistema buscará informações nos documentos enviados para fornecer
                respostas mais precisas e contextualizadas.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs font-semibold mb-2 text-gray-700">
                        📚 Fontes consultadas:
                      </p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            <span>{source.name}</span>
                            <span className="text-gray-400">
                              (relevância: {(source.relevance * 100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-gray-600">Pensando...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 max-w-md">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erro ao processar mensagem</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
              className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`px-6 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                !inputMessage.trim() || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Dica: O sistema busca automaticamente nos documentos enviados para responder suas
            perguntas
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
