"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { 
  Users, Heart, Image as ImageIcon, Send, PlusCircle, FileText, X, 
  Calendar, User, Clock, Bookmark, MoreHorizontal, Sparkles, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface Post {
  id: number;
  type: "EVENTO" | "URGENTE" | "COMUNICADO" | "ACADEMICO";
  title: string;
  content: string;
  author: string;
  authorRole: string;
  timeAgo: string;
  likes: number;
  hasImage?: boolean;
  imagePreview?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    type: "EVENTO",
    title: "Feria de Innovacion 2026",
    content: "Invitamos a todas las familias a presenciar los proyectos finales de robotica y biotecnologia el proximo viernes 15 de Junio. El evento contara con demostraciones en vivo de los alumnos de 4to y 5to ano.",
    author: "Prof. Maria Elena Gonzalez",
    authorRole: "Direccion Academica",
    timeAgo: "Hace 2 horas",
    likes: 47,
    hasImage: true,
    imagePreview: "feria_innovacion_2026.jpg",
  },
  {
    id: 2,
    type: "URGENTE",
    title: "Suspension de Talleres - Mantenimiento Edilicio",
    content: "Por trabajos de mantenimiento en el sector de laboratorios, los talleres de la tarde se suspenden este viernes 8 de Junio. Las clases regulares se desarrollan con normalidad.",
    author: "Administracion",
    authorRole: "Secretaria",
    timeAgo: "Hace 5 horas",
    likes: 12,
  },
  {
    id: 3,
    type: "ACADEMICO",
    title: "Menu Nutricional del Mes de Junio",
    content: "Ya esta disponible la planificacion de almuerzos balanceados para el mes de Junio. Incluye opciones vegetarianas y sin TACC. Descargue el archivo adjunto para mas detalles.",
    author: "Lic. Carolina Mendez",
    authorRole: "Nutricion Escolar",
    timeAgo: "Ayer, 14:30",
    likes: 28,
    hasAttachment: true,
    attachmentName: "menu_junio_2026.pdf",
  },
  {
    id: 4,
    type: "COMUNICADO",
    title: "Reunion de Padres - Cierre de Trimestre",
    content: "Recordamos a las familias que el proximo martes 11 de Junio se llevara a cabo la reunion informativa sobre el cierre del primer trimestre. Horario: 18:00 a 20:00 hs.",
    author: "Equipo de Preceptores",
    authorRole: "Preceptoria",
    timeAgo: "22 May, 10:00",
    likes: 63,
  },
];

const POST_TYPE_CONFIG = {
  EVENTO: { 
    color: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20",
    label: "Evento Proximo",
    icon: Calendar,
  },
  URGENTE: { 
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Urgente",
    icon: AlertTriangle,
  },
  COMUNICADO: { 
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Comunicado",
    icon: Users,
  },
  ACADEMICO: { 
    color: "bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20",
    label: "Academico",
    icon: Sparkles,
  },
};

// ============================================
// POST CREATOR COMPONENT (Staff Only)
// ============================================

interface PostCreatorProps {
  onPublish: (content: string, hasImage: boolean, hasFile: boolean) => void;
  onCancel: () => void;
}

