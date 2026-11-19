import type { Either } from '../../../shared/either/either.ts'
import type { EmailAlreadyInUse } from './errors/email-already-in-use.ts'
import type { User } from './user-entity.ts'

export interface AuthProvider {
  // Left quando o e-mail entrou no banco entre a checagem do use case e o cadastro
  signUp(user: User, password: string): Promise<Either<EmailAlreadyInUse, User>>
}
