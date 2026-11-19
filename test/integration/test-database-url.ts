// O banco de teste é o de dev com "_test" no nome: vetinfo -> vetinfo_test
export function testDatabaseUrl(): string {
  const devUrl = process.env.DATABASE_URL
  if (!devUrl) throw new Error('DATABASE_URL environment variable is not set.')

  const url = new URL(devUrl)
  url.pathname = `${url.pathname}_test`
  return url.toString()
}
