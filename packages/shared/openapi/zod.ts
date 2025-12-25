import * as z from 'zod';
import { createDocument } from 'zod-openapi';
import {
  CitiesSchema,
  GetDistanceFromToParamsSchema,
  GetDistanceFromToResultSchema,
} from '@schemas/city.schema';

export const document: ReturnType<typeof createDocument> = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'GIS API',
    version: '1.0.0',
    description: 'API for cities and distances',
  },
  paths: {
    '/': {
      get: {
        summary: 'Get all cities',
        description: 'Returns list of cities with population and geometry',
        responses: {
          '200': {
            description: 'List of cities',
            content: {
              'application/json': {
                schema: CitiesSchema,
              },
            },
          },
          '500': {
            description: 'Database or validation error',
            content: {
              'application/json': {
                schema: z.object({ error: z.string() }),
              },
            },
          },
        },
      },
    },
    '/distance': {
      get: {
        summary: 'Get distance between two cities',
        description: 'Returns the distance between two cities in meters',
        requestParams: { query: GetDistanceFromToParamsSchema },
        responses: {
          '200': {
            description: 'Distance result',
            content: {
              'application/json': {
                schema: GetDistanceFromToResultSchema,
              },
            },
          },
          '400': {
            description: 'Missing or invalid query parameters',
            content: {
              'application/json': {
                schema: z.object({ error: z.string() }),
              },
            },
          },
          '500': {
            description: 'Database error',
            content: {
              'application/json': {
                schema: z.object({ error: z.string() }),
              },
            },
          },
        },
      },
    },
  },
});
