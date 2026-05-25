"use client"

import { useState, useEffect } from "react"
import { useAuth, MOCK_SCHOOLS, type UserContextProfile } from "@/lib/context/auth-context"
import { Lock, Mail, ArrowRight, Shield, Users, GraduationCap, Home, Building2, School, BookOpen, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Role icons mapping
const ROLE_ICONS = {
  ADMIN: School,
  DOCENTE: BookOpen,
  PRECEPTOR: Users,
  FAMILIA: Home,
}

// Level labels
const LEVEL_LABELS = {
  INICIAL: "Nivel Inicial",
  PRIMARIO: "Nivel Primario",
  SECUNDARIO: "Nivel Secundario",
  TERCIARIO: "Nivel Terciario",
}

export default function LoginPage() {
  const { user, availableContexts, activeContext, login, switchContext, setSchool } = useAuth()
  const [step, setStep] = useState<"credentials" | "context-select" | "school-select">("credentials")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // When user logs in but hasn't selected context, show context selector
  useEffect(() => {
    if (user && availableContexts.length > 0 && !activeContext) {
      setStep("context-select")
    }
  }, [user, availableContexts, activeContext])

  const handleEmailLogin = () => {
    // Simulate email login - loads user with multiple contexts
    login("demo@sequency.edu.ar")
  }

  const handleContextSelect = (contextId: string) => {
    switchContext(contextId)
  }

  // Legacy: handle school selection for admin flow
  const handleSchoolSelect = (id: string) => {
    setSchool(id)
    setStep("credentials")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-background">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10">
        
        {step === "credentials" && (
          <>
            {/* LOGIN FORM */}
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-primary/20 border border-primary/30 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Sequency</h1>
              <p className="text-sm text-muted-foreground mt-2">Sistema Integrado de Gestion Escolar</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  Email Institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="usuario@colegio.edu.ar"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleEmailLogin}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
              >
                Ingresar de forma segura <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Demo Info */}
            <div className="mt-10 pt-6 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                  Entorno de Demostracion
                </p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  El usuario de prueba tiene <span className="text-primary font-medium">4 perfiles</span> disponibles:
                  Directora en Padre Marquez, Docente de Matematica, Madre en San Martin, y Preceptor en Tecnica N3.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-8">
              Sequency v4.2.0 - Arquitectura Multi-Contexto
            </p>
          </>
        )}

        {step === "context-select" && user && (
          <>
            {/* CONTEXT SELECTION */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full mx-auto flex items-center justify-center mb-4 text-lg font-bold text-foreground">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>

            <div className="mb-6">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-4">
                Selecciona tu perfil de trabajo
              </p>
              
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-galactic pr-1">
                {availableContexts.map((ctx) => {
                  const RoleIcon = ROLE_ICONS[ctx.role]
                  
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => handleContextSelect(ctx.id)}
                      className="w-full flex items-start gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-primary/30 rounded-xl transition-all text-left group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0">
                        <RoleIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {ctx.role}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {LEVEL_LABELS[ctx.level]}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {ctx.schoolName}
                        </p>
                        {ctx.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {ctx.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-3" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground/60 text-center">
                Podes cambiar de perfil en cualquier momento desde el menu lateral
              </p>
            </div>
          </>
        )}

        {step === "school-select" && (
          <>
            {/* SCHOOL SELECTION (Legacy for ADMIN flow) */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/20 border border-primary/30 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <School className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Seleccionar Institucion</h2>
              <p className="text-sm text-muted-foreground mt-2">Elegi el entorno en el que vas a trabajar</p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-galactic pr-1">
              {MOCK_SCHOOLS.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolSelect(school.id)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-primary/30 rounded-2xl transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{school.name}</h3>
                      <p className="text-xs text-muted-foreground">{school.region}, Buenos Aires</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <button 
              onClick={() => setStep("credentials")} 
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-6 underline underline-offset-4"
            >
              Volver al inicio de sesion
            </button>
          </>
        )}

      </div>
    </div>
  )
}
