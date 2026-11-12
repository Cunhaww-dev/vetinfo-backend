import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class MicrochipAlreadyInUse extends DomainError {
  readonly code = 'MICROCHIP_ALREADY_IN_USE'
  readonly type = 'conflict'

  constructor(microchip: string) {
    super(`Microchip ${microchip} is already in use by another patient`)
  }
}
