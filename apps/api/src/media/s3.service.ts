import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';

/** Presigned-PUT TTL in seconds (15 minutes). */
const PRESIGN_EXPIRES_IN = 900;

/**
 * Thin wrapper around the AWS S3 SDK.
 * - generatePresignedPutUrl  → caller uploads directly; API never handles binary.
 * - buildPublicUrl           → deterministic read URL (no expiry).
 * - deleteObject             → hard-deletes from S3.
 *
 * Bucket policy must allow public GetObject for buildPublicUrl to serve publicly.
 * For private buckets, replace buildPublicUrl with getSignedUrl(GetObjectCommand).
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const region = process.env.AWS_REGION ?? 'eu-north-1';
    const bucket = process.env.AWS_BUCKET_NAME ?? '';

    if (!bucket) {
      this.logger.error(
        '[S3Service] AWS_BUCKET_NAME is not set — S3 uploads will fail at runtime.',
      );
    }

    this.client = new S3Client({ region });
    this.bucket = bucket;
    this.publicBaseUrl =
      process.env.S3_PUBLIC_BASE_URL ??
      `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  /**
   * Returns a time-limited PUT URL the client can use to upload directly.
   * The key must be constructed by the caller (e.g. `listings/{id}/{uuid}.jpg`).
   */
  async generatePresignedPutUrl(
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });
  }

  /**
   * Constructs the public HTTPS URL for a stored object.
   * Does NOT verify the object exists.
   */
  buildPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  /**
   * Uploads a Buffer directly from the API server (server-side multipart flow).
   * Returns the public URL of the stored object.
   */
  async putObject(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    this.logger.log(
      `Uploading object to S3: ${key} (${contentType}, ${buffer.length} bytes)`,
    );
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return this.buildPublicUrl(key);
  }

  /**
   * Downloads an object and returns its content as a Buffer.
   * Used by the watermarking pipeline to fetch originals uploaded via the
   * presigned-PUT flow (where the API never handled the binary directly).
   * Throws on S3 error or empty response — caller should catch and degrade.
   */
  async getObjectAsBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`[S3Service] Empty body returned for key: ${key}`);
    }
    // AWS SDK v3 enriches Body with transformToByteArray()
    const bytes = await (
      response.Body as { transformToByteArray(): Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(bytes);
  }

  /** Hard-deletes an object. Throws on S3 error; caller decides how to handle. */
  async deleteObject(key: string): Promise<void> {
    this.logger.log(`Deleting S3 object: ${key}`);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  get presignExpiresIn(): number {
    return PRESIGN_EXPIRES_IN;
  }
}
