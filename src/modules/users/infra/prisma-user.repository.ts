import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { User } from '../domain/user.entity.ts';
import type { UserRepository } from '../domain/user.repository.ts';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {} // DI feita na mão, passando o prisma como parâmetro no construtor

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });

    if (!row) return null;

    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.hashedPass,
      type: row.type,
      crmv: row.crmv,
      createdAt: row.createdAt,
      crmvActivatedAt: row.crmvActivatedAt,
    });
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        hashedPass: user.passwordHash,
        type: user.type,
        crmv: user.crmv,
        createdAt: user.createdAt,
        crmvActivatedAt: user.crmvActivatedAt,
      },
    });
  }
}
