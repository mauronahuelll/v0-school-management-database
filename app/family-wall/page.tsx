"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/context/auth-context"
import {
  Bell, Calendar, Image, ShieldAlert, Heart, Share2, Paperclip,
  Clock, User, FileText, Sparkles, AlertTriangle, Download,
  BookOpen, UtensilsCrossed, Bus, ChevronRight, Megaphone,
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

const CATEGORY_CONFIG: Record<PostCategory, { label: string; dot: string }> = {
  TODOS:     { label: "Todos",           dot: "bg-white/30" },
  URGENTE:   { label: "Alertas Urgentes", dot: "bg-red-400" },
  EVENTO:    { label: "Eventos",          dot: "bg-[#d0bcff]" },
  ACADEMICO: { label: "Academico",        dot: "bg-blue-400" },
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
    content: "Se encuentran disponibles las fechas correspondientes al cierre del primer trimestre. Recordamos que los alumnos deben presentarse con el uniforme institucional completo y su libreta sanitaria.",
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
    content: "Queremos felicitar a los estudiantes de 4to Año Secundaria por la excelente exposicion de robotica y desarrollo de software realizada en el gimnasio central. Las fotografias estaran disponibles en el portal familiar.",
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
    content: "A partir del lunes 27, el servicio de transporte escolar modificara su recorrido por la zona de Ranelagh debido a obras viales. Por favor revisen el nuevo horario adjunto.",
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
    content: "Los boletines del primer trimestre ya se encuentran disponibles en el portal. Podes acceder desde la seccion 'Boletin' del menu de tu hijo/a. Cualquier consulta, contactar al preceptor correspondiente.",
    date: "20 May, 11:00",
    author: "Sistema de Gestion",
    authorRole: "Plataforma",
    likes: 88,
  },
]

const PROXIMOS_EVENTOS = [
  { id: 1, fecha: "27 Jun", label: "Cierre 1er Trimestre",   color: "text-red-400",     dot: "bg-red-500" },
  { id: 2, fecha: "04 Jul", label: "Acto Dia de la Bandera", color: "text-[#d0bcff]",   dot: "bg-[#d0bcff]" },
  { id: 3, fecha: "18 Jul", label: "Inicio Vacaciones Inv.", color: "text-emerald-400", dot: "bg-emerald-500" },
]

const ACCESOS_RAPIDOS = [
  { id: 1, label: "Reglamento Institucional", icon: BookOpen,       ext: "PDF" },
  { id: 2, label: "Menu del Comedor",         icon: UtensilsCrossed, ext: "PDF" },
  { id: 3, label: "Recorridos de Transporte", icon: Bus,            ext: "PDF" },
]

// ============================================
// POST CARD COMPONENT
// ============================================

interface PostCardProps {
  post: Publicacion
  isLiked: boolean
  onLike: () => void
}

function PostCard({ post, isLiked, onLike }: PostCardProps) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon
  const initials = post.author.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <article className={cn(
      "group rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300",
      post.urgent
        ? "bg-red-500/[0.03] border-red-500/30 hover:border-red-500/50"
        : "bg-white/[0.025] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.035]"
    )}>
      {/* Imagen de cabecera */}
      {post.hasImage && (
        <div className="aspect-[3/1] bg-gradient-to-br from-[#d0bcff]/10 via-[#0e0e16] to-[#4de082]/10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="size-10 text-white/10" />
          </div>
          <span className="absolute bottom-2.5 right-3 text-[10px] bg-black/60 px-2 py-1 rounded-md text-white/50 backdrop-blur-md font-mono">
            galeria_proyectos.jpg
          </span>
          {/* Franja urgente */}
          {post.urgent && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          )}
        </div>
      )}

      {/* Franja urgente sin imagen */}
      {post.urgent && !post.hasImage && (
        <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
      )}

      <div className="p-5">
        {/* Cabecera: avatar + autor + fecha + badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar institucional */}
            <div className={cn(
              "size-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
              post.urgent
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "bg-[#d0bcff]/10 text-[#d0bcff] border border-[#d0bcff]/15"
            )}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#e4e1ea] leading-tight truncate">{post.author}</p>
              <p className="text-[10px] text-white/30 leading-tight">{post.authorRole}</p>
            </div>
          </div>

          {/* Badge de categoría flotante + fecha */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold h-5", config.color)}>
              <Icon className="size-2.5 mr-1" />
              {post.tag}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-white/25">
              <Clock className="size-2.5" />
              {post.date}
            </div>
          </div>
        </div>

        {/* Cuerpo */}
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
            <Paperclip className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-white/50 flex-1 truncate">recorrido_transporte_v2.pdf</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 shrink-0">
              Descargar
            </Button>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <button
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              isLiked
                ? "bg-[#d0bcff]/15 text-[#d0bcff]"
                : "text-white/35 hover:text-[#d0bcff] hover:bg-white/5"
            )}
          >
            <Heart className={cn("size-4 transition-transform", isLiked && "fill-current scale-110")} />
            <span>{post.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <Button variant="ghost" size="sm" className="text-xs text-white/25 hover:text-white/50 gap-1.5 h-7">
            <Share2 className="size-3.5" />
            Compartir
          </Button>
        </div>
      </div>
    </article>
  )
}

