import { z } from 'zod'

// Os campos de texto do multipart/form-data. O arquivo vem no campo "file".
export const uploadAttachmentSchema = z.object({
  typeId: z.uuid('Type is required'),
  description: z.string().trim().nullish(),
})
