import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import USAMap from '../../components/USAMap'
import {
  LayoutDashboard, ClipboardList, Users, BarChart3, Settings, MapPin,
  Package, CheckCircle, Clock, Search, Plus, Filter, Eye, MoreHorizontal,
  ChevronDown, ChevronUp, FileText, ArrowUpRight, UserCheck,
} from 'lucide-react'
import { USERS, MONTHLY_STATS } from '../../data/mockData'
import { useOrders } from '../../context/OrderContext'
import AssignModal from '../../components/AssignModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const ROLE_COLOR  = '#3d7020'
const ROLE_HOVER  = '#4d8c2a'

const NAV = [
  { path: '/admin',          label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/admin/orders',   label: 'Orders',       icon: ClipboardList, badge: 8 },
  { path: '/admin/users',    label: 'Users',        icon: Users,         badge: 6 },
  { path: '/admin/map',      label: 'Coverage Map', icon: MapPin },
  { path: '/admin/reports',  label: 'Reports',      icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings',     icon: Settings },
]

// Light theme palette
const Q = {
  bg:      '#f0f2f4',
  card:    '#ffffff',
  border:  '#e2e8f0',
  text:    '#1e293b',
  muted:   '#64748b',
  faint:   '#94a3b8',
  shadow:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  rowHover:'#f8fafc',
}

const STATUS_MAP = {
  received:  { label:'Received',  color:'#64748b', bg:'#f1f5f9' },
  screening: { label:'Screening', color:'#d97706', bg:'#fffbeb' },
  searching: { label:'Searching', color:'#2563eb', bg:'#eff6ff' },
  examining: { label:'Examining', color:'#7c3aed', bg:'#f5f3ff' },
  delivered: { label:'Delivered', color:'#16a34a', bg:'#f0fdf4' },
}

function QCard({ children, className = '', style = {} }) {
  return (
    <div className={className}
      style={{ background: Q.card, border: `1px solid ${Q.border}`, borderRadius: 10, boxShadow: Q.shadow, ...style }}>
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = ROLE_COLOR, trend, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: Q.card, border: `1px solid ${Q.border}`, borderRadius: 10,
        boxShadow: Q.shadow, padding: '18px 20px' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon style={{ color, width: 18, height: 18 }} />
        </div>
        {trend && (
          <span className="text-xs font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full"
            style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <ArrowUpRight style={{ width: 11, height: 11 }} />{trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: Q.text }}>{value}</div>
      <div className="text-sm mt-0.5" style={{ color: Q.muted }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: Q.faint }}>{sub}</div>}
    </motion.div>
  )
}

function OrdersPipeline({ orders }) {
  const { assignOrder } = useOrders()
  const [search, setSearch]         = useState('')
  const [activeTab, setActiveTab]   = useState('all')
  const [showMap, setShowMap]       = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)

  const unassignedOrders = orders.filter(o => o.assignedTo === null && o.status !== 'delivered')

  const tabs = [
    { key: 'all',        label: 'All Orders',  count: orders.length },
    { key: 'progress',   label: 'In Progress', count: orders.filter(o => ['searching','examining','screening'].includes(o.status)).length },
    { key: 'rush',       label: 'Rush',        count: orders.filter(o => o.priority === 'rush').length },
    { key: 'delivered',  label: 'Delivered',   count: orders.filter(o => o.status === 'delivered').length },
    { key: 'unassigned', label: 'Unassigned',  count: unassignedOrders.length },
  ]

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q || o.client.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
    const matchTab =
      activeTab === 'all'        ? true :
      activeTab === 'rush'       ? o.priority === 'rush' :
      activeTab === 'progress'   ? ['searching','examining','screening'].includes(o.status) :
      activeTab === 'delivered'  ? o.status === 'delivered' :
      activeTab === 'unassigned' ? (o.assignedTo === null && o.status !== 'delivered') : true
    return matchSearch && matchTab
  })

  return (
    <div className="space-y-4">
      {assignTarget && (
        <AssignModal order={assignTarget} onClose={() => setAssignTarget(null)} />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative" style={{ minWidth: 240 }}>
          <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:Q.faint }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or file #..."
            style={{
              width:'100%', paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8,
              background:Q.bg, border:`1px solid ${Q.border}`, borderRadius:8,
              color:Q.text, fontSize:13, outline:'none',
            }}
            onFocus={e => e.target.style.borderColor = ROLE_COLOR}
            onBlur={e => e.target.style.borderColor = Q.border}
          />
        </div>
        <button style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
          background:Q.bg, border:`1px solid ${Q.border}`, borderRadius:8,
          color:Q.muted, fontSize:13, fontWeight:500, cursor:'pointer',
        }}>
          <Filter style={{ width:14, height:14 }} /> Filter
        </button>
        <button style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 16px',
          background:ROLE_COLOR, border:'none', borderRadius:8,
          color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginLeft:'auto',
        }}
          onMouseOver={e => e.currentTarget.style.background = ROLE_HOVER}
          onMouseOut={e => e.currentTarget.style.background = ROLE_COLOR}>
          <Plus style={{ width:15, height:15 }} /> New Order
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${Q.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'10px 16px', fontSize:13, fontWeight:500,
              color: activeTab === t.key ? (t.key === 'unassigned' ? '#d97706' : ROLE_COLOR) : Q.muted,
              borderBottomWidth: 2, borderBottomStyle: 'solid',
              borderBottomColor: activeTab === t.key
                ? (t.key === 'unassigned' ? '#d97706' : ROLE_COLOR)
                : 'transparent',
              marginBottom: -1, background:'transparent', border:'none',
              cursor:'pointer', transition:'color 0.15s',
            }}>
            {t.label}
            <span style={{
              padding:'1px 7px', borderRadius:99, fontSize:11, fontWeight:700,
              background: activeTab === t.key
                ? (t.key === 'unassigned' ? '#fffbeb' : `${ROLE_COLOR}18`)
                : Q.bg,
              color: activeTab === t.key
                ? (t.key === 'unassigned' ? '#d97706' : ROLE_COLOR)
                : Q.faint,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ background:Q.card, border:`1px solid ${Q.border}`, borderRadius:10, boxShadow:Q.shadow, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:`1px solid ${Q.border}` }}>
              {['File #','Client','Location','Type','Status','Assigned To','Completed','ETA',''].map(h => (
                <th key={h} style={{
                  padding:'10px 16px', textAlign:'left', fontSize:11,
                  fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em',
                  color:Q.faint, whiteSpace:'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const s = STATUS_MAP[o.status] || STATUS_MAP.received
              const isUnassigned = o.assignedTo === null && o.status !== 'delivered'
              const lastCompleted = ['examiner','delivery','screener']
                .map(r => o.completedDates?.[r])
                .find(d => d != null) || null
              return (
                <motion.tr key={o.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom:`1px solid ${Q.border}`, cursor:'pointer' }}
                  onMouseOver={e => e.currentTarget.style.background = Q.rowHover}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'10px 16px', whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:12, color:ROLE_COLOR }}>{o.id}</span>
                      {o.priority === 'rush' && (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px',
                          borderRadius:4, background:'#fef2f2', color:'#dc2626' }}>RUSH</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:'10px 16px', fontWeight:500, color:Q.text, whiteSpace:'nowrap' }}>{o.client}</td>
                  <td style={{ padding:'10px 16px', color:Q.muted, whiteSpace:'nowrap' }}>{o.county}, {o.state}</td>
                  <td style={{ padding:'10px 16px', color:Q.muted, whiteSpace:'nowrap', fontSize:12 }}>{o.type}</td>
                  <td style={{ padding:'10px 16px', whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{
                        padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600,
                        background:s.bg, color:s.color,
                      }}>{s.label}</span>
                      {isUnassigned && (
                        <span style={{
                          padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600,
                          background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a',
                        }}>Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:'10px 16px', color:Q.muted, fontSize:12, whiteSpace:'nowrap' }}>
                    {o.assignedTo
                      ? <span style={{ textTransform:'capitalize', fontWeight:500 }}>{o[o.assignedTo] || o.assignedTo}</span>
                      : <span style={{ color:Q.faint }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 16px', color:Q.faint, fontSize:12, whiteSpace:'nowrap' }}>
                    {lastCompleted || '—'}
                  </td>
                  <td style={{ padding:'10px 16px', color:Q.faint, fontSize:12, whiteSpace:'nowrap' }}>{o.eta}</td>
                  <td style={{ padding:'10px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                      <button title="Assign" onClick={e => { e.stopPropagation(); setAssignTarget(o) }}
                        style={{
                          display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
                          borderRadius:6, background: isUnassigned ? '#fffbeb' : 'transparent',
                          border: isUnassigned ? '1px solid #fde68a' : '1px solid transparent',
                          cursor:'pointer', color: isUnassigned ? '#d97706' : Q.faint,
                          fontSize:11, fontWeight:600,
                        }}
                        onMouseOver={e => { if (!isUnassigned) e.currentTarget.style.background = '#f1f5f9' }}
                        onMouseOut={e => { if (!isUnassigned) e.currentTarget.style.background = 'transparent' }}>
                        <UserCheck style={{ width:13, height:13 }} />
                        {isUnassigned ? 'Assign' : ''}
                      </button>
                      <button title="View" style={{ padding:6, borderRadius:6, background:'transparent', border:'none', cursor:'pointer', color:Q.faint }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <Eye style={{ width:14, height:14 }} />
                      </button>
                      <button title="More" style={{ padding:6, borderRadius:6, background:'transparent', border:'none', cursor:'pointer', color:Q.faint }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <MoreHorizontal style={{ width:14, height:14 }} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:'48px 16px', textAlign:'center', color:Q.faint }}>
            <FileText style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.4 }} />
            <p style={{ fontSize:13 }}>No orders match your filters</p>
          </div>
        )}
      </div>

      {/* Collapsible coverage map */}
      <div style={{ background:Q.card, border:`1px solid ${Q.border}`, borderRadius:10, boxShadow:Q.shadow, overflow:'hidden' }}>
        <button onClick={() => setShowMap(!showMap)} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 20px', background:'transparent', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, color:Q.text,
        }}
          onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <MapPin style={{ width:15, height:15, color:ROLE_COLOR }} />
            National Coverage Map
            <span style={{ fontSize:12, fontWeight:400, color:Q.faint }}>— hover states for order details</span>
          </span>
          {showMap
            ? <ChevronUp style={{ width:15, height:15, color:Q.faint }} />
            : <ChevronDown style={{ width:15, height:15, color:Q.faint }} />}
        </button>
        {showMap && (
          <div style={{ borderTop:`1px solid ${Q.border}`, padding:'16px 20px 20px' }}>
            <USAMap />
          </div>
        )}
      </div>
    </div>
  )
}

