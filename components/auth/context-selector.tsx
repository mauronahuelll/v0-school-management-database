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

// ── Mapeos de roles ───────────────────────────────────────────────────────────

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

// ── Configuracion de nivel: colores por nivel educativo ──────────────────────

type NivelKey = "INICIAL" | "PRIMARIO" | "SECUNDARIO" | "TERCIARIO"

const NIVEL_CONFIG: Record<NivelKey, {
  label:      string
  badge:      string
  iconBg:     string
  hoverBorder:string
  hoverGlow:  string
}> = {
  SECUNDARIO: {
    label:       "Secundario",
    badge:       "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    iconBg:      "bg-emerald-500/10 border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    hoverGlow:   "hover:shadow-[0_0_28px_rgba(16,185,129,0.10)]",
  },
  PRIMARIO: {
    label:       "Primario",
    badge:       "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    iconBg:      "bg-cyan-500/10 border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    hoverGlow:   "hover:shadow-[0_0_28px_rgba(6,182,212,0.10)]",
  },
  INICIAL: {
    label:       "Inicial",
    badge:       "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    iconBg:      "bg-pink-500/10 border-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
    hoverGlow:   "hover:shadow-[0_0_28px_rgba(236,72,153,0.10)]",
  },
  TERCIARIO: {
    label:       "Terciario",
    badge:       "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    iconBg:      "bg-amber-500/10 border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    hoverGlow:   "hover:shadow-[0_0_28px_rgba(245,158,11,0.10)]",
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
        "group relative w-full text-left rounded-3xl p-6",
        "bg-white/[0.02] backdrop-blur-md border border-white/10",
        "transition-all duration-300",
        "hover:bg-white/[0.04]",
        nivel.hoverBorder,
        nivel.hoverGlow,
        "hover:-translate-y-0.5 cursor-pointer shadow-lg",
      )}
    >
      {/* Badge nivel — esquina superior derecha */}
      <span className={cn(
        "absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
        nivel.badge,
      )}>
        {nivel.label}
      </span>

      {/* Icono del rol */}
      <div className={cn(
        "size-11 rounded-2xl flex items-center justify-center mb-4 border",
        nivel.iconBg,
      )}>
        <RoleIcon className="size-5 text-white/60 group-hover:text-white/90 transition-colors" />
      </div>

      {/* Rol */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
        {ROLE_LABELS[ctx.role] ?? ctx.role}
      </p>

      {/* Institución */}
      <h3 className="text-base font-semibold text-[#e4e1ea] leading-snug mb-1 group-hover:text-white transition-colors pr-16">
        {ctx.schoolName}
      </h3>

      {/* Descripcion */}
      <p className="text-sm text-white/40 leading-snug line-clamp-2 pr-4">
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

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    /*
     * DOCUMENT FLOW NATURAL:
     * ─ Sin overflow-y-auto interno (el AppShell main ya lo provee).
     * ─ Sin fixed, sin absolute, sin h-screen, sin items-center.
     * ─ El gradiente radial va directo en el className con bg-[radial-gradient...].
     * ─ pb-24 garantiza que la ultima tarjeta nunca toque el borde inferior.
     */
    <div className="min-h-screen w-full bg-[#050508] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8A2BE2]/15 via-[#050508] to-[#050508] text-[#E4E1EA] flex justify-center p-4 sm:p-8">

      {/* Contenedor central que respira y crece hacia abajo */}
      <div className="w-full max-w-4xl pt-12 pb-24 space-y-12">

        {/* ── CABECERA ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center space-y-4">

          {/* Logo SQ */}
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(138,43,226,0.15)]">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#D0BCFF] to-[#8A2BE2]">
              SQ
            </span>
          </div>

          {/* Badge Sequency */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8A2BE2]/10 border border-[#8A2BE2]/20">
            <Sparkles className="size-3 text-[#D0BCFF]" />
            <span className="text-[11px] font-semibold text-[#D0BCFF] tracking-wide">
              Sequency — Hub Academico
            </span>
          </div>

          {/* Avatar + Saludo */}
          <div className="size-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#8A2BE2]/40 to-[#D0BCFF]/20 border border-[#D0BCFF]/20 text-sm font-bold text-[#e4e1ea]">
            {initials}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              Hola,{" "}
              <span className="bg-gradient-to-r from-[#D0BCFF] to-[#b89bf2] bg-clip-text text-transparent">
                {user.name.split(" ")[0]}
              </span>
            </h1>
            <p className="text-white/50 mt-2">
              Como vas a ingresar hoy?
            </p>
          </div>

          <p className="text-[11px] text-white/25">{user.email}</p>
        </div>

        {/* ── GRILLA DE TARJETAS ─────────────────────────────────────────── */}
        {/*
         * Sin max-h ni overflow — crece libremente.
         * El scroll lo maneja el main del AppShell (overflow-y-auto).
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableContexts.map((ctx) => (
            <ProfileCard key={ctx.id} ctx={ctx} onSelect={switchContext} />
          ))}
        </div>

        {/* ── FOOTER / LOGOUT ────────────────────────────────────────────── */}
        <div className="flex justify-center mt-12">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-white/20">
              Ingresando como{" "}
              <span className="text-white/40 font-medium">{user.email}</span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/[0.07] transition-all duration-200"
            >
              <LogOut className="size-4" />
              Cerrar sesion y cambiar cuenta
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
