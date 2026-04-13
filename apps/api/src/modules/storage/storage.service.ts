import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import type { IStorageProvider, StorageConfig, UploadResult } from './storage.types.js';

@Injectable()
export class StorageService implements IStorageProvider {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;
  private bucketInitialized = false;

  constructor() {
    const config = this.loadConfig();
    this.bucket = config.bucket;

    this.minioClient = new Minio.Client({
      endPoint: config.endpoint,
      port: config.port,
      accessKey: config.user,
      secretKey: config.password,
      useSSL: config.useSSL,
    });

    // Fire-and-forget bucket initialization on startup
    this.ensureBucket().catch((err) => {
      this.logger.warn(
        `Bucket initialization failed — will retry on first upload: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // IStorageProvider implementation
  // ---------------------------------------------------------------------------

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    await this.ensureBucket();

    await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    return {
      key,
      url: this.getUrl(key),
      size: buffer.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, key);
    } catch (error) {
      // Eventual consistency — log but don't throw
      this.logger.warn(
        `Failed to delete object "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getUrl(key: string): string {
    return `/api/storage/${key}`;
  }

  async getStream(key: string): Promise<NodeJS.ReadableStream> {
    await this.ensureBucket();
    return this.minioClient.getObject(this.bucket, key);
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.minioClient.bucketExists(this.bucket);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private loadConfig(): StorageConfig {
    return {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      user: process.env.MINIO_ROOT_USER || 'minioadmin',
      password: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
      bucket: process.env.MINIO_BUCKET || 'sistema-odontologico',
      useSSL: process.env.MINIO_USE_SSL === 'true',
    };
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketInitialized) return;

    try {
      const exists = await this.minioClient.bucketExists(this.bucket);

      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        this.logger.log(`Created bucket "${this.bucket}"`);
      }

      // Set anonymous read policy on tenants/* prefix so profile photos
      // are publicly accessible via direct URL.
      await this.setAnonymousReadPolicy();
      this.bucketInitialized = true;
    } catch (error) {
      this.bucketInitialized = false;
      throw error;
    }
  }

  private async setAnonymousReadPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/tenants/*`],
        },
      ],
    };

    try {
      await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
    } catch (error) {
      this.logger.warn(
        `Failed to set bucket policy: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
