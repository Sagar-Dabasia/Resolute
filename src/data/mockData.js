// Pipeline stages (typing inserted before delivery)
export const STAGE_KEYS   = ['received','screening','searching','examining','typing','delivered']
export const STAGE_LABELS = ['Received','Screening','Searching','Examining','Typing','Delivered']

export const PAYMENT_METHODS = ['Wire', 'Check', 'Credit Card', 'ACH', 'Invoice (Net-30)']

export const ORDERS = [
  { id: 'RTS-10041', client: 'Lakewood Title Group',    state: 'FL', county: 'Miami-Dade',  type: 'Full Search',     status: 'searching',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'rush',   payment: 'Wire',             clarification: null,        created: '2026-06-09', eta: '2026-06-11', completed: null,         progress: 65 },
  { id: 'RTS-10042', client: 'Apex Lending Partners',   state: 'TX', county: 'Harris',      type: 'Current Owner',   status: 'delivered',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'normal', payment: 'ACH',              clarification: null,        created: '2026-06-08', eta: '2026-06-10', completed: '2026-06-10', progress: 100 },
  { id: 'RTS-10043', client: 'Sterling Law Firm',       state: 'CA', county: 'Los Angeles', type: 'Two-Owner',       status: 'examining',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'normal', payment: 'Credit Card',      clarification: 'responded', created: '2026-06-09', eta: '2026-06-12', completed: null,         progress: 45 },
  { id: 'RTS-10044', client: 'Pinnacle Real Estate',    state: 'NY', county: 'Kings',       type: 'Lien Search',     status: 'received',   screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'rush',   payment: 'Invoice (Net-30)', clarification: 'pending',   created: '2026-06-10', eta: '2026-06-11', completed: null,         progress: 10 },
  { id: 'RTS-10045', client: 'BlueStar Title Agency',   state: 'GA', county: 'Fulton',      type: 'Full Search',     status: 'screening',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'normal', payment: 'Check',            clarification: 'responded', created: '2026-06-10', eta: '2026-06-13', completed: null,         progress: 25 },
  { id: 'RTS-10046', client: 'Meridian Mortgage LLC',   state: 'OH', county: 'Cuyahoga',    type: 'Tax Certificate', status: 'delivered',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'normal', payment: 'Wire',             clarification: null,        created: '2026-06-07', eta: '2026-06-09', completed: '2026-06-09', progress: 100 },
  { id: 'RTS-10047', client: 'Coastal Title Services',  state: 'NC', county: 'Mecklenburg', type: 'HOA Estoppel',    status: 'searching',  screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'rush',   payment: 'ACH',              clarification: null,        created: '2026-06-09', eta: '2026-06-11', completed: null,         progress: 55 },
  { id: 'RTS-10048', client: 'Lakewood Title Group',    state: 'AZ', county: 'Maricopa',    type: 'Current Owner',   status: 'typing',     screener: 'Sam Carter',   examiner: 'Jordan Lee',  typer: 'Priya Nair', delivery: 'Morgan Davis', priority: 'normal', payment: 'Wire',             clarification: null,        created: '2026-06-08', eta: '2026-06-12', completed: null,         progress: 85 },
]

// Client registry — codes assigned in registration order, stable per client.
// Non-super-admins see the code; only super admins (Rajni, Saravanan) see the name + contact.
export const CLIENTS = [
  { code: 'CL01', name: 'Lakewood Title Group',   contact: 'Dana Whitfield', email: 'dana@lakewoodtitle.com',  phone: '(305) 555-0142', registered: '2025-01-20', activity: 'high',   orders: 14, payment: 'Wire'             },
  { code: 'CL02', name: 'Apex Lending Partners',  contact: 'Casey Wilson',   email: 'casey@apexlending.com',   phone: '(713) 555-0188', registered: '2025-02-04', activity: 'high',   orders: 9,  payment: 'ACH'              },
  { code: 'CL03', name: 'Sterling Law Firm',      contact: 'Riley Stone',    email: 'riley@sterlinglaw.com',   phone: '(213) 555-0119', registered: '2025-02-26', activity: 'medium', orders: 6,  payment: 'Credit Card'      },
  { code: 'CL04', name: 'Pinnacle Real Estate',   contact: 'Morgan Pratt',   email: 'morgan@pinnaclere.com',   phone: '(718) 555-0173', registered: '2025-03-12', activity: 'medium', orders: 5,  payment: 'Invoice (Net-30)' },
  { code: 'CL05', name: 'BlueStar Title Agency',  contact: 'Jamie Fox',      email: 'jamie@bluestartitle.com', phone: '(404) 555-0150', registered: '2025-04-01', activity: 'low',    orders: 3,  payment: 'Check'            },
  { code: 'CL06', name: 'Meridian Mortgage LLC',  contact: 'Avery Banks',    email: 'avery@meridianmtg.com',   phone: '(216) 555-0137', registered: '2025-04-22', activity: 'low',    orders: 2,  payment: 'Wire'             },
  { code: 'CL07', name: 'Coastal Title Services', contact: 'Quinn Rivera',   email: 'quinn@coastaltitle.com',  phone: '(704) 555-0164', registered: '2025-05-15', activity: 'low',    orders: 2,  payment: 'ACH'              },
]

