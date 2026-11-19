import 'dotenv/config'
import { execSync } from 'node:child_process'
import { testDatabaseUrl } from './test-database-url.ts'

// Roda uma vez antes de tudo: cria o banco de teste (se não existir) e aplica as migrations
export default function setup() {
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'ignore',
  })
}
