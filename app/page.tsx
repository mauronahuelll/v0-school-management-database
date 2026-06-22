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
  const [step, setStep]     = useState<"credentials" | "context-select" | "school-select">("credentials")
  const [mounted, setMounted] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (user && availableContexts.length > 0 && !activeContext) {
      setStep("context-select")
    }
  }, [user, availableContexts, activeContext])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      login(email || "demo@sequency.edu.ar")
      setIsLoading(false)
    }, 900)
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050508] text-[#E4E1EA] selection:bg-[#8A2BE2]/30">

      {/* Fondo inmersivo futurista con iluminación volumétrica */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8A2BE2]/20 via-[#050508] to-[#050508] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D0BCFF]/5 via-transparent to-transparent blur-3xl pointer-events-none" />
      <CircuitBackground />

      {/* Tarjeta Dark Glassmorphism — adapta ancho según step */}
      <div className={cn(
        "relative z-10 w-full mx-4 p-8 sm:p-10 rounded-[2rem] border border-white/10",
        "bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_50px_rgba(138,43,226,0.15)] overflow-hidden",
        "transition-all duration-500",
        step === "context-select" ? "max-w-md" : "max-w-md",
      )}>

        {/* Reflejo superior sutil (Efecto Cristal Premium) */}
        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#D0BCFF]/50 to-transparent pointer-events-none" />
        {/* Borde interior brillante */}
        <div className="absolute inset-[1px] rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        {/* ── STEP 1: Credentials ─────────────────────────────────────── */}
        {step === "credentials" && (
          <div className="relative">

            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-10 text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8A2BE2]/20 to-transparent border border-[#8A2BE2]/30 shadow-[0_0_30px_rgba(138,43,226,0.3)]">
                <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#D0BCFF] to-[#8A2BE2]">
                  SQ
                </span>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">Iniciar Sesion</h1>
                <p className="text-sm text-white/50">Plataforma de Gestion Escolar Avanzada</p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                    Correo Electronico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-4 h-12 rounded-xl text-sm",
                        "bg-black/40 border border-white/10 text-white placeholder:text-white/20",
                        "focus:outline-none focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50",
                        "transition-all duration-200",
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Contrasena
                    </label>
                    <a href="#" className="text-xs text-[#D0BCFF] hover:text-white transition-colors">
                      Olvidaste tu clave?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 pointer-events-none" />
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-10 h-12 rounded-xl text-sm",
                        "bg-black/40 border border-white/10 text-white placeholder:text-white/20",
                        "focus:outline-none focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50",
                        "transition-all duration-200",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                      aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full h-12 rounded-xl font-bold text-[15px] border-0",
                  "bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black",
                  "hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(208,188,255,0.4)]",
                  "active:scale-[0.99] transition-all duration-300",
                  "flex items-center justify-center group",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Acceder al Sistema
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer info */}
            <div className="mt-8 text-center">
              <p className="text-xs text-white/30">
                Protegido con cifrado de grado militar.<br />
                By Sequency Technologies.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Context Select ──────────────────────────────────── */}
        {step === "context-select" && user && (
          <div className="relative">

            <div className="text-center mb-6">
              <div className={cn(
                "size-14 rounded-full mx-auto flex items-center justify-center mb-3",
                "bg-gradient-to-br from-[#D0BCFF]/30 to-[#b89bf2]/20",
                "border border-[#D0BCFF]/20 shadow-[0_0_20px_rgba(208,188,255,0.15)]",
                "text-base font-bold text-[#e4e1ea] tracking-wide",
              )}>
                {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{user.name}</h2>
              <p className="text-xs text-white/35 mt-0.5">{user.email}</p>
            </div>

            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] text-center mb-4">
              Selecciona tu perfil de trabajo
            </p>

            <div
              className="space-y-2 max-h-80 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(208,188,255,0.15) transparent" }}
            >
              {availableContexts.map((ctx) => {
                const RoleIcon = ROLE_ICONS[ctx.role as keyof typeof ROLE_ICONS] ?? Shield
                return (
                  <button
                    key={ctx.id}
                    onClick={() => handleContextSelect(ctx.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3.5 rounded-xl text-left",
                      "bg-white/[0.02] hover:bg-[#8A2BE2]/[0.08]",
                      "border border-white/[0.06] hover:border-[#8A2BE2]/40",
                      "group transition-all duration-200",
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      "bg-[#D0BCFF]/10 border border-white/[0.06]",
                      "group-hover:bg-[#8A2BE2]/20 group-hover:border-[#8A2BE2]/30 transition-all",
                    )}>
                      <RoleIcon className="size-4 text-[#D0BCFF]/80" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-[#D0BCFF]/60 uppercase tracking-widest">{ctx.role}</span>
                        <span className="text-[9px] text-white/25">{LEVEL_LABELS[ctx.level] ?? ctx.level}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#e4e1ea] group-hover:text-[#D0BCFF] transition-colors truncate">
                        {ctx.schoolName}
                      </p>
                      {ctx.description && (
                        <p className="text-xs text-white/30 truncate mt-0.5">{ctx.description}</p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-white/20 group-hover:text-[#D0BCFF]/60 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                  </button>
                )
              })}
            </div>

            <p className="text-[10px] text-white/20 text-center mt-5 leading-relaxed">
              Podes cambiar de perfil en cualquier momento desde el menu lateral.
            </p>
          </div>
        )}

        {/* ── STEP 3: School Select ───────────────────────────────────── */}
        {step === "school-select" && (
          <div className="relative">
            <div className="text-center mb-7">
              <div className={cn(
                "size-14 rounded-2xl mx-auto flex items-center justify-center mb-4",
                "bg-[#D0BCFF]/10 border border-[#D0BCFF]/20 shadow-[0_0_20px_rgba(208,188,255,0.1)]",
              )}>
                <School className="size-7 text-[#D0BCFF]/80" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Seleccionar Institucion</h2>
              <p className="text-xs text-white/35 mt-1.5">Elegi el entorno en el que vas a trabajar</p>
            </div>

            <div
              className="space-y-2 max-h-72 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(208,188,255,0.15) transparent" }}
            >
              {MOCK_SCHOOLS.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolSelect(school.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl text-left",
                    "bg-white/[0.02] hover:bg-[#8A2BE2]/[0.08]",
                    "border border-white/[0.06] hover:border-[#8A2BE2]/40",
                    "group transition-all duration-200",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      "bg-[#D0BCFF]/10 border border-white/[0.06]",
                      "group-hover:bg-[#8A2BE2]/20 group-hover:border-[#8A2BE2]/30 transition-all",
                    )}>
                      <Building2 className="size-4 text-[#D0BCFF]/80" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#e4e1ea] group-hover:text-[#D0BCFF] transition-colors">
                        {school.name}
                      </h3>
                      <p className="text-xs text-white/30">{school.region}, Buenos Aires</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-white/20 group-hover:text-[#D0BCFF]/60 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("credentials")}
              className="w-full text-center text-xs text-white/25 hover:text-[#D0BCFF]/60 transition-colors mt-6"
            >
              Volver al inicio de sesion
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
