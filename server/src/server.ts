import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contractRoutes from './routes/contractRoutes';
import aiRoutes from './routes/aiRoutes';
import riskRoutes from './routes/riskRoutes';

// Initialize env config
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// CORS setup to allow request loops from the Vite React client
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '30mb' })); // support large text/data buffers
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// App Router bindings
app.use('/api/contracts', contractRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', riskRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server exception:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`JurisAI Contract Parser Server running on port ${port}`);
});