const CODE_BY_NAME   = Object.fromEntries(CLIENTS.map(c => [c.name, c.code]))
export const clientCode   = (name) => CODE_BY_NAME[name] || name
export const clientByName = (name) => CLIENTS.find(c => c.name === name) || null
// Returns the real client name for super admins, otherwise the stable client code.
export const displayClient = (name, user) => (user && user.superAdmin) ? name : (CODE_BY_NAME[name] || name)

export const STATE_ORDERS = {
  AL:2, AK:1, AZ:14, AR:3, CA:28, CO:9, CT:5, DE:2, FL:31, GA:18,
  HI:2, ID:4, IL:16, IN:8, IA:5, KS:4, KY:6, LA:7, ME:3, MD:11,
  MA:12, MI:14, MN:9, MS:4, MO:10, MT:2, NE:4, NV:8, NH:3, NJ:15,
  NM:3, NY:24, NC:17, ND:1, OH:19, OK:6, OR:8, PA:20, RI:2, SC:9,
  SD:1, TN:11, TX:35, UT:7, VT:1, VA:16, WA:13, WV:3, WI:8, WY:1,
}

export const USERS = [
  { id: 1, name: 'Sam Carter',     email: 'screener@resolute.com',   role: 'screener', status: 'active',   orders: 47, joined: '2025-01-15' },
  { id: 2, name: 'Jordan Lee',     email: 'examiner@resolute.com',   role: 'examiner', status: 'active',   orders: 63, joined: '2025-02-20' },
  { id: 3, name: 'Priya Nair',     email: 'typer@resolute.com',      role: 'typer',    status: 'active',   orders: 41, joined: '2025-02-10' },
  { id: 4, name: 'Morgan Davis',   email: 'delivery@resolute.com',   role: 'delivery', status: 'active',   orders: 58, joined: '2025-01-08' },
  { id: 5, name: 'Taylor Brooks',  email: 'client@resolute.com',     role: 'client',   status: 'active',   orders: 12, joined: '2025-03-10' },
  { id: 6, name: 'Casey Wilson',   email: 'casey@apexlending.com',   role: 'client',   status: 'active',   orders: 8,  joined: '2025-04-01' },
  { id: 7, name: 'Riley Stone',    email: 'riley@sterlinglaw.com',   role: 'client',   status: 'inactive', orders: 3,  joined: '2025-05-12' },
  { id: 8, name: 'Rajni',          email: 'rajni@resolute.com',      role: 'admin',    status: 'active',   orders: 0,  joined: '2024-12-01', superAdmin: true },
  { id: 9, name: 'Saravanan',      email: 'saravanan@resolute.com',  role: 'admin',    status: 'active',   orders: 0,  joined: '2024-12-01', superAdmin: true },
]

export const ACTIVITY = [
  { time: '10:42 AM', action: 'Order RTS-10044 received from Pinnacle Real Estate', type: 'new' },
  { time: '10:28 AM', action: 'RTS-10042 delivered to Apex Lending Partners', type: 'delivered' },
  { time: '10:15 AM', action: 'RTS-10047 search in progress – 55% complete', type: 'progress' },
  { time: '09:55 AM', action: 'RTS-10048 moved to Typing stage', type: 'status' },
  { time: '09:30 AM', action: 'New client registered: Riley Stone (Sterling Law)', type: 'user' },
  { time: '09:12 AM', action: 'RTS-10048 examination started by Jordan Lee', type: 'status' },
]

export const MONTHLY_STATS = [
  { month: 'Jan', orders: 142, delivered: 138 },
  { month: 'Feb', orders: 168, delivered: 161 },
  { month: 'Mar', orders: 195, delivered: 188 },
  { month: 'Apr', orders: 221, delivered: 215 },
  { month: 'May', orders: 248, delivered: 241 },
  { month: 'Jun', orders: 87,  delivered: 79  },
]

export const STATUS_COLORS = {
  received:  { bg: 'bg-blue-500/20',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
  screening: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  searching: { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
  examining: { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
  typing:    { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',   dot: 'bg-cyan-400'   },
  delivered: { bg: 'bg-green-500/20',  text: 'text-green-300',  dot: 'bg-green-400'  },
  onhold:    { bg: 'bg-red-500/20',    text: 'text-red-300',    dot: 'bg-red-400'    },
}
