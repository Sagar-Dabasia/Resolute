import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../context/OrderContext'
import { LayoutDashboard, Keyboard, CheckCircle, Clock, FileText, ChevronRight, X, Send } from 'lucide-react'
import { displayClient } from '../../data/mockData'

const ROLE_COLOR = '#3e9ec4'
const NAV = [
  { path: '/typer',           label: 'Dashboard', icon: LayoutDashboard },
  { path: '/typer/queue',     label: 'To Type',   icon: Keyboard, badge: 2 },
  { path: '/typer/completed', label: 'Completed', icon: CheckCircle },
]

const TEMPLATES = ['Standard Title Report', 'Commitment for Title Insurance', 'Lien & Judgment Report', 'Tax Certificate Summary', 'Two-Owner Search Report']

function TypeModal({ order, onClose }) {
  const { user } = useAuth()
  const { completeStep } = useOrders()
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [body, setBody] = useState('')
  const [proofed, setProofed] = useState(false)
  const submit = () => { completeStep(order.id, 'typer', user?.name, body); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="glass-card p-6 w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{order.id}</div>
            <div className="text-xl font-bold" style={{ color:'#f5ede0' }}>{displayClient(order.client, user)}</div>
            <div className="text-sm" style={{ color:'rgba(245,237,224,0.42)' }}>{order.type} · {order.state}, {order.county} County</div>
          </div>
          <button onClick={onClose} style={{ color:'rgba(245,237,224,0.30)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[['Search Type',order.type],['Examiner',order.examiner],['Priority',order.priority.toUpperCase()],['ETA',order.eta]].map(([k,v]) => (
            <div key={k} className="glass p-3 rounded-xl">
              <div className="text-xs mb-1" style={{ color:'rgba(245,237,224,0.32)' }}>{k}</div>
              <div className="font-medium text-sm" style={{ color:'#f5ede0' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color:'rgba(245,237,224,0.38)' }}>Report Template</label>
          <select value={template} onChange={e=>setTemplate(e.target.value)} className="input-field text-sm">
            {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color:'rgba(245,237,224,0.38)' }}>Report Body</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)}
            placeholder="Type the formatted title report from the examiner's findings…"
            rows={6} className="input-field text-sm resize-none" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg mb-5 transition-colors"
          onMouseOver={e=>e.currentTarget.style.background='rgba(245,240,224,0.05)'}
          onMouseOut={e=>e.currentTarget.style.background='transparent'}>
          <input type="checkbox" checked={proofed} onChange={e=>setProofed(e.target.checked)}
            className="w-4 h-4 rounded" style={{ accentColor: ROLE_COLOR }} />
          <span className="text-sm" style={{ color:'rgba(245,237,224,0.65)' }}>Proofread &amp; formatting verified</span>
        </label>
        <div className="flex gap-3">
          <button className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2" onClick={submit}>
            <Send className="w-4 h-4" /> Complete &amp; Submit to Admin
          </button>
          <button className="btn-secondary text-sm py-2.5 px-4" onClick={onClose}>Save Draft</button>
        </div>
      </motion.div>
    </div>
  )
}

function TyperHome() {
  const { user } = useAuth()
  const { getOrdersForRole } = useOrders()
  const myOrders = getOrdersForRole('typer')
  const [selected, setSelected] = useState(null)
  return (
    <div className="space-y-6">
      {selected && <TypeModal order={selected} onClose={() => setSelected(null)} />}
      <div>
        <h1 className="text-2xl font-bold" style={{ color:'#f5ede0' }}>Typer Dashboard</h1>
        <p className="text-sm" style={{ color:'rgba(245,237,224,0.45)' }}>Type and format examined reports before delivery</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon:Keyboard,    label:'Awaiting Typing', value:'2',   color:ROLE_COLOR },
          { icon:FileText,    label:'In Progress',     value:'1',   color:'#8ab0e8' },
          { icon:CheckCircle, label:'Typed Today',     value:'6',   color:'#6dbc78' },
          { icon:Clock,       label:'Avg Type Time',   value:'24m', color:'#c4a44e' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="stat-card">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background:`${s.color}22` }}>
              <s.icon className="w-4 h-4" style={{ color:s.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color:'#f5ede0' }}>{s.value}</div>
            <div className="text-sm" style={{ color:'rgba(245,237,224,0.45)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-4" style={{ color:'#f5ede0' }}>Typing Queue</h2>
        <div className="space-y-3">
          {myOrders.map((o,i) => (
            <motion.div key={o.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:i*0.07 }}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{ background:'rgba(245,240,224,0.03)', border:'1px solid rgba(138,194,104,0.08)' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='rgba(62,158,196,0.35)'}
              onMouseOut={e=>e.currentTarget.style.borderColor='rgba(138,194,104,0.08)'}
              onClick={() => setSelected(o)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${ROLE_COLOR}22` }}>
                <Keyboard className="w-5 h-5" style={{ color:ROLE_COLOR }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-semibold text-sm" style={{ color:ROLE_COLOR }}>{o.id}</span>
                  {o.priority==='rush' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background:'rgba(220,80,60,0.18)', color:'#e08080' }}>RUSH</span>
                  )}
                </div>
                <div className="font-medium text-sm truncate" style={{ color:'#f5ede0' }}>{displayClient(o.client, user)}</div>
                <div className="text-xs" style={{ color:'rgba(245,237,224,0.42)' }}>{o.type} · {o.state}, {o.county}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ background:`${ROLE_COLOR}22`, color:ROLE_COLOR }}>{o.status}</span>
                <div className="text-xs mt-1" style={{ color:'rgba(245,237,224,0.28)' }}>ETA {o.eta}</div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:'rgba(245,237,224,0.18)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TyperDashboard() {
  const { getOrdersForRole, orders } = useOrders()
  const myOrders  = getOrdersForRole('typer')
  const completed = orders.filter(o => o.completedDates?.typer)
  return (
    <Layout navItems={NAV} role="typer" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<TyperHome />} />
        <Route path="queue" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>To Type</h1>
          <div className="glass-card p-5"><OrdersTable orders={myOrders} /></div>
        </div>} />
        <Route path="completed" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Completed</h1>
          <div className="glass-card p-5"><OrdersTable orders={completed} /></div>
        </div>} />
      </Routes>
    </Layout>
  )
}
