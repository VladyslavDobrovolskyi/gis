import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '@/_router';
import { type Application } from 'express';
import dotenv from 'dotenv';
dotenv.config();

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: `${process.env.API_TITLE}`,
  version: `${process.env.API_VERSION}`,
  baseUrl: `${process.env.API_URL}:${process.env.API_PORT}`,
});

export const setupSwagger = (app: Application) => {
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(openApiDocument));
};
