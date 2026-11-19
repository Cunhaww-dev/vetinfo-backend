import { defineConfig } from 'vitest/config'

// pnpm test:integration: roda contra um banco separado (<banco>_test), nunca o de dev
export default defineConfig({
  test: {
    include: ['test/integration/**/*.int.spec.ts'],
    globalSetup: ['test/integration/global-setup.ts'],
    setupFiles: ['test/integration/setup.ts'],
    fileParallelism: false, // os arquivos dividem o mesmo banco
  },
})
