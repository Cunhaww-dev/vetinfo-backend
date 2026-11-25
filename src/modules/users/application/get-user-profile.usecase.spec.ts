import { describe, expect, it } from 'vitest'
import { User } from '../domain/user-entity.ts'
import type { UserRepository } from '../domain/user-repository.ts'
import { GetUserProfile } from './get-user-profile.usecase.ts'

const ana = User.restore({
  id: 'ana',
  name: 'Ana',
  email: 'ana@test.com',
  type: 'professional',
  crmv: 'SP12345',
  createdAt: new Date('2026-01-01'),
  crmvActivatedAt: null,
})

const users: UserRepository = {
  findByEmail: async () => null,
  findById: async (id) => (id === ana.id ? ana : null),
  update: async () => {},
}

describe('GetUserProfile', () => {
  it('devolve o usuário logado', async () => {
    const result = await new GetUserProfile(users).execute({ userId: 'ana' })

    expect(result.value).toBe(ana)
  })

  // A sessão pode apontar para um usuário que não existe mais
  it('usuário que não existe vira USER_NOT_FOUND', async () => {
    const result = await new GetUserProfile(users).execute({ userId: 'bia' })

    expect(result.value).toMatchObject({ code: 'USER_NOT_FOUND' })
  })
})
