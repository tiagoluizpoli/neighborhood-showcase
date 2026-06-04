import type { StorageService } from '../../domain/services/storage.service';
import { storageClient } from './storage.client';

export class S3StorageService implements StorageService {
  async uploadFile(
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    return storageClient.uploadFile(filename, buffer, mimetype);
  }
}