function PostCreator({ onPublish, onCancel }: PostCreatorProps) {
  const [content, setContent] = useState("");
  const [attachedImage, setAttachedImage] = useState(false);
  const [attachedFile, setAttachedFile] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!content.trim()) return;
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    onPublish(content, attachedImage, attachedFile);
    setIsPublishing(false);
  };

  return (
    <div className="rounded-2xl border border-[#d0bcff]/20 bg-[#d0bcff]/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-[#d0bcff]/20 flex items-center justify-center">
            <User className="size-4 text-[#d0bcff]" />
          </div>
          <span className="text-sm font-medium text-[#e4e1ea]">Nueva Publicacion</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="size-8 text-white/40 hover:text-white">
          <X className="size-4" />
        </Button>
      </div>

      {/* Content Area */}
      <Textarea
        placeholder="Escribe un comunicado para la comunidad educativa..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-white/[0.02] border-white/10 min-h-[120px] resize-none text-[#e4e1ea] placeholder:text-white/30"
      />

      {/* Image Preview (if attached) */}
      {attachedImage && (
        <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
          <div className="size-16 rounded-lg bg-gradient-to-br from-[#d0bcff]/20 to-[#d0bcff]/5 flex items-center justify-center border border-[#d0bcff]/20">
            <ImageIcon className="size-6 text-[#d0bcff]/60" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#e4e1ea]">imagen_evento.jpg</p>
            <p className="text-xs text-white/40">Vista previa lista para publicar</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setAttachedImage(false)}
            className="size-8 text-white/40 hover:text-red-400"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* File Preview (if attached) */}
      {attachedFile && (
        <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
          <div className="size-16 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <FileText className="size-6 text-blue-400/60" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#e4e1ea]">documento_clase.pdf</p>
            <p className="text-xs text-white/40">Archivo adjunto listo</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setAttachedFile(false)}
            className="size-8 text-white/40 hover:text-red-400"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAttachedImage(!attachedImage)}
            className={cn(
              "text-xs gap-1.5",
              attachedImage ? "text-[#d0bcff] bg-[#d0bcff]/10" : "text-white/50 hover:text-[#d0bcff]"
            )}
          >
            <ImageIcon className="size-4" /> 
            Adjuntar Foto
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAttachedFile(!attachedFile)}
            className={cn(
              "text-xs gap-1.5",
              attachedFile ? "text-blue-400 bg-blue-500/10" : "text-white/50 hover:text-blue-400"
            )}
          >
            <FileText className="size-4" /> 
            Subir Archivo
          </Button>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={!content.trim() || isPublishing}
          className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
        >
          {isPublishing ? (
            <span className="size-4 border-2 border-[#1b1b1f]/30 border-t-[#1b1b1f] rounded-full animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Publicar
        </Button>
      </div>
    </div>
  );
}

// ============================================
// POST CARD COMPONENT (Premium Design)
// ============================================

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  onLike: () => void;
  canInteract: boolean;
}

