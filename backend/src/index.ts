import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, initializeTables } from './lib/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
import configRoutes from './routes/config';
app.use('/api/config', configRoutes);

// Health check com verificação de banco
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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});
