"use client"

import { useState, useEffect } from "react"
import { Shield, Check, X, Eye, Edit, Lock } from "lucide-react"

const MODULES = [
  { id: "academic", name: "Expedientes Academicos", code: "CORE.RECORDS.ACADEMIC" },
  { id: "analytics", name: "Consola de Analitica", code: "SYS.ANALYTICS.DASHBOARD" },
  { id: "grades", name: "Gestion de Calificaciones", code: "CORE.GRADES.MANAGER" },
  { id: "config", name: "Configuracion de Sistema", code: "SYS.CONFIG.GLOBAL" },
]

const ROLES = ["Admin", "Docente", "Tutor", "Alumno"]

type Permission = "full" | "view" | "none"

const PERMISSIONS: Record<string, Record<string, Permission>> = {
  academic: { Admin: "full", Docente: "view", Tutor: "none", Alumno: "none" },
  analytics: { Admin: "full", Docente: "none", Tutor: "none", Alumno: "none" },
  grades: { Admin: "full", Docente: "full", Tutor: "none", Alumno: "view" },
  config: { Admin: "full", Docente: "none", Tutor: "none", Alumno: "none" },
}

function PermissionIcon({ permission }: { permission: Permission }) {
  if (permission === "full") {
    return <Edit className="w-4 h-4 text-secondary" />
  }
  if (permission === "view") {
    return <Eye className="w-4 h-4 text-primary" />
  }
  return <Lock className="w-4 h-4 text-muted-foreground/50" />
}

export default function PermissionsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestion de Acceso</h1>
          <p className="text-sm text-muted-foreground mt-1">Matriz de permisos por rol y modulo</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all">
            Matriz de Permisos
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors">
            Grupos de Usuarios
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors">
            Auditoria
          </button>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Modulo / Recurso
              </th>
              {ROLES.map((role) => (
                <th key={role} className="text-center px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module, idx) => (
              <tr key={module.id} className={idx !== MODULES.length - 1 ? "border-b border-white/5" : ""}>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-foreground">{module.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{module.code}</p>
                </td>
                {ROLES.map((role) => (
                  <td key={role} className="text-center px-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <PermissionIcon permission={PERMISSIONS[module.id][role]} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4 text-secondary" />
          <span>Acceso completo</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span>Solo lectura</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground/50" />
          <span>Sin acceso</span>
        </div>
      </div>
    </div>
  )
}
