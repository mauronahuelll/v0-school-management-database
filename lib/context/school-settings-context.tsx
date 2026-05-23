"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"

// ============================================
// TYPES
// ============================================

export type GradingScaleType = "NUMERIC" | "ALPHABETIC" | "CONCEPTUAL"

export interface GradingScale {
  type: GradingScaleType
  minPassing: number
  maxGrade: number
  // For alphabetic/conceptual scales
  values?: string[]
  // Labels for each value (optional)
  labels?: Record<string, string>
}

export interface RolePermission {
  roleId: string
  roleName: string
  canViewGrades: boolean
  canEditGrades: boolean
  canPublishGrades: boolean
  canViewAttendance: boolean
  canEditAttendance: boolean
  canViewBehavior: boolean
  canEditBehavior: boolean
  canManageUsers: boolean
  canAccessAdmin: boolean
}

export interface SchoolSettings {
  // Basic info
  schoolId: string
  schoolName: string
  
  // Grading configuration
  gradingScale: GradingScale
  
  // Academic configuration
  academicYear: number
  currentPeriod: string
  periodsPerYear: number
  
  // Role permissions
  rolePermissions: RolePermission[]
}

interface SchoolSettingsContextType {
  settings: SchoolSettings
  updateGradingScale: (scale: GradingScale) => void
  updateAcademicYear: (year: number) => void
  updateCurrentPeriod: (period: string) => void
  updateRolePermission: (roleId: string, permissions: Partial<RolePermission>) => void
  resetToDefaults: () => void
  isLoading: boolean
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_NUMERIC_SCALE: GradingScale = {
  type: "NUMERIC",
  minPassing: 7,
  maxGrade: 10,
}

const DEFAULT_ALPHABETIC_SCALE: GradingScale = {
  type: "ALPHABETIC",
  minPassing: 3, // Index of "C" in values array (A=0, B=1, C=2, D=3, F=4)
  maxGrade: 5,
  values: ["A", "B", "C", "D", "F"],
  labels: {
    "A": "Excelente (10-9)",
    "B": "Muy Bueno (8-7)",
    "C": "Bueno (6-5)",
    "D": "Regular (4-3)",
    "F": "Insuficiente (2-1)",
  },
}

const DEFAULT_CONCEPTUAL_SCALE: GradingScale = {
  type: "CONCEPTUAL",
  minPassing: 1, // Index - TEP is passing
  maxGrade: 3,
  values: ["TEA", "TEP", "TED"],
  labels: {
    "TEA": "Trayectoria Educativa Avanzada",
    "TEP": "Trayectoria Educativa en Proceso",
    "TED": "Trayectoria Educativa en Desarrollo",
  },
}

const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    roleId: "ADMIN",
    roleName: "Administrador",
    canViewGrades: true,
    canEditGrades: true,
    canPublishGrades: true,
    canViewAttendance: true,
    canEditAttendance: true,
    canViewBehavior: true,
    canEditBehavior: true,
    canManageUsers: true,
    canAccessAdmin: true,
  },
  {
    roleId: "DOCENTE",
    roleName: "Docente",
    canViewGrades: true,
    canEditGrades: true,
    canPublishGrades: false,
    canViewAttendance: true,
    canEditAttendance: false,
    canViewBehavior: true,
    canEditBehavior: true,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  {
    roleId: "PRECEPTOR",
    roleName: "Preceptor",
    canViewGrades: true,
    canEditGrades: false,
    canPublishGrades: false,
    canViewAttendance: true,
    canEditAttendance: true,
    canViewBehavior: true,
    canEditBehavior: true,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  {
    roleId: "FAMILIA",
    roleName: "Familia / Tutor",
    canViewGrades: true,
    canEditGrades: false,
    canPublishGrades: false,
    canViewAttendance: true,
    canEditAttendance: false,
    canViewBehavior: true,
    canEditBehavior: false,
    canManageUsers: false,
    canAccessAdmin: false,
  },
]

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolId: "",
  schoolName: "",
  gradingScale: DEFAULT_NUMERIC_SCALE,
  academicYear: new Date().getFullYear(),
  currentPeriod: "1T",
  periodsPerYear: 3,
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
}

// ============================================
// CONTEXT
// ============================================

const SchoolSettingsContext = createContext<SchoolSettingsContextType | null>(null)

// ============================================
// PROVIDER
// ============================================

interface SchoolSettingsProviderProps {
  children: ReactNode
  initialSettings?: Partial<SchoolSettings>
}

export function SchoolSettingsProvider({ 
  children, 
  initialSettings 
}: SchoolSettingsProviderProps) {
  const [settings, setSettings] = useState<SchoolSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  })
  const [isLoading, setIsLoading] = useState(false)

  const updateGradingScale = useCallback((scale: GradingScale) => {
    setSettings(prev => ({
      ...prev,
      gradingScale: scale,
    }))
  }, [])

  const updateAcademicYear = useCallback((year: number) => {
    setSettings(prev => ({
      ...prev,
      academicYear: year,
    }))
  }, [])

  const updateCurrentPeriod = useCallback((period: string) => {
    setSettings(prev => ({
      ...prev,
      currentPeriod: period,
    }))
  }, [])

  const updateRolePermission = useCallback((roleId: string, permissions: Partial<RolePermission>) => {
    setSettings(prev => ({
      ...prev,
      rolePermissions: prev.rolePermissions.map(role =>
        role.roleId === roleId ? { ...role, ...permissions } : role
      ),
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const value = useMemo(() => ({
    settings,
    updateGradingScale,
    updateAcademicYear,
    updateCurrentPeriod,
    updateRolePermission,
    resetToDefaults,
    isLoading,
  }), [
    settings,
    updateGradingScale,
    updateAcademicYear,
    updateCurrentPeriod,
    updateRolePermission,
    resetToDefaults,
    isLoading,
  ])

  return (
    <SchoolSettingsContext.Provider value={value}>
      {children}
    </SchoolSettingsContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useSchoolSettings() {
  const context = useContext(SchoolSettingsContext)
  if (!context) {
    throw new Error("useSchoolSettings must be used within a SchoolSettingsProvider")
  }
  return context
}

// ============================================
// SCALE PRESETS (for easy switching)
// ============================================

export const GRADING_SCALE_PRESETS = {
  NUMERIC: DEFAULT_NUMERIC_SCALE,
  ALPHABETIC: DEFAULT_ALPHABETIC_SCALE,
  CONCEPTUAL: DEFAULT_CONCEPTUAL_SCALE,
} as const

export function getScalePreset(type: GradingScaleType): GradingScale {
  return GRADING_SCALE_PRESETS[type]
}
