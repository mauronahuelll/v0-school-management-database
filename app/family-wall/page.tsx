"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/context/auth-context"
import {
  Bell, Calendar, Image, ShieldAlert, Heart, Share2, Paperclip,
  Clock, FileText, Sparkles, AlertTriangle, Download,
  BookOpen, UtensilsCrossed, Bus, ChevronRight, Megaphone,
  CheckCheck, Filter,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================
// TYPES & CONFIG
// ============================================

type PostCategory = "TODOS" | "URGENTE" | "EVENTO" | "ACADEMICO"

interface Publicacion {
  id: number
  type: "ANUNCIO" | "EVENTO" | "COMUNICADO"
  category: PostCategory
  tag: string
  title: string
  content: string
  date: string
  author: string
  authorRole: string
  likes: number
  urgent?: boolean
  hasImage?: boolean
  hasAttachment?: boolean
}

const TYPE_CONFIG = {
  ANUNCIO: {
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: AlertTriangle,
  },
  EVENTO: {
    color: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20",
    icon: Sparkles,
  },
  COMUNICADO: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: FileText,
  },
}

const CATEGORY_CONFIG: Record<PostCategory, { label: string; dot: string; activeBg: string; activeText: string }> = {
  TODOS:     { label: "Todos",            dot: "bg-white/40",   activeBg: "bg-white/10 border-white/20",           activeText: "text-[#e4e1ea]" },
  URGENTE:   { label: "Alertas Urgentes", dot: "bg-red-400",    activeBg: "bg-red-500/10 border-red-500/25",        activeText: "text-red-300" },
  EVENTO:    { label: "Eventos",          dot: "bg-[#d0bcff]",  activeBg: "bg-[#d0bcff]/10 border-[#d0bcff]/25",   activeText: "text-[#d0bcff]" },
  ACADEMICO: { label: "Academico",        dot: "bg-blue-400",   activeBg: "bg-blue-500/10 border-blue-500/25",      activeText: "text-blue-300" },
}

// ============================================
// MOCK DATA
// ============================================

const PUBLICACIONES_MOCK: Publicacion[] = [
  {
    id: 1,
    type: "ANUNCIO",
    category: "URGENTE",
    tag: "Alerta Urgente",
    title: "Cronograma de Examenes Trimestrales",
    content: "Se encuentran disponibles las fechas correspondientes al cierre del primer trimestre. Recordamos que los alumnos deben presentarse con el uniforme institucional completo y su libreta sanitaria al dia.",
    date: "Hoy, 09:15",
    author: "Secretaria Academica",
    authorRole: "Secretaria",
    likes: 24,
    urgent: true,
  },
  {
    id: 2,
    type: "EVENTO",
    category: "EVENTO",
    tag: "Feria de Ciencias",
    title: "Muestra de Proyectos Tecnologicos 2026",
    content: "Queremos felicitar a los estudiantes de 4to Ano Secundaria por la excelente exposicion de robotica y desarrollo de software en el gimnasio central. Las fotografias estaran disponibles en el portal familiar esta semana.",
    date: "Ayer, 18:30",
    author: "Direccion de Estudios",
    authorRole: "Direccion",
    hasImage: true,
    likes: 156,
  },
  {
    id: 3,
    type: "COMUNICADO",
    category: "ACADEMICO",
    tag: "Transporte",
    title: "Modificacion del Recorrido de Combis",
    content: "A partir del lunes 27, el servicio de transporte escolar modificara su recorrido por la zona de Ranelagh debido a obras viales. Por favor revisen el nuevo horario adjunto antes del lunes.",
    date: "22 May, 14:00",
    author: "Administracion",
    authorRole: "Administracion",
    hasAttachment: true,
    likes: 45,
  },
  {
    id: 4,
    type: "COMUNICADO",
    category: "ACADEMICO",
    tag: "Notas",
    title: "Disponibles los Boletin del 1er Trimestre",
    content: "Los boletines del primer trimestre ya se encuentran disponibles en el portal. Podes acceder desde la seccion Boletin del menu de tu hijo/a. Cualquier consulta, contactar al preceptor correspondiente.",
    date: "20 May, 11:00",
    author: "Sistema de Gestion",
    authorRole: "Plataforma",
    likes: 88,
  },
]

