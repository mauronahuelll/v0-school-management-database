"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/context/auth-context"
import {
  Bell, Calendar, Image, ShieldAlert, Heart, Share2, Paperclip,
  Clock, FileText, Sparkles, AlertTriangle, Download,
  BookOpen, UtensilsCrossed, Bus, ChevronRight, Megaphone,
  CheckCheck, Filter, ExternalLink, HelpCircle, ArrowRight,
  PenSquare, Star,
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
    pillColor: "bg-red-500/15 text-red-300 border-red-500/25",
    icon: AlertTriangle,
  },
  EVENTO: {
    color: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20",
    pillColor: "bg-[#d0bcff]/15 text-[#d0bcff] border-[#d0bcff]/25",
    icon: Sparkles,
  },
  COMUNICADO: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pillColor: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    icon: FileText,
  },
}

const CATEGORY_PILLS: { key: PostCategory; label: string }[] = [
  { key: "TODOS",     label: "Todo el Muro" },
  { key: "URGENTE",   label: "Alertas" },
  { key: "EVENTO",    label: "Eventos" },
  { key: "ACADEMICO", label: "Academico" },
]

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
  { id: 1, dia: "27", mes: "JUN", label: "Cierre 1er Trimestre",   sub: "Entrega de libreta",        dot: "bg-red-500",     text: "text-[#e4e1ea]" },
  { id: 2, dia: "04", mes: "JUL", label: "Acto Dia de la Bandera", sub: "Campus Principal",           dot: "bg-[#d0bcff]",   text: "text-[#e4e1ea]" },
  { id: 3, dia: "18", mes: "JUL", label: "Inicio Vacaciones Inv.", sub: "Segundo Semestre",           dot: "bg-emerald-500", text: "text-[#e4e1ea]" },
]

const ACCIONES_PENDIENTES = [
  {
    id: "perm-1",
    label: "Permiso: Excursion al Observatorio",
    desc: "Salida educativa para el grupo de Fisica Avanzada. Incluye transporte y almuerzo.",
    cta: "Firmar Ahora",
    vence: "Vence en 2d",
    urgent: true,
  },
  {
    id: "pago-1",
    label: "Pago: Mensualidad Junio",
    desc: "Matricula y servicios digitales correspondientes al proximo mes escolar.",
    cta: "Gestionar Pago",
    vence: "Recurrente",
    urgent: false,
  },
]

// ============================================
// HERO CARD — Tarjeta principal grande
// ============================================

