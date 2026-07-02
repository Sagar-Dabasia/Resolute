// Central config for the email-ingest service. Every value comes from env
// (see .env.example); nothing is hardcoded. Import `config` anywhere.

const num = (v, d) => (v == null || v === '' ? d : Number(v))

export const config = {
  imap: {
    host: process.env.IMAP_HOST || '',
    port: num(process.env.IMAP_PORT, 993),
    user: process.env.IMAP_USER || '',
    pass: process.env.IMAP_PASS || '',
    folder: process.env.IMAP_FOLDER || 'INBOX',
    secure: (process.env.IMAP_SECURE || 'true') !== 'false',
  },
  pollIntervalSec: num(process.env.POLL_INTERVAL_SEC, 120),
  confidenceThreshold: num(process.env.CONFIDENCE_THRESHOLD, 0.8),
  llm: {
    provider: (process.env.LLM_PROVIDER || 'gemini').toLowerCase(),
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    local: {
      baseUrl: process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434/v1',
      model: process.env.LOCAL_LLM_MODEL || 'llama3.1',
    },
  },
}
