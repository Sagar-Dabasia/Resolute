# Admin Assignment Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared OrderContext so Admin can assign orders to role queues (with optional person pinning), and each role's "Complete & Submit to Admin" button auto-advances the order status and logs to a live activity feed.

**Architecture:** Lift `ORDERS` and `ACTIVITY` out of static `mockData.js` imports into a React context (`OrderContext`). Admin writes to the context via `assignOrder`; roles write via `completeStep`. All dashboards read from the same live state. No backend — all in-memory.

**Tech Stack:** React 18, Vite 5, React Context API, Tailwind CSS, Framer Motion, Lucide React

## Global Constraints

- No new npm packages — use only what's in package.json
- Light theme (Q palette) for all new Admin UI; dark glass-card theme for role modal additions
- Order IDs follow format `RTS-XXXXX`
- `completedDates` keys match role names exactly: `screener`, `examiner`, `delivery`
- `assignedTo` is `null` when unassigned; never `undefined`
- Today's ISO date via `new Date().toISOString().split('T')[0]`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/mockData.js` | Modify | Add `assignedTo`, `completedDates` to seed data |
| `src/context/OrderContext.jsx` | Create | Shared order state, `assignOrder`, `completeStep`, `getOrdersForRole` |
| `src/App.jsx` | Modify | Wrap routes with `OrderProvider` |
| `src/components/AssignModal.jsx` | Create | Light-theme assign modal for Admin |
| `src/pages/admin/AdminDashboard.jsx` | Modify | Use context, Unassigned tab, Assign button, live activity feed |
| `src/pages/screener/ScreenerDashboard.jsx` | Modify | Use context queue, Complete button in OrderModal |
| `src/pages/examiner/ExaminerDashboard.jsx` | Modify | Use context queue, Complete button in ExamineModal |
| `src/pages/delivery/DeliveryDashboard.jsx` | Modify | Use context queue, Complete button in DeliveryModal |

---

## Task 1: Update Seed Data

**Files:**
- Modify: `src/data/mockData.js`

**What changes:** Add `assignedTo` and `completedDates` to every order. Seed a realistic initial state: RTS-10044 and RTS-10041 are unassigned (admin needs to route them), RTS-10045 is assigned to screener, RTS-10047 is assigned to delivery, RTS-10043 and RTS-10048 are assigned to examiner.

- [ ] **Step 1: Replace the ORDERS array in `src/data/mockData.js`**

```js
export const ORDERS = [
  {
    id: 'RTS-10041', client: 'Lakewood Title Group', state: 'FL', county: 'Miami-Dade',
    type: 'Full Search', status: 'searching', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'rush', created: '2026-06-09', eta: '2026-06-11',
    progress: 65,
    assignedTo: null,
    completedDates: { screener: '2026-06-09', examiner: null, delivery: null },
  },
  {
    id: 'RTS-10042', client: 'Apex Lending Partners', state: 'TX', county: 'Harris',
    type: 'Current Owner', status: 'delivered', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'normal', created: '2026-06-08', eta: '2026-06-10',
    progress: 100,
    assignedTo: null,
    completedDates: { screener: '2026-06-08', examiner: '2026-06-09', delivery: '2026-06-10' },
  },
  {
    id: 'RTS-10043', client: 'Sterling Law Firm', state: 'CA', county: 'Los Angeles',
    type: 'Two-Owner', status: 'examining', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'normal', created: '2026-06-09', eta: '2026-06-12',
    progress: 45,
    assignedTo: 'examiner',
    completedDates: { screener: '2026-06-09', examiner: null, delivery: '2026-06-10' },
  },
  {
    id: 'RTS-10044', client: 'Pinnacle Real Estate', state: 'NY', county: 'Kings',
    type: 'Lien Search', status: 'received', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'rush', created: '2026-06-10', eta: '2026-06-11',
    progress: 10,
    assignedTo: null,
    completedDates: { screener: null, examiner: null, delivery: null },
  },
  {
    id: 'RTS-10045', client: 'BlueStar Title Agency', state: 'GA', county: 'Fulton',
    type: 'Full Search', status: 'screening', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'normal', created: '2026-06-10', eta: '2026-06-13',
    progress: 25,
    assignedTo: 'screener',
    completedDates: { screener: null, examiner: null, delivery: null },
  },
  {
    id: 'RTS-10046', client: 'Meridian Mortgage LLC', state: 'OH', county: 'Cuyahoga',
    type: 'Tax Certificate', status: 'delivered', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'normal', created: '2026-06-07', eta: '2026-06-09',
    progress: 100,
    assignedTo: null,
    completedDates: { screener: '2026-06-07', examiner: '2026-06-08', delivery: '2026-06-09' },
  },
  {
    id: 'RTS-10047', client: 'Coastal Title Services', state: 'NC', county: 'Mecklenburg',
    type: 'HOA Estoppel', status: 'searching', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'rush', created: '2026-06-09', eta: '2026-06-11',
    progress: 55,
    assignedTo: 'delivery',
    completedDates: { screener: '2026-06-09', examiner: null, delivery: null },
  },
  {
    id: 'RTS-10048', client: 'Lakewood Title Group', state: 'AZ', county: 'Maricopa',
    type: 'Current Owner', status: 'examining', screener: 'Sam Carter', examiner: 'Jordan Lee',
    delivery: 'Morgan Davis', priority: 'normal', created: '2026-06-08', eta: '2026-06-12',
    progress: 70,
    assignedTo: 'examiner',
    completedDates: { screener: '2026-06-08', examiner: null, delivery: '2026-06-09' },
  },
]
```