function AdminHome() {
  const { orders, activityLog } = useOrders()
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: Q.text }}>Operations Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: Q.muted }}>Resolute Title Services — June 2026</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
          All systems operational
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}     label="Active Orders"   value={String(orders.filter(o=>o.status!=='delivered').length)} sub="2 rush priority"    color={ROLE_COLOR}  trend="+12%" delay={0}    />
        <StatCard icon={CheckCircle} label="Delivered Today" value={String(orders.filter(o=>o.status==='delivered').length)} sub="98.4% on-time"       color="#16a34a"     trend="+5%"  delay={0.05} />
        <StatCard icon={Clock}       label="Avg Turnaround"  value="1.8d" sub="Rush: 18 hrs"         color="#d97706"                  delay={0.10} />
        <StatCard icon={Users}       label="Active Clients"  value="24"   sub="6 new this month"    color="#7c3aed"     trend="+8%"  delay={0.15} />
      </div>

      {/* Chart + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <QCard className="lg:col-span-2 p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: Q.text }}>Monthly Order Volume</h2>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={MONTHLY_STATS}>
              <defs>
                <linearGradient id="ogGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ROLE_COLOR} stopOpacity={0.22}/>
                  <stop offset="95%" stopColor={ROLE_COLOR} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill:Q.faint, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:Q.faint, fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'#fff', border:`1px solid ${Q.border}`, borderRadius:8, fontSize:12, boxShadow:Q.shadow }}/>
              <Area type="monotone" dataKey="orders"    stroke={ROLE_COLOR} fill="url(#ogGrad)" strokeWidth={2} name="Orders"/>
              <Area type="monotone" dataKey="delivered" stroke="#16a34a"    fill="none"          strokeWidth={2} strokeDasharray="4 4" name="Delivered"/>
            </AreaChart>
          </ResponsiveContainer>
        </QCard>

        <QCard className="p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: Q.text }}>Recent Activity</h2>
          <div className="space-y-3">
            {activityLog.slice(0, 5).map((a, i) => (
              <div key={i} style={{ display:'flex', gap:10 }}>
                <div style={{
                  width:8, height:8, borderRadius:99, flexShrink:0, marginTop:5,
                  background: a.type==='new' ? ROLE_COLOR : a.type==='delivered' ? '#16a34a'
                    : a.type==='progress' ? '#d97706' : '#7c3aed',
                }} />
                <div>
                  <p style={{ fontSize:12, lineHeight:'1.5', color:Q.muted }}>{a.action}</p>
                  <p style={{ fontSize:11, marginTop:2, color:Q.faint }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </QCard>
      </div>

      {/* Orders pipeline */}
      <OrdersPipeline orders={orders} />
    </div>
  )
}

