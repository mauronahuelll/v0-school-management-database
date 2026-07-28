"use client"

import { useAuth, type UserContextProfile } from "@/lib/context/auth-context"
import { School, BookOpen, Users, Home, GraduationCap, LogOut, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Role icons mapping
const ROLE_ICONS = {
  ADMIN: School,
  DOCENTE: BookOpen,
  PRECEPTOR: Users,
  FAMILIA: Home,
}

// Role descriptions
const ROLE_DESCRIPTIONS = {
  ADMIN: "Gestion completa de la institucion",
  DOCENTE: "Calificaciones y seguimiento academico",
  PRECEPTOR: "Asistencia y convivencia escolar",
  FAMILIA: "Portal de seguimiento del alumno",
}

// Level labels
const LEVEL_LABELS = {
  INICIAL: "Nivel Inicial",
  PRIMARIO: "Nivel Primario",
  SECUNDARIO: "Nivel Secundario",
  TERCIARIO: "Nivel Terciario",
}

// Level colors
const LEVEL_COLORS = {
  INICIAL: "text-pink-400",
  PRIMARIO: "text-blue-400",
  SECUNDARIO: "text-emerald-400",
  TERCIARIO: "text-amber-400",
}

export function ContextSelector() {
  const { user, availableContexts, switchContext, logout } = useAuth()

  if (!user || availableContexts.length === 0) {
    return null
  }

  const handleSelectContext = (context: UserContextProfile) => {
    switchContext(context.id)
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050508] overflow-y-auto overflow-x-hidden">

      {/* FONDOS — fixed para no moverse con el scroll bajo ninguna circunstancia */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8A2BE2]/20 via-[#050508] to-[#050508] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D0BCFF]/5 via-transparent to-transparent blur-3xl pointer-events-none z-0" />

      {/* CONTENEDOR DEL CONTENIDO — sin flex centering, scroll nativo del documento */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col pt-16 pb-32 px-4 md:px-8">

        {/* CABECERA centrada textualmente */}
        <div className="text-center space-y-4 mb-12 mt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Bienvenido a Sequency</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Hola, <span className="text-primary">{user.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Como vas a ingresar hoy?
          </p>
        </div>

        {/* GRILLA DE TARJETAS — sin h-full ni max-h, crece libremente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {availableContexts.map((context) => {
            const RoleIcon = ROLE_ICONS[context.role] || GraduationCap
            const levelColor = LEVEL_COLORS[context.level] || "text-muted-foreground"

            return (
              <button
                key={context.id}
                onClick={() => handleSelectContext(context)}
                className={cn(
                  "group relative flex flex-col p-5 rounded-2xl text-left",
                  "bg-white/[0.02] hover:bg-white/[0.05]",
                  "border border-white/10 hover:border-primary/50",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-lg hover:shadow-primary/5",
                  "hover:-translate-y-0.5"
                )}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon and Role */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                      <RoleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white/5",
                      levelColor
                    )}>
                      {LEVEL_LABELS[context.level]}
                    </span>
                  </div>

                  {/* Role Title */}
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {context.role}
                  </h3>

                  {/* School Name */}
                  <p className="text-sm text-foreground/80 mb-2">
                    {context.schoolName}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground">
                    {context.description || ROLE_DESCRIPTIONS[context.role]}
                  </p>
                </div>

                {/* Arrow indicator on hover */}
                <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        {/* BOTON DE CERRAR SESION */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground text-center">
            Ingresando como <span className="text-foreground font-medium">{user.email}</span>
          </p>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesion y cambiar cuenta
          </button>
        </div>

      </div>
    </div>
  )
}
