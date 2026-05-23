"use client"

import { useState, useEffect } from "react"
import { SchoolConfigurator } from "@/components/admin/school-config"
import { Toaster } from "@/components/ui/sonner"

export default function SchoolConfigPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
