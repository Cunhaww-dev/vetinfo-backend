import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { FileStorage } from './file-storage.ts'

// Para o desenvolvimento: os arquivos ficam numa pasta do projeto (fora do git).
export class LocalFileStorage implements FileStorage {
  constructor(private readonly baseDir: string) {}

  async save(key: string, content: Buffer): Promise<void> {
    const path = join(this.baseDir, key)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  }

  async read(key: string): Promise<Buffer> {
    return readFile(join(this.baseDir, key))
  }

  async remove(key: string): Promise<void> {
    await rm(join(this.baseDir, key), { force: true })
  }
}
