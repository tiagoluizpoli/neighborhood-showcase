import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '@base-fullstack-template/env/server';

export class StorageClient {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // required for MinIO
    });
    this.bucket = env.S3_BUCKET_NAME;
  }

  async ensureBucketExists() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      const err = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
      };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        console.log(`Bucket ${this.bucket} not found. Creating...`);
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`Bucket ${this.bucket} created successfully.`);
      } else {
        throw error;
      }
    }
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
  ): Promise<string> {
    await this.ensureBucketExists();
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.getPublicUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    return `${env.S3_ENDPOINT}/${this.bucket}/${key}`;
  }
}

export const storageClient = new StorageClient();
