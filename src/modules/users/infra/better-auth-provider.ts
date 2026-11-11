import { auth } from '../../../shared/auth/auth.ts'
import type { AuthProvider } from '../domain/auth-provider.ts'
import { User } from '../domain/user-entity.ts'

export class BetterAuthProvider implements AuthProvider {
  // A classe BetterAuthProvider promete cumprir com o que tem em AuthProvider, caso tenha outra assinatura o TS mostra um erro
  async signUp(user: User, password: string): Promise<User> {
    const { user: created, token } = await auth.api.signUpEmail({
      body: {
        name: user.name,
        email: user.email,
        password,
        type: user.type,
        crmv: user.crmv,
        crmvActivatedAt: user.crmvActivatedAt,
      },
    })

    // O signUpEmail também faz login e cria uma sessão. O cookie dessa sessão
    // nunca chega ao front, então ela ficaria válida no banco por 7 dias sem uso.
    // O autoSignIn: false resolveria, mas ele faz a lib responder e-mail repetido
    // com um usuário falso (201), em vez de um erro.
    if (token) {
      const { internalAdapter } = await auth.$context
      await internalAdapter.deleteSession(token)
    }

    return User.restore({
      id: created.id,
      name: created.name,
      email: created.email,
      type: created.type,
      crmv: created.crmv ?? null,
      createdAt: created.createdAt,
      crmvActivatedAt: created.crmvActivatedAt ?? null,
    })
  }
}

// Este é o único arquivo do módulo que importa o better-auth. O domínio e o use case continuam sem saber que ele existe. Este é o padrão "portas e adaptadores": a porta (AuthProvider) fica no domínio e o adaptador (BetterAuthProvider) fica na infra.