- [ ] **Step 2: Start dev server and verify no import errors**

Run: `npm run dev`
Open: `http://localhost:5173/login` → sign in as admin → check browser console has no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockData.js
git commit -m "feat: add assignedTo and completedDates fields to order seed data"
```

---

## Task 2: Create OrderContext

**Files:**
- Create: `src/context/OrderContext.jsx`

**Interfaces:**
- Consumes: `ORDERS`, `ACTIVITY` from `../data/mockData`
- Produces:
  - `useOrders()` → `{ orders, activityLog, assignOrder, completeStep, getOrdersForRole }`
  - `assignOrder(orderId: string, { queue: string, personName?: string }): void`
  - `completeStep(orderId: string, role: string, userName: string, notes?: string): void`
  - `getOrdersForRole(role: string): Order[]`
  - `OrderProvider` component

- [ ] **Step 1: Create `src/context/OrderContext.jsx`**

```jsx
import React, { createContext, useContext, useState } from 'react'
import { ORDERS, ACTIVITY } from '../data/mockData'

const OrderContext = createContext(null)

// Maps each role to the status their completion sets
const NEXT_STATUS = {
  screener: 'searching',
  delivery: 'examining',
  examiner: 'delivered',
}

export function OrderProvider({ children }) {
  const [orders, setOrders]        = useState(ORDERS)
  const [activityLog, setActivity] = useState(ACTIVITY)

  function assignOrder(orderId, { queue, personName }) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      const update = { assignedTo: queue }
      if (personName) update[queue] = personName
      return { ...o, ...update }
    }))
  }

  function completeStep(orderId, role, userName, notes) {
    const today = new Date().toISOString().split('T')[0]
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      return {
        ...o,
        status:         NEXT_STATUS[role] || o.status,
        assignedTo:     null,
        completedDates: { ...o.completedDates, [role]: today },
      }
    }))
    const stageName = { screener: 'Screening', delivery: 'Delivery', examiner: 'Examination' }[role] || role
    setActivity(prev => [
      {
        id:     orderId + '-' + role,
        action: `${userName} completed ${stageName} on ${orderId}${notes ? ' — ' + notes : ''}`,
        time:   'Just now',
        type:   'progress',
      },
      ...prev,
    ])
  }

  function getOrdersForRole(role) {
    return orders.filter(o => o.assignedTo === role)
  }

  return (
    <OrderContext.Provider value={{ orders, activityLog, assignOrder, completeStep, getOrdersForRole }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => useContext(OrderContext)
```

- [ ] **Step 2: Verify file saved with no syntax errors**

Run: `npm run build` (fast type check)
Expected: build completes without errors (OrderContext not yet used, but should import clean).

- [ ] **Step 3: Commit**

```bash
git add src/context/OrderContext.jsx
git commit -m "feat: add OrderContext with assignOrder, completeStep, getOrdersForRole"
```

---

## Task 3: Wire OrderProvider into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `OrderProvider` from `./context/OrderContext`

- [ ] **Step 1: Update `src/App.jsx`**

Replace the entire file with:

```jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { OrderProvider } from './context/OrderContext'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ScreenerDashboard from './pages/screener/ScreenerDashboard'
import ExaminerDashboard from './pages/examiner/ExaminerDashboard'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import ClientDashboard from './pages/client/ClientDashboard'

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/screener/*" element={
              <ProtectedRoute allowedRole="screener"><ScreenerDashboard /></ProtectedRoute>
            } />
            <Route path="/examiner/*" element={
              <ProtectedRoute allowedRole="examiner"><ExaminerDashboard /></ProtectedRoute>
            } />
            <Route path="/delivery/*" element={
              <ProtectedRoute allowedRole="delivery"><DeliveryDashboard /></ProtectedRoute>
            } />
            <Route path="/client/*" element={
              <ProtectedRoute allowedRole="client"><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Verify app still boots**

Open `http://localhost:5173/login` — no console errors, login still works for all roles.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wrap app with OrderProvider"
```

---

## Task 4: Create AssignModal Component

**Files:**
- Create: `src/components/AssignModal.jsx`

**Interfaces:**
- Props: `order` (order object), `onClose(): void`
- Consumes: `useOrders()` → `assignOrder`
- Consumes: `USERS` from `../data/mockData`
- Light theme (Q palette from AdminDashboard — `#f0f2f4` bg, `#ffffff` card, `#e2e8f0` border, `#1e293b` text)

The DEFAULT_QUEUE map pre-selects the stage radio based on order status:
- `received` or `screening` → `'screener'`
- `searching` → `'delivery'`
- `examining` → `'examiner'`
- anything else → `'screener'`

- [ ] **Step 1: Create `src/components/AssignModal.jsx`**

```jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, UserCheck, Calendar } from 'lucide-react'
import { useOrders } from '../context/OrderContext'
import { USERS } from '../data/mockData'

const ROLE_COLOR = '#3d7020'
const Q = {
  bg: '#f0f2f4', card: '#ffffff', border: '#e2e8f0',
  text: '#1e293b', muted: '#64748b', faint: '#94a3b8',
  shadow: '0 4px 24px rgba(0,0,0,0.12)',
}

const DEFAULT_QUEUE = {
  received:  'screener',
  screening: 'screener',
  searching: 'delivery',
  examining: 'examiner',
}

const STAGE_LABELS = {
  screener: 'Screener',
  delivery: 'Delivery',
  examiner: 'Examiner',
}

export default function AssignModal({ order, onClose }) {
  const { assignOrder } = useOrders()
  const [queue, setQueue]           = useState(DEFAULT_QUEUE[order.status] || 'screener')
  const [personName, setPersonName] = useState('')

  const usersForQueue = USERS.filter(u => u.role === queue && u.status === 'active')

  function handleConfirm() {
    assignOrder(order.id, { queue, personName: personName || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: Q.card, borderRadius: 14, boxShadow: Q.shadow, width: '100%', maxWidth: 460, padding: 28 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: ROLE_COLOR, marginBottom: 4 }}>Assign Order</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: Q.text }}>{order.id}</div>
            <div style={{ fontSize: 13, color: Q.muted, marginTop: 2 }}>{order.client} · {order.type}</div>
          </div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', color: Q.faint, borderRadius: 6 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* completedDates summary */}
        <div style={{ background: Q.bg, border: `1px solid ${Q.border}`, borderRadius: 10,
          padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: Q.faint, marginBottom: 10, display: 'flex',
            alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 12, height: 12 }} /> Stage Completion Dates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['screener', 'delivery', 'examiner'].map(role => (
              <div key={role} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: Q.faint, textTransform: 'capitalize',
                  marginBottom: 2 }}>{STAGE_LABELS[role]}</div>
                <div style={{ fontSize: 12, fontWeight: 600,
                  color: order.completedDates?.[role] ? '#16a34a' : Q.faint }}>
                  {order.completedDates?.[role] || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage radio */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: Q.faint, marginBottom: 10 }}>
            Assign to Stage
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['screener', 'delivery', 'examiner'].map(role => (
              <button key={role} onClick={() => { setQueue(role); setPersonName('') }}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: queue === role ? `2px solid ${ROLE_COLOR}` : `2px solid ${Q.border}`,
                  background: queue === role ? `${ROLE_COLOR}0f` : Q.bg,
                  color: queue === role ? ROLE_COLOR : Q.muted,
                }}>
                {STAGE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* Person dropdown */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: Q.faint, marginBottom: 8 }}>
            Assign To (optional)
          </label>
          <select value={personName} onChange={e => setPersonName(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', border: `1px solid ${Q.border}`,
              borderRadius: 8, fontSize: 13, color: Q.text, background: Q.bg,
              outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = ROLE_COLOR}
            onBlur={e => e.target.style.borderColor = Q.border}>
            <option value="">Any available</option>
            {usersForQueue.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleConfirm}
            style={{
              flex: 1, padding: '10px 16px', background: ROLE_COLOR, border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseOver={e => e.currentTarget.style.background = '#4d8c2a'}
            onMouseOut={e => e.currentTarget.style.background = ROLE_COLOR}>
            <UserCheck style={{ width: 15, height: 15 }} /> Confirm Assignment
          </button>
          <button onClick={onClose}
            style={{
              padding: '10px 16px', border: `1px solid ${Q.border}`, borderRadius: 8,
              background: 'transparent', color: Q.muted, fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AssignModal.jsx
git commit -m "feat: add AssignModal component with stage radio, person dropdown, completedDates summary"
```

---

## Task 5: Update AdminDashboard

**Files:**
- Modify: `src/pages/admin/AdminDashboard.jsx`

**What changes:**
1. Import `useOrders` and `AssignModal`; remove `ORDERS` and `ACTIVITY` from mockData import (keep `USERS`, `MONTHLY_STATS`)
2. `OrdersPipeline`: add `useOrders()`, Unassigned tab, Unassigned badge in status cell, Assign button opening `AssignModal`
3. `AdminHome`: get `orders` and `activityLog` from `useOrders()` instead of static imports
4. `AdminOrders`: get `orders` from `useOrders()`

- [ ] **Step 1: Update the import block at the top of `src/pages/admin/AdminDashboard.jsx`**

Replace:
```js
import { ORDERS, USERS, ACTIVITY, MONTHLY_STATS } from '../../data/mockData'
```
With:
```js
import { USERS, MONTHLY_STATS } from '../../data/mockData'
import { useOrders } from '../../context/OrderContext'
import AssignModal from '../../components/AssignModal'
```

Also add `UserCheck` to the lucide-react import line:
```js
import {
  LayoutDashboard, ClipboardList, Users, BarChart3, Settings, MapPin,
  Package, CheckCircle, Clock, Search, Plus, Filter, Eye, MoreHorizontal,
  ChevronDown, ChevronUp, FileText, ArrowUpRight, UserCheck,
} from 'lucide-react'
```

- [ ] **Step 2: Replace the `OrdersPipeline` function**

Replace the entire `OrdersPipeline` function (lines 79–260) with:

```jsx
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
```

- [ ] **Step 3: Update `AdminHome` to use context**

Replace the entire `AdminHome` function (the `function AdminHome() { ... }` block) with:

```jsx
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
```

- [ ] **Step 4: Update `AdminOrders` to use context**

Replace:
```jsx
function AdminOrders() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: Q.text }}>Order Management</h1>
        <p className="text-sm" style={{ color: Q.muted }}>All active and completed title search orders</p>
      </div>
      <OrdersPipeline orders={ORDERS} />
    </div>
  )
}
```
With:
```jsx
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
```

- [ ] **Step 5: Verify in browser**

Sign in as admin → `/admin/orders`:
- "Unassigned" tab appears with count 2 (RTS-10044, RTS-10041)
- Rows for RTS-10044 and RTS-10041 show yellow "Unassigned" badge
- "Completed" column shows dates for completed stages
- "Assign" button is highlighted yellow for unassigned orders
- Clicking Assign opens AssignModal with correct pre-selection
- Selecting a stage + person and clicking Confirm → order gets `assignedTo` set, Unassigned badge disappears, Unassigned tab count drops
- Activity feed on `/admin` home shows live entries

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminDashboard.jsx
git commit -m "feat: wire AdminDashboard to OrderContext with Assign button, Unassigned tab, live activity feed"
```

---

## Task 6: Update ScreenerDashboard

**Files:**
- Modify: `src/pages/screener/ScreenerDashboard.jsx`

**What changes:**
1. Remove module-level `myOrders` constant
2. Add `useOrders` import; use `getOrdersForRole('screener')` inside components
3. Add `useAuth` import for `user.name` in `completeStep` call
4. Add "Complete & Submit to Admin" button in `OrderModal`
5. Extract inline route JSX into named components so they can use hooks

- [ ] **Step 1: Replace `src/pages/screener/ScreenerDashboard.jsx` entirely**

```jsx
import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { LayoutDashboard, ClipboardList, CheckCircle, Clock, AlertTriangle, Search, ChevronRight, X, Send } from 'lucide-react'
import { useOrders } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLOR = '#8ab868'
const NAV = [
  { path: '/screener',           label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/screener/queue',     label: 'Screening Queue', icon: ClipboardList, badge: 3 },
  { path: '/screener/completed', label: 'Completed',       icon: CheckCircle },
]

const STATUS_DOT = {
  received:  '#8ab0e8', screening: '#d4b450', searching: '#8ab868',
  examining: '#c4a44e', delivered: '#6dbc78',
}

function OrderModal({ order, onClose }) {
  const { completeStep } = useOrders()
  const { user }         = useAuth()
  const [status, setStatus] = useState(order.status)
  const [notes, setNotes]   = useState('')

  function handleComplete() {
    completeStep(order.id, 'screener', user.name, notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono font-semibold text-sm" style={{ color: ROLE_COLOR }}>{order.id}</div>
            <div className="text-xl font-bold mt-0.5" style={{ color: '#f5ede0' }}>{order.client}</div>
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
          <button className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
            onClick={handleComplete}>
            <Send className="w-4 h-4" /> Complete & Submit to Admin
          </button>
          <button className="btn-secondary text-sm py-2.5 px-4" onClick={onClose}>Hold</button>
        </div>
      </motion.div>
    </div>
  )
}

function ScreenerHome() {
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
          { icon: AlertTriangle, label: 'Awaiting Screening', value: String(myOrders.filter(o=>o.status==='received').length), color: '#d4b450' },
          { icon: Search,        label: 'In Screening',       value: String(myOrders.filter(o=>o.status==='screening').length), color: ROLE_COLOR },
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
          {myOrders.length === 0 && (
            <p style={{ color:'rgba(245,237,224,0.35)', fontSize:13, textAlign:'center', padding:'24px 0' }}>
              No orders assigned to you
            </p>
          )}
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
                <div className="font-medium text-sm mt-0.5 truncate" style={{ color:'#f5ede0' }}>{o.client}</div>
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

function ScreenerQueue() {
  const { getOrdersForRole } = useOrders()
  const myOrders = getOrdersForRole('screener')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Screening Queue</h1>
      <div className="glass-card p-5"><OrdersTable orders={myOrders} /></div>
    </div>
  )
}

function ScreenerCompleted() {
  const { orders } = useOrders()
  const completed = orders.filter(o => o.status === 'delivered')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Completed Screenings</h1>
      <div className="glass-card p-5"><OrdersTable orders={completed} /></div>
    </div>
  )
}

export default function ScreenerDashboard() {
  return (
    <Layout navItems={NAV} role="screener" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<ScreenerHome />} />
        <Route path="queue"     element={<ScreenerQueue />} />
        <Route path="completed" element={<ScreenerCompleted />} />
      </Routes>
    </Layout>
  )
}
```

- [ ] **Step 2: Verify in browser**

Sign in as screener (screener@resolute.com / screener123):
- Dashboard shows RTS-10045 in queue (only order with `assignedTo: 'screener'`)
- Clicking RTS-10045 opens modal with "Complete & Submit to Admin" button
- Clicking complete → order disappears from screener queue
- Sign in as admin → activity feed shows "Sam Carter completed Screening on RTS-10045"
- RTS-10045 appears in admin Unassigned tab

- [ ] **Step 3: Commit**

```bash
git add src/pages/screener/ScreenerDashboard.jsx
git commit -m "feat: wire ScreenerDashboard to OrderContext with Complete & Submit button"
```

---

## Task 7: Update ExaminerDashboard

**Files:**
- Modify: `src/pages/examiner/ExaminerDashboard.jsx`

- [ ] **Step 1: Replace `src/pages/examiner/ExaminerDashboard.jsx` entirely**

```jsx
import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { LayoutDashboard, FileSearch, CheckCircle, Clock, AlertCircle, ChevronRight, X, Send } from 'lucide-react'
import { useOrders } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLOR = '#c4a44e'
const NAV = [
  { path: '/examiner',           label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/examiner/examine',   label: 'To Examine', icon: FileSearch, badge: 2 },
  { path: '/examiner/completed', label: 'Completed',  icon: CheckCircle },
]

function ExamineModal({ order, onClose }) {
  const { completeStep } = useOrders()
  const { user }         = useAuth()
  const [findings, setFindings]         = useState('')
  const [liens, setLiens]               = useState(false)
  const [encumbrances, setEncumbrances] = useState(false)

  function handleComplete() {
    completeStep(order.id, 'examiner', user.name, findings)
    onClose()
  }

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
          <button className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
            onClick={handleComplete}>
            <Send className="w-4 h-4" /> Complete & Submit to Admin
          </button>
          <button className="btn-secondary text-sm py-2.5 px-4" onClick={onClose}>Save Draft</button>
        </div>
      </motion.div>
    </div>
  )
}

function ExaminerHome() {
  const { getOrdersForRole } = useOrders()
  const myOrders = getOrdersForRole('examiner')
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
          { icon:FileSearch,  label:'Awaiting Exam',   value: String(myOrders.length), color:'#8ab0e8' },
          { icon:Clock,       label:'In Progress',     value: String(myOrders.filter(o=>o.status==='examining').length), color:ROLE_COLOR },
          { icon:CheckCircle, label:'Completed Today', value:'4', color:'#6dbc78' },
          { icon:AlertCircle, label:'Issues Found',    value:'1', color:'#e08080' },
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
          {myOrders.length === 0 && (
            <p style={{ color:'rgba(245,237,224,0.35)', fontSize:13, textAlign:'center', padding:'24px 0' }}>
              No orders assigned to you
            </p>
          )}
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

function ExaminerQueue() {
  const { getOrdersForRole } = useOrders()
  const myOrders = getOrdersForRole('examiner')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>To Examine</h1>
      <div className="glass-card p-5"><OrdersTable orders={myOrders} /></div>
    </div>
  )
}

function ExaminerCompleted() {
  const { orders } = useOrders()
  const completed = orders.filter(o => o.status === 'delivered')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Completed</h1>
      <div className="glass-card p-5"><OrdersTable orders={completed} /></div>
    </div>
  )
}

export default function ExaminerDashboard() {
  return (
    <Layout navItems={NAV} role="examiner" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<ExaminerHome />} />
        <Route path="examine"   element={<ExaminerQueue />} />
        <Route path="completed" element={<ExaminerCompleted />} />
      </Routes>
    </Layout>
  )
}
```

- [ ] **Step 2: Verify in browser**

Sign in as examiner (examiner@resolute.com / examiner123):
- Dashboard shows RTS-10043 and RTS-10048 in queue (`assignedTo: 'examiner'`)
- Clicking an order → modal with "Complete & Submit to Admin" button
- Completing → order leaves queue, admin activity feed updated

- [ ] **Step 3: Commit**

```bash
git add src/pages/examiner/ExaminerDashboard.jsx
git commit -m "feat: wire ExaminerDashboard to OrderContext with Complete & Submit button"
```

---

## Task 8: Update DeliveryDashboard

**Files:**
- Modify: `src/pages/delivery/DeliveryDashboard.jsx`

- [ ] **Step 1: Replace `src/pages/delivery/DeliveryDashboard.jsx` entirely**

```jsx
import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import OrdersTable from '../../components/OrdersTable'
import { LayoutDashboard, Truck, Package, CheckCircle, Clock, Download, Send, X, ChevronRight } from 'lucide-react'
import { useOrders } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLOR = '#c4783e'
const NAV = [
  { path: '/delivery',         label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/delivery/queue',   label: 'Ready to Send',icon: Package, badge: 2 },
  { path: '/delivery/sent',    label: 'Delivered',    icon: CheckCircle },
]

function DeliveryModal({ order, onClose }) {
  const { completeStep } = useOrders()
  const { user }         = useAuth()
  const [method, setMethod]       = useState('email')
  const [recipient, setRecipient] = useState('')
  const [note, setNote]           = useState('')

  function handleComplete() {
    completeStep(order.id, 'delivery', user.name, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="glass-card p-6 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono font-semibold text-sm" style={{ color:ROLE_COLOR }}>{order.id}</div>
            <div className="text-xl font-bold" style={{ color:'#f5ede0' }}>{order.client}</div>
          </div>
          <button onClick={onClose} style={{ color:'rgba(245,237,224,0.30)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
          style={{ background:'rgba(109,188,120,0.12)', border:'1px solid rgba(109,188,120,0.25)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:'rgba(109,188,120,0.20)' }}>
            <CheckCircle className="w-5 h-5" style={{ color:'#6dbc78' }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color:'#f5ede0' }}>Report Ready for Delivery</div>
            <div className="text-xs" style={{ color:'rgba(245,237,224,0.42)' }}>{order.type} · {order.state}, {order.county} County</div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color:'rgba(245,237,224,0.38)' }}>Delivery Method</label>
          <div className="grid grid-cols-3 gap-2">
            {[['email','Email'],['portal','Portal'],['api','API Push']].map(([k,l]) => (
              <button key={k} onClick={() => setMethod(k)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={method===k
                  ? { background:`${ROLE_COLOR}22`, border:`1px solid ${ROLE_COLOR}55`, color:'#f5ede0' }
                  : { border:'1px solid rgba(245,240,224,0.08)', color:'rgba(245,237,224,0.40)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color:'rgba(245,237,224,0.38)' }}>Recipient Email</label>
          <input value={recipient} onChange={e=>setRecipient(e.target.value)}
            placeholder="client@company.com" className="input-field text-sm" />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color:'rgba(245,237,224,0.38)' }}>Delivery Note</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Notes for the client…" rows={3} className="input-field text-sm resize-none" />
        </div>
        <div className="flex gap-3">
          <button className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
            onClick={handleComplete}>
            <Send className="w-4 h-4" /> Complete & Submit to Admin
          </button>
          <button className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2" onClick={onClose}>
            <Download className="w-4 h-4" /> Preview
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DeliveryHome() {
  const { getOrdersForRole, orders } = useOrders()
  const readyOrders     = getOrdersForRole('delivery')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const [selected, setSelected] = useState(null)
  return (
    <div className="space-y-6">
      {selected && <DeliveryModal order={selected} onClose={() => setSelected(null)} />}
      <div>
        <h1 className="text-2xl font-bold" style={{ color:'#f5ede0' }}>Delivery Dashboard</h1>
        <p className="text-sm" style={{ color:'rgba(245,237,224,0.45)' }}>Manage and deliver completed title search reports</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon:Package,     label:'Ready to Deliver', value: String(readyOrders.length),     color:ROLE_COLOR },
          { icon:Truck,       label:'Sent Today',       value:'3',                              color:'#8ab868' },
          { icon:CheckCircle, label:'Delivered (MTD)',  value: String(deliveredOrders.length),  color:'#6dbc78' },
          { icon:Clock,       label:'Avg Delivery',     value:'22m',                            color:'#c4a44e' },
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
        <h2 className="font-semibold mb-4" style={{ color:'#f5ede0' }}>Ready to Deliver</h2>
        <div className="space-y-3">
          {readyOrders.length === 0 && (
            <p style={{ color:'rgba(245,237,224,0.35)', fontSize:13, textAlign:'center', padding:'24px 0' }}>
              No orders assigned to you
            </p>
          )}
          {readyOrders.map((o,i) => (
            <motion.div key={o.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:i*0.07 }}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{ background:'rgba(245,240,224,0.03)', border:'1px solid rgba(138,194,104,0.08)' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='rgba(196,120,62,0.30)'}
              onMouseOut={e=>e.currentTarget.style.borderColor='rgba(138,194,104,0.08)'}
              onClick={() => setSelected(o)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${ROLE_COLOR}22` }}>
                <Package className="w-5 h-5" style={{ color:ROLE_COLOR }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm" style={{ color:ROLE_COLOR }}>{o.id}</span>
                  {o.priority==='rush' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background:'rgba(220,80,60,0.18)', color:'#e08080' }}>RUSH</span>
                  )}
                </div>
                <div className="font-medium text-sm mt-0.5 truncate" style={{ color:'#f5ede0' }}>{o.client}</div>
                <div className="text-xs" style={{ color:'rgba(245,237,224,0.42)' }}>{o.type} · {o.state}</div>
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
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-4" style={{ color:'#f5ede0' }}>Recently Delivered</h2>
        <div className="space-y-2">
          {deliveredOrders.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              onMouseOver={e=>e.currentTarget.style.background='rgba(245,240,224,0.03)'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color:'#6dbc78' }} />
              <span className="font-mono text-xs flex-shrink-0" style={{ color:'rgba(245,237,224,0.55)' }}>{o.id}</span>
              <span className="text-xs flex-1 truncate" style={{ color:'rgba(245,237,224,0.45)' }}>{o.client}</span>
              <span className="text-xs flex-shrink-0" style={{ color:'rgba(245,237,224,0.28)' }}>{o.eta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeliveryQueue() {
  const { getOrdersForRole } = useOrders()
  const readyOrders = getOrdersForRole('delivery')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Ready to Send</h1>
      <div className="glass-card p-5"><OrdersTable orders={readyOrders} /></div>
    </div>
  )
}

