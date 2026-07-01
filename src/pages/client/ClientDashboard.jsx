import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import USAMap from '../../components/USAMap'
import {
  LayoutDashboard, PlusCircle, ClipboardList, MessageSquare,
  Package, CheckCircle, Clock, ChevronRight, X, MapPin, Zap, Send, FileText, DollarSign
} from 'lucide-react'
import { ORDERS, PAYMENT_METHODS } from '../../data/mockData'
import { useOrders } from '../../context/OrderContext'

const ROLE_COLOR = '#a0c070'
const NAV = [
  { path: '/client',         label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/client/order',   label: 'Place Order', icon: PlusCircle },
  { path: '/client/orders',  label: 'My Orders',   icon: ClipboardList },
  { path: '/client/support', label: 'Support',     icon: MessageSquare },
]
const MY_IDS = ['RTS-10041', 'RTS-10042', 'RTS-10045']

// Live copies of this client's orders (so delivered invoices/status reflect).
function useMyOrders() {
  const { orders } = useOrders()
  return MY_IDS.map(id => orders.find(o => o.id === id) || ORDERS.find(o => o.id === id)).filter(Boolean)
}

// Fallback billable estimate when the typed invoice total isn't stamped on the order yet.
const BASE_PRICE = { 'Full Search': 175, 'Two-Owner': 150, 'Current Owner': 125, 'Lien Search': 110, 'Tax Certificate': 95, 'HOA Estoppel': 120 }
const estimatePrice = (o) => (o.workflow?.invoiceAmount ?? BASE_PRICE[o.type] ?? 125) + (o.priority === 'rush' ? 50 : 0)

// Invoice + payment card shown when Delivery sent the order via the client portal.
function InvoiceCard({ order }) {
  const { updateOrder } = useOrders()
  const pay = order.workflow?.payment
  const amount = estimatePrice(order)
  const [method, setMethod] = useState(pay?.method || PAYMENT_METHODS[1])
  const confirm = () => updateOrder({ ...order, workflow: { ...order.workflow, payment: { method, status: 'submitted', at: new Date().toISOString().slice(0, 10) } } })
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return (
    <div className="glass-card p-5" style={{ border: '1px solid rgba(160,192,112,0.28)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: ROLE_COLOR }} />
          <span className="font-semibold text-sm" style={{ color: '#1e293b' }}>Invoice · {order.id}</span>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color: '#1e293b' }}>{money(amount)}</span>
      </div>
      <p className="text-[11px] mb-3" style={{ color: 'rgba(30,41,59,0.35)' }}>Sales tax applied automatically at settlement.</p>
      {pay?.status === 'submitted' ? (
        <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(109,188,120,0.12)', border: '1px solid rgba(109,188,120,0.25)', color: '#6dbc78' }}>
          <CheckCircle className="w-4 h-4" /> Payment submitted via {pay.method} on {pay.at}
        </div>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(30,41,59,0.40)' }}>Payment Method</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PAYMENT_METHODS.map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-1.5"
                style={method === m
                  ? { background: `${ROLE_COLOR}1e`, border: `1px solid ${ROLE_COLOR}55`, color: '#1e293b' }
                  : { border: '1px solid rgba(30,41,59,0.08)', color: 'rgba(30,41,59,0.45)' }}>
                <DollarSign className="w-3.5 h-3.5" /> {m}
              </button>
            ))}
          </div>
          <button onClick={confirm} className="btn-primary w-full text-sm py-2.5">Confirm Payment via {method}</button>
        </>
      )}
    </div>
  )
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri',
  'Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York',
  'North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia',
  'Washington','West Virginia','Wisconsin','Wyoming',
]

// Client-facing stages — internal stages (screening/searching/examining/typing) collapse into "In Progress"
const CLIENT_STEPS = ['Received','In Progress','Clarification Responded','Delivered']
function clientStage(order) {
  if (order.status === 'delivered')          return { idx: 3, label: 'Delivered',               color: '#6dbc78' }
  if (order.clarification === 'responded')   return { idx: 2, label: 'Clarification Responded',  color: '#8ab0e8' }
  if (['screening','searching','examining','typing'].includes(order.status))
                                             return { idx: 1, label: 'In Progress',              color: '#d4b450' }
  return { idx: 0, label: 'Received', color: '#8ab868' }
}

