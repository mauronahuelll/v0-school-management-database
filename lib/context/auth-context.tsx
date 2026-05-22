"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type Role = "ADMIN" | "DOCENTE" | "PRECEPTOR" | "FAMILIA" | null

interface AuthContextType {
  role: Role
  userName: string
  login: (role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data per role for demo purposes
const MOCK_USERS: Record<NonNullable<Role>, { name: string; department: string }> = {
  ADMIN: { name: "Director Martinez", department: "Administracion" },
  DOCENTE: { name: "Prof. Rodriguez", department: "Ciencias Exactas" },
  PRECEPTOR: { name: "Lic. Fernandez", department: "Preceptoria 6to" },
  FAMILIA: { name: "Elena Martinez", department: "Tutor de Lucia M." },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [userName, setUserName] = useState<string>("")
  const router = useRouter()
  const pathname = usePathname()

  // Protect routes: redirect to login if no role and not on login page
  useEffect(() => {
    if (!role && pathname !== "/") {
      router.push("/")
    }
  }, [role, pathname, router])

  const login = (selectedRole: Role) => {
    if (selectedRole) {
      setRole(selectedRole)
      setUserName(MOCK_USERS[selectedRole].name)
      router.push("/dashboard")
    }
  }

  const logout = () => {
    setRole(null)
    setUserName("")
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ role, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
