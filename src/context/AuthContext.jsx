import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const MOCK_USERS = {
  'admin@resolute.com':     { password: 'admin123',     role: 'admin',    name: 'Alex Morrison',   avatar: 'AM' },
  'screener@resolute.com':  { password: 'screener123',  role: 'screener', name: 'Sam Carter',      avatar: 'SC' },
  'examiner@resolute.com':  { password: 'examiner123',  role: 'examiner', name: 'Jordan Lee',      avatar: 'JL' },
  'delivery@resolute.com':  { password: 'delivery123',  role: 'delivery', name: 'Morgan Davis',    avatar: 'MD' },
  'client@resolute.com':    { password: 'client123',    role: 'client',   name: 'Taylor Brooks',   avatar: 'TB' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const found = MOCK_USERS[email.toLowerCase()]
    if (found && found.password === password) {
      const u = { email: email.toLowerCase(), role: found.role, name: found.name, avatar: found.avatar }
      setUser(u)
      return { success: true, role: found.role }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
