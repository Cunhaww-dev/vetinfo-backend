import { describe, expect, it } from 'vitest'
import { detectFileType } from './file-type.ts'

const bytes = (...values: number[]) => Buffer.from(values)

describe('detectFileType', () => {
  it('reconhece PDF, JPEG, PNG e WEBP pelos primeiros bytes', () => {
    expect(detectFileType(Buffer.from('%PDF-1.4'))).toBe('application/pdf')
    expect(detectFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(detectFileType(bytes(0x89, 0x50, 0x4e, 0x47))).toBe('image/png')
    expect(detectFileType(Buffer.from('RIFF\0\0\0\0WEBP'))).toBe('image/webp')
  })

  it('recusa HTML, mesmo com nome de imagem', () => {
    expect(detectFileType(Buffer.from('<html><script>'))).toBeNull()
  })

  it('recusa arquivo vazio', () => {
    expect(detectFileType(Buffer.alloc(0))).toBeNull()
  })
})
