import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  payment as paymentSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { env } from '@neighborhood-showcase/env/server';
import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Resend } from 'resend';

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

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/webhooks/abacatepay',
    {
      config: {
        rawBody: true,
      },
    },
    async (request, reply) => {
      const signature = request.headers['x-webhook-signature'];
      const { webhookSecret } = request.query as { webhookSecret?: string };

      request.log.info(
        {
          webhookSecretQuery: webhookSecret,
          headerSignature: signature,
          rawBodyLength:
            (request as FastifyRequest & { rawBody?: string }).rawBody
              ?.length || 0,
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
        const rawBody =
          (request as FastifyRequest & { rawBody?: string }).rawBody || '';
        const verified = verifySignature(rawBody, String(signature));
        if (!verified) {
          return reply
            .status(401)
            .send({ error: 'Invalid cryptographic signature' });
        }
      }

      // Parse the webhook payload
      const payload = request.body as {
        id?: string;
        event?: string;
        data?: {
          transparent?: {
            id: string;
            status: string;
          };
          checkout?: {
            id: string;
            status: string;
          };
        };
      };

      if (!payload || typeof payload !== 'object') {
        return reply.status(400).send({ error: 'Invalid request body' });
      }

      const { event, data } = payload;

      if (!event || !data) {
        return reply
          .status(400)
          .send({ error: 'Missing required webhook fields' });
      }

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

      // Assert that the webhook payload status is PAID
      if (paymentStatus !== 'PAID') {
        return reply.status(200).send({
          status: 'ignored',
          message: `Payment status is '${paymentStatus}', expecting 'PAID'`,
        });
      }

      // Find the payment record
      const paymentRecord = await db
        .select()
        .from(paymentSchema)
        .where(eq(paymentSchema.billingId, billingId))
        .limit(1)
        .then((res) => res[0]);

      if (!paymentRecord) {
        request.log.error(
          `Payment record not found for billingId: ${billingId}`,
        );
        return reply.status(404).send({ error: 'Payment record not found' });
      }

      // Idempotency: check if already paid
      if (paymentRecord.status === 'PAID') {
        return reply.status(200).send({
          status: 'already_processed',
          message: 'Payment already marked as PAID',
        });
      }

      // Find associated announcement
      const announcementRecord = await db
        .select()
        .from(announcementSchema)
        .where(eq(announcementSchema.id, paymentRecord.announcementId))
        .limit(1)
        .then((res) => res[0]);

      if (!announcementRecord) {
        request.log.error(
          `Announcement record not found for payment ${paymentRecord.id}`,
        );
        return reply
          .status(404)
          .send({ error: 'Associated announcement not found' });
      }

      // Find provider user details for email
      const provider = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, announcementRecord.providerId))
        .limit(1)
        .then((res) => res[0]);

      // Execute DB Transaction
      await db.transaction(async (tx) => {
        // Update payment status to PAID
        await tx
          .update(paymentSchema)
          .set({
            status: 'PAID',
            updatedAt: new Date(),
          })
          .where(eq(paymentSchema.id, paymentRecord.id));

        // Update announcement status to ACTIVE, set paidAt and expiresAt (+30 days)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await tx
          .update(announcementSchema)
          .set({
            status: 'ACTIVE',
            paidAt: new Date(),
            expiresAt,
          })
          .where(eq(announcementSchema.id, announcementRecord.id));
      });

      // Send email confirmation using Resend (runs after transaction successfully commits)
      if (provider?.email) {
        const customerName = provider.name || 'Provedor';
        const announcementTitle = announcementRecord.title;

        if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'mock-resend-key') {
          console.log(`[MOCK EMAIL (Resend)] To: ${provider.email}`);
          console.log(
            `[MOCK EMAIL (Resend)] Subject: Seu anúncio "${announcementTitle}" está ativo!`,
          );
          console.log(
            `[MOCK EMAIL (Resend)] Body: Olá ${customerName}, seu anúncio "${announcementTitle}" foi publicado com sucesso.`,
          );
        } else {
          try {
            const resend = new Resend(env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: provider.email,
              subject: `Seu anúncio "${announcementTitle}" está ativo!`,
              html: `
                <p>Olá, ${customerName}.</p>
                <p>Seu pagamento foi confirmado com sucesso!</p>
                <p>O seu anúncio <strong>${announcementTitle}</strong> já está ativo e visível na vitrine pública do seu condomínio.</p>
                <p>Ele ficará ativo pelos próximos 30 dias.</p>
                <br/>
                <p>Atenciosamente,</p>
                <p>Administração - Neighborhood Showcase</p>
              `,
            });
          } catch (error) {
            // Log error but do not fail the request
            request.log.error(error, 'Resend email dispatch failed');
          }
        }
      }

      return reply.status(200).send({
        status: 'success',
        message: 'Payment successfully processed',
      });
    },
  );
}
