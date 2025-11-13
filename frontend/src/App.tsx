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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">RAG WhatsApp Chat</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <nav className="flex space-x-2 sm:space-x-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Documentos</span>
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'tests'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <TestTube className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Testes</span>
                </button>
              </nav>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-md"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'chat' && <ChatInterface showHistory={true} />}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'tests' && <TestPanel />}
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