function TrackOrder({ order }) {
  const stage = clientStage(order)
  const idx = stage.idx
  const sc  = stage.color
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{order.id}</div>
          <div className="font-bold" style={{ color:'#1e293b' }}>{order.client}</div>
          <div className="text-xs" style={{ color:'rgba(30,41,59,0.42)' }}>{order.type} · {order.state}</div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background:`${sc}1e`, color:sc }}>{stage.label}</span>
      </div>
      {/* Step tracker */}
      <div className="flex items-center gap-1 my-4">
        {CLIENT_STEPS.map((step,i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={i < idx
                  ? { background:'#3d7020', color:'#f5f7f2' }
                  : i === idx
                  ? { background:'#5a8c3e', color:'#f5f7f2', boxShadow:`0 0 0 3px rgba(90,140,62,0.25)` }
                  : { background:'rgba(30,41,59,0.08)', color:'rgba(30,41,59,0.28)' }}>
                {i < idx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-[9px] text-center leading-tight whitespace-nowrap hidden sm:block"
                style={{ color: i <= idx ? 'rgba(30,41,59,0.55)' : 'rgba(30,41,59,0.22)' }}>
                {step}
              </span>
            </div>
            {i < CLIENT_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full mb-5"
                style={{ background: i < idx ? '#4d8c2a' : 'rgba(30,41,59,0.10)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs mb-1.5" style={{ color:'rgba(30,41,59,0.38)' }}>
        <span>ETA: <span style={{ color:'#1e293b' }}>{order.eta}</span></span>
        <span>{order.progress}% complete</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(30,41,59,0.08)' }}>
        <motion.div className="h-full rounded-full"
          initial={{ width:0 }} animate={{ width:`${order.progress}%` }}
          transition={{ duration:1.2, ease:'easeOut' }}
          style={{ background:'linear-gradient(90deg,#3d7020,#8fc268)' }} />
      </div>
    </div>
  )
}

function PlaceOrderPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    searchType:'', state:'', county:'', address:'', parcelId:'',
    priority:'normal', firstName:'', lastName:'', email:'', company:'', notes:''
  })
  const [submitted, setSubmitted] = useState(false)
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  if (submitted) return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background:'rgba(109,188,120,0.18)' }}>
        <CheckCircle className="w-10 h-10" style={{ color:'#6dbc78' }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color:'#1e293b' }}>Order Submitted!</h2>
      <p className="text-sm mb-1" style={{ color:'rgba(30,41,59,0.55)' }}>
        Assigned <span className="font-mono font-bold" style={{ color:ROLE_COLOR }}>RTS-10049</span>
      </p>
      <p className="text-xs mb-8" style={{ color:'rgba(30,41,59,0.32)' }}>
        Confirmation sent to {form.email || 'your email'} within minutes.
      </p>
      <div className="flex gap-3">
        <button onClick={() => { setSubmitted(false); setStep(1) }} className="btn-primary">Place Another</button>
        <button className="btn-secondary">Track Order</button>
      </div>
    </motion.div>
  )

  const STEPS = ['Property Info','Search Details','Contact','Review']
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color:'#1e293b' }}>Place a New Order</h1>
        <p className="text-sm" style={{ color:'rgba(30,41,59,0.42)' }}>Title search across all 50 states · Confirmation within minutes</p>
      </div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s,i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => i+1 < step && setStep(i+1)}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={i+1 < step
                  ? { background:'#3d7020', color:'#f5f7f2' }
                  : i+1 === step
                  ? { background:'#5a8c3e', color:'#f5f7f2', boxShadow:`0 0 0 3px rgba(90,140,62,0.25)` }
                  : { background:'rgba(30,41,59,0.07)', color:'rgba(30,41,59,0.28)' }}>
                {i+1 < step ? <CheckCircle className="w-3.5 h-3.5" /> : i+1}
              </div>
              <span className="text-xs font-medium hidden sm:block"
                style={{ color: i+1===step ? '#1e293b' : 'rgba(30,41,59,0.30)' }}>{s}</span>
            </div>
            {i < STEPS.length-1 && (
              <div className="flex-1 h-0.5 rounded-full"
                style={{ background: i+1 < step ? '#4d8c2a' : 'rgba(30,41,59,0.10)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="glass-card p-6">
          <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
            {step===1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color:'#1e293b' }}>Property Information</h2>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Property State *</label>
                  <select value={form.state} onChange={e=>set('state',e.target.value)} className="input-field text-sm" required>
                    <option value="">Select state…</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>County *</label>
                  <input value={form.county} onChange={e=>set('county',e.target.value)} placeholder="e.g. Miami-Dade" className="input-field text-sm" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Property Address</label>
                  <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="123 Main St, City, State 00000" className="input-field text-sm"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Parcel / APN #</label>
                  <input value={form.parcelId} onChange={e=>set('parcelId',e.target.value)} placeholder="Optional" className="input-field text-sm"/>
                </div>
              </div>
            )}
            {step===2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color:'#1e293b' }}>Search Details</h2>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'rgba(30,41,59,0.40)' }}>Search Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Current Owner','Two-Owner','Full Search','Lien Search','Tax Certificate','HOA Estoppel','Municipal Lien','Property Valuation'].map(t => (
                      <button key={t} type="button" onClick={() => set('searchType',t)}
                        className="p-3 rounded-xl text-sm text-left border transition-all"
                        style={form.searchType===t
                          ? { border:`1px solid ${ROLE_COLOR}55`, background:`${ROLE_COLOR}18`, color:'#1e293b' }
                          : { border:'1px solid rgba(30,41,59,0.08)', color:'rgba(30,41,59,0.50)' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'rgba(30,41,59,0.40)' }}>Priority</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[['normal','Standard (2-3 days)','Normal turnaround'],['rush','Rush (24 hrs)','+ Rush fee applies']].map(([k,l,d]) => (
                      <button key={k} type="button" onClick={() => set('priority',k)}
                        className="p-3 rounded-xl text-left border transition-all"
                        style={form.priority===k
                          ? k==='rush'
                            ? { border:'1px solid rgba(220,80,60,0.40)', background:'rgba(220,80,60,0.12)', color:'#1e293b' }
                            : { border:`1px solid ${ROLE_COLOR}55`, background:`${ROLE_COLOR}18`, color:'#1e293b' }
                          : { border:'1px solid rgba(30,41,59,0.08)', color:'rgba(30,41,59,0.50)' }}>
                        <div className="font-semibold text-sm">{l}</div>
                        <div className="text-xs mt-0.5 opacity-60">{d}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Special Instructions</label>
                  <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} className="input-field text-sm resize-none" placeholder="Any notes for the search team…"/>
                </div>
              </div>
            )}
            {step===3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color:'#1e293b' }}>Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>First Name *</label>
                    <input value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="First name" className="input-field text-sm" required/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Last Name *</label>
                    <input value={form.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="Last name" className="input-field text-sm" required/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Work Email *</label>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@company.com" className="input-field text-sm" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(30,41,59,0.40)' }}>Company</label>
                  <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Company name" className="input-field text-sm"/>
                </div>
              </div>
            )}
            {step===4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color:'#1e293b' }}>Review & Submit</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[['State',form.state||'—'],['County',form.county||'—'],['Search Type',form.searchType||'—'],
                    ['Priority',form.priority.toUpperCase()],['Contact',`${form.firstName} ${form.lastName}`.trim()||'—'],['Email',form.email||'—']].map(([k,v]) => (
                    <div key={k} className="glass p-3 rounded-xl">
                      <div className="text-xs mb-0.5" style={{ color:'rgba(30,41,59,0.32)' }}>{k}</div>
                      <div className="font-medium text-sm" style={{ color:'#1e293b' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {form.priority==='rush' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background:'rgba(220,80,60,0.10)', border:'1px solid rgba(220,80,60,0.22)', color:'#e08080' }}>
                    <Zap className="w-4 h-4 flex-shrink-0" />
                    Rush order selected — additional fees apply. Delivery within 24 hours.
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 mt-8">
              {step>1 && <button type="button" onClick={() => setStep(s=>s-1)} className="btn-secondary px-6">Back</button>}
              {step<4
                ? <button type="button" onClick={() => setStep(s=>s+1)} className="btn-primary flex-1">Continue</button>
                : <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Order
                  </button>
              }
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ClientHome() {
  const myOrders = useMyOrders()
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'#1e293b' }}>Client Portal</h1>
          <p className="text-sm" style={{ color:'rgba(30,41,59,0.45)' }}>Welcome back, Taylor Brooks</p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> New Order
        </motion.button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon:Package,     label:'Active Orders',   value:'2',   color:ROLE_COLOR },
          { icon:CheckCircle, label:'Completed (YTD)', value:'12',  color:'#6dbc78' },
          { icon:Clock,       label:'Avg Turnaround',  value:'1.9d',color:'#c4a44e' },
          { icon:Zap,         label:'Rush Orders',     value:'1',   color:'#c4783e' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="stat-card">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background:`${s.color}22` }}>
              <s.icon className="w-4 h-4" style={{ color:s.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color:'#1e293b' }}>{s.value}</div>
            <div className="text-sm" style={{ color:'rgba(30,41,59,0.45)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold" style={{ color:'#1e293b' }}>Order Tracking</h2>
          {myOrders.map(o => (
            <React.Fragment key={o.id}>
              <TrackOrder order={o} />
              {o.workflow?.invoiceVisibleToClient && <InvoiceCard order={o} />}
            </React.Fragment>
          ))}
        </div>
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-1" style={{ color:'#1e293b' }}>Coverage Map</h2>
          <p className="text-xs mb-3" style={{ color:'rgba(30,41,59,0.30)' }}>3,140+ counties · All 50 states</p>
          <USAMap compact />
          <div className="mt-4 flex items-center gap-2 text-xs" style={{ color:'rgba(30,41,59,0.30)' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color:ROLE_COLOR }} />
            Your searches are in FL, CA, NY
          </div>
        </div>
      </div>
    </div>
  )
}

