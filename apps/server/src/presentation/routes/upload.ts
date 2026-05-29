import { auth } from '@base-fullstack-template/auth';
import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { storageClient } from '../../infrastructure/storage/storage.client';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/api/upload', async (request, reply) => {
    // 1. Authenticate check: Ensure user is logged in
    const authHeaders = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value) authHeaders.append(key, value.toString());
    });

    const betterAuthReq = new Request(
      `http://${request.headers.host || 'localhost'}${request.url}`,
      {
        method: request.method,
        headers: authHeaders,
      },
    );

    const session = await auth.api.getSession({
      headers: betterAuthReq.headers,
    });

    if (!session?.user) {
      return reply
        .status(401)
        .send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const data = await request.file();
    if (!data) {
      return reply
        .status(400)
        .send({ error: 'No file uploaded', code: 'BAD_REQUEST' });
    }

    const buffer = await data.toBuffer();
    const filename = data.filename;
    const mimetype = data.mimetype;

    const uploadType = data.fields?.type
      ? (data.fields.type as { value: string }).value
      : 'document';

    let uploadBuffer = buffer;
    let uploadMimetype = mimetype;
    let uploadFilename = `${session.user.id}-${Date.now()}-${filename}`;

    // If it's an image, run sharp optimization!
    if (uploadType === 'image' || mimetype.startsWith('image/')) {
      try {
        uploadBuffer = await sharp(buffer)
          .resize(800, 600, { fit: 'cover' }) // 4:3 cropped aspect ratio
          .webp({ quality: 80 })
          .toBuffer();
        uploadMimetype = 'image/webp';

        const extIndex = uploadFilename.lastIndexOf('.');
        uploadFilename = `${
          extIndex !== -1
            ? uploadFilename.substring(0, extIndex)
            : uploadFilename
        }.webp`;
      } catch (err) {
        fastify.log.error(err, 'Sharp image processing failed');
        return reply
          .status(400)
          .send({ error: 'Failed to process image', code: 'BAD_REQUEST' });
      }
    }

    // Upload to S3/MinIO
    try {
      const url = await storageClient.uploadFile(
        uploadFilename,
        uploadBuffer,
        uploadMimetype,
      );
      return reply.send({ url, key: uploadFilename });
    } catch (err) {
      fastify.log.error(err, 'S3 upload failed');
      return reply
        .status(500)
        .send({ error: 'Failed to save file', code: 'INTERNAL_SERVER_ERROR' });
    }
  });
}
