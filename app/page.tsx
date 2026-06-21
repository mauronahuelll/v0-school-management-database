"use client"

import { useState, useEffect } from "react"
import { useAuth, MOCK_SCHOOLS, type UserContextProfile } from "@/lib/context/auth-context"
import {
  Lock, Mail, ArrowRight, Shield, Users, GraduationCap,
  Home, Building2, School, BookOpen, ChevronRight, Eye, EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Role icons ────────────────────────────────────────────────────────────────
const ROLE_ICONS = {
  ADMIN:     School,
  DOCENTE:   BookOpen,
  PRECEPTOR: Users,
  FAMILIA:   Home,
}

const LEVEL_LABELS: Record<string, string> = {
  INICIAL:    "Nivel Inicial",
  PRIMARIO:   "Nivel Primario",
  SECUNDARIO: "Nivel Secundario",
  TERCIARIO:  "Nivel Terciario",
}

// ── Background circuit lines SVG (decorativo) ────────────────────────────────
function CircuitBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Horizontal traces */}
          <path d="M0 20 H30 M50 20 H80" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          <path d="M0 60 H20 M60 60 H80" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          {/* Vertical traces */}
          <path d="M20 0 V30 M20 50 V80" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          <path d="M60 0 V20 M60 40 V80" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          {/* Corner joints */}
          <path d="M30 20 Q50 20 50 40" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          <path d="M20 30 Q20 60 60 60" stroke="#d0bcff" strokeWidth="0.5" fill="none" />
          {/* Nodes */}
          <circle cx="20" cy="20" r="1.5" fill="#d0bcff" />
          <circle cx="60" cy="20" r="1.5" fill="#d0bcff" />
          <circle cx="20" cy="60" r="1.5" fill="#d0bcff" />
          <circle cx="60" cy="60" r="1.5" fill="#d0bcff" />
          <circle cx="50" cy="40" r="1" fill="#b89bf2" />
          <circle cx="40" cy="40" r="1" fill="#b89bf2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
  )
}

// ── SQ Logo mark ──────────────────────────────────────────────────────────────
function SQLogoMark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "size-20" : "size-14"
  const text = size === "lg" ? "text-3xl" : "text-xl"
  return (
    <div className={cn("relative mx-auto flex items-center justify-center", dim)}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-2xl bg-[#d0bcff]/20 blur-xl" />
      {/* Ring border */}
      <div className="absolute inset-0 rounded-2xl border border-[#d0bcff]/30 shadow-[0_0_20px_rgba(208,188,255,0.25)]" />
      {/* Inner fill */}
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl w-full h-full",
        "bg-gradient-to-br from-[#d0bcff]/20 via-[#0A0A0F]/60 to-[#d0bcff]/10",
        "backdrop-blur-sm",
      )}>
        <span className={cn(
          "font-bold tracking-tight select-none",
          text,
          "bg-gradient-to-b from-[#e4e1ea] via-[#d0bcff] to-[#b89bf2] bg-clip-text text-transparent",
        )}>
          SQ
        </span>
      </div>
    </div>
  )
}

