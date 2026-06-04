export interface StorageService {
  uploadFile(
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string>;
}
