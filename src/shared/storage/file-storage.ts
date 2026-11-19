// Porta para guardar arquivos. Os use cases só conhecem esta interface.
// O adaptador (disco local ou Cloudflare R2) é escolhido pelo STORAGE_DRIVER.
export interface FileStorage {
  save(key: string, content: Buffer, contentType: string): Promise<void>
  read(key: string): Promise<Buffer>
  remove(key: string): Promise<void>
}
