import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { ListPatientMedications } from '../application/list-patient-medications.usecase.ts'
import type { ListVisitMedications } from '../application/list-visit-medications.usecase.ts'
import type { RegisterMedication } from '../application/register-medication.usecase.ts'
import type { UpdateMedication } from '../application/update-medication.usecase.ts'
import type { Medication } from '../domain/medication-entity.ts'
import { patientMedicationsQuerySchema } from '../medication.schema.ts'
import type { DeleteMedication } from '../application/delete-medication.usecase.ts'

type VisitParams = { visitId: string }
type PatientParams = { patientId: string }
type MedicationParams = { medicationId: string }

// "2026-11-19" vira Date. Mantém o undefined (não mexer) e o null (apagar).
function toDate(value: string | null | undefined) {
  if (value === undefined || value === null) return value
  return new Date(value)
}

const toDay = (date: Date) => date.toISOString().slice(0, 10)

function toHttp(medication: Medication) {
  return {
    id: medication.id,
    visitId: medication.visitId,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    route: medication.route,
    startDate: toDay(medication.startDate),
    endDate: medication.endDate ? toDay(medication.endDate) : null,
    continuousUse: medication.continuousUse,
    active: medication.active,
    notes: medication.notes,
    createdAt: medication.createdAt.toISOString(),
  }
}

export class MedicationController {
  constructor(
    private readonly registerMedication: RegisterMedication,
    private readonly listVisitMedications: ListVisitMedications,
    private readonly listPatientMedications: ListPatientMedications,
    private readonly updateMedication: UpdateMedication,
    private readonly deleteMedication: DeleteMedication,
  ) {}

  register = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.registerMedication.execute({
      ...req.body,
      startDate: toDate(req.body.startDate),
      endDate: toDate(req.body.endDate),
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  listByVisit = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listVisitMedications.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  listByPatient = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const { active } = patientMedicationsQuerySchema.parse(req.query)

    const result = await this.listPatientMedications.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
      onlyActive: active === 'true',
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  update = async (
    req: Request<MedicationParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.updateMedication.execute({
      ...req.body,
      startDate: toDate(req.body.startDate),
      endDate: toDate(req.body.endDate),
      userId: res.locals.userId,
      medicationId: req.params.medicationId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  remove = async (
    req: Request<{ medicationId: string }>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.deleteMedication.execute({
      userId: res.locals.userId,
      medicationId: req.params.medicationId,
    })
    if (result.isLeft()) throw result.value

    return res.status(204).send()
  }
}