function AdminOrders() {
  const { orders } = useOrders()
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: Q.text }}>Order Management</h1>
        <p className="text-sm" style={{ color: Q.muted }}>All active and completed title search orders</p>
      </div>
      <OrdersPipeline orders={orders} />
    </div>
  )
}

function AdminUsers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: Q.text }}>User Management</h1>
          <p className="text-sm" style={{ color: Q.muted }}>Team members and client accounts</p>
        </div>
        <button style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:ROLE_COLOR, border:'none', borderRadius:8,
          color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
        }}
          onMouseOver={e => e.currentTarget.style.background = ROLE_HOVER}
          onMouseOut={e => e.currentTarget.style.background = ROLE_COLOR}>
          <Plus style={{ width:15, height:15 }} /> Invite User
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { role:'Screeners', count:2, color:'#4d8c2a' },
          { role:'Examiners', count:1, color:'#d97706' },
          { role:'Delivery',  count:1, color:'#7c3aed' },
          { role:'Clients',   count:8, color:'#2563eb' },
        ].map(r => (
          <div key={r.role}
            style={{ background:Q.card, border:`1px solid ${Q.border}`, borderRadius:10, boxShadow:Q.shadow, padding:'16px 20px' }}>
            <div style={{ fontSize:28, fontWeight:700, color:Q.text }}>{r.count}</div>
            <div style={{ fontSize:13, color:Q.muted, marginTop:2 }}>{r.role}</div>
            <div style={{ marginTop:10, height:3, borderRadius:99, background:r.color, opacity:0.5 }} />
          </div>
        ))}
      </div>

      <div style={{ background:Q.card, border:`1px solid ${Q.border}`, borderRadius:10, boxShadow:Q.shadow, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:`1px solid ${Q.border}` }}>
              {['Name','Email','Role','Status','Orders','Joined'].map(h => (
                <th key={h} style={{
                  padding:'10px 16px', textAlign:'left', fontSize:11,
                  fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:Q.faint,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USERS.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
                style={{ borderBottom:`1px solid ${Q.border}`, cursor:'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = Q.rowHover}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'10px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{
                      width:32, height:32, borderRadius:8, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:11, fontWeight:700,
                      background:`${ROLE_COLOR}18`, color:ROLE_COLOR,
                    }}>
                      {u.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <span style={{ fontWeight:500, color:Q.text }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding:'10px 16px', color:Q.muted, fontSize:12 }}>{u.email}</td>
                <td style={{ padding:'10px 16px' }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600,
                    background:`${ROLE_COLOR}14`, color:ROLE_COLOR,
                    textTransform:'capitalize',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding:'10px 16px' }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600,
                    ...(u.status === 'active'
                      ? { background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }
                      : { background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }),
                  }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding:'10px 16px', fontWeight:500, color:Q.text }}>{u.orders}</td>
                <td style={{ padding:'10px 16px', fontSize:12, color:Q.faint }}>{u.joined}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminMap() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: Q.text }}>Coverage Map</h1>
        <p className="text-sm" style={{ color: Q.muted }}>Real-time order distribution across all 50 states</p>
      </div>
      <QCard className="p-6"><USAMap /></QCard>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[{s:'FL',c:31},{s:'TX',c:35},{s:'CA',c:28},{s:'NY',c:24},{s:'OH',c:19}].map(({s,c}) => (
          <div key={s}
            style={{ background:Q.card, border:`1px solid ${Q.border}`, borderRadius:10,
              boxShadow:Q.shadow, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:30, fontWeight:700, color:ROLE_COLOR }}>{c}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:4, color:Q.muted }}>{s}</div>
            <div style={{ fontSize:11, color:Q.faint }}>active orders</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Layout navItems={NAV} role="admin" roleColor={ROLE_COLOR} lightTheme>
      <Routes>
        <Route index            element={<AdminHome />} />
        <Route path="orders"   element={<AdminOrders />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="map"      element={<AdminMap />} />
        <Route path="reports"  element={<AdminHome />} />
        <Route path="settings" element={
          <div style={{ padding:48, textAlign:'center', color:Q.faint, fontSize:14 }}>
            Settings coming soon
          </div>
        } />
      </Routes>
    </Layout>
  )
}
