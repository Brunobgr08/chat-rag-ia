# RAG WhatsApp Chat

Sistema de chat com IA integrado ao WhatsApp usando RAG (Retrieval-Augmented Generation).

## 🚀 Funcionalidades

- ✅ Painel de Configurações (Open Router, Modelos, System Prompt)
- ✅ Sistema RAG com upload de documentos
- ✅ Integração WhatsApp via Evolution API
- ✅ Interface de teste com histórico
- ✅ Deploy na Vercel

## ☁️ Deploy na Vercel

- Frontend: https://chat-rag-ia.vercel.app
- Backend: https://chat-rag-ia-backend.vercel.app

## 🛠️ Stack Técnica

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

### Backend

- Express + TypeScript
- PostgreSQL
- Evolution API

## 🔑 Configurações

**Evolution API:**

- URL: Configurar em `EVOLUTION_API_URL` (painel de configurações ou `.env`)
- Key: Configurar em `EVOLUTION_API_KEY` (painel de configurações ou `.env`)

**Banco de Dados:**

- PostgreSQL(Railway)

## 📦 Instalação

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```
