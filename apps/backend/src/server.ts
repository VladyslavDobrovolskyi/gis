// backend/server.ts
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware } from 'trpc-to-openapi';

import { setupSwagger } from '@docs/swagger';

import { appRouter } from './router';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));

setupSwagger(app);
// tRPC JSON API
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  }),
);

// OpenAPI REST
app.use(
  '/',
  createOpenApiExpressMiddleware({
    router: appRouter,
  }),
);

app.listen(3000, () => {
  console.log('Server on http://localhost:3000');
});
