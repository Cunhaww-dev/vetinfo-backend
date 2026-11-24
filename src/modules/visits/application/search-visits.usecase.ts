import type {
  VisitRepository,
  VisitSearchResult,
} from '../domain/visit-repository.ts'

export const VISITS_PAGE_SIZE = 20

type SearchVisitsInput = {
  userId: string
  speciesId?: string | undefined
  from?: Date | undefined
  to?: Date | undefined
  page: number
}

// A tela de atendimentos: todos os atendimentos do usuário, de todos os pacientes.
// Filtra por espécie e por período. Não tem caso de erro: sem resultado, a lista vem vazia.
export class SearchVisits {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: SearchVisitsInput): Promise<VisitSearchResult> {
    return this.visits.search(input.userId, {
      speciesId: input.speciesId,
      from: input.from,
      to: input.to,
      page: input.page,
      pageSize: VISITS_PAGE_SIZE,
    })
  }
}
