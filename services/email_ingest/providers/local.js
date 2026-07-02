// LocalLLMProvider (fallback). Talks to any OpenAI-compatible chat endpoint
// (e.g. Ollama at /v1). Most local models aren't multimodal, so PDFs are turned
// into text (text layer + tesseract OCR fallback) before sending. Returns the
// same validated schema as GeminiProvider.
import { buildInstruction, validateExtraction } from '../schema.js'
import { pdfToText } from './pdfText.js'
import { config } from '../config.js'

export function createLocalProvider(deps = {}) {
  const doFetch = deps.fetch || globalThis.fetch
  const baseUrl = (deps.baseUrl || config.llm.local.baseUrl).replace(/\/$/, '')
  const model = deps.model || config.llm.local.model
  const toText = deps.pdfToText || pdfToText

  return {
    name: 'local',
    async extract_order(text, pdfFiles = [], catalog) {
      const chunks = [text || '(no body)']
      for (const f of pdfFiles) {
        const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content || '', 'base64')
        const t = await toText(buf)
        if (t) chunks.push(`\n--- ${f.filename || 'attachment.pdf'} ---\n${t}`)
      }
      const res = await doFetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildInstruction(catalog) },
            { role: 'user', content: chunks.join('\n').slice(0, 24000) },
          ],
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Local LLM ${res.status}: ${detail.slice(0, 300)}`)
      }
      const body = await res.json()
      const content = body?.choices?.[0]?.message?.content || ''
      let parsed
      try { parsed = JSON.parse(content) } catch { throw new Error('Local LLM did not return valid JSON') }
      return validateExtraction(parsed)
    },
  }
}
