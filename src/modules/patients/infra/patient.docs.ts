import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import {
  registerPatientSchema,
  updatePatientSchema,
} from '../patient.schema.ts'

const patientSchema = z
  .object({
    id: uuid,
    guardianId: uuid
      .nullable()
      .meta({ description: 'null = sem tutor (ONG, resgate)' }),
    breedId: uuid,
    name: z.string().meta({ example: 'Rex' }),
    sex: z.enum(['male', 'female']),
    neutered: z.boolean(),
    coatColor: z.string().nullable().meta({ example: 'Caramelo' }),
    birthDate: z.iso.date().nullable().meta({ example: '2020-05-31' }),
    microchip: z.string().nullable(),
    createdAt: z.iso.datetime().meta({ description: 'Data do cadastro' }),
  })
  .meta({ id: 'Patient' })

const patientParams = { path: z.object({ patientId: uuid }) }
const notFound = error(
  'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
)
const breedOrGuardianNotFound = error(
  'Raça não existe (BREED_NOT_FOUND) ou tutor não existe (GUARDIAN_NOT_FOUND)',
)
const microchipInUse = error(
  'Outro paciente deste usuário já tem o microchip (MICROCHIP_ALREADY_IN_USE)',
)
const invalidBirthDate = error(
  'Data de nascimento no futuro (INVALID_BIRTH_DATE)',
)

export const patientPaths: ZodOpenApiPathsObject = {
  '/patients': {
    post: {
      tags: ['Patients'],
      operationId: 'registerPatient',
      summary: 'Cria um paciente',
      description: 'A espécie vem pela raça. O tutor é opcional.',
      requestBody: {
        content: { 'application/json': { schema: registerPatientSchema } },
      },
      responses: {
        '201': json('Paciente criado', patientSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': breedOrGuardianNotFound,
        '409': microchipInUse,
        '422': invalidBirthDate,
      },
    },
    get: {
      tags: ['Patients'],
      operationId: 'listPatients',
      summary: 'Lista os pacientes do usuário',
      requestParams: {
        query: z.object({
          guardianId: uuid
            .optional()
            .meta({ description: 'Só os pacientes deste tutor' }),
        }),
      },
      responses: {
        '200': json('Os pacientes, por nome', z.array(patientSchema)),
        '401': unauthorized,
      },
    },
  },
  '/patients/{patientId}': {
    get: {
      tags: ['Patients'],
      operationId: 'getPatient',
      summary: 'Mostra um paciente',
      requestParams: patientParams,
      responses: {
        '200': json('O paciente', patientSchema),
        '401': unauthorized,
        '404': notFound,
      },
    },
    patch: {
      tags: ['Patients'],
      operationId: 'updatePatient',
      summary: 'Muda um paciente',
      description: 'Campo ausente não muda. `null` apaga o campo.',
      requestParams: patientParams,
      requestBody: {
        content: { 'application/json': { schema: updatePatientSchema } },
      },
      responses: {
        '200': json('O paciente atualizado', patientSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Paciente, raça ou tutor não existe (PATIENT_NOT_FOUND, BREED_NOT_FOUND, GUARDIAN_NOT_FOUND)',
        ),
        '409': microchipInUse,
        '422': invalidBirthDate,
      },
    },
  },
}
