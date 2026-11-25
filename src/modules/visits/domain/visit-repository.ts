import type { BodyConditionScale } from '../../catalog/domain/body-condition-scale.ts'
import type { Visit } from './visit-entity.ts'

// Só leitura, para a lista "atendidos há pouco". Não é uma entidade.
export type RecentPatient = {
  visitId: string
  visitedAt: Date
  patient: {
    id: string
    name: string
    breedId: string
    species: { id: string; name: string }
  }
}

// Só leitura, para a tela de atendimentos. Um item por atendimento.
export type VisitSummary = {
  id: string
  visitedAt: Date
  authorType: Visit['authorType']
  type: Visit['type']
  finishedAt: Date | null
  // As vacinas do atendimento, pelo nome. Na vacinação, é o que o vet procura na lista
  vaccines: string[]
  // A avaliação do SOAP (o diagnóstico), para o vet reconhecer o atendimento na lista
  assessment: string | null
  patient: {
    id: string
    name: string
    species: { id: string; name: string }
    breed: { id: string; name: string }
  }
  guardian: { id: string; name: string } | null
}

export type VisitSearchFilters = {
  speciesId?: string | undefined
  type?: Visit['type'] | undefined
  // open = em andamento, finished = finalizados
  status?: 'open' | 'finished' | undefined
  from?: Date | undefined
  to?: Date | undefined
  page: number
  pageSize: number
}

export type VisitSearchResult = {
  items: VisitSummary[]
  total: number
}

// Só o que o atendimento precisa saber do paciente
export type VisitPatient = {
  birthDate: Date | null
  // Vem da espécie (paciente → raça → espécie)
  bodyConditionScale: BodyConditionScale
}

// Toda busca recebe o userId. Um usuário nunca enxerga o atendimento de outro.
export interface VisitRepository {
  create(visit: Visit): Promise<void>
  update(visit: Visit): Promise<void>
  findById(id: string, userId: string): Promise<Visit | null>
  listByPatient(patientId: string, userId: string): Promise<Visit[]>
  findLatestWithVitalSigns(
    patientId: string,
    userId: string,
  ): Promise<Visit | null>
  patientExists(patientId: string, userId: string): Promise<boolean>
  findPatient(patientId: string, userId: string): Promise<VisitPatient | null>
  listRecentPatients(userId: string, limit: number): Promise<RecentPatient[]>
  // Todos os atendimentos do usuário, do mais novo ao mais antigo, com filtros
  search(
    userId: string,
    filters: VisitSearchFilters,
  ): Promise<VisitSearchResult>
  // As vacinas vivas do atendimento. A vacinação só finaliza com pelo menos 1
  countVaccines(visitId: string, userId: string): Promise<number>
  // false = não existe, é de outro usuário ou já foi apagado
  softDelete(id: string, userId: string): Promise<boolean>
}
