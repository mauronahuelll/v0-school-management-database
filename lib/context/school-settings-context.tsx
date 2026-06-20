"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"

// ============================================
// TYPES
// ============================================

export type GradingScaleType = "NUMERIC" | "ALPHABETIC" | "CONCEPTUAL"
export type AcademicPeriodType = "TRIMESTRAL" | "CUATRIMESTRAL" | "BIMESTRAL" | "SEMESTRAL"

// Alias requerido por el cliente — mapea 1:1 con AcademicPeriodType
export type AcademicPeriodLayout = AcademicPeriodType

export interface AcademicPeriodConfig {
  type: AcademicPeriodType
  periods: {
    id: string
    name: string
    shortName: string
    startDate: string
    endDate: string
  }[]
}

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
  academicPeriodConfig: AcademicPeriodConfig
  // Layout del ciclo lectivo — derivado de academicPeriodConfig.type para acceso directo
  academicPeriodLayout: AcademicPeriodLayout

  // Attendance policy
  maxAbsences: number
  
  // Role permissions
  rolePermissions: RolePermission[]
}

interface SchoolSettingsContextType {
  settings: SchoolSettings
  updateGradingScale: (scale: GradingScale) => void
  updateAcademicYear: (year: number) => void
  updateCurrentPeriod: (period: string) => void
  updateAcademicPeriodConfig: (config: AcademicPeriodConfig) => void
  updateAcademicPeriodLayout: (layout: AcademicPeriodLayout) => void
  updateMaxAbsences: (max: number) => void
  updateRolePermission: (roleId: string, permissions: Partial<RolePermission>) => void
  resetToDefaults: () => void
  isLoading: boolean
  // Helpers
  getAvailablePeriods: () => { id: string; name: string; shortName: string }[]
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

// Default Academic Period Configurations
const DEFAULT_TRIMESTRAL_CONFIG: AcademicPeriodConfig = {
  type: "TRIMESTRAL",
  periods: [
    { id: "1T", name: "1° Trimestre", shortName: "1T", startDate: "2026-03-02", endDate: "2026-06-06" },
    { id: "2T", name: "2° Trimestre", shortName: "2T", startDate: "2026-06-09", endDate: "2026-09-12" },
    { id: "3T", name: "3° Trimestre", shortName: "3T", startDate: "2026-09-15", endDate: "2026-12-11" },
  ],
}

const DEFAULT_CUATRIMESTRAL_CONFIG: AcademicPeriodConfig = {
  type: "CUATRIMESTRAL",
  periods: [
    { id: "1C", name: "1° Cuatrimestre", shortName: "1C", startDate: "2026-03-02", endDate: "2026-07-10" },
    { id: "2C", name: "2° Cuatrimestre", shortName: "2C", startDate: "2026-08-03", endDate: "2026-12-11" },
  ],
}

const DEFAULT_BIMESTRAL_CONFIG: AcademicPeriodConfig = {
  type: "BIMESTRAL",
  periods: [
    { id: "1B", name: "1° Bimestre", shortName: "1B", startDate: "2026-03-02", endDate: "2026-04-30" },
    { id: "2B", name: "2° Bimestre", shortName: "2B", startDate: "2026-05-04", endDate: "2026-07-03" },
    { id: "3B", name: "3° Bimestre", shortName: "3B", startDate: "2026-08-03", endDate: "2026-10-02" },
    { id: "4B", name: "4° Bimestre", shortName: "4B", startDate: "2026-10-05", endDate: "2026-12-11" },
  ],
}

const DEFAULT_SEMESTRAL_CONFIG: AcademicPeriodConfig = {
  type: "SEMESTRAL",
  periods: [
    { id: "1S", name: "1° Semestre", shortName: "1S", startDate: "2026-03-02", endDate: "2026-07-10" },
    { id: "2S", name: "2° Semestre", shortName: "2S", startDate: "2026-07-27", endDate: "2026-12-11" },
  ],
}

export const ACADEMIC_PERIOD_PRESETS: Record<AcademicPeriodType, AcademicPeriodConfig> = {
  TRIMESTRAL: DEFAULT_TRIMESTRAL_CONFIG,
  CUATRIMESTRAL: DEFAULT_CUATRIMESTRAL_CONFIG,
  BIMESTRAL: DEFAULT_BIMESTRAL_CONFIG,
  SEMESTRAL: DEFAULT_SEMESTRAL_CONFIG,
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
  academicPeriodConfig: DEFAULT_TRIMESTRAL_CONFIG,
  academicPeriodLayout: "TRIMESTRAL",
  maxAbsences: 20,
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

  const updateAcademicPeriodConfig = useCallback((config: AcademicPeriodConfig) => {
    setSettings(prev => ({
      ...prev,
      academicPeriodConfig: config,
      academicPeriodLayout: config.type,
      periodsPerYear: config.periods.length,
      currentPeriod: config.periods[0]?.id || "1T",
    }))
  }, [])

  const updateAcademicPeriodLayout = useCallback((layout: AcademicPeriodLayout) => {
    const preset = ACADEMIC_PERIOD_PRESETS[layout]
    setSettings(prev => ({
      ...prev,
      academicPeriodLayout: layout,
      academicPeriodConfig: preset,
      periodsPerYear: preset.periods.length,
      currentPeriod: preset.periods[0]?.id || "1T",
    }))
  }, [])

  const updateMaxAbsences = useCallback((max: number) => {
    setSettings(prev => ({
      ...prev,
      maxAbsences: max,
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

  const getAvailablePeriods = useCallback(() => {
    return settings.academicPeriodConfig.periods.map(p => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
    }))
  }, [settings.academicPeriodConfig])

  const value = useMemo(() => ({
    settings,
    updateGradingScale,
    updateAcademicYear,
    updateCurrentPeriod,
    updateAcademicPeriodConfig,
    updateAcademicPeriodLayout,
    updateMaxAbsences,
    updateRolePermission,
    resetToDefaults,
    isLoading,
    getAvailablePeriods,
  }), [
    settings,
    updateGradingScale,
    updateAcademicYear,
    updateCurrentPeriod,
    updateAcademicPeriodConfig,
    updateAcademicPeriodLayout,
    updateMaxAbsences,
    updateRolePermission,
    resetToDefaults,
    isLoading,
    getAvailablePeriods,
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
