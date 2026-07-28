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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Halo adicional centrado — se superpone al fondo global del body */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 blur-[140px] rounded-full pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Bienvenido a Sequency</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Hola, <span className="text-primary">{user.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Como vas a ingresar hoy?
          </p>
        </div>

        {/* Context Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

        {/* Footer */}
        <div className="flex flex-col items-center gap-4">
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
