import { randomUUID } from 'node:crypto'
import type { FileType } from '../../../shared/storage/file-type.ts'

type CreateAttachmentInput = {
  userId: string
  visitId: string
  typeId: string
  fileName: string
  contentType: FileType
  sizeBytes: number
  description?: string | null | undefined
}

type RestoreAttachmentProps = {
  id: string
  userId: string
  visitId: string
  typeId: string
  fileName: string
  contentType: string
  sizeBytes: number
  storageKey: string
  description: string | null
  createdAt: Date
}

// Só o nome, sem pasta. "../../etc/passwd" vira "passwd". Nome vazio vira "arquivo".
function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() ?? ''
  return base.slice(0, 255) || 'arquivo'
}

// Arquivo clínico de um atendimento. O conteúdo fica no storage, aqui só os dados dele.
// O anexo não muda depois de criado: um arquivo errado vira um anexo novo.
export class Attachment {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly visitId: string,
    readonly typeId: string,
    readonly fileName: string, // o nome original, só para mostrar e para o download
    readonly contentType: string, // lido dos bytes do arquivo, nunca do navegador
    readonly sizeBytes: number,
    readonly storageKey: string, // onde o arquivo está no storage
    readonly description: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: CreateAttachmentInput): Attachment {
    const id = randomUUID()

    return new Attachment(
      id,
      input.userId,
      input.visitId,
      input.typeId,
      cleanFileName(input.fileName),
      input.contentType,
      input.sizeBytes,
      `attachments/${input.userId}/${id}`, // o nome do usuário nunca entra na chave
      input.description?.trim() || null,
      new Date(),
    )
  }

  static restore(props: RestoreAttachmentProps): Attachment {
    return new Attachment(
      props.id,
      props.userId,
      props.visitId,
      props.typeId,
      props.fileName,
      props.contentType,
      props.sizeBytes,
      props.storageKey,
      props.description,
      props.createdAt,
    )
  }
}
