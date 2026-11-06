import type { Patient } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type ListPatientsInput = {
  userId: string
  guardianId?: string | undefined
}

export class ListPatients {
  constructor(private readonly patients: PatientRepository) {}

  async execute(input: ListPatientsInput): Promise<Patient[]> {
    return this.patients.listByUser(input.userId, {
      guardianId: input.guardianId,
    })
  }
}
