import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
  payment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import { webhookRoutes } from './webhook';

describe('AbacatePay Webhook Integration Test', () => {
  let app: FastifyInstance;
  const testUserId = 'web-test-provider-id';
  const testCondoId = 'web-test-condo-id';
  const testAnnId = 'web-test-ann-id';
  const testBillingId = 'bill_test_webhook_123';
  const webhookSecret = 'mock-webhook-secret';

  beforeAll(async () => {
    // Setup Fastify instance
    app = Fastify();
    await app.register(fastifyRawBody, {
      field: 'rawBody',
      global: false,
      encoding: 'utf8',
      runFirst: true,
    });
    await app.register(webhookRoutes);

    // Clear database
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Seed test data
    await db.insert(user).values({
      id: testUserId,
      name: 'John Webhook Provider',
      email: 'john-webhook@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await db.insert(condominium).values({
      id: testCondoId,
      name: 'Webhook Towers',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: testUserId,
      status: 'APPROVED',
    });

    await db.insert(assignment).values({
      id: 'web-assign-id',
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Apt 202',
    });

    await db.insert(announcement).values({
      id: testAnnId,
      providerId: testUserId,
      condominiumId: testCondoId,
      title: 'Delicious Pizza',
      description: 'Warm and tasty pizza delivered right to your apartment',
      imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
      category: 'Alimentação',
      status: 'PENDING_PAYMENT',
    });

    await db.insert(payment).values({
      id: 'pay-test-id',
      announcementId: testAnnId,
      billingId: testBillingId,
      amountCents: 200,
      status: 'PENDING',
    });
  });

  afterAll(async () => {
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
    if (app) {
      await app.close();
    }
  });

  test('returns 401 if x-webhook-signature is invalid/missing in non-dev environment', async () => {
    // Note: env.NODE_ENV is set to 'test' in vitest/bun test, which is handled in our controller.
    // To test signature failure, we send an incorrect signature.
    const payload = {
      id: 'evt_1',
      event: 'billing.paid',
      data: { id: testBillingId, status: 'PAID' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      headers: {
        'x-webhook-signature': 'wrong-signature',
      },
      payload,
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toBe(
      'Invalid cryptographic signature',
    );

    // Verify DB states remain unchanged
    const payRec = await db
      .select()
      .from(payment)
      .where(eq(payment.billingId, testBillingId))
      .limit(1)
      .then((res) => res[0]);
    expect(payRec).toBeDefined();
    expect(payRec?.status).toBe('PENDING');

    const annRec = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, testAnnId))
      .limit(1)
      .then((res) => res[0]);
    expect(annRec).toBeDefined();
    expect(annRec?.status).toBe('PENDING_PAYMENT');
  });

  test('returns 400 for invalid/malformed request body', async () => {
    const payload = {};
    const payloadStr = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(payloadStr)
      .digest('hex');

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      headers: {
        'x-webhook-signature': signature,
        'content-type': 'application/json',
      },
      payload: payloadStr,
    });

    expect(response.statusCode).toBe(400);
  });

  test('returns 404 for valid signature but non-existent billingId', async () => {
    const payload = {
      id: 'evt_3',
      event: 'billing.paid',
      data: { id: 'non-existent-billing-id', status: 'PAID' },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(payloadStr)
      .digest('hex');

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      headers: {
        'x-webhook-signature': signature,
        'content-type': 'application/json',
      },
      payload: payloadStr,
    });

    expect(response.statusCode).toBe(404);
  });

  test('successfully processes paid callback, transition states and supports idempotency', async () => {
    // 1. Process paid event
    const payload = {
      id: 'evt_success',
      event: 'billing.paid',
      data: { id: testBillingId, status: 'PAID' },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(payloadStr)
      .digest('hex');

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      headers: {
        'x-webhook-signature': signature,
        'content-type': 'application/json',
      },
      payload: payloadStr,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('success');

    // Verify DB updates
    const payRec = await db
      .select()
      .from(payment)
      .where(eq(payment.billingId, testBillingId))
      .limit(1)
      .then((res) => res[0]);
    expect(payRec).toBeDefined();
    expect(payRec?.status).toBe('PAID');

    const annRec = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, testAnnId))
      .limit(1)
      .then((res) => res[0]);
    expect(annRec).toBeDefined();
    expect(annRec?.status).toBe('ACTIVE');
    expect(annRec?.paidAt).not.toBeNull();
    expect(annRec?.expiresAt).not.toBeNull();

    // Verify expiresAt is set to roughly 30 days from now
    const diffMs =
      (annRec?.expiresAt?.getTime() ?? 0) -
      (Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(Math.abs(diffMs)).toBeLessThan(10000); // within 10 seconds

    // 2. Idempotency check: Process same event again
    const responseIdempotent = await app.inject({
      method: 'POST',
      url: '/api/webhooks/abacatepay',
      headers: {
        'x-webhook-signature': signature,
        'content-type': 'application/json',
      },
      payload: payloadStr,
    });

    expect(responseIdempotent.statusCode).toBe(200);
    expect(JSON.parse(responseIdempotent.body).status).toBe(
      'already_processed',
    );
  });
});
