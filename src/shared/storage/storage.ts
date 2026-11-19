import type { FileStorage } from './file-storage.ts'
import { LocalFileStorage } from './local-file-storage.ts'
import { R2FileStorage } from './r2-file-storage.ts'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} environment variable is not set.`)
  return value
}

// Uma instância para o app todo. Sem STORAGE_DRIVER, vale o disco local.
function createFileStorage(): FileStorage {
  if (process.env.STORAGE_DRIVER === 'r2') {
    return new R2FileStorage({
      accountId: requireEnv('R2_ACCOUNT_ID'),
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      bucket: requireEnv('R2_BUCKET'),
    })
  }
  return new LocalFileStorage(process.env.UPLOADS_DIR ?? 'uploads')
}

export const fileStorage = createFileStorage()
