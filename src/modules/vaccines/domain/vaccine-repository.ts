import type { Vaccine } from './vaccine-entity.ts'

// Só o que a vacina precisa saber do paciente e do atendimento
export type VaccinePatient = { id: string; birthDate: Date }
export type VaccineVisit = { id: string; patientId: string; visitedAt: Date }

// Só leitura, para o lembrete de revacinação. Não é uma entidade.
export type DueVaccine = {
  vaccineId: string
  name: string
  nextDoseAt: Date
  patient: { id: string; name: string }
}

// Toda busca recebe o userId. Um usuário nunca enxerga a vacina de outro.
export interface VaccineRepository {
  create(vaccine: Vaccine): Promise<void>
  update(vaccine: Vaccine): Promise<void>
  findById(id: string, userId: string): Promise<Vaccine | null>
  listByPatient(patientId: string, userId: string): Promise<Vaccine[]>
  listByVisit(visitId: string, userId: string): Promise<Vaccine[]>
  // Próximas doses até a data limite, incluindo as atrasadas
  listDue(userId: string, until: Date): Promise<DueVaccine[]>
  findPatient(patientId: string, userId: string): Promise<VaccinePatient | null>
  findVisit(visitId: string, userId: string): Promise<VaccineVisit | null>
}
