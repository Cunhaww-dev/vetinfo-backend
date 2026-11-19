import { APIError } from 'better-auth/api'
import { type Either, left, right } from '../../../shared/either/either.ts'
import { auth } from '../../../shared/auth/auth.ts'
import type { AuthProvider } from '../domain/auth-provider.ts'
import { EmailAlreadyInUse } from '../domain/errors/email-already-in-use.ts'
import { User } from '../domain/user-entity.ts'

// Dois cadastros ao mesmo tempo com o mesmo e-mail passam pela checagem do use case.
// O segundo cai aqui: a lib acusa o e-mail repetido, ou o banco recusa (unique) e a lib
// devolve um erro genérico. No genérico, o e-mail já existir no banco confirma a causa.
async function isEmailTaken(error: unknown, email: string): Promise<boolean> {
  if (!(error instanceof APIError)) return false

  const code = error.body?.code
  if (code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') return true
  if (code !== 'FAILED_TO_CREATE_USER') return false

  const { internalAdapter } = await auth.$context
  return (await internalAdapter.findUserByEmail(email)) !== null
}

export class BetterAuthProvider implements AuthProvider {
  // A classe BetterAuthProvider promete cumprir com o que tem em AuthProvider, caso tenha outra assinatura o TS mostra um erro
  async signUp(
    user: User,
    password: string,
  ): Promise<Either<EmailAlreadyInUse, User>> {
    let signedUp
    try {
      signedUp = await auth.api.signUpEmail({
        body: {
          name: user.name,
          email: user.email,
          password,
          type: user.type,
          crmv: user.crmv,
          crmvActivatedAt: user.crmvActivatedAt,
        },
      })
    } catch (error) {
      if (await isEmailTaken(error, user.email))
        return left(new EmailAlreadyInUse(user.email))
      throw error
    }
    const { user: created, token } = signedUp

    // O signUpEmail também faz login e cria uma sessão. O cookie dessa sessão
    // nunca chega ao front, então ela ficaria válida no banco por 7 dias sem uso.
    // O autoSignIn: false resolveria, mas ele faz a lib responder e-mail repetido
    // com um usuário falso (201), em vez de um erro.
    if (token) {
      const { internalAdapter } = await auth.$context
      await internalAdapter.deleteSession(token)
    }

    return right(
      User.restore({
        id: created.id,
        name: created.name,
        email: created.email,
        type: created.type,
        crmv: created.crmv ?? null,
        createdAt: created.createdAt,
        crmvActivatedAt: created.crmvActivatedAt ?? null,
      }),
    )
  }
}

// Este é o único arquivo do módulo que importa o better-auth. O domínio e o use case continuam sem saber que ele existe. Este é o padrão "portas e adaptadores": a porta (AuthProvider) fica no domínio e o adaptador (BetterAuthProvider) fica na infra.
