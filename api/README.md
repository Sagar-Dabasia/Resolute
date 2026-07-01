# Serverless API (`/api`)

Vercel serverless functions. The SPA rewrite in `vercel.json` excludes `/api`,
so these resolve to functions (not `index.html`). Files under `_lib/` are
shared modules, not routes.

## `POST /api/webhooks/inbound-email`

Inbound email → draft order pipeline:
1. Accepts an inbound-email JSON payload (`{ from, subject, text, attachments[] }`;
   also tolerates SendGrid/Postmark/Mailgun field names).
2. Extracts `propertyAddress`, `parcelNumberAPN`, `borrowerName`, `orderType`
   via the LLM service (`_lib/extractOrder.js`) using a **forced Claude tool
   call** for strict JSON structured output.
3. Inserts a draft order via `_lib/ordersRepo.js` — status **`received`**,
   `assigned_to: 'screener'` (the draft/pending-review equivalent; lands in the
   Screener intake queue). Extracted fields are stored on `orders.workflow.intake`.
4. Returns **200** on receipt (even if a downstream step fails — logged
   server-side — so the provider doesn't retry-storm; `400` only for malformed JSON).

### Environment variables (Vercel → Project → Settings → Environment Variables)
| Var | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (falls back to `VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** service-role key (bypasses RLS). Never expose to the client. |
| `ANTHROPIC_API_KEY` | Enables LLM extraction. If absent, a regex heuristic fallback runs. |
| `ANTHROPIC_MODEL` | Optional; defaults to `claude-sonnet-5`. |
| `INBOUND_WEBHOOK_SECRET` | Optional; if set, requests must send header `x-webhook-secret`. |

### Test
```bash
curl -X POST https://<your-app>.vercel.app/api/webhooks/inbound-email \
  -H 'content-type: application/json' \
  -d '{
    "from":"casey@apexlending.com",
    "subject":"New lien search order",
    "text":"Please open a Lien Search for borrower Jordan Miller at 123 Oak St, Miami, FL 33101. APN 01-2345-678-9012."
  }'
# → { "received": true, "orderId": "RTS-10049", "status": "received", "extraction": "llm", "fields": {...} }
```

> Note: attachment **text** is used for extraction. Binary PDFs are not OCR'd
> here — pass `attachments[].text` (most providers include parsed text) or add
> an OCR step later.
