// backend/src/index.ts (atualizado)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, initializeTables } from './lib/database';

// Routes
import configRoutes from './routes/config';
import documentRoutes from './routes/documents';
import chatRoutes from './routes/chat';
import whatsappRoutes from './routes/whatsapp';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS - permite localhost (dev) e frontend URL (prod)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove valores undefined/null/empty

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: Postman, curl)
      if (!origin) return callback(null, true);

      // Permite origens na lista
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Bloqueia outras origens
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/config', configRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    status: 'OK',
    database: dbStatus ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Initialize database on startup
const initializeApp = async () => {
  try {
    const dbConnected = await testConnection();

    if (dbConnected) {
      await initializeTables();
      console.log('✅ Aplicação inicializada com sucesso');
    } else {
      console.log('⚠️  Aplicação rodando sem conexão com o banco');
    }

    // Only start server if not in Vercel (serverless environment)
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📁 Documents API: http://localhost:${PORT}/api/documents`);
        console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
        console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/api/whatsapp/webhook/:instance`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  }
};

initializeApp();

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// Export for Vercel serverless
export default app;
