// Cria a instancia do express
import express from 'express';
import { healthRouter } from './shared/http/health.routes.ts';
import { userRouter } from './modules/users/infra/user.routes.ts';

const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(userRouter);

export { app };
