// Contrato do repositório de usuários para persistência de dados no banco.
import type { User } from './user.entity.ts';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
