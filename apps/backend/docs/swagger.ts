import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '@/_router';
import { type Application } from 'express';
import env from 'dotenv-flow';
env.config();

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: `${process.env.SWAGGER_API_TITLE}`,
  version: `${process.env.SWAGGER_API_VERSION}`,
  baseUrl: `${process.env.SWAGGER_API_URL}`,
});

export const setupSwagger = (app: Application) => {
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(openApiDocument));
};
