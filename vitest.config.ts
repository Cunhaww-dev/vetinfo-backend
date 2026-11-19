import { defineConfig } from 'vitest/config'

// pnpm test: só os testes unitários, sem banco. Os de integração têm config própria.
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
  },
})