function PostCard({ post, isLiked, onLike, canInteract }: PostCardProps) {
  const config = POST_TYPE_CONFIG[post.type];
  const Icon = config.icon;

  return (
    <article className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-white/10 transition-all duration-300">
      {/* Image Header (if applicable) */}
      {post.hasImage && (
        <div className="aspect-[2.5/1] bg-gradient-to-br from-[#d0bcff]/10 via-transparent to-[#4de082]/10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="size-12 text-white/10" />
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-white/60 font-mono">{post.imagePreview}</span>
          </div>
          {/* Type Badge on Image */}
          <Badge 
            variant="outline" 
            className={cn("absolute top-4 left-4 text-[10px] uppercase tracking-wider font-bold", config.color)}
          >
            <Icon className="size-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Type Badge (if no image) */}
        {!post.hasImage && (
          <Badge 
            variant="outline" 
            className={cn("text-[10px] uppercase tracking-wider font-bold w-fit", config.color)}
          >
            <Icon className="size-3 mr-1" />
            {config.label}
          </Badge>
        )}

        {/* Title & Content */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#e4e1ea] tracking-tight leading-tight">
            {post.title}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Attachment */}
        {post.hasAttachment && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 w-fit">
            <FileText className="size-4 text-blue-400" />
            <span className="text-xs text-white/50">{post.attachmentName}</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300">
              Descargar
            </Button>
          </div>
        )}

        {/* Author & Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-white/5 flex items-center justify-center">
              <User className="size-3.5 text-white/40" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#e4e1ea]">{post.author}</p>
              <p className="text-[10px] text-white/30">{post.authorRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Clock className="size-3" />
            {post.timeAgo}
          </div>
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Like Button - Available to ALL */}
          <button 
            onClick={onLike}
            disabled={!canInteract}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
              isLiked 
                ? "bg-[#d0bcff]/10 text-[#d0bcff]" 
                : "text-white/40 hover:text-[#d0bcff] hover:bg-white/5",
              !canInteract && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("size-4", isLiked && "fill-current")} />
            <span className="font-medium">{post.likes + (isLiked ? 1 : 0)}</span>
          </button>

          {/* Bookmark & More */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 text-white/30 hover:text-white/60">
              <Bookmark className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-white/30 hover:text-white/60">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function CommunityPage() {
  const { activeContext } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  // ============================================
  // RBAC - STRICT BROADCASTING POLICY
  // ============================================
  // El Muro es una pizarra de anuncios institucionales (Broadcasting), NO una red social.
  // PostCreator: renderiza ESTRICTAMENTE solo para ADMIN (Direccion/Secretaria).
  // DOCENTE, PRECEPTOR y FAMILIA: READ-ONLY (solo ven el feed y usan "Me Gusta").
  //
  // Seguridad: evaluamos el rol REAL del contexto (sin fallback permisivo) para no
  // exponer el creador a roles no autorizados. El guard `if (!mounted) return null`
  // (mas abajo) evita el flash de hidratacion en Next.js.
  const currentRole = activeContext?.role || "FAMILIA";
  const canCreateContent = activeContext?.role === "ADMIN";
  const canInteract = true; // Todos los usuarios autenticados pueden dar "Me Gusta"

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLike = useCallback((postId: number) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!likedPosts[postId]) {
      toast.success("Marcaste como favorito");
    }
  }, [likedPosts]);

  const handlePublish = useCallback((content: string, hasImage: boolean, hasFile: boolean) => {
    const newPost: Post = {
      id: Date.now(),
      type: "COMUNICADO",
      title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
      content,
      author: "Usuario Actual",
      authorRole: currentRole || "Staff",
      timeAgo: "Ahora",
      likes: 0,
      hasImage,
      imagePreview: hasImage ? "nueva_imagen.jpg" : undefined,
      hasAttachment: hasFile,
      attachmentName: hasFile ? "archivo_adjunto.pdf" : undefined,
    };
    
    setPosts(prev => [newPost, ...prev]);
    setShowComposer(false);
    toast.success("Publicacion enviada exitosamente", {
      description: "Tu comunicado ya es visible para toda la comunidad",
    });
  }, [currentRole]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
          Muro de Comunidad Escolar
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {canCreateContent 
            ? "Publica comunicados y novedades para la comunidad" 
            : "Ultimas actualizaciones de la institucion"
          }
        </p>
      </header>

      {/* Read-Only Notice for FAMILIA (non-staff) */}
      {!canCreateContent && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <Heart className="size-5 text-blue-400" />
          <p className="text-sm text-white/50">
            Canal informativo de la institucion. Podes leer las publicaciones y marcarlas como favoritas tocando el corazon.
          </p>
        </div>
      )}

      {/* Post Creator - EXCLUSIVO para ADMIN (Broadcasting institucional) */}
      {canCreateContent && (
        showComposer ? (
          <PostCreator 
            onPublish={handlePublish} 
            onCancel={() => setShowComposer(false)} 
          />
        ) : (
          <div 
            onClick={() => setShowComposer(true)}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:border-[#d0bcff]/30 hover:bg-[#d0bcff]/5 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#d0bcff]/10 flex items-center justify-center border border-[#d0bcff]/20">
                <User className="size-5 text-[#d0bcff]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/40">Escribe algo para la comunidad educativa...</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="size-9 text-white/30 hover:text-[#d0bcff]">
                  <ImageIcon className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-9 text-white/30 hover:text-blue-400">
                  <FileText className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPosts[post.id] || false}
            onLike={() => handleLike(post.id)}
            canInteract={canInteract}
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
  );
}
