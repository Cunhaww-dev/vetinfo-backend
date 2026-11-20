import { prisma } from '../src/shared/prisma/client.ts'

type SpeciesSeed = {
  breeds: string[]
  // A escala do escore corporal desta espécie (ver body-condition-scale.ts)
  scale: 'nine_point' | 'five_point'
}

// O VetInfo atende todas as espécies. A escala segue a área de cada uma:
// 1 a 9 em cão e gato (WSAVA) e equino (Henneke), 1 a 5 no resto.
const CATALOG: Record<string, SpeciesSeed> = {
  Cão: {
    scale: 'nine_point',
    breeds: [
      'Labrador',
      'Golden Retriever',
      'Poodle',
      'Shih Tzu',
      'Yorkshire',
      'Bulldog Francês',
      'Pinscher',
      'Border Collie',
      'Spitz Alemão',
      'Dachshund',
      'Pastor Alemão',
      'Beagle',
      'Rottweiler',
    ],
  },
  Gato: {
    scale: 'nine_point',
    breeds: [
      'Persa',
      'Siamês',
      'Maine Coon',
      'Angorá',
      'Ragdoll',
      'Sphynx',
      'Bengal',
      'British Shorthair',
    ],
  },
  Equino: {
    scale: 'nine_point',
    breeds: [
      'Mangalarga Marchador',
      'Quarto de Milha',
      'Crioulo',
      'Puro Sangue Inglês',
      'Árabe',
      'Pônei',
    ],
  },
  Ave: {
    scale: 'five_point',
    breeds: [
      'Calopsita',
      'Periquito',
      'Papagaio',
      'Canário',
      'Agapornis',
      'Arara',
      'Galinha',
    ],
  },
  Bovino: {
    scale: 'five_point',
    breeds: ['Nelore', 'Angus', 'Holandês', 'Gir', 'Girolando', 'Jersey'],
  },
  Ovino: {
    scale: 'five_point',
    breeds: ['Santa Inês', 'Dorper', 'Texel', 'Suffolk'],
  },
  Caprino: {
    scale: 'five_point',
    breeds: ['Boer', 'Saanen', 'Anglo-Nubiano', 'Toggenburg'],
  },
  Suíno: {
    scale: 'five_point',
    breeds: ['Large White', 'Landrace', 'Duroc', 'Mini Pig'],
  },
  Coelho: {
    scale: 'five_point',
    breeds: ['Mini Lop', 'Fuzzy Lop', 'Lionhead', 'Nova Zelândia'],
  },
  Roedor: {
    scale: 'five_point',
    breeds: [
      'Hamster Sírio',
      'Porquinho-da-índia',
      'Chinchila',
      'Gerbil',
      'Twister',
    ],
  },
  Furão: { scale: 'five_point', breeds: [] },
  Réptil: {
    scale: 'five_point',
    breeds: ['Jabuti', 'Tartaruga', 'Iguana', 'Teiú', 'Píton-bola'],
  },
  Peixe: { scale: 'five_point', breeds: ['Betta', 'Kinguio', 'Carpa Koi'] },
}

const DEFAULT_BREEDS = ['SRD', 'Outros']

const ATTACHMENT_TYPES = [
  'Exame laboratorial',
  'Laudo',
  'Radiografia',
  'Ultrassonografia',
  'Foto de lesão',
  'Receita',
  'Outros',
]

async function main() {
  for (const [speciesName, { breeds, scale }] of Object.entries(CATALOG)) {
    // O update também corrige a escala de uma espécie que já existe
    const species = await prisma.species.upsert({
      where: { name: speciesName },
      update: { bodyConditionScale: scale },
      create: { name: speciesName, bodyConditionScale: scale },
    })

    const allBreeds = [...DEFAULT_BREEDS, ...breeds]

    for (const breedName of allBreeds) {
      await prisma.breed.upsert({
        where: {
          speciesId_name: { speciesId: species.id, name: breedName },
        },
        update: {},
        create: { name: breedName, speciesId: species.id },
      })
    }

    console.log(`${speciesName}: ${allBreeds.length} breeds, scale ${scale}`)
  }

  for (const name of ATTACHMENT_TYPES) {
    await prisma.attachmentType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log(`Attachment types: ${ATTACHMENT_TYPES.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
