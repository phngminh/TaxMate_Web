import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Only this test server substitutes API modules. Production builds never load it.
export default defineConfig({
  plugins: [{
    name: 'isolated-qtt-fixtures', enforce: 'pre',
    resolveId(source) {
      if (/\/(taxBook|taxDeclaration|tknTaxPeriod|paymentAccount)\.api$/.test(source) || source.endsWith('/contexts/BusinessContext')) {
        return fileURLToPath(new URL('./qtt-preview-fixtures.ts', import.meta.url))
      }
    }
  }, react()],
  server: { host: 'localhost', port: 5186, strictPort: true }
})
