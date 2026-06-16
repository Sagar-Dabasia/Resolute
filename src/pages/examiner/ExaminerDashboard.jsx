import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { LayoutDashboard, FileSearch, CheckCircle, Clock, AlertCircle, ChevronRight, X } from 'lucide-react'
import { ORDERS } from '../../data/mockData'

const ROLE_COLOR = '#c4a44e'
const NAV = [
  { path: '/examiner',           label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/examiner/examine',   label: 'To Examine', icon: FileSearch, badge: 2 },
  { path: '/examiner/completed', label: 'Completed',  icon: CheckCircle },
]
const myOrders = ORDERS.filter(o => ['searching','examining'].includes(o.status))

function ExamineModal({ order, onClose }) {
  const [findings, setFindings] = useState('')
  const [liens, setLiens] = useState(false)
  const [encumbrances, setEncumbrances] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="glass-card p-6 w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{order.id}</div>
            <div className="text-xl font-bold" style={{ color:'#f5ede0' }}>{order.client}</div>
            <div className="text-sm" style={{ color:'rgba(245,237,224,0.42)' }}>{order.type} · {order.state}, {order.county} County</div>
          </div>
          <button onClick={onClose} style={{ color:'rgba(245,237,224,0.30)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[['Search Type',order.type],['County',order.county],['State',order.state],['Priority',order.priority.toUpperCase()]].map(([k,v]) => (
            <div key={k} className="glass p-3 rounded-xl">
              <div className="text-xs mb-1" style={{ color:'rgba(245,237,224,0.32)' }}>{k}</div>
              <div className="font-medium text-sm" style={{ color:'#f5ede0' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color:'rgba(245,237,224,0.38)' }}>Examination Checklist</label>
            <div className="space-y-2">
              {['Chain of title verified','Tax status confirmed','Lien search completed',
                'HOA status checked','Easements/encumbrances noted'].map(item => (
                <label key={item} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg transition-colors"
                  onMouseOver={e=>e.currentTarget.style.background='rgba(245,240,224,0.05)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: ROLE_COLOR }} />
                  <span className="text-sm" style={{ color:'rgba(245,237,224,0.65)' }}>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color:'rgba(245,237,224,0.38)' }}>Issues Found</label>
            <div className="grid grid-cols-2 gap-3">
              {[['Open Liens',liens,setLiens],['Encumbrances',encumbrances,setEncumbrances]].map(([l,v,s]) => (
                <button key={l} onClick={() => s(!v)}
                  className="p-3 rounded-xl text-sm font-medium transition-all border"
                  style={v
                    ? { border:'1px solid rgba(220,80,60,0.40)', background:'rgba(220,80,60,0.14)', color:'#e08080' }
                    : { border:'1px solid rgba(245,240,224,0.08)', color:'rgba(245,237,224,0.40)' }}>
                  {l}: {v ? 'YES' : 'NO'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color:'rgba(245,237,224,0.38)' }}>Examination Notes</label>
            <textarea value={findings} onChange={e=>setFindings(e.target.value)}
              placeholder="Document findings, chain of title issues, liens, easements…"
              rows={4} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex-1 text-sm py-2.5" onClick={onClose}>Complete & Send to Delivery</button>
          <button className="btn-secondary text-sm py-2.5 px-4" onClick={onClose}>Save Draft</button>
        </div>
      </motion.div>
    </div>
  )
}

function ExaminerHome() {
  const [selected, setSelected] = useState(null)
  return (
    <div className="space-y-6">
      {selected && <ExamineModal order={selected} onClose={() => setSelected(null)} />}
      <div>
        <h1 className="text-2xl font-bold" style={{ color:'#f5ede0' }}>Examiner Dashboard</h1>
        <p className="text-sm" style={{ color:'rgba(245,237,224,0.45)' }}>Examine title documents and verify chain of title</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon:FileSearch,  label:'Awaiting Exam',   value:'2',  color:'#8ab0e8' },
          { icon:Clock,       label:'In Progress',     value:'1',  color:ROLE_COLOR },
          { icon:CheckCircle, label:'Completed Today', value:'4',  color:'#6dbc78' },
          { icon:AlertCircle, label:'Issues Found',    value:'1',  color:'#e08080' },
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
        <h2 className="font-semibold mb-4" style={{ color:'#f5ede0' }}>Examination Queue</h2>
        <div className="space-y-3">
          {myOrders.map((o,i) => (
            <motion.div key={o.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:i*0.07 }}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{ background:'rgba(245,240,224,0.03)', border:'1px solid rgba(138,194,104,0.08)' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='rgba(196,164,78,0.30)'}
              onMouseOut={e=>e.currentTarget.style.borderColor='rgba(138,194,104,0.08)'}
              onClick={() => setSelected(o)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-semibold text-sm" style={{ color:ROLE_COLOR }}>{o.id}</span>
                  {o.priority==='rush' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background:'rgba(220,80,60,0.18)', color:'#e08080' }}>RUSH</span>
                  )}
                </div>
                <div className="font-medium text-sm truncate" style={{ color:'#f5ede0' }}>{o.client}</div>
                <div className="text-xs" style={{ color:'rgba(245,237,224,0.42)' }}>{o.type} · {o.state}, {o.county}</div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(245,240,224,0.10)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${o.progress}%`, background:'linear-gradient(90deg,#4d8c2a,#c4a44e)' }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ background:`${ROLE_COLOR}22`, color:ROLE_COLOR }}>{o.status}</span>
                <div className="text-xs mt-1" style={{ color:'rgba(245,237,224,0.28)' }}>{o.progress}%</div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:'rgba(245,237,224,0.18)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ExaminerDashboard() {
  return (
    <Layout navItems={NAV} role="examiner" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<ExaminerHome />} />
        <Route path="examine" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>To Examine</h1>
          <div className="glass-card p-5"><OrdersTable orders={myOrders} /></div>
        </div>} />
        <Route path="completed" element={<div className="space-y-6">
          <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Completed</h1>
          <div className="glass-card p-5"><OrdersTable orders={ORDERS.filter(o=>o.status==='delivered')} /></div>
        </div>} />
      </Routes>
    </Layout>
  )
}
