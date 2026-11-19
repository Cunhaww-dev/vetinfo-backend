import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { FileStorage } from './file-storage.ts'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

// Para produção: o Cloudflare R2 usa a mesma API do S3. O bucket é privado,
// e o arquivo só sai pela API, depois de conferir o dono.
export class R2FileStorage implements FileStorage {
  private readonly client: S3Client

  constructor(private readonly config: R2Config) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async save(key: string, content: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    )
  }

  async read(key: string): Promise<Buffer> {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    )
    if (!object.Body) throw new Error(`R2 object ${key} has no body`)
    return Buffer.from(await object.Body.transformToByteArray())
  }

  async remove(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    )
  }
}
