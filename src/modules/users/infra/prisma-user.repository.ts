import type {
  PrismaClient,
  User as UserRow,
} from '../../../generated/prisma/client.ts'
import { User } from '../domain/user-entity.ts'
import type { UserRepository } from '../domain/user-repository.ts'

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {} // DI feita na mão, passando o prisma como parâmetro no construtor

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } })
    return row ? this.toDomain(row) : null
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        type: user.type,
        crmv: user.crmv,
        crmvActivatedAt: user.crmvActivatedAt,
      },
    })
  }

  // Traduz a linha do banco pra entidade. Um lugar só, os dois métodos usam.
  private toDomain(row: UserRow): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      type: row.type,
      crmv: row.crmv,
      createdAt: row.createdAt,
      crmvActivatedAt: row.crmvActivatedAt,
    })
  }
}
