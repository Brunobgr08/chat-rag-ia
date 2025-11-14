import { useState } from 'react';
import { Settings, MessageCircle, FileText, TestTube } from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import TestPanel from './components/TestPanel';
import config from './config';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'tests'>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-700 p-2 rounded-lg shadow-md">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{config.app.name}</h1>
                <p className="text-xs text-blue-100">{config.app.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation Tabs */}
              <nav className="flex gap-2 bg-blue-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'chat'
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'documents'
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Docs</span>
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'tests'
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline">Testes</span>
                </button>
              </nav>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-white hover:bg-blue-700 rounded-lg transition-all"
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
