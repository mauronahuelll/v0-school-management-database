"use client"

import { useAuth, type UserContextProfile } from "@/lib/context/auth-context"
import {
  School,
  BookOpen,
  Users,
  Home,
  LogOut,
  ChevronRight,
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

// ── Configuracion de nivel ────────────────────────────────────────────────────

type NivelKey = "INICIAL" | "PRIMARIO" | "SECUNDARIO" | "TERCIARIO"

const NIVEL_CONFIG: Record<NivelKey, {
  label:       string
  badge:       string
  iconBg:      string
  iconColor:   string
  activeBg:    string
}> = {
  SECUNDARIO: {
    label:      "Secundario",
    badge:      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    iconBg:     "bg-emerald-500/10 border border-emerald-500/20",
    iconColor:  "text-emerald-400",
    activeBg:   "bg-emerald-500/[0.07] border-emerald-500/20",
  },
  PRIMARIO: {
    label:      "Primario",
    badge:      "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    iconBg:     "bg-cyan-500/10 border border-cyan-500/20",
    iconColor:  "text-cyan-400",
    activeBg:   "bg-cyan-500/[0.07] border-cyan-500/20",
  },
  INICIAL: {
    label:      "Inicial",
    badge:      "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    iconBg:     "bg-pink-500/10 border border-pink-500/20",
    iconColor:  "text-pink-400",
    activeBg:   "bg-pink-500/[0.07] border-pink-500/20",
  },
  TERCIARIO: {
    label:      "Terciario",
    badge:      "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    iconBg:     "bg-amber-500/10 border border-amber-500/20",
    iconColor:  "text-amber-400",
    activeBg:   "bg-amber-500/[0.07] border-amber-500/20",
  },
}

// ── Fila de perfil ────────────────────────────────────────────────────────────

function ProfileRow({
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
        "group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl",
        "border border-transparent",
        "hover:bg-white/[0.04] hover:border-white/10",
        "transition-all duration-200 cursor-pointer",
      )}
    >
      {/* Icono del rol */}
      <div className={cn(
        "shrink-0 size-11 rounded-xl flex items-center justify-center",
        nivel.iconBg,
      )}>
        <RoleIcon className={cn("size-5", nivel.iconColor)} />
      </div>

      {/* Texto central */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#e4e1ea] leading-tight group-hover:text-white transition-colors">
          {ROLE_LABELS[ctx.role] ?? ctx.role}
        </p>
        <p className="text-xs text-white/40 leading-tight mt-0.5 truncate">
          {ctx.schoolName}
          {ctx.description ? ` — ${ctx.description}` : ""}
        </p>
      </div>

      {/* Badge de nivel */}
      <span className={cn(
        "shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
        nivel.badge,
      )}>
        {nivel.label}
      </span>

      {/* Flecha */}
      <ChevronRight className="shrink-0 size-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
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

  const firstName = user.name.split(" ")[0]

  return (
    /* Fondo fijo con gradiente radial. El min-h-screen + flex centran la tarjeta. */
    <div className="fixed inset-0 bg-[#050508] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(138,43,226,0.18),transparent)] flex items-center justify-center p-4">

      {/* ── TARJETA CENTRAL (modal-style) ──────────────────────────────── */}
      <div className="w-full max-w-lg bg-[#0A0A0F]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(138,43,226,0.12)] overflow-hidden flex flex-col">

        {/* ── CABECERA ─────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
          {/* Logo + badge */}
          <div className="flex items-center gap-2 mb-5">
            <div className="size-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center">
              <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#D0BCFF] to-[#8A2BE2]">
                SQ
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8A2BE2]/10 border border-[#8A2BE2]/20">
              <Sparkles className="size-3 text-[#D0BCFF]" />
              <span className="text-[10px] font-semibold text-[#D0BCFF] tracking-wide">
                Sequency — Hub Academico
              </span>
            </div>
          </div>

          {/* Avatar + saludo */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-[#8A2BE2]/40 to-[#D0BCFF]/20 border border-[#D0BCFF]/20 text-xs font-bold text-[#e4e1ea]">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Hola,{" "}
                <span className="bg-gradient-to-r from-[#D0BCFF] to-[#b89bf2] bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="text-xs text-white/40 leading-tight mt-0.5">
                Como vas a ingresar hoy?
              </p>
            </div>
          </div>
        </div>

        {/* ── LISTA DE PERFILES (scroll interno) ───────────────────────── */}
        <div className="overflow-y-auto max-h-[50vh] p-2 space-y-0.5">
          {availableContexts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/25">
              <Users className="size-8" />
              <p className="text-sm">No hay perfiles disponibles</p>
            </div>
          ) : (
            availableContexts.map(ctx => (
              <ProfileRow key={ctx.id} ctx={ctx} onSelect={switchContext} />
            ))
          )}
        </div>

        {/* ── FOOTER / LOGOUT ──────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3 flex items-center justify-between">
          <p className="text-[11px] text-white/25 truncate">
            {user.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-red-400 hover:bg-red-500/[0.07] transition-all duration-200"
          >
            <LogOut className="size-3.5" />
            Cerrar sesion
          </button>
        </div>

      </div>
    </div>
  )
}
