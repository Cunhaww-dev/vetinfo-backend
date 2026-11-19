import { prisma } from '../src/shared/prisma/client.ts'

const CATALOG: Record<string, string[]> = {
  Cão: ['Labrador', 'Golden Retriever', 'Poodle', 'Shih Tzu', 'Yorkshire'],
  Gato: ['Persa', 'Siamês', 'Maine Coon', 'Angorá', 'Ragdoll'],
  Ave: ['Calopsita', 'Periquito', 'Papagaio', 'Canário', 'Agapornis'],
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
  for (const [speciesName, breeds] of Object.entries(CATALOG)) {
    const species = await prisma.species.upsert({
      where: { name: speciesName },
      update: {},
      create: { name: speciesName },
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

    console.log(`${speciesName}: ${allBreeds.length} breeds`)
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
