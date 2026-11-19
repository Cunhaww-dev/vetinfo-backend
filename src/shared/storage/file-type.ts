export type FileType =
  'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

// Lê o tipo pelos primeiros bytes do arquivo ("magic number"), e não pelo nome
// ou pelo Content-Type que o navegador manda. Os dois podem mentir: um .html
// com nome de .png viraria XSS quando alguém abrisse o anexo.
export function detectFileType(content: Buffer): FileType | null {
  const startsWith = (bytes: number[], offset = 0) =>
    bytes.every((byte, i) => content[offset + i] === byte)

  if (startsWith([0x25, 0x50, 0x44, 0x46])) return 'application/pdf' // %PDF
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith([0x89, 0x50, 0x4e, 0x47])) return 'image/png'
  // RIFF....WEBP
  if (
    startsWith([0x52, 0x49, 0x46, 0x46]) &&
    startsWith([0x57, 0x45, 0x42, 0x50], 8)
  )
    return 'image/webp'
  return null
}
