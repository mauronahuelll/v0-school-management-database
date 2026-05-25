"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

// ============================================================================
// TYPES
// ============================================================================

export type Role = "ADMIN" | "DOCENTE" | "PRECEPTOR" | "FAMILIA"
export type EducationLevel = "INICIAL" | "PRIMARIO" | "SECUNDARIO" | "TERCIARIO"

export interface School {
  id: string
  name: string
  shortName: string
  region: string
}

export interface UserContextProfile {
  id: string
  schoolId: string
  schoolName: string
  level: EducationLevel
  role: Role
  description?: string // e.g., "Docente de Matematica" or "Padre de Lucia"
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

interface AuthContextType {
  // User data
  user: User | null
  
  // Multi-context support
  availableContexts: UserContextProfile[]
  activeContext: UserContextProfile | null
  
  // Legacy support (derived from activeContext)
  role: Role | null
  userName: string
  schoolId: string | null
  schoolName: string | null
  
  // Actions
  login: (email: string) => void
  logout: () => void
  switchContext: (contextId: string) => void
  
  // Legacy actions (for backwards compatibility)
  setSchool: (schoolId: string) => void
  clearSchool: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock schools for multi-tenant
export const MOCK_SCHOOLS: School[] = [
  { id: "inst-1", name: "Instituto Padre Marquez", shortName: "Padre Marquez", region: "Berazategui" },
  { id: "inst-2", name: "Colegio Secundario San Martin", shortName: "San Martin", region: "Quilmes" },
  { id: "inst-3", name: "Escuela Tecnica N3", shortName: "Tecnica N3", region: "Bosques Norte" },
]

// Mock user with multiple context profiles (same email, different roles/levels)
const MOCK_USER: User = {
  id: "user-001",
  email: "elena.martinez@example.com",
  name: "Elena Martinez",
}

// Mock contexts - same user with different "hats"
const MOCK_CONTEXTS: UserContextProfile[] = [
  {
    id: "ctx-admin-1",
    schoolId: "inst-1",
    schoolName: "Padre Marquez",
    level: "SECUNDARIO",
    role: "ADMIN",
    description: "Directora General",
  },
  {
    id: "ctx-docente-1",
    schoolId: "inst-1",
    schoolName: "Padre Marquez",
    level: "SECUNDARIO",
    role: "DOCENTE",
    description: "Docente de Matematica - 4to y 5to Ano",
  },
  {
    id: "ctx-familia-1",
    schoolId: "inst-2",
    schoolName: "San Martin",
    level: "INICIAL",
    role: "FAMILIA",
    description: "Madre de Lucia Martinez (Sala de 5)",
  },
  {
    id: "ctx-preceptor-1",
    schoolId: "inst-3",
    schoolName: "Tecnica N3",
    level: "SECUNDARIO",
    role: "PRECEPTOR",
    description: "Preceptor Turno Manana",
  },
]

// Alternative mock for quick role-based login (dev console)
const DEV_ROLE_CONTEXTS: Record<Role, UserContextProfile> = {
  ADMIN: MOCK_CONTEXTS[0],
  DOCENTE: MOCK_CONTEXTS[1],
  FAMILIA: MOCK_CONTEXTS[2],
  PRECEPTOR: MOCK_CONTEXTS[3],
}

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [availableContexts, setAvailableContexts] = useState<UserContextProfile[]>([])
  const [activeContext, setActiveContext] = useState<UserContextProfile | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()

  // Derived values for backwards compatibility
  const role = activeContext?.role ?? null
  const userName = user?.name ?? ""
  const schoolId = activeContext?.schoolId ?? null
  const schoolName = activeContext?.schoolName ?? null

  // Protect routes: redirect to login if no user and not on login page
  useEffect(() => {
    if (!user && pathname !== "/") {
      router.push("/")
    }
  }, [user, pathname, router])

  // Login: Load user and their available contexts
  const login = useCallback((email: string) => {
    // In production, this would validate credentials and fetch user + contexts from API
    setUser(MOCK_USER)
    setAvailableContexts(MOCK_CONTEXTS)
    setActiveContext(null) // User must select a context
    
    // Don't auto-redirect - let user select context on login page
  }, [])

  // Quick login for dev console (selects role directly)
  const quickLogin = useCallback((selectedRole: Role, selectedSchoolId?: string) => {
    setUser(MOCK_USER)
    setAvailableContexts(MOCK_CONTEXTS)
    
    // Find matching context or use default for role
    let context = DEV_ROLE_CONTEXTS[selectedRole]
    
    if (selectedSchoolId) {
      const matchingContext = MOCK_CONTEXTS.find(
        c => c.role === selectedRole && c.schoolId === selectedSchoolId
      )
      if (matchingContext) {
        context = matchingContext
      }
    }
    
    setActiveContext(context)
    router.push("/dashboard")
  }, [router])

  // Switch context (change "hat")
  const switchContext = useCallback((contextId: string) => {
    const newContext = availableContexts.find(c => c.id === contextId)
    if (newContext) {
      setActiveContext(newContext)
      router.push("/dashboard")
    }
  }, [availableContexts, router])

  // Legacy: setSchool - for backwards compatibility, creates/switches to admin context
  const setSchool = useCallback((id: string) => {
    const school = MOCK_SCHOOLS.find(s => s.id === id)
    if (school && user) {
      // Find existing admin context for this school or create virtual one
      const existingContext = availableContexts.find(
        c => c.schoolId === id && c.role === "ADMIN"
      )
      
      if (existingContext) {
        setActiveContext(existingContext)
      } else {
        // Create a temporary admin context for this school
        const newContext: UserContextProfile = {
          id: `ctx-admin-${id}`,
          schoolId: id,
          schoolName: school.shortName,
          level: "SECUNDARIO",
          role: "ADMIN",
          description: "Administrador",
        }
        setAvailableContexts(prev => [...prev, newContext])
        setActiveContext(newContext)
      }
      router.push("/dashboard")
    }
  }, [user, availableContexts, router])

  // Legacy: clearSchool - clears active context
  const clearSchool = useCallback(() => {
    setActiveContext(null)
  }, [])

  // Logout: Clear everything
  const logout = useCallback(() => {
    setUser(null)
    setAvailableContexts([])
    setActiveContext(null)
    router.push("/")
  }, [router])

  return (
    <AuthContext.Provider value={{ 
      // User data
      user,
      
      // Multi-context
      availableContexts,
      activeContext,
      
      // Legacy support
      role,
      userName,
      schoolId,
      schoolName,
      
      // Actions
      login,
      logout,
      switchContext,
      
      // Legacy actions
      setSchool,
      clearSchool,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}

// Helper hook to get role-specific data
export const useActiveRole = () => {
  const { activeContext } = useAuth()
  return {
    role: activeContext?.role ?? null,
    level: activeContext?.level ?? null,
    schoolId: activeContext?.schoolId ?? null,
    schoolName: activeContext?.schoolName ?? null,
    description: activeContext?.description ?? null,
    isAuthenticated: activeContext !== null,
  }
}
