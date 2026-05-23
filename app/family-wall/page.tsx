"use client"

import { useAuth } from "@/lib/context/auth-context"
import { Bell, Calendar, Image, MessageSquare, ShieldAlert, Heart, Share2, Paperclip } from "lucide-react"

const PUBLICACIONES_MOCK = [
  {
    id: 1,
    type: "ANUNCIO",
    tag: "Importante",
    title: "Cronograma de Examenes Trimestrales",
    content: "Se encuentran disponibles las fechas correspondientes al cierre del primer trimestre. Recordamos que los alumnos deben presentarse con el uniforme institucional completo.",
    date: "Hoy, 09:15",
    author: "Secretaria Academica",
    likes: 24,
    comments: 8,
  },
  {
    id: 2,
    type: "EVENTO",
    tag: "Feria de Ciencias",
    title: "Muestra de Proyectos Tecnologicos 2026",
    content: "Queremos felicitar a los estudiantes de 4to Anio Secundaria por la excelente exposicion de robotica y desarrollo de software realizada en el gimnasio central.",
    date: "Ayer, 18:30",
    author: "Direccion de Estudios",
    hasImage: true,
    likes: 156,
    comments: 32,
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
    comments: 12,
  },
]

export default function FamilyWallPage() {
  const { role } = useAuth()

  if (role !== "FAMILIA" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 py-20">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">Acceso Restringido</p>
          <p className="text-sm text-muted-foreground mt-1">No tenes permisos para visualizar el Muro de la Comunidad.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Comunidad Educativa</h1>
          <p className="text-sm text-muted-foreground mt-1">Muro digital e informacion compartida por la institucion</p>
        </div>
        <button className="relative p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center">3</span>
        </button>
      </header>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
          <Calendar className="w-4 h-4" /> Calendario
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-muted-foreground text-xs font-medium hover:bg-white/[0.05] transition-colors">
          <Paperclip className="w-4 h-4" /> Documentos
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {PUBLICACIONES_MOCK.map((post) => (
          <article 
            key={post.id} 
            className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-primary/20 transition-all space-y-4"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider ${
                  post.type === "ANUNCIO" 
                    ? "bg-destructive/10 text-destructive border border-destructive/20" 
                    : post.type === "EVENTO"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary/10 text-secondary border border-secondary/20"
                }`}>
                  {post.tag}
                </span>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <p className="text-[11px] font-medium text-primary/80 font-mono">{post.author}</p>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground tracking-tight">{post.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
            </div>

            {/* Post Image Placeholder */}
            {post.hasImage && (
              <div className="aspect-video w-full rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <Image className="w-10 h-10 text-white/10 group-hover:scale-110 transition-transform" />
                <span className="absolute bottom-3 right-3 text-[10px] bg-black/60 px-2 py-1 rounded-md text-white/60 backdrop-blur-md font-mono">
                  galeria_proyectos.jpg
                </span>
              </div>
            )}

            {/* Attachment Indicator */}
            {post.hasAttachment && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 w-fit">
                <Paperclip className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">recorrido_transporte_v2.pdf</span>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <MessageSquare className="w-4 h-4" /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" /> Compartir
                </button>
              </div>
              <button className="text-xs text-primary hover:underline">
                Ver mas detalles
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cargar publicaciones anteriores...
        </button>
      </div>
    </div>
  )
}