// ── Reusable input with icon ──────────────────────────────────────────────────
function AuthInput({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  rightSlot,
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  icon: React.ElementType
  value?: string
  onChange?: (v: string) => void
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">
        {label}
      </label>
      <div className="relative group">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25 group-focus-within:text-[#d0bcff]/70 transition-colors duration-200 pointer-events-none" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full bg-black/30 border border-white/10 rounded-xl",
            "py-3 pl-10 pr-4 text-sm text-[#e4e1ea] placeholder:text-white/20",
            "focus:outline-none focus:border-[#d0bcff]/50 focus:ring-2 focus:ring-[#d0bcff]/10",
            "transition-all duration-200",
            rightSlot && "pr-10",
          )}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, availableContexts, activeContext, login, switchContext, setSchool } = useAuth()
  const [step, setStep] = useState<"credentials" | "context-select" | "school-select">("credentials")
  const [mounted, setMounted] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (user && availableContexts.length > 0 && !activeContext) {
      setStep("context-select")
    }
  }, [user, availableContexts, activeContext])

  const handleEmailLogin = () => {
    login("demo@sequency.edu.ar")
  }

  const handleContextSelect = (contextId: string) => {
    switchContext(contextId)
  }

  const handleSchoolSelect = (id: string) => {
    setSchool(id)
    setStep("credentials")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#000000]">

      {/* ── Fondo: gradiente radial + circuitos ──────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(208,188,255,0.12)_0%,_rgba(10,10,15,0.85)_60%,_rgba(0,0,0,1)_100%)]" />
      <CircuitBackground />

      {/* Halos de luz ambiental */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d0bcff]/[0.07] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#b89bf2]/[0.05] blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[200px] h-[200px] bg-[#d0bcff]/[0.04] blur-[60px] rounded-full pointer-events-none" />

      {/* ── Tarjeta Glassmorphism ─────────────────────────────────────────── */}
      <div className={cn(
        "relative z-10 w-full",
        step === "context-select" ? "max-w-md" : "max-w-sm",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.08]",
        "rounded-3xl p-8",
        "shadow-[0_0_60px_rgba(208,188,255,0.08),0_0_0_1px_rgba(208,188,255,0.05)]",
        "transition-all duration-500",
      )}>

        {/* Borde interior brillante (efecto premium) */}
        <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        {/* ── STEP 1: Credentials ──────────────────────────────────────── */}
        {step === "credentials" && (
          <div className="relative space-y-0">

            {/* Logo + título */}
            <div className="text-center mb-8">
              <SQLogoMark size="lg" />
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#e4e1ea]">
                Inicia Sesion
              </h1>
              <p className="text-xs text-white/35 mt-1.5 tracking-wide">
                Gestion Escolar Avanzada
              </p>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <AuthInput
                id="email"
                label="Correo Electronico"
                type="email"
                placeholder="usuario@colegio.edu.ar"
                icon={Mail}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">
                    Contrasena
                  </label>
                  <button
                    type="button"
                    className="text-[10px] text-[#d0bcff]/60 hover:text-[#d0bcff] transition-colors duration-150"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25 group-focus-within:text-[#d0bcff]/70 transition-colors duration-200 pointer-events-none" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "w-full bg-black/30 border border-white/10 rounded-xl",
                      "py-3 pl-10 pr-10 text-sm text-[#e4e1ea] placeholder:text-white/20",
                      "focus:outline-none focus:border-[#d0bcff]/50 focus:ring-2 focus:ring-[#d0bcff]/10",
                      "transition-all duration-200",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPass
                      ? <EyeOff className="size-4" />
                      : <Eye className="size-4" />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* CTA principal */}
            <button
              onClick={handleEmailLogin}
              className={cn(
                "mt-6 w-full flex items-center justify-center gap-2",
                "py-3 rounded-xl text-sm font-bold",
                "bg-gradient-to-r from-[#d0bcff] to-[#b89bf2]",
                "text-[#0A0A0F]",
                "shadow-[0_0_20px_rgba(208,188,255,0.3)]",
                "hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.4)]",
                "active:scale-[0.99]",
                "transition-all duration-200",
              )}
            >
              Ingresar de forma segura
              <ArrowRight className="size-4" />
            </button>

            {/* Demo info */}
            <div className="mt-7 pt-6 border-t border-white/[0.06]">
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] text-center mb-2">
                Entorno de Demostracion
              </p>
              <p className="text-[11px] text-white/30 leading-relaxed text-center">
                El usuario de prueba tiene{" "}
                <span className="text-[#d0bcff]/70 font-semibold">4 perfiles</span>{" "}
                disponibles: Directora, Docente, Madre y Preceptor.
              </p>
            </div>

            <p className="text-[9px] text-white/15 text-center mt-5 tracking-wide">
              Sequency v4.2.0 — Arquitectura Multi-Contexto
            </p>
          </div>
        )}

        {/* ── STEP 2: Context Select ───────────────────────────────────── */}
        {step === "context-select" && user && (
          <div className="relative">

            {/* Avatar + user */}
            <div className="text-center mb-6">
              <div className={cn(
                "size-14 rounded-full mx-auto flex items-center justify-center mb-3",
                "bg-gradient-to-br from-[#d0bcff]/30 to-[#b89bf2]/20",
                "border border-[#d0bcff]/20",
                "text-base font-bold text-[#e4e1ea] tracking-wide",
                "shadow-[0_0_20px_rgba(208,188,255,0.15)]",
              )}>
                {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="text-lg font-bold text-[#e4e1ea] tracking-tight">{user.name}</h2>
              <p className="text-xs text-white/35 mt-0.5">{user.email}</p>
            </div>

            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] text-center mb-4">
              Selecciona tu perfil de trabajo
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(208,188,255,0.15) transparent" }}>
              {availableContexts.map((ctx) => {
                const RoleIcon = ROLE_ICONS[ctx.role as keyof typeof ROLE_ICONS] ?? Shield
                return (
                  <button
                    key={ctx.id}
                    onClick={() => handleContextSelect(ctx.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3.5 rounded-xl text-left",
                      "bg-white/[0.02] hover:bg-[#d0bcff]/[0.06]",
                      "border border-white/[0.05] hover:border-[#d0bcff]/25",
                      "group transition-all duration-150",
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      "bg-[#d0bcff]/10 border border-white/[0.05]",
                      "group-hover:bg-[#d0bcff]/20 group-hover:border-[#d0bcff]/25",
                      "transition-all duration-150",
                    )}>
                      <RoleIcon className="size-4.5 text-[#d0bcff]/80" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-[#d0bcff]/60 uppercase tracking-widest">
                          {ctx.role}
                        </span>
                        <span className="text-[9px] text-white/25">
                          {LEVEL_LABELS[ctx.level] ?? ctx.level}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#e4e1ea] group-hover:text-[#d0bcff] transition-colors truncate">
                        {ctx.schoolName}
                      </p>
                      {ctx.description && (
                        <p className="text-xs text-white/30 truncate mt-0.5">{ctx.description}</p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-white/20 group-hover:text-[#d0bcff]/60 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                  </button>
                )
              })}
            </div>

            <p className="text-[10px] text-white/20 text-center mt-5 leading-relaxed">
              Podes cambiar de perfil en cualquier momento desde el menu lateral.
            </p>
          </div>
        )}

        {/* ── STEP 3: School Select (legacy admin) ─────────────────────── */}
        {step === "school-select" && (
          <div className="relative">
            <div className="text-center mb-7">
              <div className={cn(
                "size-14 rounded-2xl mx-auto flex items-center justify-center mb-4",
                "bg-[#d0bcff]/10 border border-[#d0bcff]/20",
                "shadow-[0_0_20px_rgba(208,188,255,0.1)]",
              )}>
                <School className="size-7 text-[#d0bcff]/80" />
              </div>
              <h2 className="text-xl font-bold text-[#e4e1ea] tracking-tight">Seleccionar Institucion</h2>
              <p className="text-xs text-white/35 mt-1.5">Elegi el entorno en el que vas a trabajar</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(208,188,255,0.15) transparent" }}>
              {MOCK_SCHOOLS.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolSelect(school.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl text-left",
                    "bg-white/[0.02] hover:bg-[#d0bcff]/[0.06]",
                    "border border-white/[0.05] hover:border-[#d0bcff]/25",
                    "group transition-all duration-150",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      "bg-[#d0bcff]/10 border border-white/[0.05]",
                      "group-hover:bg-[#d0bcff]/20 group-hover:border-[#d0bcff]/25 transition-all",
                    )}>
                      <Building2 className="size-4.5 text-[#d0bcff]/80" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#e4e1ea] group-hover:text-[#d0bcff] transition-colors">
                        {school.name}
                      </h3>
                      <p className="text-xs text-white/30">{school.region}, Buenos Aires</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-white/20 group-hover:text-[#d0bcff]/60 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("credentials")}
              className="w-full text-center text-xs text-white/25 hover:text-[#d0bcff]/60 transition-colors mt-6"
            >
              Volver al inicio de sesion
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
