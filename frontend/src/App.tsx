import React, { useState } from 'react';
import { Settings, MessageCircle, FileText, TestTube } from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import TestPanel from './components/TestPanel';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'tests'>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Chat RAG IA
                </h1>
                <p className="text-xs text-gray-500">Assistente Inteligente</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation Tabs */}
              <nav className="flex gap-1 bg-gray-100/80 p-1 rounded-xl backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'chat'
                      ? 'bg-white text-blue-700 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'documents'
                      ? 'bg-white text-blue-700 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Docs</span>
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'tests'
                      ? 'bg-white text-blue-700 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline">Testes</span>
                </button>
              </nav>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-fadeIn">
          {activeTab === 'chat' && <ChatInterface showHistory={true} />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'tests' && <TestPanel />}
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
