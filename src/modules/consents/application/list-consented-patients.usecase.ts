import type { ConsentRepository } from '../domain/consent-repository.ts'

// Na tela de novo código para estudo, o vet vê de cara quem pode ser
// compartilhado. Não tem caso de erro: sem consentimento, a lista vem vazia.
export class ListConsentedPatients {
  constructor(private readonly consents: ConsentRepository) {}

  async execute(input: { userId: string }): Promise<string[]> {
    return this.consents.listConsentedPatientIds(input.userId)
  }
}
