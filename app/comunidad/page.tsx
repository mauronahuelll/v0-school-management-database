"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { motion } from "framer-motion"
import { 
  MessageSquare, Calendar, Image as ImageIcon, 
  ShieldAlert, Award, Heart, Share2, 
  Bell, Pin, Megaphone, BookOpen
} from "lucide-react"

const PUBLICACIONES_MOCK = [
  {
    id: 1,
    type: "ANUNCIO",
    tag: "Importante",
    pinned: true,
    title: "Cronograma de Examenes Trimestrales",
    content: "Se encuentran disponibles las fechas correspondientes al cierre del primer trimestre. Recordamos que los alumnos deben presentarse con el uniforme institucional completo. Las mesas de examen estaran habilitadas del 15 al 22 de mayo.",
    date: "Hoy, 09:15",
    author: "Secretaria Academica",
    likes: 24,
    comments: 8
  },
  {
    id: 2,
    type: "EVENTO",
    tag: "Feria de Ciencias",
    pinned: false,
    title: "Muestra de Proyectos Tecnologicos 2026",
    content: "Queremos felicitar a los estudiantes de 4to Ano Secundaria por la excelente exposicion de robotica y desarrollo de software realizada en el gimnasio central. Los proyectos presentados demostraron un alto nivel de innovacion y trabajo en equipo.",
    date: "Ayer, 18:30",
    author: "Direccion de Estudios",
    hasMedia: true,
    mediaType: "gallery",
    mediaCount: 12,
    likes: 156,
    comments: 42
  },
  {
    id: 3,
    type: "COMUNICADO",
    tag: "Institucional",
    pinned: false,
    title: "Entrega de Boletines del Primer Trimestre",
    content: "Se informa a los tutores que el proximo viernes se realizara la entrega formal de calificaciones. Las reuniones presenciales se coordinaran por franja horaria mediante el cuaderno de comunicaciones digital.",
    date: "Hace 2 dias",
    author: "Direccion Escolar",
    likes: 67,
    comments: 15
  },
  {
    id: 4,
    type: "ACTIVIDAD",
    tag: "Deportes",
    pinned: false,
    title: "Torneo Intercolegial de Voley",
    content: "Nuestro equipo femenino de voley obtuvo el segundo puesto en el torneo regional disputado en Quilmes. Felicitaciones a las jugadoras y al cuerpo tecnico por el excelente desempeno.",
    date: "Hace 3 dias",
    author: "Coordinacion Deportiva",
    hasMedia: true,
    mediaType: "image",
    likes: 89,
    comments: 23
  }
]

const PROXIMOS_EVENTOS = [
  { id: 1, titulo: "Reunion de Padres 4to Ano", fecha: "15 May", hora: "18:00" },
  { id: 2, titulo: "Feriado - Dia de la Patria", fecha: "25 May", hora: "Todo el dia" },
  { id: 3, titulo: "Cierre 1er Trimestre", fecha: "31 May", hora: "--" },
]

export default function ComunidadMuroPage() {
  const { role, schoolName } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>("todos")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Restringir acceso a FAMILIA y ADMIN
  if (role !== "FAMILIA" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-3">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium">Acceso Restringido</p>
        <p className="text-sm text-center max-w-md">
          Este canal esta reservado para el Portal Familiar. 
          Solo los tutores y administradores pueden acceder al Muro de la Comunidad.
        </p>
      </div>
    )
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "ANUNCIO":
        return { icon: Megaphone, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" }
      case "EVENTO":
        return { icon: Calendar, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" }
      case "COMUNICADO":
        return { icon: Bell, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" }
      case "ACTIVIDAD":
        return { icon: Award, color: "text-tertiary", bg: "bg-tertiary/10", border: "border-tertiary/20" }
      default:
        return { icon: MessageSquare, color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10" }
    }
  }

  const filteredPosts = activeFilter === "todos" 
    ? PUBLICACIONES_MOCK 
    : PUBLICACIONES_MOCK.filter(p => p.type === activeFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Muro de la Comunidad</h1>
            <p className="text-xs text-muted-foreground">{schoolName} | Comunicados y eventos institucionales</p>
          </div>
        </div>
      </motion.header>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-galactic">
        {[
          { id: "todos", label: "Todos" },
          { id: "ANUNCIO", label: "Anuncios" },
          { id: "EVENTO", label: "Eventos" },
          { id: "COMUNICADO", label: "Comunicados" },
          { id: "ACTIVIDAD", label: "Actividades" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeFilter === filter.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/[0.02] text-muted-foreground border border-white/5 hover:bg-white/5"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPosts.map((post, index) => {
            const config = getTypeConfig(post.type)
            const Icon = config.icon

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-2xl glass-panel hover:border-primary/20 transition-all space-y-4 ${
                  post.pinned ? "ring-1 ring-primary/20" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.pinned && (
                      <Pin className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
                      {post.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{post.date}</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary/70 font-medium">{post.author}</span>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-foreground tracking-tight">{post.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                </div>

                {/* Media Placeholder */}
                {post.hasMedia && (
                  <div className="aspect-video w-full rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <ImageIcon className="w-10 h-10 text-white/10 group-hover:scale-110 transition-transform" />
                    {post.mediaType === "gallery" && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] text-white/60 backdrop-blur-md font-mono">
                        +{post.mediaCount} fotos
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 text-[10px] bg-black/60 px-2 py-1 rounded text-white/40 backdrop-blur-md">
                      galeria_escolar_{post.id}.jpg
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Compartir</span>
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl glass-panel space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Proximos Eventos
            </h3>
            <div className="space-y-3">
              {PROXIMOS_EVENTOS.map((evento) => (
                <div key={evento.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold text-center min-w-[50px]">
                    {evento.fecha}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{evento.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{evento.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl glass-panel space-y-3"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Accesos Rapidos</h3>
            <div className="space-y-2">
              {[
                { icon: BookOpen, label: "Reglamento Escolar", href: "#" },
                { icon: Calendar, label: "Calendario Academico", href: "#" },
                { icon: Bell, label: "Configurar Notificaciones", href: "#" },
              ].map((link, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-white/[0.04] transition-all text-left"
                >
                  <link.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{link.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
