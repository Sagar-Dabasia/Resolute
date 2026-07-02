// GeminiProvider (default). Google Gemini API via REST (no SDK). Sends the
// email text AND the raw PDFs as native document input (inline_data), and uses
// JSON mode (responseMimeType) so the reply parses directly. Returns the shared
// schema after validateExtraction().
import { buildInstruction, validateExtraction } from '../schema.js'
import { config } from '../config.js'

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    service_type: { type: 'string', nullable: true },
    property_address: { type: 'string', nullable: true },
    parcel_or_apn: { type: 'string', nullable: true },
    client_reference: { type: 'string', nullable: true },
    requested_turnaround: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    confidence: { type: 'number' },
    needs_review: { type: 'boolean' },
    review_reason: { type: 'string', nullable: true },
  },
  required: ['service_type', 'confidence', 'needs_review'],
}

export function createGeminiProvider(deps = {}) {
  const doFetch = deps.fetch || globalThis.fetch
  const apiKey = deps.apiKey || config.llm.gemini.apiKey
  const model = deps.model || config.llm.gemini.model

  return {
    name: 'gemini',
    async extract_order(text, pdfFiles = [], catalog) {
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
      const parts = [{ text: `${buildInstruction(catalog)}\n\n--- EMAIL ---\n${text || '(no body)'}` }]
      for (const f of pdfFiles) {
        const data = Buffer.isBuffer(f.content) ? f.content.toString('base64') : f.content // allow pre-encoded
        parts.push({ inline_data: { mime_type: f.mimeType || 'application/pdf', data } })
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0 },
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`)
      }
      const body = await res.json()
      const jsonText = body?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
      let parsed
      try { parsed = JSON.parse(jsonText) } catch { throw new Error('Gemini did not return valid JSON') }
      return validateExtraction(parsed)
    },
  }
}
