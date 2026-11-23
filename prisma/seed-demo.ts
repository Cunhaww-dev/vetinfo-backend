// Dados de demonstração para o desenvolvimento. NUNCA rode em produção.
// Cria a vet "Dra. Ana Souza" com tutores, pacientes de várias espécies,
// atendimentos, medicações, vacinas e consentimentos.
//
// Uso: pnpm db:seed:demo (depois do pnpm prisma db seed, que cria o catálogo)
// Login: demo@vetinfo.dev com a senha de DEMO_USER_PASSWORD, no .env

import { BetterAuthProvider } from '../src/modules/users/infra/better-auth-provider.ts'
import { PrismaUserRepository } from '../src/modules/users/infra/prisma-user.repository.ts'
import { RegisterUser } from '../src/modules/users/application/register-user.usecase.ts'
import { prisma } from '../src/shared/prisma/client.ts'

// Só dev e homologação. Com NODE_ENV=production, o seed para antes de tudo:
// uma conta com senha conhecida no banco real seria uma porta aberta.
if (process.env.NODE_ENV === 'production')
  throw new Error('O seed demo não roda em produção.')

// A senha fica no .env, fora do código e do git
const PASSWORD = process.env.DEMO_USER_PASSWORD
if (!PASSWORD || PASSWORD.length < 8)
  throw new Error(
    'Defina DEMO_USER_PASSWORD no .env, com pelo menos 8 caracteres.',
  )

const EMAIL = 'demo@vetinfo.dev'

const DAY_MS = 24 * 60 * 60 * 1000
// Dias a partir de hoje (negativo = passado), com a hora do atendimento
const daysAgo = (days: number, hour = 10) => {
  const date = new Date(Date.now() - days * DAY_MS)
  date.setHours(hour, 0, 0, 0)
  return date
}
// Data pura (coluna @db.Date), sem hora
const dateOnly = (days: number) =>
  new Date(new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10))

const GUARDIANS = [
  {
    key: 'marina',
    name: 'Marina Costa',
    phone: '11987654321',
    email: 'marina.costa@exemplo.com',
    birthDate: '1990-04-12',
  },
  {
    key: 'joao',
    name: 'João Pereira',
    phone: '21998765432',
    email: 'joao.pereira@exemplo.com',
    birthDate: '1985-09-30',
  },
  {
    key: 'carla',
    name: 'Carla Mendes',
    phone: '31991234567',
    email: 'carla.mendes@exemplo.com',
    birthDate: '1978-01-22',
  },
  {
    key: 'fazenda',
    name: 'Fazenda Boa Vista (Sr. Antônio)',
    phone: '34999887766',
    email: 'contato@fazendaboavista.com',
    birthDate: '1962-07-05',
  },
  {
    key: 'rafa',
    name: 'Rafael Lima',
    phone: '41988776655',
    email: 'rafael.lima@exemplo.com',
    birthDate: '1996-11-03',
  },
] as const

type GuardianKey = (typeof GUARDIANS)[number]['key']

type VisitSeed = {
  daysAgo: number
  weightKg?: number
  temperatureC?: number
  heartRate?: number
  respiratoryRate?: number
  score?: number
  soap: {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  }
  medications?: {
    name: string
    dosage: string
    frequency: string
    route:
      | 'oral'
      | 'topical'
      | 'subcutaneous'
      | 'intramuscular'
      | 'ophthalmic'
      | 'otic'
    days: number | null // null = sem término
    continuousUse?: boolean
  }[]
  vaccines?: {
    name: string
    nextDoseInDays: number | null
    manufacturer?: string
  }[]
}

type PatientSeed = {
  name: string
  species: string
  breed: string
  sex: 'male' | 'female'
  neutered: boolean
  birthDate: string
  coatColor?: string
  microchip?: string
  guardian: GuardianKey | null
  consent?: boolean
  visits: VisitSeed[]
  // Vacinas antigas, sem atendimento (de outra clínica)
  oldVaccines?: {
    name: string
    daysAgo: number
    nextDoseInDays: number | null
  }[]
}

