import type { User } from './user-entity.ts'

export interface AuthProvider {
  signUp(user: User, password: string): Promise<User>
}
