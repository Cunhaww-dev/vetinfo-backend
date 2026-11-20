import type { Attachment } from './attachment-entity.ts'

// Catálogo global, igual às espécies. Só leitura.
export type AttachmentType = { id: string; name: string }

// Toda busca recebe o userId. Um usuário nunca enxerga o anexo de outro.
export interface AttachmentRepository {
  create(attachment: Attachment): Promise<void>
  findById(id: string, userId: string): Promise<Attachment | null>
  listByVisit(visitId: string, userId: string): Promise<Attachment[]>
  listByPatient(patientId: string, userId: string): Promise<Attachment[]>
  visitExists(visitId: string, userId: string): Promise<boolean>
  patientExists(patientId: string, userId: string): Promise<boolean>
  listTypes(): Promise<AttachmentType[]>
  typeExists(typeId: string): Promise<boolean>
  // false = não existe, é de outro usuário ou já foi apagado
  softDelete(id: string, userId: string): Promise<boolean>
}
