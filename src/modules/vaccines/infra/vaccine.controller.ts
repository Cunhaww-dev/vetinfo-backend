import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { ListDueVaccines } from '../application/list-due-vaccines.usecase.ts'
import type { ListPatientVaccines } from '../application/list-patient-vaccines.usecase.ts'
import type { ListVisitVaccines } from '../application/list-visit-vaccines.usecase.ts'
import type { RegisterVaccine } from '../application/register-vaccine.usecase.ts'
import type { UpdateVaccine } from '../application/update-vaccine.usecase.ts'
import type { Vaccine } from '../domain/vaccine-entity.ts'
import { dueVaccinesQuerySchema } from '../vaccine.schema.ts'
import type { DeleteVaccine } from '../application/delete-vaccine.usecase.ts'

type PatientParams = { patientId: string }
type VisitParams = { visitId: string }
type VaccineParams = { vaccineId: string }

// "2026-11-19" vira Date. Mantém o undefined (não mexer) e o null (apagar).
function toDate(value: string | null | undefined) {
  if (value === undefined || value === null) return value
  return new Date(value)
}

const toDay = (date: Date) => date.toISOString().slice(0, 10)

function toHttp(vaccine: Vaccine) {
  return {
    id: vaccine.id,
    patientId: vaccine.patientId,
    visitId: vaccine.visitId,
    name: vaccine.name,
    appliedAt: toDay(vaccine.appliedAt),
    nextDoseAt: vaccine.nextDoseAt ? toDay(vaccine.nextDoseAt) : null,
    manufacturer: vaccine.manufacturer,
    batch: vaccine.batch,
    notes: vaccine.notes,
    createdAt: vaccine.createdAt.toISOString(),
  }
}

export class VaccineController {
  constructor(
    private readonly registerVaccine: RegisterVaccine,
    private readonly listPatientVaccines: ListPatientVaccines,
    private readonly listVisitVaccines: ListVisitVaccines,
    private readonly updateVaccine: UpdateVaccine,
    private readonly listDueVaccines: ListDueVaccines,
    private readonly deleteVaccine: DeleteVaccine,
  ) {}

  register = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.registerVaccine.execute({
      ...req.body,
      appliedAt: toDate(req.body.appliedAt),
      nextDoseAt: toDate(req.body.nextDoseAt),
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  listByPatient = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listPatientVaccines.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  listByVisit = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listVisitVaccines.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  update = async (
    req: Request<VaccineParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.updateVaccine.execute({
      ...req.body,
      appliedAt: toDate(req.body.appliedAt),
      nextDoseAt: toDate(req.body.nextDoseAt),
      userId: res.locals.userId,
      vaccineId: req.params.vaccineId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  due = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const { days } = dueVaccinesQuerySchema.parse(req.query)
    const today = toDay(new Date())

    const due = await this.listDueVaccines.execute({
      userId: res.locals.userId,
      days,
    })

    return res.status(200).json(
      due.map((item) => ({
        vaccineId: item.vaccineId,
        name: item.name,
        nextDoseAt: toDay(item.nextDoseAt),
        overdue: toDay(item.nextDoseAt) < today,
        patient: item.patient,
      })),
    )
  }

  remove = async (
    req: Request<{ vaccineId: string }>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.deleteVaccine.execute({
      userId: res.locals.userId,
      vaccineId: req.params.vaccineId,
    })
    if (result.isLeft()) throw result.value

    return res.status(204).send()
  }
}
