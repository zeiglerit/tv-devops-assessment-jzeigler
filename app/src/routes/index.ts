import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/', (_req, res) => {
  res.send('Hello from Express + TypeScript!');
});

export default router;
