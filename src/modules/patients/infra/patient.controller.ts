import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { GetPatient } from '../application/get-patient.usecase.ts'
import type { ListPatients } from '../application/list-patients.usecase.ts'
import type { RegisterPatient } from '../application/register-patient.usecase.ts'
import type { UpdatePatient } from '../application/update-patient.usecase.ts'
import type { Patient } from '../domain/patient-entity.ts'

type PatientParams = { patientId: string }

// "2020-05-31" vira Date. Mantém o undefined (não mexer) e o null (apagar).
function toDate(value: string | null | undefined) {
  if (value === undefined || value === null) return value
  return new Date(value)
}

function toHttp(patient: Patient) {
  return {
    id: patient.id,
    guardianId: patient.guardianId,
    breedId: patient.breedId,
    name: patient.name,
    sex: patient.sex,
    neutered: patient.neutered,
    coatColor: patient.coatColor,
    birthDate: patient.birthDate?.toISOString().slice(0, 10) ?? null,
    microchip: patient.microchip,
    createdAt: patient.createdAt.toISOString(),
  }
}

export class PatientController {
  constructor(
    private readonly registerPatient: RegisterPatient,
    private readonly listPatients: ListPatients,
    private readonly getPatient: GetPatient,
    private readonly updatePatient: UpdatePatient,
  ) {}

  register = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const result = await this.registerPatient.execute({
      ...req.body,
      birthDate: toDate(req.body.birthDate),
      userId: res.locals.userId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  list = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const { guardianId } = req.query

    const patients = await this.listPatients.execute({
      userId: res.locals.userId,
      guardianId: typeof guardianId === 'string' ? guardianId : undefined,
    })

    return res.status(200).json(patients.map(toHttp))
  }

  show = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.getPatient.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  update = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.updatePatient.execute({
      ...req.body,
      birthDate: toDate(req.body.birthDate),
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }
}
