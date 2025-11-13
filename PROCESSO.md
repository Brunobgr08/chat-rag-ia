# Processo de Desenvolvimento do Projeto

Este documento contém o passo a passo de cada processo do projeto e os prompts utilizados para gerá-los.

---

## 1. Configuração Inicial do Projeto

### Descrição

Configuração inicial do ambiente e estrutura base do projeto.

### Passos

1. Inicialização do repositório
2. Definição de estrutura de pastas e arquivos base

### Prompt Utilizado

```
[Create a model and project structure for a chat system with AI, RAG, and WhatsApp integration via Evolution API. The technical stack will be Frontend: React + TypeScript + Vite, Backend: Express, Database: PostgreSQL, and Deploy: Vercel. Define only the structure initially.]
```

---

## 2. Painel de Configurações

### Descrição

Implementação do painel de configurações com as seguintes funcionalidades:

- API Key da Open Router
- Seletor de modelo (GPT-4, Claude, Llama, etc.)
- System Prompt editável

### Passos

1. Criar interface do painel de configurações
2. Implementar gerenciamento de API Key
3. Adicionar seletor de modelos
4. Implementar editor de System Prompt
5. Persistir configurações

### Prompt Utilizado

```
[Create a settings panel for a chat system with AI, RAG, and WhatsApp integration via the Evolution API. The panel should include Open Router API Key management, model selector (GPT-4, Claude, Llama, etc.), and System Prompt editor.]
```

---

## 3. Sistema RAG (Retrieval-Augmented Generation)

### Descrição

Implementação do sistema RAG para busca e recuperação de informações.

### Passos

1. Upload de arquivos (PDF, TXT, MD)
2. Listar e deletar documentos
3. Usar documentos como contexto nas respostas

### Prompt Utilizado

```
[Add a Retrieval-Augmented Generation (RAG) system to the chat system. The RAG system should include document upload, listing, deletion, and usage as context in responses.]
```

---

## 4. Integração WhatsApp

### Descrição

Integração com o WhatsApp via Evolution API.

### Passos

1. Webhook para receber mensagens
2. Processar com IA + RAG
3. Enviar respostas via Evolution API

### Prompt Utilizado

```
[Adicionate WhatsApp integration to the chat system using the Evolution API. The integration should include a webhook to receive messages, processing with AI + RAG, and sending responses via the Evolution API.]
```

---

## 5. Interface de Testes

### Descrição

Criação de uma interface de testes para simulação de conversas.

### Passos

1. Definir interface de chat local para testes
2. Implementar componentes reutilizáveis
3. Adicionar responsividade
4. Melhorias de UX/UI
5. Histórico de conversas

### Prompt Utilizado

```
[Create a testing interface for the chat system. The interface should include a local chat, reusable components, responsiveness, and UX/UI improvements. Include a conversation history.]
```

---

## Notas Adicionais

### Tecnologias Utilizadas

- React + TypeScript + Vite
- Express + TypeScript
- PostgreSQL
- Vercel

### Desafios Encontrados

-

### Melhorias Futuras

- Dashboard com métricas
- Visualização de kanban (fases) para os chats
- Integração com MCPs
- Busca e filtros nas conversas
- Exportação de conversas (PDF/JSON)
- Sistema de avaliação de respostas
