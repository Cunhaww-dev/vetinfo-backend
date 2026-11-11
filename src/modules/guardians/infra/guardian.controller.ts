import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { ChangeGuardianAddress } from '../application/change-guardian-address.usecase.ts'
import type { CreateGuardian } from '../application/create-guardian.usecase.ts'
import type { GetGuardian } from '../application/get-guardian.usecase.ts'
import type { ListGuardians } from '../application/list-guardians.usecase.ts'
import type { UpdateGuardian } from '../application/update-guardian.usecase.ts'
import type { Guardian } from '../domain/guardian-entity.ts'

type GuardianParams = { guardianId: string }

// "1990-05-31" vira Date. Mantém o undefined (não mexer).
function toDate(value: string | undefined) {
  return value === undefined ? undefined : new Date(value)
}

function toHttp(guardian: Guardian) {
  return {
    id: guardian.id,
    name: guardian.name,
    phone: guardian.phone,
    email: guardian.email,
    cpf: guardian.cpf?.value ?? null,
    birthDate: guardian.birthDate.toISOString().slice(0, 10),
    address: guardian.address
      ? {
          street: guardian.address.street,
          number: guardian.address.number,
          complement: guardian.address.complement,
          district: guardian.address.district,
          city: guardian.address.city,
          state: guardian.address.state,
          zipCode: guardian.address.zipCode,
        }
      : null,
    createdAt: guardian.createdAt.toISOString(),
  }
}

// A lista aparece em toda tela e não precisa do CPF inteiro.
// O detalhe, o cadastro e a edição mostram o CPF inteiro, porque é ali que ele é usado.
function toHttpListItem(guardian: Guardian) {
  return { ...toHttp(guardian), cpf: guardian.cpf?.masked() ?? null }
}

export class GuardianController {
  constructor(
    private readonly createGuardian: CreateGuardian,
    private readonly listGuardians: ListGuardians,
    private readonly getGuardian: GetGuardian,
    private readonly updateGuardian: UpdateGuardian,
    private readonly changeGuardianAddress: ChangeGuardianAddress,
  ) {}

  create = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const { name, phone, email, cpf, birthDate, address } = req.body

    const result = await this.createGuardian.execute({
      userId: res.locals.userId,
      name,
      phone,
      email,
      cpf,
      birthDate: new Date(birthDate),
      address,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  list = async (_req: Request, res: Response<unknown, AuthLocals>) => {
    const guardians = await this.listGuardians.execute({
      userId: res.locals.userId,
    })

    return res.status(200).json(guardians.map(toHttpListItem))
  }

  show = async (
    req: Request<GuardianParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.getGuardian.execute({
      userId: res.locals.userId,
      guardianId: req.params.guardianId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  update = async (
    req: Request<GuardianParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const { name, phone, email, cpf, birthDate } = req.body

    const result = await this.updateGuardian.execute({
      userId: res.locals.userId,
      guardianId: req.params.guardianId,
      name,
      phone,
      email,
      cpf,
      birthDate: toDate(birthDate),
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  changeAddress = async (
    req: Request<GuardianParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.changeGuardianAddress.execute({
      userId: res.locals.userId,
      guardianId: req.params.guardianId,
      address: req.body,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }
}
