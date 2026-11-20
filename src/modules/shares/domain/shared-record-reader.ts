import type { BodyConditionScale } from '../../catalog/domain/body-condition-scale.ts'
// Só leitura: o que a pessoa com o código enxerga. Não são entidades.
// É um retrato do prontuário, montado numa consulta só, e nunca volta para o banco.

export type SharedVisit = {
  id: string
  visitedAt: Date
  authorType: 'professional' | 'student'
  vitalSigns: {
    weightKg: number | null
    temperatureC: number | null
    heartRate: number | null
    respiratoryRate: number | null
    bodyConditionScore: number | null
    bodyConditionScale: BodyConditionScale | null
  }
  soap: {
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
  }
  medications: {
    name: string
    dosage: string
    frequency: string
    route: string
    startDate: Date
    endDate: Date | null
    continuousUse: boolean
  }[]
  attachments: {
    id: string
    type: string
    fileName: string
    contentType: string
    sizeBytes: number
    description: string | null
  }[]
}

export type SharedPatient = {
  id: string
  name: string
  sex: 'male' | 'female'
  neutered: boolean
  coatColor: string | null
  birthDate: Date
  microchip: string | null
  breed: string
  species: string
  visits: SharedVisit[]
  vaccines: {
    name: string
    appliedAt: Date
    nextDoseAt: Date | null
    manufacturer: string | null
    batch: string | null
  }[]
}

export type SharedAttachment = {
  fileName: string
  contentType: string
  storageKey: string
}

export interface SharedRecordReader {
  read(
    patientIds: string[],
    ownerId: string,
    options: { hideMicrochip: boolean },
  ): Promise<SharedPatient[]>
  // O anexo só sai se for de um atendimento de um dos pacientes do código
  findAttachment(
    attachmentId: string,
    patientIds: string[],
    ownerId: string,
  ): Promise<SharedAttachment | null>
}
