// Backend data-access layer. Every function is a no-op-friendly wrapper around
// Supabase; callers should branch on `isSupabaseConfigured` (re-exported here)
// and fall back to mock state when it's false.
import { supabase, isSupabaseConfigured } from './supabase'

export { isSupabaseConfigured }

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?'

// ── Mappers: DB row ↔ app (mock) shape ──────────────────────────────────────
const toAppOrder = (r) => ({
  id: r.id,
  client: r.clients?.name || r.client_code,
  clientCode: r.client_code,
  state: r.state, county: r.county, type: r.type,
  status: r.status, priority: r.priority, payment: r.payment,
  clarification: r.clarification,
  assignedTo: r.assigned_to,
  screener: r.screener, examiner: r.examiner, typer: r.typer, delivery: r.delivery,
  progress: r.progress,
  created: r.created, eta: r.eta, completed: r.completed,
  completedDates: r.completed_dates || {},
  completedBy: r.completed_by || {},
})

const toOrderRow = (o) => ({
  status: o.status, priority: o.priority, payment: o.payment, clarification: o.clarification,
  assigned_to: o.assignedTo,
  screener: o.screener, examiner: o.examiner, typer: o.typer, delivery: o.delivery,
  progress: o.progress, eta: o.eta, completed: o.completed,
  completed_dates: o.completedDates, completed_by: o.completedBy,
})

const mapUser = (authUser, prof) => ({
  email: authUser.email,
  role: prof?.role || null,        // null when no profile/role — caller must handle, never silently 'client'
  name: prof?.name || authUser.email,
  avatar: initials(prof?.name || authUser.email),
  superAdmin: !!prof?.super_admin,
  clientCode: prof?.client_code || null,
})

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
  return mapUser(session.user, prof)
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  const user = await getCurrentUser()
  return { success: true, role: user?.role, user }
}

export const signOut = () => supabase.auth.signOut()

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange(async () => { cb(await getCurrentUser()) })
  return () => data.subscription.unsubscribe()
}

// ── Orders ─────────────────────────────────────────────────────────────────
export async function fetchOrders() {
  const { data, error } = await supabase.from('orders').select('*, clients(name)').order('created', { ascending: false })
  if (error) { console.error('[orders]', error.message); return null }
  return data.map(toAppOrder)
}

export async function saveOrder(order) {
  const { error } = await supabase.from('orders').update(toOrderRow(order)).eq('id', order.id)
  if (error) console.error('[saveOrder]', error.message)
}

export function subscribeOrders(cb) {
  const channel = supabase.channel('orders-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, cb)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Fulfillment (JSONB document) ─────────────────────────────────────────────
export async function fetchFulfillment(orderId) {
  const { data, error } = await supabase.from('fulfillments').select('data').eq('order_id', orderId).maybeSingle()
  if (error) { console.error('[fetchFulfillment]', error.message); return null }
  return data?.data || null
}

export async function saveFulfillment(orderId, data) {
  const { error } = await supabase.from('fulfillments').upsert({ order_id: orderId, data, updated_at: new Date().toISOString() })
  if (error) console.error('[saveFulfillment]', error.message)
}

// ── Storage (documents bucket) ────────────────────────────────────────────────
export async function uploadDocument(orderId, file) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `orders/${orderId}/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from('documents').upload(path, file)
  if (error) throw error
  const { data } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
  return { path, url: data?.signedUrl || null }
}

export async function removeDocument(path) {
  if (!path) return
  await supabase.storage.from('documents').remove([path])
}
