import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server-side Gemini API endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, modelMetrics, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Using offline civil engineering engine.',
        offlineMode: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const metricsSummary = modelMetrics
      ? `Current trained model in ConcreteIQ Lab:
- Algorithm: ${modelMetrics.modelName || 'Regression Model'}
- Test R²: ${modelMetrics.r2 ?? 'N/A'}
- Test MAE: ${modelMetrics.mae ?? 'N/A'} MPa
- Test RMSE: ${modelMetrics.rmse ?? 'N/A'} MPa
- Train R²: ${modelMetrics.trainR2 ?? 'N/A'}`
      : 'No model currently trained in this active session.';

    const systemInstruction = `You are the civil engineering AI specialist in "Axiom" — an interactive materials science & civil engineering laboratory web application for concrete compressive strength prediction (based on the UCI ML Repository Dataset #165, containing 1030 samples).

App & Model Context:
${metricsSummary}

Engineering Guidelines:
1. Ground your answers in civil engineering principles: Abrams' Law, hydration kinetics of C-S-H gel, pozzolanic reactions of fly ash and ground granulated blast furnace slag (GGBS), superplasticizer dispersion mechanics, water-cement (w/c) ratio, and Indian Standards (IS 456:2000, IS 10262:2019, IS 516).
2. When answering mix design queries (e.g., target compressive strength with fixed cement and aggregates), provide recommended water content, superplasticizer dosage, w/c ratio, durability exposure suitability, and reasoning.
3. When answering machine learning questions, discuss bias-variance tradeoff, feature importance (Cement, Age, and Water dominate), evaluation metrics (R², MAE, RMSE), and data leakage prevention.
4. MANDATORY SAFETY DISCLAIMER: Always remind the user that AI recommendations are statistical decision-support estimates; laboratory trial mixes, standard curing, and cube/cylinder compression tests per IS 516 under a qualified civil engineer are mandatory before any site pouring or structural implementation.`;

    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || 'No response generated from Gemini.';
    return res.json({ response: text });
  } catch (err: any) {
    console.error('Error calling Gemini API:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while querying Gemini',
      offlineMode: true,
    });
  }
});

// In development, mount Vite middleware. In production, serve dist.
async function setupServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ConcreteIQ Lab server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
