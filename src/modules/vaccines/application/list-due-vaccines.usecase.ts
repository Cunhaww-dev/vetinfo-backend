import type {
  DueVaccine,
  VaccineRepository,
} from '../domain/vaccine-repository.ts'

type ListDueVaccinesInput = {
  userId: string
  days: number
}

const DAY_MS = 24 * 60 * 60 * 1000

// Lembrete de revacinação: as próximas doses dos próximos dias, mais as atrasadas
export class ListDueVaccines {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(input: ListDueVaccinesInput): Promise<DueVaccine[]> {
    const today = new Date(new Date().toISOString().slice(0, 10))
    const until = new Date(today.getTime() + input.days * DAY_MS)

    return this.vaccines.listDue(input.userId, until)
  }
}
