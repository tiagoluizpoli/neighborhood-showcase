import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { auth } from '@neighborhood-showcase/auth';
import { env } from '@neighborhood-showcase/env/server';
import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
// Use Cases
import { ProcessWebhookPayment } from '../application/use-cases/payment/process-webhook-payment';
import { UploadFile } from '../application/use-cases/storage/upload-file';
import { DrizzleAnnouncementRepository } from '../infrastructure/db/announcement-repository';
// Infrastructure / Repositories
import { DrizzlePaymentRepository } from '../infrastructure/db/payment-repository';
import { DrizzleUserRepository } from '../infrastructure/db/user-repository';
// Infrastructure / Services
import { ResendEmailService } from '../infrastructure/services/resend-email.service';
import { S3StorageService } from '../infrastructure/storage/s3-storage.service';
import { SharpImageOptimizer } from '../infrastructure/storage/sharp-image-optimizer.service';
import { createContext } from '../presentation/context';
import { uploadRoutes } from '../presentation/routes/upload';
import { webhookRoutes } from '../presentation/routes/webhook';
import { initUnleash } from '../shared/feature-flags';
import { type AppRouter, appRouter } from './app-router';

const baseCorsConfig = {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
};

const fastify = Fastify({
  logger: true,
});

// Dependency Injection Composition
const paymentRepo = new DrizzlePaymentRepository();
const announcementRepo = new DrizzleAnnouncementRepository();
const userRepo = new DrizzleUserRepository();
const emailService = new ResendEmailService();

const processWebhookPayment = new ProcessWebhookPayment(
  paymentRepo,
  announcementRepo,
  userRepo,
  emailService,
);

const storageService = new S3StorageService();
const imageOptimizer = new SharpImageOptimizer();
const uploadFile = new UploadFile(storageService, imageOptimizer);

fastify.register(fastifyCors, baseCorsConfig);
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
fastify.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
});
fastify.register(uploadRoutes, { uploadFile });
fastify.register(webhookRoutes, { processWebhookPayment });

fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ err: error }, 'Authentication Error:');
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      });
    }
  },
});

fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

fastify.get('/', async () => {
  return 'OK';
});

fastify.listen({ port: 3000 }, async (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  await initUnleash();
  console.log('Server running on port 3000');
});
