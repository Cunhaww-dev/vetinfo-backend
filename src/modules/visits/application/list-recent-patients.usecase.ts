import type {
  RecentPatient,
  VisitRepository,
} from '../domain/visit-repository.ts'

type ListRecentPatientsInput = {
  userId: string
  limit: number
}

// "Atendidos há pouco": os pacientes com o atendimento mais novo, um por paciente.
// Não tem caso de erro. Sem atendimentos, a lista vem vazia.
export class ListRecentPatients {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: ListRecentPatientsInput): Promise<RecentPatient[]> {
    return this.visits.listRecentPatients(input.userId, input.limit)
  }
}
