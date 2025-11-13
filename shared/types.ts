export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
}

export interface AppConfig {
  openRouterApiKey: string;
  selectedModel: string;
  systemPrompt: string;
  evolutionApiUrl: string;
  evolutionApiKey: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}