function DeliverySent() {
  const { orders } = useOrders()
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'#f5ede0'}}>Delivered Orders</h1>
      <div className="glass-card p-5"><OrdersTable orders={deliveredOrders} /></div>
    </div>
  )
}

export default function DeliveryDashboard() {
  return (
    <Layout navItems={NAV} role="delivery" roleColor={ROLE_COLOR}>
      <Routes>
        <Route index element={<DeliveryHome />} />
        <Route path="queue" element={<DeliveryQueue />} />
        <Route path="sent"  element={<DeliverySent />} />
      </Routes>
    </Layout>
  )
}
```

- [ ] **Step 2: Verify in browser**

Sign in as delivery (delivery@resolute.com / delivery123):
- Dashboard shows RTS-10047 in "Ready to Deliver" (`assignedTo: 'delivery'`)
- Clicking RTS-10047 → modal with "Complete & Submit to Admin" button
- Completing → order leaves queue; status → `examining`; admin activity feed updated; order in admin Unassigned tab

- [ ] **Step 3: Final end-to-end test**

Run the full workflow:
1. Sign in as admin → assign RTS-10044 (received) to Screener / Sam Carter → Unassigned count drops
2. Sign in as screener → see RTS-10044 in queue → complete it → it disappears
3. Sign in as admin → activity feed shows "Sam Carter completed Screening on RTS-10044"; RTS-10044 in Unassigned tab with status `searching`
4. Admin assigns RTS-10044 to Delivery
5. Sign in as delivery → see RTS-10044 → complete it
6. Sign in as admin → activity feed updated; RTS-10044 now in Unassigned with status `examining`
7. Admin assigns to Examiner → examiner completes → status `delivered`

- [ ] **Step 4: Commit**

```bash
git add src/pages/delivery/DeliveryDashboard.jsx
git commit -m "feat: wire DeliveryDashboard to OrderContext with Complete & Submit button"
```
