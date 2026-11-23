import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { ShareNotAvailable } from '../domain/errors/share-not-available.ts'
import { ShareNotFound } from '../domain/errors/share-not-found.ts'
import { normalizeShareCode } from '../domain/share-code.ts'
import type { Share } from '../domain/share-entity.ts'
import type {
  ShareRepository,
  ShareVisitor,
} from '../domain/share-repository.ts'
import type {
  SharedPatient,
  SharedRecordReader,
} from '../domain/shared-record-reader.ts'

type AccessShareInput = { code: string; visitor: ShareVisitor }

type SharedRecord = { share: Share; patients: SharedPatient[] }

const REASONS = {
  revoked: 'it was revoked',
  expired: 'it expired',
}

// Os pacientes que o código ainda pode mostrar. No estudo, a revogação do
// consentimento vale na hora, mesmo para um código criado antes dela.
export async function visiblePatientIds(
  share: Share,
  shares: ShareRepository,
): Promise<string[]> {
  if (share.type === 'guardian') return share.patientIds

  const patients = await shares.findPatients(share.patientIds, share.userId)
  const consented = await shares.withActiveConsent(patients)
  return share.patientIds.filter((id) => consented.has(id))
}

// Rota pública: quem tem o código vê o prontuário, somente leitura
export class AccessShare {
  constructor(
    private readonly shares: ShareRepository,
    private readonly reader: SharedRecordReader,
  ) {}

  async execute(
    input: AccessShareInput,
  ): Promise<Either<DomainError, SharedRecord>> {
    const code = normalizeShareCode(input.code)
    const share = await this.shares.findByCode(code)
    if (!share) return left(new ShareNotFound(code))

    const status = share.status()
    if (status !== 'active') return left(new ShareNotAvailable(REASONS[status]))

    const patientIds = await visiblePatientIds(share, this.shares)
    if (patientIds.length === 0)
      return left(new ShareNotAvailable('the guardian revoked the consent'))

    // Cada acesso conta um uso, e fica registrado para a auditoria
    await this.shares.recordUse(share.id, input.visitor)

    // No estudo, o microchip fica de fora: ele identifica o animal fora da clínica
    const patients = await this.reader.read(patientIds, share.userId, {
      hideMicrochip: share.type === 'third_party',
    })

    return right({ share, patients })
  }
}
