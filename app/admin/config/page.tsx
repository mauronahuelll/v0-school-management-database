"use client"

import { useState, useEffect } from "react"
import { SchoolConfigurator } from "@/components/admin/school-config"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/lib/context/auth-context"
import { ShieldOff } from "lucide-react"

export default function SchoolConfigPage() {
  const [mounted, setMounted] = useState(false)
  const { role } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // ── RBAC: ruta restringida a ADMIN ────────────────────────────────────────
  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/[0.02] border border-red-500/20 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-5 text-center">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <ShieldOff className="size-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Acceso Denegado</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Esta vista es exclusiva para el equipo directivo.
              Si necesitas acceso, comunicate con el administrador de la institucion.
            </p>
          </div>
          <div className="w-full px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/15">
            <p className="text-xs text-red-400/80">
              <span className="font-semibold">Rol activo:</span>{" "}
              <span className="font-mono">{role ?? "Sin sesion"}</span>
              {" — "}Permiso requerido:{" "}
              <span className="font-mono font-semibold">ADMIN</span>
            </p>
          </div>
        </div>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuracion de la Institucion
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define la escala de calificaciones, ciclo lectivo y permisos de tu escuela
        </p>
      </header>

      <SchoolConfigurator />
      
      <Toaster theme="dark" />
    </div>
  )
}