function HeroPostCard({
  post,
  isLiked,
  onLike,
}: {
  post: Publicacion
  isLiked: boolean
  onLike: () => void
}) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon

  return (
    <article className="relative rounded-3xl overflow-hidden border border-white/10 group cursor-pointer">
      {/* Fondo con gradiente simulando imagen de evento */}
      <div className="aspect-[16/9] relative bg-[#0d0d1a]">
        {/* Capas de gradiente para simular imagen de fondo vibrante */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0d1a] to-[#001a0d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(168,85,247,0.35)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(16,185,129,0.2)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />

        {/* Icono decorativo central */}
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none">
          <div className="opacity-10">
            <Sparkles className="size-48 text-purple-300" />
          </div>
        </div>

        {/* Overlay de gradiente para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Contenido superpuesto */}
        <div className="absolute inset-0 flex flex-col justify-end p-7">
          {/* Badges superiores */}
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase tracking-widest font-bold border gap-1 backdrop-blur-sm", config.pillColor)}
            >
              <Icon className="size-2.5" />
              {post.tag}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] text-white/60 border-white/20 bg-black/30 backdrop-blur-sm gap-1"
            >
              <Clock className="size-2.5" />
              {post.date}
            </Badge>
          </div>

          {/* Titulo grande */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight text-balance mb-3">
            {post.title}
          </h2>

          {/* Descripcion */}
          <p className="text-sm text-white/65 leading-relaxed max-w-xl mb-5 line-clamp-2">
            {post.content}
          </p>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-[#d0bcff]/90 hover:bg-[#d0bcff] text-[#0d0d1a] font-bold gap-2 rounded-xl border-0 shadow-lg shadow-purple-500/20"
            >
              Ver Mas
              <ArrowRight className="size-3.5" />
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); onLike() }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-sm border",
                isLiked
                  ? "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30"
                  : "bg-black/30 text-white/50 border-white/15 hover:text-[#d0bcff] hover:border-[#d0bcff]/30"
              )}
            >
              <Heart className={cn("size-3.5", isLiked && "fill-current")} />
              {post.likes + (isLiked ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ============================================
// MEDIA POST CARD — Tarjeta mediana con thumbnail
// ============================================

function MediaPostCard({
  post,
  isLiked,
  isRead,
  onLike,
  onMarkRead,
}: {
  post: Publicacion
  isLiked: boolean
  isRead: boolean
  onLike: () => void
  onMarkRead: () => void
}) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon

  // Paleta de gradiente por tipo de post para el thumbnail
  const thumbGradient = {
    ANUNCIO:    "from-red-950 via-[#0d0d1a] to-red-900/30",
    EVENTO:     "from-[#1a0533] via-[#0d0d1a] to-purple-900/30",
    COMUNICADO: "from-blue-950 via-[#0d0d1a] to-blue-900/30",
  }[post.type]

  return (
    <article className={cn(
      "group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5",
      post.urgent
        ? "bg-red-500/[0.04] border-red-500/25"
        : "bg-white/[0.025] border-white/[0.07]",
      isRead && "opacity-65"
    )}>
      {/* Thumbnail */}
      <div className={cn(
        "aspect-[16/9] relative bg-gradient-to-br",
        thumbGradient
      )}>
        {/* Glow decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(168,85,247,0.12)_0%,transparent_70%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="size-10 text-white/8" />
        </div>
        {/* Badge tipo en la imagen */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={cn("text-[10px] uppercase tracking-wider font-bold border gap-1 backdrop-blur-md", config.pillColor)}
          >
            <Icon className="size-2.5" />
            {post.tag}
          </Badge>
        </div>
        {/* Icono de adjunto si aplica */}
        {post.hasAttachment && (
          <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
            <Paperclip className="size-3 text-blue-300" />
          </div>
        )}
        {/* Franja urgente */}
        {post.urgent && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
        )}
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1 space-y-1.5">
          <h3 className="text-sm font-bold text-[#e4e1ea] leading-snug tracking-tight line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs text-white/45 leading-relaxed line-clamp-3">
            {post.content}
          </p>
        </div>

        {/* Pie: fecha + acciones */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
          <span className="text-[11px] text-white/30 flex items-center gap-1">
            <Clock className="size-3" />
            {post.date}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1 p-1.5 rounded-lg text-[11px] font-medium transition-all",
                isLiked
                  ? "text-[#d0bcff]"
                  : "text-white/30 hover:text-[#d0bcff] hover:bg-white/[0.04]"
              )}
            >
              <Heart className={cn("size-3.5", isLiked && "fill-current")} />
              <span>{post.likes + (isLiked ? 1 : 0)}</span>
            </button>
            <button
              onClick={onMarkRead}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isRead
                  ? "text-emerald-400/60"
                  : "text-white/25 hover:text-emerald-400 hover:bg-white/[0.04]"
              )}
              title={isRead ? "Leido" : "Marcar como leido"}
            >
              <CheckCheck className="size-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all">
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ============================================
// STANDARD POST CARD — Lista vertical
// ============================================

