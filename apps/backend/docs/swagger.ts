import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '@/src/router';
import { Application } from 'express';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'GIS API',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000',
});

export const setupSwagger = (app: Application) => {
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(openApiDocument));
};
