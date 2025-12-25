import swaggerUi from 'swagger-ui-express';
import { document } from '@gis/shared/openapi';
import { Application } from 'express';

export const setupSwagger = (app: Application) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
};
