import { auth } from '@neighborhood-showcase/auth';
import type { FastifyInstance } from 'fastify';
import type { UploadFile } from '../../application/use-cases/storage/upload-file';

export async function uploadRoutes(
  fastify: FastifyInstance,
  opts: { uploadFile: UploadFile },
) {
  const { uploadFile } = opts;
  if (!uploadFile) {
    throw new Error('UploadFile use case is required');
  }

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

    // Call the UploadFile use case
    try {
      const result = await uploadFile.execute({
        userId: session.user.id,
        filename,
        buffer,
        mimetype,
        uploadType,
      });
      return reply.send(result);
    } catch (err) {
      fastify.log.error(err, 'File upload failed');
      return reply
        .status(500)
        .send({ error: 'Failed to save file', code: 'INTERNAL_SERVER_ERROR' });
    }
  });
}
