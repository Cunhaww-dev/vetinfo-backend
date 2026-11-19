import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidShareExpiration } from './errors/invalid-share-expiration.ts'
import { InvalidShareGuardian } from './errors/invalid-share-guardian.ts'
import { ShareAlreadyRevoked } from './errors/share-already-revoked.ts'

export const SHARE_TYPES = ['guardian', 'third_party'] as const
export type ShareType = (typeof SHARE_TYPES)[number]

export type ShareStatus = 'active' | 'revoked' | 'expired' | 'exhausted'

export const MAX_SHARE_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

type CreateShareInput = {
  userId: string
  type: ShareType
  guardianId?: string | null | undefined
  patientIds: string[]
  code: string
  recipientName?: string | null | undefined
  expiresAt: Date
  maxUses?: number | null | undefined
}

type RestoreShareProps = {
  id: string
  userId: string
  type: ShareType
  guardianId: string | null
  patientIds: string[]
  code: string
  recipientName: string | null
  expiresAt: Date
  maxUses: number | null
  revokedAt: Date | null
  usesCount: number
  createdAt: Date
}

// Código de acesso somente leitura a um ou mais pacientes.
// As regras de quem pode receber (tutor dono, consentimento) ficam no use case,
// porque dependem de outros agregados (paciente, consentimento).
export class Share {
  private constructor(
    readonly id: string,
    readonly userId: string, // o veterinário que criou
    readonly type: ShareType,
    readonly guardianId: string | null, // só no tipo guardian
    readonly patientIds: string[],
    readonly code: string,
    readonly recipientName: string | null, // para o veterinário lembrar quem recebeu
    readonly expiresAt: Date,
    readonly maxUses: number | null, // null = sem limite
    readonly revokedAt: Date | null,
    readonly usesCount: number, // contado nos ShareUse, nunca guardado
    readonly createdAt: Date,
  ) {}

  static create(input: CreateShareInput): Either<DomainError, Share> {
    const guardianId = input.guardianId ?? null
    if ((input.type === 'guardian') !== (guardianId !== null))
      return left(new InvalidShareGuardian())

    const now = Date.now()
    const expiresAt = input.expiresAt.getTime()
    if (expiresAt <= now || expiresAt > now + MAX_SHARE_DAYS * DAY_MS)
      return left(new InvalidShareExpiration(MAX_SHARE_DAYS))

    return right(
      new Share(
        randomUUID(),
        input.userId,
        input.type,
        guardianId,
        [...new Set(input.patientIds)],
        input.code,
        input.recipientName?.trim() || null,
        input.expiresAt,
        input.maxUses ?? null,
        null,
        0,
        new Date(),
      ),
    )
  }

  // A ordem importa: revogado ganha de vencido, que ganha de esgotado
  status(now = new Date()): ShareStatus {
    if (this.revokedAt) return 'revoked'
    if (this.expiresAt.getTime() <= now.getTime()) return 'expired'
    if (this.maxUses !== null && this.usesCount >= this.maxUses)
      return 'exhausted'
    return 'active'
  }

  // Os anexos abrem a partir da página do código. Esgotar os usos não bloqueia
  // o arquivo de quem já entrou, mas revogar ou vencer bloqueia.
  canServeFiles(now = new Date()): boolean {
    const status = this.status(now)
    return status === 'active' || status === 'exhausted'
  }

  revoke(): Either<DomainError, Share> {
    if (this.revokedAt) return left(new ShareAlreadyRevoked(this.id))
    return right(Share.restore({ ...this, revokedAt: new Date() }))
  }

  static restore(props: RestoreShareProps): Share {
    return new Share(
      props.id,
      props.userId,
      props.type,
      props.guardianId,
      props.patientIds,
      props.code,
      props.recipientName,
      props.expiresAt,
      props.maxUses,
      props.revokedAt,
      props.usesCount,
      props.createdAt,
    )
  }
}
