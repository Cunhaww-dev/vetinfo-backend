// Cria a instancia do express
import express from 'express';
import { healthRouter } from './shared/http/health.routes.ts';

const app = express();
app.use(express.json());
app.use(healthRouter);

export { app };
