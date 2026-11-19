import { describe, expect, it } from 'vitest'
import { left, right } from '../../../shared/either/either.ts'
import type { AuthProvider } from '../domain/auth-provider.ts'
import { EmailAlreadyInUse } from '../domain/errors/email-already-in-use.ts'
import type { User } from '../domain/user-entity.ts'
import type { UserRepository } from '../domain/user-repository.ts'
import { RegisterUser } from './register-user.usecase.ts'

// Nenhum usuário no banco: a checagem do use case sempre passa
const emptyUsers: UserRepository = {
  findByEmail: async () => null,
  findById: async () => null,
  update: async () => {},
}

const input = {
  name: 'Ana',
  email: ' ANA@test.com ',
  password: '12345678',
  type: 'professional' as const,
  crmv: 'sp12345',
}

describe('RegisterUser', () => {
  it('cria o usuário pelo provider, com o e-mail normalizado', async () => {
    const provider: AuthProvider = { signUp: async (user) => right(user) }

    const result = await new RegisterUser(emptyUsers, provider).execute(input)

    expect((result.value as User).email).toBe('ana@test.com')
    expect((result.value as User).crmv).toBe('SP12345')
  })

  // Dois cadastros ao mesmo tempo: os dois passam pela checagem, e o provider
  // acusa o segundo. Antes isso dava 500.
  it('e-mail que entrou no banco no meio do caminho vira EMAIL_ALREADY_IN_USE', async () => {
    const provider: AuthProvider = {
      signUp: async (user) => left(new EmailAlreadyInUse(user.email)),
    }

    const result = await new RegisterUser(emptyUsers, provider).execute(input)

    expect(result.value).toMatchObject({ code: 'EMAIL_ALREADY_IN_USE' })
  })

  it('CRMV fora do formato nem chega ao provider', async () => {
    let called = false
    const provider: AuthProvider = {
      signUp: async (user) => {
        called = true
        return right(user)
      },
    }

    const result = await new RegisterUser(emptyUsers, provider).execute({
      ...input,
      crmv: 'XX12345',
    })

    expect(result.value).toMatchObject({ code: 'INVALID_CRMV_FORMAT' })
    expect(called).toBe(false)
  })
})
