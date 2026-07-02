// Provider factory — swappable via LLM_PROVIDER (env). Both providers expose
// the same interface: extract_order(text, pdfFiles, service_catalog) -> dict.
import { createGeminiProvider } from './gemini.js'
import { createLocalProvider } from './local.js'
import { config } from '../config.js'

export function getProvider(name = config.llm.provider, deps = {}) {
  switch ((name || '').toLowerCase()) {
    case 'local':
    case 'ollama':
      return createLocalProvider(deps)
    case 'gemini':
    case '':
      return createGeminiProvider(deps)
    default:
      throw new Error(`Unknown LLM_PROVIDER "${name}" (expected "gemini" or "local")`)
  }
}
