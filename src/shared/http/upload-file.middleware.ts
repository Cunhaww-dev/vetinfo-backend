import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'

// Lê um arquivo do multipart/form-data, no campo "file", e guarda em memória (req.file).
// Os outros campos do formulário vão para o req.body. Genérico: cada rota escolhe o limite.
export function uploadFile(maxSizeMb: number) {
  const upload = multer({
    storage: multer.memoryStorage(),
    defParamCharset: 'utf8', // sem isso, "raio x ç.png" chega como "raio x Ã§.png"
    limits: { fileSize: maxSizeMb * 1024 * 1024, files: 1 },
  }).single('file')

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        const tooLarge = error.code === 'LIMIT_FILE_SIZE'
        res.status(tooLarge ? 413 : 400).json({
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? `File is larger than ${maxSizeMb} MB`
            : error.message,
        })
        return
      }
      if (error) return next(error)

      if (!req.file) {
        res.status(400).json({
          code: 'FILE_REQUIRED',
          message: 'Send the file in the "file" field (multipart/form-data)',
        })
        return
      }

      next()
    })
  }
}