const PROXIMOS_EVENTOS = [
  { id: 1, fecha: "27 Jun", label: "Cierre 1er Trimestre",   color: "text-red-400",     dot: "bg-red-500",     linea: "bg-red-500/40" },
  { id: 2, fecha: "04 Jul", label: "Acto Dia de la Bandera", color: "text-[#d0bcff]",   dot: "bg-[#d0bcff]",   linea: "bg-[#d0bcff]/40" },
  { id: 3, fecha: "18 Jul", label: "Inicio Vacaciones Inv.", color: "text-emerald-400", dot: "bg-emerald-500", linea: "bg-emerald-500/40" },
]

const ACCESOS_RAPIDOS = [
  { id: 1, label: "Reglamento Institucional", icon: BookOpen,        ext: "PDF" },
  { id: 2, label: "Menu del Comedor",          icon: UtensilsCrossed, ext: "PDF" },
  { id: 3, label: "Recorridos de Transporte",  icon: Bus,             ext: "PDF" },
]

// ============================================
// POST CARD — Estilo Foro Moderno
// ============================================

interface PostCardProps {
  post: Publicacion
  isLiked: boolean
  isRead: boolean
  onLike: () => void
  onMarkRead: () => void
}

function PostCard({ post, isLiked, isRead, onLike, onMarkRead }: PostCardProps) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon
  // Avatar: dos primeras iniciales del autor
  const initials = post.author.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <article className={cn(
      "group rounded-2xl border transition-all duration-300 overflow-hidden",
      post.urgent
        ? "bg-red-500/[0.03] border-red-500/30 hover:border-red-500/45"
        : "bg-white/[0.025] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.035]",
      isRead && "opacity-70"
    )}>
      {/* Franja de urgencia */}
      {post.urgent && (
        <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
      )}

      {/* Imagen de cabecera */}
      {post.hasImage && (
        <div className="aspect-[16/5] bg-gradient-to-br from-[#d0bcff]/8 via-[#0e0e16] to-[#4de082]/8 relative border-b border-white/[0.04]">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="size-8 text-white/10" />
          </div>
          <span className="absolute bottom-2 right-3 text-[10px] bg-black/50 px-2 py-0.5 rounded text-white/40 backdrop-blur-sm font-mono">
            galeria_proyectos.jpg
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Fila superior: avatar + meta + badge */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar institucional */}
          <div className={cn(
            "size-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border",
            post.urgent
              ? "bg-red-500/15 text-red-400 border-red-500/20"
              : "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/15"
          )}>
            {initials}
          </div>

          {/* Autor + fecha */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-bold text-[#e4e1ea] leading-tight truncate">{post.author}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-white/35">{post.authorRole}</span>
              <span className="text-white/15 text-[10px]">·</span>
              <div className="flex items-center gap-1 text-[11px] text-white/25">
                <Clock className="size-2.5" />
                {post.date}
              </div>
            </div>
          </div>

          {/* Badge de categoría — pegado arriba a la derecha */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider font-bold h-5 shrink-0 gap-1",
              config.color
            )}
          >
            <Icon className="size-2.5" />
            {post.tag}
          </Badge>
        </div>

        {/* Cuerpo del post */}
        <div className="space-y-2 mb-4">
          <h2 className="text-[15px] font-bold text-[#e4e1ea] tracking-tight leading-snug">
            {post.title}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Adjunto */}
        {post.hasAttachment && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-4 group/att">
            <Paperclip className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-white/45 flex-1 truncate font-mono">recorrido_transporte_v2.pdf</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info("Descargando adjunto...")}
              className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 shrink-0"
            >
              <Download className="size-3" />
              Descargar
            </Button>
          </div>
        )}

        {/* Pie del post: acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                isLiked
                  ? "bg-[#d0bcff]/15 text-[#d0bcff]"
                  : "text-white/30 hover:text-[#d0bcff] hover:bg-white/[0.04]"
              )}
            >
              <Heart className={cn("size-3.5 transition-transform", isLiked && "fill-current scale-110")} />
              <span>{post.likes + (isLiked ? 1 : 0)}</span>
            </button>

            {/* Marcar como leido */}
            <button
              onClick={onMarkRead}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                isRead
                  ? "text-emerald-400/70"
                  : "text-white/30 hover:text-emerald-400 hover:bg-white/[0.04]"
              )}
            >
              <CheckCheck className="size-3.5" />
              <span>{isRead ? "Leido" : "Marcar leido"}</span>
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all">
            <Share2 className="size-3.5" />
            Compartir
          </button>
        </div>
      </div>
    </article>
  )
}

