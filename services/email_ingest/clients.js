// Match an inbound sender to an existing Client by email. Returns the client
// row ({ code, name, email, ... }) or null. Case-insensitive; tolerates a
// "Display Name <addr@host>" sender by extracting the bare address.
import { supabaseAdmin } from '../../api/_lib/supabaseAdmin.js'

export function parseAddress(sender = '') {
  const m = String(sender).match(/<([^>]+)>/)
  const addr = (m ? m[1] : sender).trim().toLowerCase()
  return addr
}

export async function matchClientByEmail(sender, client = supabaseAdmin) {
  const email = parseAddress(sender)
  if (!email || !client) return null
  const { data, error } = await client.from('clients').select('*').ilike('email', email).limit(1)
  if (error) throw new Error(`client lookup failed: ${error.message}`)
  return data && data.length ? data[0] : null
}
