"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

// ============================================================================
// TYPES
// ============================================================================

export type StaffFieldType =
  | "TEXTO"
  | "TEXTO_LARGO"
  | "NUMERO"
  | "FECHA"
  | "TELEFONO"
  | "EMAIL"

export interface StaffField {
  id: string
  label: string
  type: StaffFieldType
  required: boolean
  placeholder?: string
}

export const STAFF_FIELD_TYPE_LABELS: Record<StaffFieldType, string> = {
  TEXTO:       "Texto corto",
  TEXTO_LARGO: "Texto largo",
  NUMERO:      "Numero",
  FECHA:       "Fecha",
  TELEFONO:    "Telefono",
  EMAIL:       "Email",
}

// ============================================================================
// INITIAL MOCK DATA
// ============================================================================

const INITIAL_STAFF_FIELDS: StaffField[] = [
  { id: "sf_cbu",      label: "CBU / Alias bancario",  type: "TEXTO",       required: true,  placeholder: "Ej: 0000000000000000000000" },
  { id: "sf_talle",    label: "Talle de uniforme",     type: "TEXTO",       required: false, placeholder: "Ej: M, L, XL" },
  { id: "sf_alergias", label: "Alergias o condiciones", type: "TEXTO_LARGO", required: false, placeholder: "Describe alergias, condiciones medicas relevantes..." },
  { id: "sf_telefono_emergencia", label: "Telefono de emergencia", type: "TELEFONO", required: true, placeholder: "Ej: +54 9 11 1234-5678" },
]

// ============================================================================
// CONTEXT
// ============================================================================

interface StaffFieldsContextType {
  staffFields: StaffField[]
  addStaffField: (field: Omit<StaffField, "id">) => void
  updateStaffField: (id: string, field: Partial<Omit<StaffField, "id">>) => void
  deleteStaffField: (id: string) => void
}

const StaffFieldsContext = createContext<StaffFieldsContextType | undefined>(undefined)

export function StaffFieldsProvider({ children }: { children: ReactNode }) {
  const [staffFields, setStaffFields] = useState<StaffField[]>(INITIAL_STAFF_FIELDS)

  const addStaffField = useCallback((field: Omit<StaffField, "id">) => {
    setStaffFields(prev => [
      ...prev,
      { ...field, id: `sf_${Date.now()}` },
    ])
  }, [])

  const updateStaffField = useCallback((id: string, updates: Partial<Omit<StaffField, "id">>) => {
    setStaffFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const deleteStaffField = useCallback((id: string) => {
    setStaffFields(prev => prev.filter(f => f.id !== id))
  }, [])

  return (
    <StaffFieldsContext.Provider value={{ staffFields, addStaffField, updateStaffField, deleteStaffField }}>
      {children}
    </StaffFieldsContext.Provider>
  )
}

export function useStaffFields() {
  const ctx = useContext(StaffFieldsContext)
  if (!ctx) throw new Error("useStaffFields must be used inside <StaffFieldsProvider>")
  return ctx
}
