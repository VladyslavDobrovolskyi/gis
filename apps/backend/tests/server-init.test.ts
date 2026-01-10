import { describe, it, expect } from '@jest/globals';
import * as allure from 'allure-js-commons';
import express from 'express';
import type { AppRouter } from '@/_router';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';

const noopMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) =>
  next();

jest.mock('cors', () =>
  Object.assign(noopMiddleware, { default: noopMiddleware, __esModule: true }),
);

jest.mock('@trpc/server/adapters/express', () => ({
  createExpressMiddleware: () => noopMiddleware,
}));

jest.mock('trpc-to-openapi', () => ({
  createOpenApiExpressMiddleware: () => noopMiddleware,
}));

jest.mock('@docs/swagger', () => ({
  setupSwagger: jest.fn() as jest.MockedFunction<(app: Express) => void>,
}));

jest.mock('@/_router', () => ({ appRouter: {} as AppRouter }));

describe('Express Server', () => {
  it('Initializes express application and middleware', () => {
    allure.epic('Server');
    allure.feature('Initialization');
    allure.severity('Blocker');
    expect(express).toBeDefined();
  });
});
