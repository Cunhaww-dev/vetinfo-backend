import { createDocument } from 'zod-openapi'
import { catalogPaths } from '../../modules/catalog/infra/catalog.docs.ts'
import { guardianPaths } from '../../modules/guardians/infra/guardian.docs.ts'
import { patientPaths } from '../../modules/patients/infra/patient.docs.ts'
import { userPaths } from '../../modules/users/infra/user.docs.ts'
import { visitPaths } from '../../modules/visits/infra/visit.docs.ts'

// O Zod gera um regex gigante para e-mail, UUID e data. O Swagger UI tenta montar
// um exemplo a partir desse regex e mostra lixo. Com o format (email, uuid, date-time),
// o regex não acrescenta nada para quem lê a doc. O Zod continua validando igual.
function cleanSchema({ jsonSchema }: { jsonSchema: Record<string, unknown> }) {
  if (jsonSchema.format && jsonSchema.pattern) delete jsonSchema.pattern

  // z.int() vira mínimo e máximo de -9007199254740991 a 9007199254740991
  if (jsonSchema.minimum === Number.MIN_SAFE_INTEGER) delete jsonSchema.minimum
  if (jsonSchema.maximum === Number.MAX_SAFE_INTEGER) delete jsonSchema.maximum
}

// Cada módulo descreve as próprias rotas. Aqui só junta tudo num documento.
export const openApiDocument = createDocument(
  {
    openapi: '3.1.0',
    info: {
      title: 'VetInfo API',
      version: '0.1.0',
      description:
        'Prontuário clínico digital para veterinários autônomos.\n\n' +
        '**Como testar aqui:** chame `POST /api/auth/sign-in/email`. O better-auth grava o cookie de sessão no navegador, e as outras rotas passam a funcionar.\n\n' +
        '**Escopo:** o registro de outro usuário sempre responde 404, como se não existisse.',
    },
    servers: [{ url: '/', description: 'Este servidor' }],
    // Sessão por cookie (better-auth). Rotas públicas sobrescrevem com security: []
    security: [{ cookieAuth: [] }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Sessão (rotas do better-auth)' },
      { name: 'Users', description: 'Usuários e CRMV' },
      { name: 'Catalog', description: 'Espécies e raças' },
      { name: 'Guardians', description: 'Tutores' },
      { name: 'Patients', description: 'Pacientes' },
      { name: 'Visits', description: 'Atendimentos, sinais vitais e SOAP' },
    ],
    paths: {
      ...userPaths,
      ...catalogPaths,
      ...guardianPaths,
      ...patientPaths,
      ...visitPaths,
    },
  },
  { override: cleanSchema },
)