// ============================================
// SIDEBAR IZQUIERDA — Categorias (menú vertical)
// ============================================

function SidebarCategorias({ active, onChange, counts }: {
  active: PostCategory
  onChange: (c: PostCategory) => void
  counts: Record<PostCategory, number>
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
        <Filter className="size-3.5 text-white/40" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Filtrar Muro</h3>
      </div>

      {/* Menú vertical */}
      <nav className="p-2 space-y-0.5">
        {(Object.keys(CATEGORY_CONFIG) as PostCategory[]).map(cat => {
          const { label, dot, activeBg, activeText } = CATEGORY_CONFIG[cat]
          const isActive = active === cat
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border",
                isActive
                  ? cn(activeBg, activeText)
                  : "bg-transparent border-transparent text-white/40 hover:bg-white/[0.03] hover:text-white/60 hover:border-white/[0.05]"
              )}
            >
              <span className={cn("size-2 rounded-full shrink-0", dot)} />
              <span className="flex-1 text-left text-[13px]">{label}</span>
              <span className={cn(
                "text-[11px] font-mono px-1.5 py-0.5 rounded-md",
                isActive ? "bg-white/15 text-current" : "bg-white/[0.04] text-white/25"
              )}>
                {counts[cat]}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Tip de uso */}
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Filtra las publicaciones por categoria para ver solo lo que te interesa.
        </p>
      </div>
    </div>
  )
}

// ============================================
// SIDEBAR DERECHA — Widgets de contexto
// ============================================

