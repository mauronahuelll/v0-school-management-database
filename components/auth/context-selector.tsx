"use client"

import { useAuth, type UserContextProfile } from "@/lib/context/auth-context"
import {
  School,
  BookOpen,
  Users,
  Home,
  LogOut,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Mapeos de roles y niveles ─────────────────────────────────────────────────

const ROLE_ICONS: Record<string, React.ElementType> = {
  ADMIN:     School,
  DOCENTE:   BookOpen,
  PRECEPTOR: Users,
  FAMILIA:   Home,
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:     "Administracion",
  DOCENTE:   "Docente",
  PRECEPTOR: "Preceptor",
  FAMILIA:   "Familia",
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN:     "Gestion completa de la institucion",
  DOCENTE:   "Calificaciones y seguimiento academico",
  PRECEPTOR: "Asistencia y convivencia escolar",
  FAMILIA:   "Portal de seguimiento del alumno",
}

// ── Configuracion de nivel: badge y colores ───────────────────────────────────

type NivelKey = "INICIAL" | "PRIMARIO" | "SECUNDARIO" | "TERCIARIO"

const NIVEL_CONFIG: Record<NivelKey, {
  label:      string
  badge:      string
  dot:        string
  iconBg:     string
  iconBorder: string
  hoverBorder:string
  hoverGlow:  string
  hoverBg:    string
}> = {
  SECUNDARIO: {
    label:       "Secundario",
    badge:       "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot:         "bg-emerald-400",
    iconBg:      "bg-emerald-500/10",
    iconBorder:  "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    hoverGlow:   "hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]",
    hoverBg:     "hover:bg-emerald-500/[0.04]",
  },
  PRIMARIO: {
    label:       "Primario",
    badge:       "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    dot:         "bg-cyan-400",
    iconBg:      "bg-cyan-500/10",
    iconBorder:  "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    hoverGlow:   "hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]",
    hoverBg:     "hover:bg-cyan-500/[0.04]",
  },
  INICIAL: {
    label:       "Inicial",
    badge:       "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    dot:         "bg-pink-400",
    iconBg:      "bg-pink-500/10",
    iconBorder:  "border-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
    hoverGlow:   "hover:shadow-[0_0_30px_rgba(236,72,153,0.12)]",
    hoverBg:     "hover:bg-pink-500/[0.04]",
  },
  TERCIARIO: {
    label:       "Terciario",
    badge:       "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot:         "bg-amber-400",
    iconBg:      "bg-amber-500/10",
    iconBorder:  "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    hoverGlow:   "hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    hoverBg:     "hover:bg-amber-500/[0.04]",
  },
}

// ── Tarjeta de perfil ─────────────────────────────────────────────────────────

