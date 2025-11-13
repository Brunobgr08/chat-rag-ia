import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
}

const TestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      {
        name: 'Conexão com Backend',
        test: async () => {
          const start = Date.now();
          const response = await fetch('http://localhost:3001/api/health');
          const data = await response.json();
          const duration = Date.now() - start;

          if (data.status === 'OK') {
            return { success: true, message: `Backend OK (${duration}ms)`, duration };
          }
          throw new Error('Backend não está respondendo corretamente');
        },
      },
      {
        name: 'Banco de Dados',
        test: async () => {
          const start = Date.now();
          const response = await fetch('http://localhost:3001/api/health');
          const data = await response.json();
          const duration = Date.now() - start;

          if (data.database === 'Connected') {
            return { success: true, message: `PostgreSQL conectado (${duration}ms)`, duration };
          }
          throw new Error('Banco de dados desconectado');
        },
      },
      {
        name: 'Configurações',
        test: async () => {
          const start = Date.now();
          const response = await fetch('http://localhost:3001/api/config');
          const data = await response.json();
          const duration = Date.now() - start;

          if (data.success) {
            return {
              success: true,
              message: `Configurações carregadas (${duration}ms)`,
              duration,
            };
          }
          throw new Error('Erro ao carregar configurações');
        },
      },
      {
        name: 'Documentos',
        test: async () => {
          const start = Date.now();
          const response = await fetch('http://localhost:3001/api/documents');
          const data = await response.json();
          const duration = Date.now() - start;

          if (data.success) {
            const count = data.data.length;
            return {
              success: true,
              message: `${count} documento(s) encontrado(s) (${duration}ms)`,
              duration,
            };
          }
          throw new Error('Erro ao listar documentos');
        },
      },
      {
        name: 'Histórico de Conversas',
        test: async () => {
          const start = Date.now();
          const response = await fetch('http://localhost:3001/api/chat/conversations');
          const data = await response.json();
          const duration = Date.now() - start;

          if (data.success) {
            const count = data.data.length;
            return {
              success: true,
              message: `${count} conversa(s) encontrada(s) (${duration}ms)`,
              duration,
            };
          }
          throw new Error('Erro ao listar conversas');
        },
      },
    ];

    for (const { name, test } of tests) {
      setResults((prev) => [...prev, { name, status: 'pending', message: 'Testando...' }]);

      try {
        const result = await test();
        setResults((prev) =>
          prev.map((r) =>
            r.name === name
              ? { ...r, status: 'success', message: result.message, duration: result.duration }
              : r,
          ),
        );
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.name === name
              ? {
                  ...r,
                  status: 'error',
                  message: error instanceof Error ? error.message : 'Erro desconhecido',
                }
              : r,
          ),
        );
      }

      // Pequeno delay entre testes
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Painel de Testes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Teste a conectividade e funcionalidade do sistema
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Executar Testes
            </>
          )}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Clique em "Executar Testes" para verificar o sistema</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{result.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPanel;