const PATIENTS: PatientSeed[] = [
  {
    name: 'Thor',
    species: 'Cão',
    breed: 'Labrador',
    sex: 'male',
    neutered: true,
    birthDate: '2019-03-14',
    coatColor: 'Chocolate',
    microchip: '985112003456789',
    guardian: 'marina',
    consent: true,
    visits: [
      {
        daysAgo: 300,
        weightKg: 31.2,
        temperatureC: 38.4,
        heartRate: 90,
        respiratoryRate: 22,
        score: 6,
        soap: {
          subjective: 'Check-up anual.',
          objective: 'Bom estado geral. Leve sobrepeso.',
          assessment: 'Saudável, acima do peso.',
          plan: 'Reduzir a ração em 10%. Caminhadas diárias.',
        },
        vaccines: [
          { name: 'V10', nextDoseInDays: 365 - 300, manufacturer: 'Zoetis' },
          {
            name: 'Antirrábica',
            nextDoseInDays: 365 - 300,
            manufacturer: 'MSD',
          },
        ],
      },
      {
        daysAgo: 150,
        weightKg: 32.4,
        temperatureC: 38.6,
        heartRate: 96,
        respiratoryRate: 24,
        score: 7,
        soap: {
          subjective: 'Tutora relata coceira nas orelhas há 1 semana.',
          objective: 'Otite externa bilateral, secreção marrom.',
          assessment: 'Otite externa por Malassezia.',
          plan: 'Limpeza otológica e pomada por 10 dias. Retorno em 15 dias.',
        },
        medications: [
          {
            name: 'Otosporin',
            dosage: '5 gotas em cada ouvido',
            frequency: 'A cada 12 horas',
            route: 'otic',
            days: 10,
          },
        ],
      },
      {
        daysAgo: 60,
        weightKg: 30.8,
        temperatureC: 38.5,
        heartRate: 88,
        respiratoryRate: 20,
        score: 6,
        soap: {
          subjective: 'Retorno do controle de peso.',
          objective: 'Perdeu 1,6 kg. Ouvidos limpos.',
          assessment: 'Boa evolução.',
          plan: 'Manter a dieta. Suplemento articular contínuo.',
        },
        medications: [
          {
            name: 'Condroitina + Glucosamina',
            dosage: '1 comprimido',
            frequency: '1 vez ao dia',
            route: 'oral',
            days: null,
            continuousUse: true,
          },
        ],
      },
      {
        daysAgo: 5,
        weightKg: 29.9,
        temperatureC: 39.1,
        heartRate: 110,
        respiratoryRate: 28,
        score: 5,
        soap: {
          subjective: 'Mancando da pata traseira direita desde ontem.',
          objective: 'Dor à palpação do joelho direito. Gaveta negativa.',
          assessment: 'Entorse leve. Descartar lesão de ligamento.',
          plan: 'Anti-inflamatório por 5 dias e repouso. Raio-X se não melhorar.',
        },
        medications: [
          {
            name: 'Meloxicam 2 mg',
            dosage: '0,1 mg/kg',
            frequency: '1 vez ao dia',
            route: 'oral',
            days: 5,
          },
        ],
      },
    ],
  },
  {
    name: 'Luna',
    species: 'Gato',
    breed: 'Siamês',
    sex: 'female',
    neutered: true,
    birthDate: '2021-08-02',
    coatColor: 'Seal point',
    guardian: 'marina',
    visits: [
      {
        daysAgo: 200,
        weightKg: 3.6,
        temperatureC: 38.7,
        heartRate: 180,
        respiratoryRate: 30,
        score: 5,
        soap: {
          subjective: 'Vacinação.',
          objective: 'Sem alterações.',
          assessment: 'Saudável.',
          plan: 'Vacina V5. Próxima em 1 ano.',
        },
        vaccines: [
          {
            name: 'V5 felina',
            nextDoseInDays: 365 - 200,
            manufacturer: 'Zoetis',
          },
        ],
      },
      {
        daysAgo: 20,
        weightKg: 3.4,
        temperatureC: 39.4,
        heartRate: 200,
        respiratoryRate: 36,
        score: 4,
        soap: {
          subjective: 'Vômitos há 2 dias e pouco apetite.',
          objective: 'Desidratação leve (5%). Abdômen sensível.',
          assessment: 'Gastrite. Suspeita de tricobezoar.',
          plan: 'Fluidoterapia, antiemético e pasta de malte.',
        },
        medications: [
          {
            name: 'Ondansetrona',
            dosage: '0,5 mg/kg',
            frequency: 'A cada 12 horas',
            route: 'oral',
            days: 3,
          },
          {
            name: 'Pasta de malte',
            dosage: '2 cm',
            frequency: '1 vez ao dia',
            route: 'oral',
            days: 30,
          },
        ],
      },
    ],
  },
  {
    name: 'Mel',
    species: 'Cão',
    breed: 'Shih Tzu',
    sex: 'female',
    neutered: false,
    birthDate: '2023-02-10',
    coatColor: 'Branco e dourado',
    guardian: 'joao',
    consent: true,
    visits: [
      {
        daysAgo: 90,
        weightKg: 5.1,
        temperatureC: 38.6,
        heartRate: 120,
        respiratoryRate: 26,
        score: 5,
        soap: {
          subjective: 'Primeira consulta. Tutor adotou há 1 mês.',
          objective: 'Saudável. Tártaro leve.',
          assessment: 'Saudável.',
          plan: 'Vacinas em dia. Escovação dos dentes.',
        },
        vaccines: [
          { name: 'V10', nextDoseInDays: -5, manufacturer: 'Boehringer' },
        ],
      },
      {
        daysAgo: 2,
        weightKg: 5.4,
        temperatureC: 38.9,
        heartRate: 128,
        respiratoryRate: 28,
        score: 6,
        soap: {
          subjective: 'Olho direito vermelho e lacrimejando.',
          objective: 'Hiperemia conjuntival. Fluoresceína negativa.',
          assessment: 'Conjuntivite.',
          plan: 'Colírio por 7 dias.',
        },
        medications: [
          {
            name: 'Tobramicina colírio',
            dosage: '1 gota no olho direito',
            frequency: 'A cada 8 horas',
            route: 'ophthalmic',
            days: 7,
          },
        ],
      },
    ],
  },
  {
    name: 'Kiwi',
    species: 'Ave',
    breed: 'Calopsita',
    sex: 'male',
    neutered: false,
    birthDate: '2022-05-20',
    coatColor: 'Cinza com bochecha laranja',
    guardian: 'carla',
    visits: [
      {
        daysAgo: 45,
        weightKg: 0.09,
        temperatureC: 41,
        heartRate: 300,
        respiratoryRate: 50,
        score: 2.5,
        soap: {
          subjective: 'Comendo menos e penas arrepiadas.',
          objective: 'Quilha proeminente. Fezes amolecidas.',
          assessment: 'Perda de peso. Suspeita de parasitose.',
          plan: 'Coproparasitológico. Vermífugo e dieta com farelo.',
        },
        medications: [
          {
            name: 'Ivermectina',
            dosage: '0,2 mg/kg',
            frequency: 'Dose única, repetir em 15 dias',
            route: 'topical',
            days: 15,
          },
        ],
      },
      {
        daysAgo: 10,
        weightKg: 0.098,
        temperatureC: 41.2,
        heartRate: 290,
        respiratoryRate: 46,
        score: 3,
        soap: {
          subjective: 'Retorno. Comendo bem.',
          objective: 'Ganhou 8 g.',
          assessment: 'Boa evolução.',
          plan: 'Manter a dieta. Retorno em 30 dias.',
        },
      },
    ],
  },
  {
    name: 'Pipoca',
    species: 'Coelho',
    breed: 'Mini Lop',
    sex: 'female',
    neutered: true,
    birthDate: '2024-01-15',
    coatColor: 'Branco',
    guardian: 'rafa',
    visits: [
      {
        daysAgo: 30,
        weightKg: 1.8,
        temperatureC: 39,
        heartRate: 220,
        respiratoryRate: 45,
        score: 3.5,
        soap: {
          subjective: 'Dentes da frente grandes.',
          objective: 'Incisivos com crescimento excessivo.',
          assessment: 'Má oclusão dentária.',
          plan: 'Desgaste dos incisivos. Mais feno na dieta.',
        },
      },
    ],
  },
  {
    name: 'Estrela',
    species: 'Equino',
    breed: 'Mangalarga Marchador',
    sex: 'female',
    neutered: false,
    birthDate: '2016-10-01',
    coatColor: 'Tordilha',
    microchip: '982000411223344',
    guardian: 'fazenda',
    consent: true,
    visits: [
      {
        daysAgo: 120,
        weightKg: 420,
        temperatureC: 37.8,
        heartRate: 40,
        respiratoryRate: 14,
        score: 5,
        soap: {
          subjective: 'Avaliação antes da temporada.',
          objective: 'Bom estado. Cascos bem cuidados.',
          assessment: 'Saudável.',
          plan: 'Vacinas e vermifugação.',
        },
        vaccines: [
          { name: 'Influenza equina', nextDoseInDays: 365 - 120 },
          { name: 'Tétano', nextDoseInDays: 365 - 120 },
        ],
      },
      {
        daysAgo: 8,
        weightKg: 432,
        temperatureC: 38.1,
        heartRate: 48,
        respiratoryRate: 18,
        score: 6,
        soap: {
          subjective: 'Cólica leve hoje de manhã.',
          objective: 'Motilidade intestinal diminuída. Sem distensão.',
          assessment: 'Cólica espasmódica.',
          plan: 'Analgésico. Jejum de 12 horas e observação.',
        },
        medications: [
          {
            name: 'Flunixin meglumine',
            dosage: '1,1 mg/kg',
            frequency: 'Dose única',
            route: 'intramuscular',
            days: 1,
          },
        ],
      },
    ],
  },
  {
    name: 'Mimosa',
    species: 'Bovino',
    breed: 'Holandês',
    sex: 'female',
    neutered: false,
    birthDate: '2020-06-18',
    coatColor: 'Preto e branco',
    guardian: 'fazenda',
    visits: [
      {
        daysAgo: 70,
        weightKg: 580,
        temperatureC: 38.9,
        heartRate: 70,
        respiratoryRate: 28,
        score: 3,
        soap: {
          subjective: 'Queda na produção de leite.',
          objective: 'Quarto posterior esquerdo endurecido.',
          assessment: 'Mastite clínica.',
          plan: 'Antibiótico intramamário por 3 dias. Descartar o leite.',
        },
        medications: [
          {
            name: 'Cefalexina intramamária',
            dosage: '1 bisnaga',
            frequency: 'A cada 12 horas',
            route: 'topical',
            days: 3,
          },
        ],
        vaccines: [{ name: 'Febre aftosa', nextDoseInDays: 180 - 70 }],
      },
      {
        daysAgo: 12,
        weightKg: 592,
        temperatureC: 38.6,
        heartRate: 66,
        respiratoryRate: 26,
        score: 3.5,
        soap: {
          subjective: 'Retorno.',
          objective: 'Úbere normal.',
          assessment: 'Curada.',
          plan: 'Liberar o leite após a carência.',
        },
      },
    ],
  },
  {
    name: 'Bolota',
    species: 'Roedor',
    breed: 'Porquinho-da-índia',
    sex: 'male',
    neutered: false,
    birthDate: '2024-06-01',
    coatColor: 'Tricolor',
    guardian: 'rafa',
    visits: [
      {
        daysAgo: 15,
        weightKg: 0.95,
        temperatureC: 38.8,
        heartRate: 260,
        respiratoryRate: 80,
        score: 3,
        soap: {
          subjective: 'Coceira e falhas no pelo.',
          objective: 'Alopecia no dorso. Raspado positivo para ácaros.',
          assessment: 'Sarna (Trixacarus).',
          plan: 'Ivermectina e vitamina C.',
        },
        medications: [
          {
            name: 'Vitamina C',
            dosage: '30 mg/kg',
            frequency: '1 vez ao dia',
            route: 'oral',
            days: null,
            continuousUse: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Tobias',
    species: 'Réptil',
    breed: 'Jabuti',
    sex: 'male',
    neutered: false,
    birthDate: '2005-01-01',
    coatColor: 'Casco marrom e amarelo',
    guardian: 'carla',
    visits: [
      {
        daysAgo: 40,
        weightKg: 4.2,
        score: 3,
        soap: {
          subjective: 'Check-up.',
          objective: 'Casco firme. Sem secreções.',
          assessment: 'Saudável.',
          plan: 'Banho de sol diário e cálcio.',
        },
      },
    ],
  },
  {
    name: 'Nina',
    species: 'Gato',
    breed: 'SRD',
    sex: 'female',
    neutered: true,
    birthDate: '2025-03-01',
    coatColor: 'Rajada',
    guardian: null,
    visits: [
      {
        daysAgo: 3,
        weightKg: 2.1,
        temperatureC: 38.5,
        heartRate: 190,
        respiratoryRate: 32,
        score: 3,
        soap: {
          subjective: 'Resgatada pela ONG. Sem histórico.',
          objective: 'Magra. Pulgas.',
          assessment: 'Desnutrição leve e pulgas.',
          plan: 'Antipulgas e ração filhote. Vacinas na semana que vem.',
        },
        medications: [
          {
            name: 'Fipronil spray',
            dosage: '1 borrifada por kg',
            frequency: 'Dose única',
            route: 'topical',
            days: 1,
          },
        ],
      },
    ],
    oldVaccines: [{ name: 'V4 felina', daysAgo: 200, nextDoseInDays: -20 }],
  },
]

async function createUser() {
  const register = new RegisterUser(
    new PrismaUserRepository(prisma),
    new BetterAuthProvider(),
  )
  const result = await register.execute({
    name: 'Dra. Ana Souza',
    email: EMAIL,
    password: PASSWORD,
    type: 'professional',
    crmv: 'SP12345',
  })
  if (result.isLeft()) throw result.value
  return result.value.id
}

async function main() {
  if (await prisma.user.findUnique({ where: { email: EMAIL } })) {
    console.log(`${EMAIL} já existe. Nada foi criado.`)
    return
  }

  const species = await prisma.species.findMany({ include: { breeds: true } })
  if (species.length === 0)
    throw new Error('Catálogo vazio. Rode o seed do catálogo antes.')

  const breedId = (speciesName: string, breedName: string) => {
    const breed = species
      .find(({ name }) => name === speciesName)
      ?.breeds.find(({ name }) => name === breedName)
    if (!breed)
      throw new Error(`Raça não encontrada: ${speciesName}, ${breedName}`)
    return breed.id
  }
  const scaleOf = (speciesName: string) =>
    species.find(({ name }) => name === speciesName)!.bodyConditionScale

  const userId = await createUser()

  const guardianIds = {} as Record<GuardianKey, string>
  for (const { key, ...guardian } of GUARDIANS) {
    const row = await prisma.guardian.create({
      data: { ...guardian, birthDate: new Date(guardian.birthDate), userId },
    })
    guardianIds[key] = row.id
  }

  let visitCount = 0
  for (const seed of PATIENTS) {
    const patient = await prisma.patient.create({
      data: {
        userId,
        name: seed.name,
        breedId: breedId(seed.species, seed.breed),
        sex: seed.sex,
        neutered: seed.neutered,
        birthDate: new Date(seed.birthDate),
        coatColor: seed.coatColor ?? null,
        microchip: seed.microchip ?? null,
        guardianId: seed.guardian ? guardianIds[seed.guardian] : null,
      },
    })

    for (const visit of seed.visits) {
      const visitedAt = daysAgo(visit.daysAgo)
      const row = await prisma.visit.create({
        data: {
          userId,
          patientId: patient.id,
          authorType: 'professional',
          visitedAt,
          weightKg: visit.weightKg ?? null,
          temperatureC: visit.temperatureC ?? null,
          heartRate: visit.heartRate ?? null,
          respiratoryRate: visit.respiratoryRate ?? null,
          bodyConditionScore: visit.score ?? null,
          bodyConditionScale: visit.score ? scaleOf(seed.species) : null,
          soap: { create: visit.soap },
        },
      })
      visitCount++

      for (const medication of visit.medications ?? []) {
        await prisma.medication.create({
          data: {
            userId,
            visitId: row.id,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            route: medication.route,
            startDate: dateOnly(visit.daysAgo),
            endDate:
              medication.days === null
                ? null
                : dateOnly(visit.daysAgo - medication.days),
            continuousUse: medication.continuousUse ?? false,
          },
        })
      }

      for (const vaccine of visit.vaccines ?? []) {
        await prisma.vaccine.create({
          data: {
            userId,
            patientId: patient.id,
            visitId: row.id,
            name: vaccine.name,
            appliedAt: dateOnly(visit.daysAgo),
            nextDoseAt:
              vaccine.nextDoseInDays === null
                ? null
                : dateOnly(-vaccine.nextDoseInDays),
            manufacturer: vaccine.manufacturer ?? null,
          },
        })
      }
    }

    for (const vaccine of seed.oldVaccines ?? []) {
      await prisma.vaccine.create({
        data: {
          userId,
          patientId: patient.id,
          name: vaccine.name,
          appliedAt: dateOnly(vaccine.daysAgo),
          nextDoseAt:
            vaccine.nextDoseInDays === null
              ? null
              : dateOnly(-vaccine.nextDoseInDays),
          notes: 'Registrada de outra clínica.',
        },
      })
    }

    if (seed.consent && patient.guardianId) {
      await prisma.guardianConsent.create({
        data: {
          userId,
          guardianId: patient.guardianId,
          patientId: patient.id,
          termVersion: '1',
          acceptedAt: daysAgo(30),
          notes: 'Termo assinado em papel.',
        },
      })
    }
  }

  console.log(
    `Demo pronta: ${GUARDIANS.length} tutores, ${PATIENTS.length} pacientes, ${visitCount} atendimentos.`,
  )
  console.log(`Login: ${EMAIL}, com a senha de DEMO_USER_PASSWORD`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
