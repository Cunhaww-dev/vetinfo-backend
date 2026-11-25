import type {
  VisitRepository,
  VisitSearchFilters,
  VisitSearchResult,
} from '../domain/visit-repository.ts'

type SearchVisitsInput = {
  userId: string
  speciesId?: string | undefined
  type?: VisitSearchFilters['type']
  status?: VisitSearchFilters['status']
  from?: Date | undefined
  to?: Date | undefined
  page: number
  pageSize: number
}

// A tela de atendimentos: todos os atendimentos do usuário, de todos os pacientes.
// Filtra por espécie, por tipo, por status e por período. Não tem caso de erro: sem resultado, a lista vem vazia.
export class SearchVisits {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: SearchVisitsInput): Promise<VisitSearchResult> {
    return this.visits.search(input.userId, {
      speciesId: input.speciesId,
      type: input.type,
      status: input.status,
      from: input.from,
      to: input.to,
      page: input.page,
      pageSize: input.pageSize,
    })
  }
}
