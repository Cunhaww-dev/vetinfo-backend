import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { GetLatestVitalSigns } from '../application/get-latest-vital-signs.usecase.ts'
import type { ListRecentPatients } from '../application/list-recent-patients.usecase.ts'
import type { GetVisit } from '../application/get-visit.usecase.ts'
import type { ListVisits } from '../application/list-visits.usecase.ts'
import type { RegisterVisit } from '../application/register-visit.usecase.ts'
import type { UpdateVisit } from '../application/update-visit.usecase.ts'
import type { Visit } from '../domain/visit-entity.ts'
import type { SearchVisits } from '../application/search-visits.usecase.ts'
import {
  recentPatientsQuerySchema,
  searchVisitsQuerySchema,
} from '../visit.schema.ts'
import type { DeleteVisit } from '../application/delete-visit.usecase.ts'
import type { FinishVisit } from '../application/finish-visit.usecase.ts'

type PatientParams = { patientId: string }
type VisitParams = { visitId: string }

// "2026-11-06T14:30:00-03:00" vira Date. Sem data, segue undefined.
function toDate(value: string | undefined) {
  return value === undefined ? undefined : new Date(value)
}

function toHttp(visit: Visit) {
  return {
    id: visit.id,
    patientId: visit.patientId,
    authorType: visit.authorType,
    type: visit.type,
    visitedAt: visit.visitedAt.toISOString(),
    finishedAt: visit.finishedAt?.toISOString() ?? null,
    vitalSigns: {
      weightKg: visit.vitalSigns.weightKg,
      temperatureC: visit.vitalSigns.temperatureC,
      heartRate: visit.vitalSigns.heartRate,
      respiratoryRate: visit.vitalSigns.respiratoryRate,
      bodyConditionScore: visit.vitalSigns.bodyConditionScore,
      bodyConditionScale: visit.vitalSigns.bodyConditionScale,
    },
    soap: {
      subjective: visit.soap.subjective,
      objective: visit.soap.objective,
      assessment: visit.soap.assessment,
      plan: visit.soap.plan,
    },
  }
}

export class VisitController {
  constructor(
    private readonly registerVisit: RegisterVisit,
    private readonly listVisits: ListVisits,
    private readonly getVisit: GetVisit,
    private readonly updateVisit: UpdateVisit,
    private readonly getLatestVitalSigns: GetLatestVitalSigns,
    private readonly listRecentPatients: ListRecentPatients,
    private readonly deleteVisit: DeleteVisit,
    private readonly searchVisits: SearchVisits,
    private readonly finishVisit: FinishVisit,
  ) {}

  finish = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.finishVisit.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  search = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const query = searchVisitsQuerySchema.parse(req.query)

    const { items, total } = await this.searchVisits.execute({
      userId: res.locals.userId,
      speciesId: query.speciesId,
      type: query.type,
      status: query.status,
      from: toDate(query.from),
      to: toDate(query.to),
      page: query.page,
      pageSize: query.pageSize,
    })

    return res.status(200).json({
      items: items.map((item) => ({
        ...item,
        visitedAt: item.visitedAt.toISOString(),
        finishedAt: item.finishedAt?.toISOString() ?? null,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    })
  }

  register = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.registerVisit.execute({
      ...req.body,
      visitedAt: toDate(req.body.visitedAt),
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  list = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listVisits.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  show = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.getVisit.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  update = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.updateVisit.execute({
      ...req.body,
      visitedAt: toDate(req.body.visitedAt),
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  latestVitalSigns = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.getLatestVitalSigns.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    const visit = result.value
    if (!visit) return res.status(200).json(null)

    return res.status(200).json({
      visitId: visit.id,
      visitedAt: visit.visitedAt.toISOString(),
      ...toHttp(visit).vitalSigns,
    })
  }

  recentPatients = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const { limit } = recentPatientsQuerySchema.parse(req.query)

    const recent = await this.listRecentPatients.execute({
      userId: res.locals.userId,
      limit,
    })

    return res.status(200).json(
      recent.map((item) => ({
        visitId: item.visitId,
        visitedAt: item.visitedAt.toISOString(),
        patient: item.patient,
      })),
    )
  }

  remove = async (
    req: Request<{ visitId: string }>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.deleteVisit.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(204).send()
  }
}
