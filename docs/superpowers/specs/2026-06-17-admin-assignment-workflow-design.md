# Admin Assignment Workflow Design

**Date:** 2026-06-17
**Status:** Approved

## Overview

Implement a job assignment workflow where the Admin assigns orders to role queues (with optional person-level pinning), and each role reports back to Admin upon completion by auto-advancing the order status and logging to a shared activity feed.

---

## 1. Data Layer & Context

### New file: `src/context/OrderContext.jsx`

Replaces direct imports of `ORDERS` and `ACTIVITY` from `mockData.js` across all dashboards.

**State:**
- `orders` — live array, seeded from `ORDERS` in mockData
- `activityLog` — live array, seeded from `ACTIVITY` in mockData

**Actions:**
- `assignOrder(orderId, { queue, personName? })` — sets `assignedTo` to the target queue (`'screener' | 'examiner' | 'delivery'`), optionally sets the role-specific assignee field (`screener`, `examiner`, or `delivery` name). If the order status is `null` or `received`, leaves status as `received`.
- `completeStep(orderId, role, notes?)` — auto-advances order status one step, resets `assignedTo` to `null`, appends a timestamped activity log entry.
- `getOrdersForRole(role)` — returns orders where `assignedTo === role`. Used by all non-admin dashboards.

**Status pipeline (unchanged):**
```
received → screening → searching → examining → delivered
```

**Step advancement map:**
| Role completes | Status before | Status after |
|---|---|---|
| Screener | screening | searching |
| Examiner | examining | delivered |
| Delivery | searching | examining |

> Note: Delivery advances `searching → examining` and Examiner advances `examining → delivered`, matching the existing pipeline order.

### Order object changes

Two new fields added to each order:
```js
assignedTo: 'screener' | 'examiner' | 'delivery' | null,
completedDates: {
  screener:  'YYYY-MM-DD' | null,
  examiner:  'YYYY-MM-DD' | null,
  delivery:  'YYYY-MM-DD' | null,
}
```

**`assignedTo`:**
- `null` = unassigned (newly received or between stages)
- Set by Admin via `assignOrder()`
- Reset to `null` by `completeStep()`

**`completedDates`:**
- Each key records the ISO date when that role called `completeStep()`
- Written once — not overwritten on re-assignment
- Seeded as `{ screener: null, examiner: null, delivery: null }` for all existing orders in mockData
- Surfaced in the Admin Orders table as a "Completed" column (shows the most recent non-null date) and in full per-stage detail inside the AssignModal

Existing fields (`screener`, `examiner`, `delivery`) retain their person-name meaning and are updated by `assignOrder()` when a person is pinned.

---

## 2. Admin Assignment UI

### Location: Admin Orders page (`/admin/orders`)

**Orders table changes:**
- Each row gets an **"Assign" button** in the Actions column (replaces placeholder)
- Orders with `assignedTo: null` show a yellow **"Unassigned"** badge alongside/instead of the status badge
- A new **"Unassigned" tab** added to the existing tab bar (All / In Progress / Rush / Delivered / **Unassigned**)

**`AssignModal` component (`src/components/AssignModal.jsx`):**

Fields:
1. **Stage** (required) — radio group: Screener / Examiner / Delivery. Pre-selected based on current order status:
   - `received` → Screener pre-selected
   - `searching` → Examiner pre-selected
   - `examining` → Delivery pre-selected
   - other → no pre-selection
2. **Person** (optional) — dropdown of `USERS` filtered by selected role. First option is "Any available" (no pin). Defaults to "Any available".
3. **Confirm** button — calls `assignOrder(orderId, { queue, personName })`, closes modal.

Admin can re-assign an already-assigned order at any time by clicking "Assign" again.

---

## 3. Role Completion & Reporting Back

### Role modal changes

Each role's existing action modal gets a **"Complete & Submit to Admin"** button:

| Role | Existing modal | Button added to |
|---|---|---|
| Screener | `OrderModal` | Bottom action area |
| Examiner | `ExamineModal` | Bottom action area |
| Delivery | `DeliveryModal` | Bottom action area (alongside existing Deliver button) |

Clicking the button calls `completeStep(orderId, role, notes)`.

### `completeStep` behavior

1. Advances order status one step per the pipeline map above
2. Sets `assignedTo: null` — order drops out of the role's queue immediately
3. Stamps `completedDates[role]` with today's ISO date (e.g. `completedDates.screener = '2026-06-17'`)
4. Appends to `activityLog`:
   ```js
   {
     id: Date.now(),
     action: `${userName} completed ${stage} on ${orderId}`,
     time: 'Just now',
     type: 'progress'
   }
   ```
5. No navigation — modal closes, role's queue re-renders without the completed order

### Admin visibility (no new UI required)

- **Activity feed** on Admin home reads from `activityLog` in context — completions appear in real time
- **Orders table** status badge updates immediately (same context)
- **Unassigned tab** surfaces the order again for admin to assign the next stage

### Role queue visibility

Each role dashboard's queue filter changes from:
```js
// Before: static import
ORDERS.filter(o => ['received', 'screening'].includes(o.status))

// After: context-driven
getOrdersForRole('screener')  // returns orders where assignedTo === 'screener'
```

This means roles only see orders explicitly assigned to them — not all orders in their status range.

---

## 4. Files Changed

| File | Change |
|---|---|
| `src/context/OrderContext.jsx` | **New** — shared order + activity state |
| `src/context/AuthContext.jsx` | Wrap with OrderContext provider |
| `src/data/mockData.js` | Add `assignedTo` and `completedDates` fields to each order seed |
| `src/App.jsx` | Wrap routes with `OrderProvider` |
| `src/components/AssignModal.jsx` | **New** — assignment modal |
| `src/pages/admin/AdminDashboard.jsx` | Assign button, Unassigned tab, context reads |
| `src/pages/screener/ScreenerDashboard.jsx` | Complete button, context reads |
| `src/pages/examiner/ExaminerDashboard.jsx` | Complete button, context reads |
| `src/pages/delivery/DeliveryDashboard.jsx` | Complete button, context reads |
| `src/components/OrdersTable.jsx` | Unassigned badge, assign button column |

---

## 5. Out of Scope

- Backend persistence (all state is in-memory React context)
- Email/push notifications (activity feed is the notification surface)
- Multi-person assignment or load balancing
- Admin approval gate between stages (auto-advance only)
- Client dashboard changes (clients track by order ID, not assignment queue)