function ListPostCard({
  post,
  isLiked,
  isRead,
  onLike,
  onMarkRead,
}: {
  post: Publicacion
  isLiked: boolean
  isRead: boolean
  onLike: () => void
  onMarkRead: () => void
}) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon

  return (
    <article className={cn(
      "group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-white/12",
      post.urgent
        ? "bg-red-500/[0.04] border-red-500/25"
        : "bg-white/[0.025] border-white/[0.07]",
      isRead && "opacity-65"
    )}>
      {/* Icono tipo */}
      <div className={cn(
        "size-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
        config.color
      )}>
        <Icon className="size-4.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-[#e4e1ea] leading-snug tracking-tight line-clamp-1 flex-1">
            {post.title}
          </h3>
          <span className="text-[11px] text-white/30 shrink-0 flex items-center gap-1">
            <Clock className="size-3" />
            {post.date}
          </span>
        </div>
        <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-2 pt-1.5">
          <Badge variant="outline" className={cn("text-[10px] border h-4.5 gap-1", config.color)}>
            <Icon className="size-2.5" />
            {post.tag}
          </Badge>
          <span className="text-[10px] text-white/25">{post.author}</span>

          {post.hasAttachment && (
            <button
              onClick={() => toast.info("Descargando adjunto...")}
              className="ml-auto flex items-center gap-1 text-[11px] text-blue-400/60 hover:text-blue-400 transition-colors"
            >
              <Download className="size-3" />
              Adjunto
            </button>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all",
                isLiked ? "text-[#d0bcff]" : "text-white/25 hover:text-[#d0bcff] hover:bg-white/[0.04]"
              )}
            >
              <Heart className={cn("size-3.5", isLiked && "fill-current")} />
              {post.likes + (isLiked ? 1 : 0)}
            </button>
            <button
              onClick={onMarkRead}
              className={cn(
                "p-1.5 rounded-lg text-[11px] transition-all",
                isRead ? "text-emerald-400/60" : "text-white/25 hover:text-emerald-400 hover:bg-white/[0.04]"
              )}
            >
              <CheckCheck className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ============================================
// SIDEBAR — Centro de Accion
// ============================================

function CentroDeAccion() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <h3 className="text-sm font-bold text-[#e4e1ea] tracking-tight">Centro de Accion</h3>
        <Badge
          variant="outline"
          className="text-[10px] font-bold bg-red-500/15 text-red-400 border-red-500/30"
        >
          {ACCIONES_PENDIENTES.length} PENDIENTES
        </Badge>
      </div>

      <div className="p-3 space-y-3">
        {ACCIONES_PENDIENTES.map((accion) => (
          <div
            key={accion.id}
            className={cn(
              "rounded-xl border p-4 space-y-3",
              accion.urgent
                ? "bg-[#d0bcff]/[0.04] border-[#d0bcff]/20"
                : "bg-white/[0.02] border-white/[0.06]"
            )}
          >
            {/* Vencimiento */}
            <div className="flex items-center justify-between">
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center border shrink-0",
                accion.urgent
                  ? "bg-[#d0bcff]/10 border-[#d0bcff]/20"
                  : "bg-emerald-500/10 border-emerald-500/20"
              )}>
                {accion.urgent
                  ? <PenSquare className="size-3.5 text-[#d0bcff]" />
                  : <Star className="size-3.5 text-emerald-400" />
                }
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                accion.urgent
                  ? "bg-red-500/10 text-red-400"
                  : "bg-white/[0.04] text-white/35"
              )}>
                {accion.vence}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-[#e4e1ea] leading-snug">{accion.label}</p>
              <p className="text-xs text-white/45 leading-relaxed">{accion.desc}</p>
            </div>

            <Button
              size="sm"
              onClick={() => toast.success(`Accion: ${accion.cta}`)}
              className={cn(
                "w-full gap-2 font-semibold border",
                accion.urgent
                  ? "bg-[#d0bcff]/15 hover:bg-[#d0bcff]/25 text-[#d0bcff] border-[#d0bcff]/25"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border-white/10"
              )}
              variant="outline"
            >
              {accion.cta}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SIDEBAR — Proximas Fechas
// ============================================

function ProximasFechas() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
          Proximas Fechas
        </p>
        <button className="text-[10px] text-[#d0bcff]/50 hover:text-[#d0bcff] transition-colors flex items-center gap-0.5">
          Ver todo <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="p-3 space-y-1">
        {PROXIMOS_EVENTOS.map((evt) => (
          <div
            key={evt.id}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            {/* Bloque de fecha tipo calendar */}
            <div className="w-10 flex flex-col items-center justify-center shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.02] py-1">
              <span className="text-[9px] font-bold text-white/30 uppercase leading-none">{evt.mes}</span>
              <span className="text-base font-black text-[#e4e1ea] leading-tight">{evt.dia}</span>
            </div>

            {/* Separador de color */}
            <div className={cn("w-0.5 h-7 rounded-full shrink-0", evt.dot, "opacity-60")} />

            {/* Etiqueta */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#e4e1ea] leading-tight truncate">{evt.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{evt.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SIDEBAR — Ayuda y soporte
// ============================================

function WidgetAyuda() {
  return (
    <div className="rounded-2xl border border-[#d0bcff]/15 bg-[#d0bcff]/[0.03] overflow-hidden p-5">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center shrink-0">
          <HelpCircle className="size-4 text-[#d0bcff]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#e4e1ea] leading-tight">Necesitas ayuda?</p>
          <p className="text-xs text-white/45 leading-relaxed mt-1">
            Contacta directamente con el tutor de tu hijo/a o soporte tecnico.
          </p>
          <button
            onClick={() => toast.info("Abriendo chat de soporte...")}
            className="mt-3 text-xs text-[#d0bcff] hover:text-[#e8d5ff] font-semibold flex items-center gap-1 transition-colors"
          >
            Contactar tutor
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function FamilyWallPage() {
  const { activeContext } = useAuth()
  const [mounted, setMounted]               = useState(false)
  const [likedPosts, setLikedPosts]         = useState<Record<number, boolean>>({})
  const [readPosts, setReadPosts]           = useState<Record<number, boolean>>({})
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

  // Hero = primera publicacion de tipo EVENTO, o la primera disponible
  const heroPost = filtered.find(p => p.type === "EVENTO") ?? filtered[0]
  // Medianas = las siguientes 2 con hasImage o las 2 siguientes al hero
  const restPosts = filtered.filter(p => p.id !== heroPost?.id)
  const mediaPosts = restPosts.slice(0, 2)
  const listPosts  = restPosts.slice(2)

  return (
    <div className="min-h-full">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center shrink-0">
              <Megaphone className="size-4 text-[#d0bcff]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#e4e1ea] leading-tight">Panel Familiar</h1>
              <p className="text-xs text-white/35">Comunicaciones y novedades de la institucion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros pill — reemplazan el sidebar de categorias */}
            <nav className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {CATEGORY_PILLS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                    activeCategory === key
                      ? "bg-[#d0bcff]/20 text-[#d0bcff] border border-[#d0bcff]/25"
                      : "text-white/40 hover:text-white/65 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Campana notificaciones */}
            <button className="relative p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
              <Bell className="size-4 text-white/40" />
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </header>

        {/* ── Grid asimetrico: columna principal (7) + sidebar (5) ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── COLUMNA PRINCIPAL ──────────────────────────────────────── */}
          <main className="lg:col-span-7 space-y-4">

            {filtered.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
                <p className="text-sm text-white/25">No hay publicaciones en esta categoria.</p>
                <button
                  onClick={() => setActiveCategory("TODOS")}
                  className="mt-3 text-xs text-[#d0bcff]/50 hover:text-[#d0bcff] transition-colors"
                >
                  Ver todas
                </button>
              </div>
            ) : (
              <>
                {/* Hero card */}
                {heroPost && (
                  <HeroPostCard
                    post={heroPost}
                    isLiked={likedPosts[heroPost.id] || false}
                    onLike={() => handleLike(heroPost.id)}
                  />
                )}

                {/* Grid 2 columnas de tarjetas medianas */}
                {mediaPosts.length > 0 && (
                  <div className={cn(
                    "grid gap-4",
                    mediaPosts.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                  )}>
                    {mediaPosts.map(post => (
                      <MediaPostCard
                        key={post.id}
                        post={post}
                        isLiked={likedPosts[post.id] || false}
                        isRead={readPosts[post.id] || false}
                        onLike={() => handleLike(post.id)}
                        onMarkRead={() => handleMarkRead(post.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Resto en lista vertical */}
                {listPosts.length > 0 && (
                  <div className="space-y-3">
                    {listPosts.map(post => (
                      <ListPostCard
                        key={post.id}
                        post={post}
                        isLiked={likedPosts[post.id] || false}
                        isRead={readPosts[post.id] || false}
                        onLike={() => handleLike(post.id)}
                        onMarkRead={() => handleMarkRead(post.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Footer del feed */}
                <div className="text-center pt-1 pb-2">
                  <button className="text-xs text-white/20 hover:text-white/40 transition-colors">
                    Cargar publicaciones anteriores...
                  </button>
                </div>
              </>
            )}
          </main>

          {/* ── SIDEBAR DERECHA ────────────────────────────────────────── */}
          <aside className="hidden lg:flex lg:col-span-5 flex-col gap-4 sticky top-24">
            <CentroDeAccion />
            <ProximasFechas />
            <WidgetAyuda />
          </aside>

        </div>
      </div>
    </div>
  )
}