function ProfileCard({
  ctx,
  onSelect,
}: {
  ctx: UserContextProfile
  onSelect: (id: string) => void
}) {
  const RoleIcon = ROLE_ICONS[ctx.role] ?? ShieldCheck
  const nivel    = NIVEL_CONFIG[ctx.level as NivelKey] ?? NIVEL_CONFIG.SECUNDARIO

  return (
    <button
      type="button"
      onClick={() => onSelect(ctx.id)}
      className={cn(
        // Base glassmorphism
        "group relative w-full text-left rounded-3xl p-6",
        "bg-white/[0.02] backdrop-blur-2xl border border-white/10",
        // Hover state
        "transition-all duration-300",
        nivel.hoverBg,
        nivel.hoverBorder,
        nivel.hoverGlow,
        "hover:-translate-y-0.5",
      )}
    >
      {/* Badge de nivel — esquina superior derecha */}
      <span className={cn(
        "absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
        nivel.badge,
      )}>
        {nivel.label}
      </span>

      {/* Icono del rol */}
      <div className={cn(
        "size-12 rounded-2xl flex items-center justify-center mb-4",
        "border transition-colors duration-300",
        nivel.iconBg,
        nivel.iconBorder,
        `group-hover:${nivel.iconBg.replace("/10", "/20")}`,
      )}>
        <RoleIcon className="size-5 text-white/70 group-hover:text-white/90 transition-colors" />
      </div>

      {/* Rol */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1">
        {ROLE_LABELS[ctx.role] ?? ctx.role}
      </p>

      {/* Institución */}
      <h3 className="text-base font-semibold text-[#e4e1ea] leading-snug mb-1 group-hover:text-white transition-colors">
        {ctx.schoolName}
      </h3>

      {/* Descripcion */}
      <p className="text-sm text-white/40 leading-snug line-clamp-2">
        {ctx.description ?? ROLE_DESCRIPTIONS[ctx.role]}
      </p>

      {/* Flecha de accion */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <ArrowRight className="size-4 text-white/50" />
      </div>
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ContextSelector() {
  const { user, availableContexts, switchContext, logout } = useAuth()

  if (!user) return null

  const handleSelect = (id: string) => switchContext(id)

  // Iniciales del avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    /*
     * ROOT: min-h-[100dvh] + overflow-y-auto
     * ─ Sin h-screen, sin max-h-screen, sin overflow-hidden, sin items-center.
     * ─ Los fondos son `fixed` → no se mueven con el scroll bajo ninguna circunstancia.
     */
    <div className="relative min-h-[100dvh] w-full bg-[#050508] overflow-y-auto overflow-x-hidden">

      {/* FONDO 1: gradiente radial superior púrpura */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(138,43,226,0.22) 0%, transparent 70%)",
        }}
      />

      {/* FONDO 2: halo difuso inferior derecho */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 right-0 w-[700px] h-[700px] z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(208,188,255,0.06) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/*
       * CONTENEDOR CENTRAL
       * ─ max-w-4xl centrado, pb-32 garantiza que la última tarjeta
       *   nunca toque el borde del viewport.
       */}
      <main className="relative z-10 w-full max-w-4xl mx-auto pt-20 pb-32 px-4 md:px-8 flex flex-col">

        {/* ── CABECERA ──────────────────────────────────────────────────── */}
        <div className="text-center space-y-4 mb-12 mt-8">
          {/* Logo SQ */}
          <div className="mx-auto size-16 rounded-2xl flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-2xl bg-[#d0bcff]/15 blur-lg" />
            <div className="relative size-full rounded-2xl border border-[#d0bcff]/25 bg-gradient-to-br from-[#d0bcff]/15 via-black/50 to-[#d0bcff]/8 flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold bg-gradient-to-b from-[#e4e1ea] to-[#b89bf2] bg-clip-text text-transparent select-none">
                SQ
              </span>
            </div>
          </div>

          {/* Badge Sequency */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8A2BE2]/10 border border-[#8A2BE2]/20">
            <Sparkles className="size-3 text-[#d0bcff]" />
            <span className="text-[11px] font-semibold text-[#d0bcff] tracking-wide">
              Sequency — Hub Academico
            </span>
          </div>

          {/* Avatar + Saludo */}
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#8A2BE2]/40 to-[#d0bcff]/20 border border-[#d0bcff]/20 text-sm font-bold text-[#e4e1ea]">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#e4e1ea] tracking-tight">
                Hola,{" "}
                <span className="bg-gradient-to-r from-[#d0bcff] to-[#b89bf2] bg-clip-text text-transparent">
                  {user.name.split(" ")[0]}
                </span>
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Selecciona el perfil con el que queres ingresar hoy
              </p>
            </div>
          </div>

          {/* Email */}
          <p className="text-[11px] text-white/25">
            {user.email}
          </p>
        </div>

        {/* ── GRILLA DE TARJETAS ─────────────────────────────────────────── */}
        {/*
         * grid sin restriccion de altura — crece hacia abajo libremente.
         * El scroll del documento (min-h-[100dvh] overflow-y-auto) es el árbitro.
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {availableContexts.map((ctx) => (
            <ProfileCard key={ctx.id} ctx={ctx} onSelect={handleSelect} />
          ))}
        </div>

        {/* ── FOOTER / LOGOUT ────────────────────────────────────────────── */}
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/[0.07] transition-all duration-200"
          >
            <LogOut className="size-4" />
            Cerrar sesion y cambiar cuenta
          </button>
        </div>

      </main>
    </div>
  )
}