function SupportPage() {
  const [msg, setMsg]   = useState('')
  const [msgs, setMsgs] = useState([
    { from:'support', text:'Hi Taylor! How can we help you today?', time:'10:30 AM' }
  ])
  const send = () => {
    if (!msg.trim()) return
    setMsgs(m => [...m, { from:'user', text:msg, time:'Now' }])
    setMsg('')
    setTimeout(() => setMsgs(m => [...m, {
      from:'support', text:'Thanks for your message! A team member will respond shortly.', time:'Just now'
    }]), 800)
  }
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color:'#1e293b' }}>Support</h1>
      <div className="glass-card overflow-hidden flex flex-col" style={{ height:500 }}>
        <div className="p-4 flex items-center gap-3" style={{ borderBottom:'1px solid rgba(138,194,104,0.09)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background:`${ROLE_COLOR}30` }}>
            <MessageSquare className="w-4 h-4" style={{ color:ROLE_COLOR }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color:'#1e293b' }}>Resolute Support</div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color:'#6dbc78' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:'#6dbc78' }} />
              Online · Avg reply under 2 min
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m,i) => (
            <div key={i} className={`flex ${m.from==='user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                style={m.from==='user'
                  ? { background:'#3d7020', color:'#f5f7f2' }
                  : { background:'rgba(30,41,59,0.07)', color:'rgba(30,41,59,0.80)', border:'1px solid rgba(138,194,104,0.12)' }}>
                {m.text}
                <div className="text-xs mt-1" style={{ color: m.from==='user' ? 'rgba(30,41,59,0.45)' : 'rgba(30,41,59,0.28)' }}>
                  {m.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 flex gap-2" style={{ borderTop:'1px solid rgba(138,194,104,0.09)' }}>
          <input value={msg} onChange={e=>setMsg(e.target.value)}
            onKeyDown={e => e.key==='Enter' && send()}
            placeholder="Type a message…" className="input-field text-sm flex-1 py-2" />
          <button onClick={send} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MyOrdersPage() {
  const myOrders = useMyOrders()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>My Orders</h1>
      <div className="space-y-4">
        {myOrders.map(o => (
          <React.Fragment key={o.id}>
            <TrackOrder order={o} />
            {o.workflow?.invoiceVisibleToClient && <InvoiceCard order={o} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <Layout navItems={NAV} role="client" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index         element={<ClientHome />} />
        <Route path="order"  element={<PlaceOrderPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="support" element={<SupportPage />} />
      </Routes>
    </Layout>
  )
}
