import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './src/routes/analyze.js';
import historyRouter from './src/routes/history.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // support larger base64 payloads if needed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`ReceiptPrint backend server is running on port ${PORT}`);
});

export default app;
