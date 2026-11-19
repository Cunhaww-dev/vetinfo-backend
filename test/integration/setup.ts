import 'dotenv/config'
import { testDatabaseUrl } from './test-database-url.ts'

// Antes de qualquer import do Prisma: o client lê o DATABASE_URL quando é importado
process.env.DATABASE_URL = testDatabaseUrl()