// ============================================
// WIDGETS DE LA COLUMNA LATERAL
// ============================================

function WidgetCategorias({ active, onChange }: { active: PostCategory; onChange: (c: PostCategory) => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="size-3.5 text-white/40" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Categorias</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_CONFIG) as PostCategory[]).map(cat => {
          const { label, dot } = CATEGORY_CONFIG[cat]
          const isActive = active === cat
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                isActive
                  ? "bg-white/10 border-white/20 text-[#e4e1ea]"
                  : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/15 hover:text-white/60"
              )}
            >
              <span className={cn("size-1.5 rounded-full", dot)} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WidgetEventos() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-white/40" />
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Proximos Eventos</h3>
        </div>
        <button className="text-[10px] text-[#d0bcff]/50 hover:text-[#d0bcff] transition-colors flex items-center gap-0.5">
          Ver todos <ChevronRight className="size-3" />
        </button>
      </div>
      <div className="space-y-2">
        {PROXIMOS_EVENTOS.map(evt => (
          <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <div className="text-center shrink-0 w-10">
              <p className="text-[10px] text-white/30 leading-none">
                {evt.fecha.split(" ")[1]}
              </p>
              <p className="text-sm font-bold text-[#e4e1ea] leading-tight">
                {evt.fecha.split(" ")[0]}
              </p>
            </div>
            <div className={cn("w-px h-8 rounded-full shrink-0", evt.dot.replace("bg-", "bg-") )} />
            <p className="text-xs text-white/60 leading-snug flex-1">{evt.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WidgetAccesos() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Download className="size-3.5 text-white/40" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Accesos Rapidos</h3>
      </div>
      <div className="space-y-2">
        {ACCESOS_RAPIDOS.map(acc => {
          const Icon = acc.icon
          return (
            <button
              key={acc.id}
              onClick={() => toast.info(`Descargando: ${acc.label}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
            >
              <div className="size-7 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/15 flex items-center justify-center shrink-0">
                <Icon className="size-3.5 text-[#d0bcff]/70" />
              </div>
              <span className="text-xs text-white/55 group-hover:text-white/80 transition-colors flex-1 text-left leading-tight">
                {acc.label}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 shrink-0">
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
  const [mounted, setMounted] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<PostCategory>("TODOS")

  const currentRole = activeContext?.role || null

  useEffect(() => { setMounted(true) }, [])

  const handleLike = useCallback((postId: number) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    if (!likedPosts[postId]) {
      toast.success("Guardado en favoritos")
    }
  }, [likedPosts])

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

  return (
    <div className="w-full space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">Comunidad Educativa</h1>
          <p className="text-sm text-white/40 mt-1">
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

      {/* ── Aviso modo lectura (FAMILIA) ─────────────────────────────── */}
      {currentRole === "FAMILIA" && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/10">
          <Heart className="size-4 text-[#d0bcff] shrink-0" />
          <p className="text-sm text-white/50">
            Podes marcar publicaciones como favoritas tocando el{" "}
            <span className="text-[#d0bcff] font-medium">corazon</span>.
          </p>
        </div>
      )}

      {/* ── Grid asimétrico 8/4 ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Columna principal: el Muro (col-span-8) ─────────────────── */}
        <main className="lg:col-span-8 space-y-4">
          {/* Sub-header del feed */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30 font-mono">
              {filtered.length} publicacion{filtered.length !== 1 ? "es" : ""}
              {activeCategory !== "TODOS" ? ` · ${CATEGORY_CONFIG[activeCategory].label}` : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
              <p className="text-sm text-white/30">No hay publicaciones en esta categoria.</p>
            </div>
          ) : (
            filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={likedPosts[post.id] || false}
                onLike={() => handleLike(post.id)}
              />
            ))
          )}

          {filtered.length > 0 && (
            <div className="text-center pt-2">
              <button className="text-xs text-white/25 hover:text-white/45 transition-colors">
                Cargar publicaciones anteriores...
              </button>
            </div>
          )}
        </main>

        {/* ── Columna lateral: Widgets (col-span-4) ───────────────────── */}
        {/* En mobile aparece primero (order-first) para que el filtro quede arriba */}
        <aside className="lg:col-span-4 flex flex-col gap-4 order-first lg:order-last">
          <WidgetCategorias active={activeCategory} onChange={setActiveCategory} />
          <WidgetEventos />
          <WidgetAccesos />
        </aside>

      </div>
    </div>
  )
}
