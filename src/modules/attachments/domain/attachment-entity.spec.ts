import { describe, expect, it } from 'vitest'
import { Attachment } from './attachment-entity.ts'

function create(fileName: string) {
  return Attachment.create({
    userId: 'user-1',
    visitId: 'visit-1',
    typeId: 'type-1',
    fileName,
    contentType: 'application/pdf',
    sizeBytes: 10,
  })
}

describe('Attachment', () => {
  it('guarda só o nome do arquivo, sem pasta', () => {
    expect(create('../../etc/passwd').fileName).toBe('passwd')
    expect(create('C:\\exames\\hemograma.pdf').fileName).toBe('hemograma.pdf')
  })

  it('nome vazio vira "arquivo"', () => {
    expect(create('   ').fileName).toBe('arquivo')
  })

  it('a chave no storage usa o id, nunca o nome do arquivo', () => {
    const attachment = create('meu exame.pdf')

    expect(attachment.storageKey).toBe(`attachments/user-1/${attachment.id}`)
  })
})
