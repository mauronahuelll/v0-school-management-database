"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type Role = "ADMIN" | "DOCENTE" | "PRECEPTOR" | "FAMILIA" | null

export interface School {
  id: string
  name: string
  shortName: string
  region: string
}

interface AuthContextType {
  role: Role
  userName: string
  schoolId: string | null
  schoolName: string | null
  login: (role: Role, schoolId?: string) => void
  logout: () => void
  setSchool: (schoolId: string) => void
  clearSchool: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data per role
const MOCK_USERS: Record<NonNullable<Role>, { name: string; department: string }> = {
  ADMIN: { name: "Director Martinez", department: "Administracion" },
  DOCENTE: { name: "Prof. Rodriguez", department: "Ciencias Exactas" },
  PRECEPTOR: { name: "Lic. Fernandez", department: "Preceptoria 6to" },
  FAMILIA: { name: "Elena Martinez", department: "Tutor de Lucia M." },
}

// Mock schools for multi-tenant
export const MOCK_SCHOOLS: School[] = [
  { id: "inst-1", name: "Instituto Padre Marquez", shortName: "Padre Marquez", region: "Berazategui" },
  { id: "inst-2", name: "Colegio Secundario San Martin", shortName: "San Martin", region: "Quilmes" },
  { id: "inst-3", name: "Escuela Tecnica N3", shortName: "Tecnica N3", region: "Bosques Norte" },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [userName, setUserName] = useState<string>("")
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Protect routes: redirect to login if no role and not on login page
  useEffect(() => {
    if (!role && pathname !== "/") {
      router.push("/")
    }
  }, [role, pathname, router])

  const login = (selectedRole: Role, selectedSchoolId?: string) => {
    if (selectedRole) {
      setRole(selectedRole)
      setUserName(MOCK_USERS[selectedRole].name)
      
      if (selectedSchoolId) {
        const school = MOCK_SCHOOLS.find(s => s.id === selectedSchoolId)
        setSchoolId(selectedSchoolId)
        setSchoolName(school?.shortName || null)
        router.push("/dashboard")
      } else if (selectedRole !== "ADMIN") {
        // Non-admin roles get auto-assigned to first school
        setSchoolId("inst-1")
        setSchoolName(MOCK_SCHOOLS[0].shortName)
        router.push("/dashboard")
      }
      // For ADMIN without schoolId, stay on login page for school selection
    }
  }

  const setSchool = (id: string) => {
    const school = MOCK_SCHOOLS.find(s => s.id === id)
    if (school) {
      setSchoolId(id)
      setSchoolName(school.shortName)
      router.push("/dashboard")
    }
  }

  const clearSchool = () => {
    setSchoolId(null)
    setSchoolName(null)
  }

  const logout = () => {
    setRole(null)
    setUserName("")
    setSchoolId(null)
    setSchoolName(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ 
      role, 
      userName, 
      schoolId, 
      schoolName, 
      login, 
      logout, 
      setSchool, 
      clearSchool 
    }}>
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
