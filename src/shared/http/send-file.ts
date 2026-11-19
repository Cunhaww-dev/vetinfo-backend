import type { Response } from 'express'

type FileToSend = { name: string; contentType: string; content: Buffer }

// Manda um arquivo guardado no storage. O nosniff impede o navegador de
// "adivinhar" outro tipo e rodar o arquivo como HTML.
export function sendFile(res: Response, file: FileToSend) {
  const asciiName = file.name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')

  res.setHeader('Content-Type', file.contentType)
  res.setHeader('Content-Length', file.content.length)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, no-store') // dado clínico não fica em cache
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  )
  return res.status(200).send(file.content)
}
