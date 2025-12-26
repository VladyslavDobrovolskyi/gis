import cors from 'cors';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import { setupSwagger } from '@docs/swagger';
import { appRouter } from './_router';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));

setupSwagger(app);

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  }),
);

app.use(
  '/',
  createOpenApiExpressMiddleware({
    router: appRouter,
  }),
);

app.listen(Number(process.env.API_PORT), () => {
  console.log(`Server on ${process.env.API_URL}:${process.env.API_PORT} is started successfully!`);
});
