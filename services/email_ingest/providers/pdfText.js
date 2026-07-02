// PDF → text for the local (non-multimodal) provider: extract the text layer,
// and OCR fallback via the `tesseract` CLI when a PDF is scanned/imagey.
// Both dependencies are optional and lazy-loaded so the rest of the service
// (and the tests) never require them to be installed.

// Extract the embedded text layer using `pdf-parse` if available.
export async function extractTextLayer(buffer) {
  try {
    const mod = await import('pdf-parse')
    const pdfParse = mod.default || mod
    const { text } = await pdfParse(buffer)
    return (text || '').trim()
  } catch {
    return '' // pdf-parse not installed or parse failed
  }
}

// OCR fallback: pipe the PDF through the tesseract CLI. Requires poppler
// (`pdftoppm`) + `tesseract` on PATH; returns '' if unavailable.
export async function ocrPdf(buffer) {
  try {
    const os = await import('node:os')
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const { spawnSync } = await import('node:child_process')
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ingest-ocr-'))
    const pdf = path.join(dir, 'in.pdf')
    await fs.writeFile(pdf, buffer)
    const ppm = spawnSync('pdftoppm', ['-png', '-r', '200', pdf, path.join(dir, 'p')])
    if (ppm.status !== 0) { await fs.rm(dir, { recursive: true, force: true }); return '' }
    const pages = (await fs.readdir(dir)).filter(f => f.endsWith('.png')).sort()
    let out = ''
    for (const p of pages) {
      const t = spawnSync('tesseract', [path.join(dir, p), 'stdout'], { encoding: 'utf8' })
      if (t.status === 0) out += (t.stdout || '') + '\n'
    }
    await fs.rm(dir, { recursive: true, force: true })
    return out.trim()
  } catch {
    return ''
  }
}

// Best-effort text for one PDF: text layer first, OCR only if that's empty.
export async function pdfToText(buffer) {
  const layer = await extractTextLayer(buffer)
  if (layer && layer.length > 20) return layer
  const ocr = await ocrPdf(buffer)
  return ocr || layer
}