function WidgetEventos() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-white/40" />
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Proximos Eventos</h3>
        </div>
        <button className="text-[10px] text-[#d0bcff]/50 hover:text-[#d0bcff] transition-colors flex items-center gap-0.5">
          Ver todos <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="p-2">
        {PROXIMOS_EVENTOS.map(evt => {
          const [dia, mes] = evt.fecha.split(" ")
          return (
            <div
              key={evt.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              {/* Bloque de fecha */}
              <div className={cn(
                "w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0",
                "bg-white/[0.02] border-white/[0.06]"
              )}>
                <span className="text-[10px] font-semibold text-white/30 leading-none uppercase">{mes}</span>
                <span className="text-base font-black text-[#e4e1ea] leading-tight">{dia}</span>
              </div>

              {/* Linea de color + label */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn("w-0.5 h-8 rounded-full shrink-0", evt.linea)} />
                <p className={cn("text-[13px] font-medium leading-snug", evt.color)}>
                  {evt.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WidgetAccesos() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
        <Download className="size-3.5 text-white/40" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Accesos Rapidos</h3>
      </div>

      <div className="p-2 space-y-0.5">
        {ACCESOS_RAPIDOS.map(acc => {
          const Icon = acc.icon
          return (
            <button
              key={acc.id}
              onClick={() => toast.info(`Descargando: ${acc.label}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group text-left"
            >
              <div className="size-8 rounded-lg bg-[#d0bcff]/8 border border-[#d0bcff]/12 flex items-center justify-center shrink-0">
                <Icon className="size-3.5 text-[#d0bcff]/60 group-hover:text-[#d0bcff]/80 transition-colors" />
              </div>
              <span className="text-[13px] text-white/50 group-hover:text-white/75 transition-colors flex-1 leading-tight">
                {acc.label}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 shrink-0 border border-white/[0.06]">
                {acc.ext}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function FamilyWallPage() {
  const { activeContext } = useAuth()
  const [mounted, setMounted]           = useState(false)
  const [likedPosts, setLikedPosts]     = useState<Record<number, boolean>>({})
  const [readPosts, setReadPosts]       = useState<Record<number, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<PostCategory>("TODOS")

  const currentRole = activeContext?.role || null

  useEffect(() => { setMounted(true) }, [])

  const handleLike = useCallback((postId: number) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    if (!likedPosts[postId]) toast.success("Guardado en favoritos")
  }, [likedPosts])

  const handleMarkRead = useCallback((postId: number) => {
    setReadPosts(prev => {
      const next = { ...prev, [postId]: !prev[postId] }
      toast.success(next[postId] ? "Marcado como leido" : "Marcado como no leido")
      return next
    })
  }, [])

  if (!mounted) return null

  if (currentRole !== "FAMILIA" && currentRole !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#e4e1ea]">Acceso Restringido</p>
          <p className="text-sm text-white/40 mt-1">Esta vista es exclusiva para cuentas de tipo Familia.</p>
        </div>
      </div>
    )
  }

  const filtered = activeCategory === "TODOS"
    ? PUBLICACIONES_MOCK
    : PUBLICACIONES_MOCK.filter(p => p.category === activeCategory)

  // Conteos por categoria para las badges del sidebar
  const counts = (Object.keys(CATEGORY_CONFIG) as PostCategory[]).reduce((acc, cat) => {
    acc[cat] = cat === "TODOS"
      ? PUBLICACIONES_MOCK.length
      : PUBLICACIONES_MOCK.filter(p => p.category === cat).length
    return acc
  }, {} as Record<PostCategory, number>)

  return (
    <div className="min-h-full">
      {/* ── Contenedor centrado ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 py-6 space-y-6">

        {/* ── Page Header ───────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-8 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center">
                <Megaphone className="size-4 text-[#d0bcff]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">Comunidad Educativa</h1>
            </div>
            <p className="text-sm text-white/35 ml-0.5">
              Muro digital e informacion compartida por la institucion
            </p>
          </div>
          <button className="relative p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-white/40" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </header>

        {/* ── Grid 3 columnas ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative items-start">

          {/* ── COL IZQUIERDA: Categorias (sticky) — md:col-span-3 ─────── */}
          <aside className="md:col-span-3 sticky top-24 h-fit space-y-4 order-2 md:order-1">
            <SidebarCategorias
              active={activeCategory}
              onChange={setActiveCategory}
              counts={counts}
            />

            {/* Mini-stats */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
              <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Actividad del Muro</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Publicaciones", value: PUBLICACIONES_MOCK.length.toString() },
                  { label: "Leidas",        value: Object.values(readPosts).filter(Boolean).length.toString() },
                  { label: "Favoritos",     value: Object.values(likedPosts).filter(Boolean).length.toString() },
                  { label: "Sin leer",      value: (PUBLICACIONES_MOCK.length - Object.values(readPosts).filter(Boolean).length).toString() },
                ].map(stat => (
                  <div key={stat.label} className="text-center py-2 px-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-lg font-black text-[#e4e1ea]">{stat.value}</p>
                    <p className="text-[10px] text-white/25 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── COL CENTRAL: Feed (fluye hacia abajo) — md:col-span-6 ──── */}
          <main className="md:col-span-6 space-y-4 order-1 md:order-2">
            {/* Sub-header del feed */}
            <div className="flex items-center justify-between h-8">
              <p className="text-xs text-white/25 font-mono">
                {filtered.length} publicacion{filtered.length !== 1 ? "es" : ""}
                {activeCategory !== "TODOS" && (
                  <span className="text-[#d0bcff]/60"> · {CATEGORY_CONFIG[activeCategory].label}</span>
                )}
              </p>
              {activeCategory !== "TODOS" && (
                <button
                  onClick={() => setActiveCategory("TODOS")}
                  className="text-[11px] text-white/30 hover:text-white/55 transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
                <p className="text-sm text-white/25">No hay publicaciones en esta categoria.</p>
                <button
                  onClick={() => setActiveCategory("TODOS")}
                  className="mt-3 text-xs text-[#d0bcff]/50 hover:text-[#d0bcff] transition-colors"
                >
                  Ver todas las publicaciones
                </button>
              </div>
            ) : (
              filtered.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPosts[post.id] || false}
                  isRead={readPosts[post.id] || false}
                  onLike={() => handleLike(post.id)}
                  onMarkRead={() => handleMarkRead(post.id)}
                />
              ))
            )}

            {filtered.length > 0 && (
              <div className="text-center pt-2 pb-4">
                <button className="text-xs text-white/20 hover:text-white/40 transition-colors">
                  Cargar publicaciones anteriores...
                </button>
              </div>
            )}
          </main>

          {/* ── COL DERECHA: Contexto (sticky) — md:col-span-3 ─────────── */}
          <aside className="md:col-span-3 sticky top-24 h-fit space-y-4 order-3">
            <WidgetEventos />
            <WidgetAccesos />
          </aside>

        </div>
      </div>
    </div>
  )
}
