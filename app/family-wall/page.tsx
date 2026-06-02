"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { 
  Bell, Calendar, Image, ShieldAlert, Heart, Share2, Paperclip, 
  Clock, User, FileText, Sparkles, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================
// TYPES & CONFIG
// ============================================

interface Publicacion {
  id: number
  type: "ANUNCIO" | "EVENTO" | "COMUNICADO"
  tag: string
  title: string
  content: string
  date: string
  author: string
  likes: number
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

// ============================================
// MOCK DATA
// ============================================

const PUBLICACIONES_MOCK: Publicacion[] = [
  {
    id: 1,
    type: "ANUNCIO",
    tag: "Importante",
    title: "Cronograma de Examenes Trimestrales",
    content: "Se encuentran disponibles las fechas correspondientes al cierre del primer trimestre. Recordamos que los alumnos deben presentarse con el uniforme institucional completo.",
    date: "Hoy, 09:15",
    author: "Secretaria Academica",
    likes: 24,
  },
  {
    id: 2,
    type: "EVENTO",
    tag: "Feria de Ciencias",
    title: "Muestra de Proyectos Tecnologicos 2026",
    content: "Queremos felicitar a los estudiantes de 4to Ano Secundaria por la excelente exposicion de robotica y desarrollo de software realizada en el gimnasio central.",
    date: "Ayer, 18:30",
    author: "Direccion de Estudios",
    hasImage: true,
    likes: 156,
  },
  {
    id: 3,
    type: "COMUNICADO",
    tag: "Transporte",
    title: "Modificacion del Recorrido de Combis",
    content: "A partir del lunes 27, el servicio de transporte escolar modificara su recorrido por la zona de Ranelagh debido a obras viales. Por favor revisen el nuevo horario adjunto.",
    date: "22 May, 14:00",
    author: "Administracion",
    hasAttachment: true,
    likes: 45,
  },
]

// ============================================
// POST CARD COMPONENT (Premium Design)
// ============================================

interface PostCardProps {
  post: Publicacion
  isLiked: boolean
  onLike: () => void
}

function PostCard({ post, isLiked, onLike }: PostCardProps) {
  const config = TYPE_CONFIG[post.type]
  const Icon = config.icon

  return (
    <article className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-white/10 transition-all duration-300">
      {/* Image Header */}
      {post.hasImage && (
        <div className="aspect-[2.5/1] bg-gradient-to-br from-[#d0bcff]/10 via-transparent to-[#4de082]/10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="size-12 text-white/10" />
          </div>
          <span className="absolute bottom-3 right-3 text-[10px] bg-black/60 px-2 py-1 rounded-md text-white/60 backdrop-blur-md font-mono">
            galeria_proyectos.jpg
          </span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", config.color)}>
            <Icon className="size-3 mr-1" />
            {post.tag}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Clock className="size-3" />
            {post.date}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-[#e4e1ea] tracking-tight leading-tight">
            {post.title}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Attachment */}
        {post.hasAttachment && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 w-fit">
            <Paperclip className="size-4 text-blue-400" />
            <span className="text-xs text-white/50">recorrido_transporte_v2.pdf</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300">
              Descargar
            </Button>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <div className="size-6 rounded-full bg-white/5 flex items-center justify-center">
            <User className="size-3 text-white/40" />
          </div>
          <span className="text-xs text-[#d0bcff]/80 font-medium">{post.author}</span>
        </div>

        {/* Interaction - ONLY Like for FAMILIA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Like Button - Changes to purple on click */}
          <button 
            onClick={onLike}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              isLiked 
                ? "bg-[#d0bcff]/15 text-[#d0bcff] scale-105" 
                : "text-white/40 hover:text-[#d0bcff] hover:bg-white/5"
            )}
          >
            <Heart className={cn(
              "size-5 transition-transform",
              isLiked && "fill-current scale-110"
            )} />
            <span>{post.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <Button variant="ghost" size="sm" className="text-xs text-white/30 hover:text-white/50 gap-1.5">
            <Share2 className="size-4" />
            Compartir
          </Button>
        </div>
      </div>
    </article>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function FamilyWallPage() {
  const { activeContext } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({})

  const currentRole = activeContext?.role || null

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLike = useCallback((postId: number) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    if (!likedPosts[postId]) {
      toast.success("Marcaste como favorito", {
        description: "La publicacion se guardo en tus favoritos",
      })
    }
  }, [likedPosts])

  if (!mounted) return null

  // Access restriction - Only FAMILIA and ADMIN can view
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">Comunidad Educativa</h1>
          <p className="text-sm text-white/40 mt-1">
            Muro digital e informacion compartida por la institucion
          </p>
        </div>
        <button className="relative p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
          <Bell className="w-5 h-5 text-white/40" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </header>

      {/* Read-Only Mode Notice */}
      {currentRole === "FAMILIA" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/10">
          <Heart className="size-5 text-[#d0bcff]" />
          <p className="text-sm text-white/50">
            Podes marcar publicaciones como favoritas tocando el <span className="text-[#d0bcff] font-medium">corazon</span>
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-[#d0bcff] text-xs font-medium hover:bg-[#d0bcff]/20 transition-colors">
          <Calendar className="w-4 h-4" /> Calendario
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-white/50 text-xs font-medium hover:bg-white/[0.05] transition-colors">
          <Paperclip className="w-4 h-4" /> Documentos
        </button>
      </div>

      {/* Feed - Premium Post Cards */}
      <div className="space-y-4">
        {PUBLICACIONES_MOCK.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPosts[post.id] || false}
            onLike={() => handleLike(post.id)}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <button className="text-sm text-white/30 hover:text-white/50 transition-colors">
          Cargar publicaciones anteriores...
        </button>
      </div>
    </div>
  )
}
