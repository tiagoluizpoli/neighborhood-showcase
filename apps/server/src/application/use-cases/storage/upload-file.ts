import type { ImageOptimizer } from '../../../domain/services/image-optimizer.service';
import type { StorageService } from '../../../domain/services/storage.service';

export interface UploadFileInput {
  userId: string;
  filename: string;
  buffer: Buffer;
  mimetype: string;
  uploadType: string;
}

export interface UploadFileResult {
  url: string;
  key: string;
}

export class UploadFile {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageOptimizer: ImageOptimizer,
  ) {}

  async execute(input: UploadFileInput): Promise<UploadFileResult> {
    let uploadBuffer = input.buffer;
    let uploadMimetype = input.mimetype;
    let uploadFilename = `${input.userId}-${Date.now()}-${input.filename}`;

    if (input.uploadType === 'image' || input.mimetype.startsWith('image/')) {
      uploadBuffer = await this.imageOptimizer.optimizeWebp(input.buffer);
      uploadMimetype = 'image/webp';

      const extIndex = uploadFilename.lastIndexOf('.');
      uploadFilename = `${
        extIndex !== -1 ? uploadFilename.substring(0, extIndex) : uploadFilename
      }.webp`;
    }

    const url = await this.storageService.uploadFile(
      uploadFilename,
      uploadBuffer,
      uploadMimetype,
    );

    return { url, key: uploadFilename };
  }
}
