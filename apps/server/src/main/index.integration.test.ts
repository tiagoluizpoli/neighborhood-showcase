import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from './index';

describe('Main composition root integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('responds on the health endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('OK');
  });

  test('registers the upload route through main wiring', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/upload',
    });
    const body = JSON.parse(response.body) as {
      error: string;
      code: string;
    };

    expect(response.statusCode).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  });

  test('registers the webhook route through main wiring', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});
