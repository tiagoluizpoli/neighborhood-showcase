import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@neighborhood-showcase/env/server';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  type ProcessWebhookPayment,
  WebhookAssociatedAnnouncementNotFoundError,
  WebhookPaymentNotFoundError,
} from '../../application/use-cases/payment/process-webhook-payment';

const abacatePayWebhookPayloadSchema = z.object({
  id: z.string(),
  event: z.string(),
  data: z.object({
    transparent: z
      .object({
        id: z.string(),
        status: z.string(),
      })
      .optional(),
    checkout: z
      .object({
        id: z.string(),
        status: z.string(),
      })
      .optional(),
  }),
});

interface WebhookQuery {
  webhookSecret: string;
}

interface FastifyRequestWithRawBody
  extends FastifyRequest<{ Querystring: WebhookQuery }> {
  rawBody?: string | Buffer;
}

function verifySignature(body: string, signature: string): boolean {
  const computed = createHmac('sha256', env.ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(body, 'utf8'))
    .digest('base64');

  try {
    const A = Buffer.from(computed);
    const B = Buffer.from(signature);
    return A.length === B.length && timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

export async function webhookRoutes(
  fastify: FastifyInstance,
  opts: { processWebhookPayment: ProcessWebhookPayment },
) {
  const { processWebhookPayment } = opts;
  if (!processWebhookPayment) {
    throw new Error('ProcessWebhookPayment use case is required');
  }

  fastify.post<{
    Querystring: WebhookQuery;
  }>(
    '/api/webhooks/abacatepay',
    {
      config: {
        rawBody: true,
      },
      schema: {
        querystring: {
          type: 'object',
          required: ['webhookSecret'],
          properties: {
            webhookSecret: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request: FastifyRequestWithRawBody, reply) => {
      const signature = request.headers['x-webhook-signature'];
      const { webhookSecret } = request.query;

      const rawBodyStr = request.rawBody ? request.rawBody.toString() : '';

      request.log.info(
        {
          webhookSecretQuery: webhookSecret,
          headerSignature: signature,
          rawBodyLength: rawBodyStr.length,
        },
        'AbacatePay Webhook Debug Values',
      );

      const isDev = env.NODE_ENV === 'development';

      // Secret and Signature validation
      if (!signature || !webhookSecret) {
        if (!isDev) {
          return reply.status(401).send({
            error: 'Missing authentication credentials (signature or secret)',
          });
        }
        request.log.warn(
          'Bypassing verification in development environment due to missing signature or secret',
        );
      } else {
        // 1. Verify URL secret
        const expectedSecretBuf = Buffer.from(env.ABACATEPAY_WEBHOOK_SECRET);
        const receivedSecretBuf = Buffer.from(webhookSecret);
        const isSecretValid =
          expectedSecretBuf.length === receivedSecretBuf.length &&
          timingSafeEqual(expectedSecretBuf, receivedSecretBuf);

        if (!isSecretValid) {
          return reply.status(401).send({ error: 'Invalid webhook secret' });
        }

        // 2. Verify HMAC Signature
        const verified = verifySignature(rawBodyStr, String(signature));
        if (!verified) {
          return reply
            .status(401)
            .send({ error: 'Invalid cryptographic signature' });
        }
      }

      // Parse the webhook payload using Zod schema
      const parseResult = abacatePayWebhookPayloadSchema.safeParse(
        request.body,
      );

      if (!parseResult.success) {
        return reply.status(400).send({ error: 'Invalid request body' });
      }

      const { event, data } = parseResult.data;

      let billingId: string | undefined;
      let paymentStatus: string | undefined;

      if (event === 'transparent.completed' && data.transparent) {
        billingId = data.transparent.id;
        paymentStatus = data.transparent.status;
      } else if (event === 'checkout.completed' && data.checkout) {
        billingId = data.checkout.id;
        paymentStatus = data.checkout.status;
      }

      // If we cannot extract billingId, acknowledge and ignore
      if (!billingId) {
        return reply.status(200).send({
          status: 'ignored',
          message: `Webhook event '${event}' is ignored or has no billing data`,
        });
      }

      // Log the extracted paymentStatus and billingId to satisfy TS compiler constraints
      request.log.info(
        { billingId, paymentStatus },
        'Processing verified AbacatePay webhook payment event',
      );

      // Assert that the webhook payload status is PAID
      if (paymentStatus !== 'PAID') {
        return reply.status(200).send({
          status: 'ignored',
          message: `Payment status is '${paymentStatus}', expecting 'PAID'`,
        });
      }

      try {
        const result = await processWebhookPayment.execute({ billingId });
        return reply.status(200).send({
          status: result.status,
          message:
            result.status === 'already_processed'
              ? 'Payment already marked as PAID'
              : 'Payment successfully processed',
        });
      } catch (error) {
        if (error instanceof WebhookPaymentNotFoundError) {
          request.log.error(
            `Payment record not found for billingId: ${billingId}`,
          );
          return reply.status(404).send({ error: error.message });
        }

        if (error instanceof WebhookAssociatedAnnouncementNotFoundError) {
          request.log.error(
            `Announcement record not found for payment: billingId ${billingId}`,
          );
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error, 'Webhook payment processing failed');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
}
