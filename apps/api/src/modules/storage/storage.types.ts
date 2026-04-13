/**
 * Result of a successful storage upload.
 */
export interface UploadResult {
  /** Object key, e.g. "tenants/{tid}/profile-photos/{uid}.webp" */
  key: string;
  /** URL path to access the file, e.g. "/api/storage/tenants/{tid}/profile-photos/{uid}.webp" */
  url: string;
  /** Size in bytes after processing */
  size: number;
  /** MIME type of the stored file, e.g. "image/webp" */
  mimeType: string;
}

/**
 * Generic storage provider interface.
 * Implementations can target MinIO, AWS S3, Cloudflare R2, etc.
 */
export interface IStorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  healthCheck(): Promise<boolean>;
}

/**
 * Configuration for connecting to a MinIO/S3-compatible storage service.
 */
export interface StorageConfig {
  endpoint: string;
  port: number;
  user: string;
  password: string;
  bucket: string;
  useSSL: boolean;
}
