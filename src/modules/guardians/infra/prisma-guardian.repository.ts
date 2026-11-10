import type {
  GuardianAddress as AddressRow,
  Guardian as GuardianRow,
  PrismaClient,
} from '../../../generated/prisma/client.ts'
import { Address } from '../domain/address.ts'
import { Cpf } from '../domain/cpf.ts'
import { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

// Junto com o tutor, o banco só traz o endereço atual
const CURRENT_ADDRESS = { addresses: { where: { current: true }, take: 1 } }

export class PrismaGuardianRepository implements GuardianRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(guardian: Guardian): Promise<void> {
    await this.prisma.guardian.create({
      data: {
        id: guardian.id,
        userId: guardian.userId,
        name: guardian.name,
        phone: guardian.phone,
        email: guardian.email,
        cpf: guardian.cpf?.value ?? null,
        birthDate: guardian.birthDate,
        createdAt: guardian.createdAt,
        ...(guardian.address && {
          addresses: { create: this.toAddressRow(guardian.address) },
        }),
      },
    })
  }

  async findById(id: string, userId: string): Promise<Guardian | null> {
    const row = await this.prisma.guardian.findFirst({
      where: { id, userId },
      include: CURRENT_ADDRESS,
    })
    return row ? this.toDomain(row) : null
  }

  async findByCpf(cpf: string, userId: string): Promise<Guardian | null> {
    const row = await this.prisma.guardian.findUnique({
      where: { userId_cpf: { userId, cpf } },
      include: CURRENT_ADDRESS,
    })
    return row ? this.toDomain(row) : null
  }

  async listByUser(userId: string): Promise<Guardian[]> {
    const rows = await this.prisma.guardian.findMany({
      where: { userId },
      include: CURRENT_ADDRESS,
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async update(guardian: Guardian): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardian.id },
      data: {
        name: guardian.name,
        phone: guardian.phone,
        email: guardian.email,
        cpf: guardian.cpf?.value ?? null,
        birthDate: guardian.birthDate,
      },
    })
  }

  // As 2 escritas andam juntas: ou as duas acontecem, ou nenhuma.
  // Assim o tutor nunca fica com 2 endereços atuais, nem com nenhum.
  async changeAddress(guardian: Guardian): Promise<void> {
    if (!guardian.address) return

    await this.prisma.$transaction([
      this.prisma.guardianAddress.updateMany({
        where: { guardianId: guardian.id, current: true },
        data: { current: false },
      }),
      this.prisma.guardianAddress.create({
        data: {
          guardianId: guardian.id,
          ...this.toAddressRow(guardian.address),
        },
      }),
    ])
  }

  private toAddressRow(address: Address) {
    return {
      street: address.street,
      number: address.number,
      complement: address.complement,
      district: address.district,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      current: true,
    }
  }

  private toDomain(row: GuardianRow & { addresses: AddressRow[] }): Guardian {
    const current = row.addresses[0]

    return Guardian.restore({
      id: row.id,
      userId: row.userId,
      name: row.name,
      phone: row.phone,
      email: row.email,
      cpf: row.cpf ? Cpf.restore(row.cpf) : null,
      birthDate: row.birthDate,
      address: current ? Address.restore(current) : null,
      createdAt: row.createdAt,
    })
  }
}
