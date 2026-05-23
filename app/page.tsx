"use client"

import { useState } from "react"
import { useAuth, Role, MOCK_SCHOOLS } from "@/lib/context/auth-context"
import { Lock, Mail, ArrowRight, Shield, Users, GraduationCap, Home, Building2, School } from "lucide-react"

const ROLE_INFO: Record<NonNullable<Role>, { icon: typeof Shield; label: string; description: string }> = {
  ADMIN: { icon: Shield, label: "Administrador", description: "Acceso completo al sistema" },
  DOCENTE: { icon: GraduationCap, label: "Docente", description: "Calificaciones y seguimiento" },
  PRECEPTOR: { icon: Users, label: "Preceptor", description: "Asistencia y convivencia" },
  FAMILIA: { icon: Home, label: "Familia", description: "Portal de tutores" },
}

export default function LoginPage() {
  const { login, role, schoolId, setSchool } = useAuth()
  const [step, setStep] = useState<"credentials" | "school-select">("credentials")

  // If already logged in as ADMIN but no school selected, show school selector
  const showSchoolSelector = step === "school-select" || (role === "ADMIN" && !schoolId)

  const handleRoleSelect = (selectedRole: NonNullable<Role>) => {
    if (selectedRole === "ADMIN") {
      login(selectedRole) // This sets role but doesn't navigate (no schoolId)
      setStep("school-select")
    } else {
      login(selectedRole, "inst-1") // Non-admins get auto-assigned
    }
  }

  const handleSchoolSelect = (id: string) => {
    setSchool(id)
    setStep("credentials")
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-background">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10">
        
        {!showSchoolSelector ? (
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
              
              <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2">
                Ingresar de forma segura <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role Testing Section */}
            <div className="mt-10 pt-6 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-4">
                Entorno de Pruebas - Seleccionar Rol
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["ADMIN", "DOCENTE", "PRECEPTOR", "FAMILIA"] as NonNullable<Role>[]).map((r) => {
                  const info = ROLE_INFO[r]
                  const Icon = info.icon
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className="group flex flex-col items-center gap-2 py-4 px-3 border border-white/5 rounded-xl text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Icon className="w-5 h-5 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground">{info.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-8">
              Sequency v4.2.0 - Ambiente de Desarrollo
            </p>
          </>
        ) : (
          <>
            {/* SCHOOL SELECTION FOR ADMIN */}
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
              onClick={() => {
                setStep("credentials")
              }} 
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
