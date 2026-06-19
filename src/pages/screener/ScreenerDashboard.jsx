import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { LayoutDashboard, ClipboardList, CheckCircle, Clock, AlertTriangle, Search, ChevronRight, X, Send } from 'lucide-react'
import { displayClient } from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../context/OrderContext'

const ROLE_COLOR = '#8ab868'
const NAV = [
  { path: '/screener',           label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/screener/queue',     label: 'Screening Queue', icon: ClipboardList, badge: 3 },
  { path: '/screener/completed', label: 'Completed',       icon: CheckCircle },
]

const STATUS_DOT = {
  received:  '#8ab0e8', screening: '#d4b450', searching: '#8ab868',
  examining: '#c4a44e', typing: '#5ab6d0', delivered: '#6dbc78',
}

function OrderModal({ order, onClose }) {
  const { user } = useAuth()
  const { completeStep } = useOrders()
  const [status, setStatus] = useState(order.status)
  const [notes, setNotes]   = useState('')
  const submit = () => { completeStep(order.id, 'screener', user?.name, notes); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{order.id}</div>
            <div className="text-xl font-bold mt-0.5" style={{ color: '#f5ede0' }}>{displayClient(order.client, user)}</div>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(245,237,224,0.30)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[['State/County',`${order.state} · ${order.county}`],['Search Type',order.type],
            ['Priority',order.priority.toUpperCase()],['ETA',order.eta]].map(([k,v]) => (
            <div key={k} className="glass p-3 rounded-xl">
              <div className="text-xs mb-1" style={{ color: 'rgba(245,237,224,0.32)' }}>{k}</div>
              <div className="font-medium text-sm" style={{ color: '#f5ede0' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(245,237,224,0.38)' }}>Update Status</label>
          <div className="flex gap-2 flex-wrap">
            {['received','screening','searching'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={status === s
                  ? { background: `${ROLE_COLOR}28`, color: ROLE_COLOR, border: `1px solid ${ROLE_COLOR}55` }
                  : { background: 'rgba(245,240,224,0.05)', color: 'rgba(245,237,224,0.40)', border: '1px solid rgba(245,240,224,0.08)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Add screening notes…" rows={3} className="input-field text-sm mb-4 resize-none" />
        <div className="flex gap-3">
          <button className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2" onClick={submit}>
            <Send className="w-4 h-4" /> Complete &amp; Submit to Admin
          </button>
          <button className="btn-secondary text-sm py-2.5 px-4" onClick={onClose}>Hold</button>
        </div>
      </motion.div>
    </div>
  )
}

function ScreenerHome() {
  const { user } = useAuth()
  const { getOrdersForRole } = useOrders()
  const myOrders = getOrdersForRole('screener')
  const [selected, setSelected] = useState(null)
  return (
    <div className="space-y-6">
      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f5ede0' }}>Screening Dashboard</h1>
        <p className="text-sm" style={{ color: 'rgba(245,237,224,0.45)' }}>Review and validate incoming title search requests</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: 'Awaiting Screening', value: '2', color: '#d4b450' },
          { icon: Search,        label: 'In Screening',       value: '1', color: ROLE_COLOR },
          { icon: CheckCircle,   label: 'Passed Today',       value: '5', color: '#6dbc78' },
          { icon: Clock,         label: 'Avg Screen Time',    value: '18m', color: '#c4a44e' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="stat-card">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${s.color}22` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#f5ede0' }}>{s.value}</div>
            <div className="text-sm" style={{ color: 'rgba(245,237,224,0.45)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-4" style={{ color: '#f5ede0' }}>My Screening Queue</h2>
        <div className="space-y-3">
          {myOrders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{ background:'rgba(245,240,224,0.03)', border:'1px solid rgba(138,194,104,0.08)' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(138,194,104,0.25)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(138,194,104,0.08)'}
              onClick={() => setSelected(o)}>
              <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: STATUS_DOT[o.status] || ROLE_COLOR }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{o.id}</span>
                  {o.priority === 'rush' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background:'rgba(220,80,60,0.18)', color:'#e08080' }}>RUSH</span>
                  )}
                </div>
                <div className="font-medium text-sm mt-0.5 truncate" style={{ color:'#f5ede0' }}>{displayClient(o.client, user)}</div>
                <div className="text-xs" style={{ color:'rgba(245,237,224,0.42)' }}>{o.type} · {o.state}, {o.county}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ background: `${STATUS_DOT[o.status] || ROLE_COLOR}22`, color: STATUS_DOT[o.status] || ROLE_COLOR }}>
                  {o.status}
                </span>
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

export default function ScreenerDashboard() {
  const { getOrdersForRole, orders } = useOrders()
  const myOrders  = getOrdersForRole('screener')
  const completed = orders.filter(o => o.completedDates?.screener)
  return (
    <Layout navItems={NAV} role="screener" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<ScreenerHome />} />
        <Route path="queue" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Screening Queue</h1>
          <div className="glass-card p-5"><OrdersTable orders={myOrders} /></div>
        </div>} />
        <Route path="completed" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Completed Screenings</h1>
          <div className="glass-card p-5"><OrdersTable orders={completed} /></div>
        </div>} />
      </Routes>
    </Layout>
  )
}
