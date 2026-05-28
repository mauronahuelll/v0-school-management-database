"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Users, MessageCircle, Heart, Image as ImageIcon, Send, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CommunityPage() {
  const { activeContext } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  const currentRole = activeContext?.role || null;
  const canCreateContent = currentRole !== "FAMILIA";
  const canComment = currentRole !== "FAMILIA";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLike = (postId: number) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!likedPosts[postId]) {
      toast.success("Marcaste como favorito");
    }
  };

  const handlePublish = () => {
    if (!newPost.trim()) return;
    toast.success("Publicacion enviada exitosamente");
    setNewPost("");
    setShowComposer(false);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-foreground">Muro de Comunidad Escolar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ultimas actualizaciones de la institucion
          </p>
        </div>
        
        {/* Create Post Button - Only for non-FAMILIA */}
        {canCreateContent && (
          <Button
            onClick={() => setShowComposer(!showComposer)}
            className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
          >
            <PlusCircle className="size-4 mr-2" />
            Nueva Publicacion
          </Button>
        )}
      </header>

      {/* Post Composer - Only for non-FAMILIA */}
      {canCreateContent && showComposer && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <Textarea
            placeholder="Escribe un comunicado para la comunidad..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="bg-white/[0.02] border-white/10 min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ImageIcon className="size-4 mr-1" /> Imagen
              </Button>
            </div>
            <Button onClick={handlePublish} disabled={!newPost.trim()} className="bg-primary text-primary-foreground">
              <Send className="size-4 mr-2" /> Publicar
            </Button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {/* Featured Post */}
        <article className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-status-present/20 relative">
            <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-status-present text-status-present-foreground">
              Evento Proximo
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Feria de Innovacion 2024</h2>
              <span className="text-xs text-muted-foreground font-mono">Hace 2 horas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Invitamos a todas las familias a presenciar los proyectos finales de robotica y biotecnologia. 
              El evento contara con demostraciones en vivo.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button 
                onClick={() => handleLike(1)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  likedPosts[1] ? "text-status-absent" : "text-muted-foreground hover:text-status-absent"
                }`}
              >
                <Heart className={`size-4 ${likedPosts[1] ? "fill-current" : ""}`} />
                {24 + (likedPosts[1] ? 1 : 0)}
              </button>
              {/* Comment button - Only for non-FAMILIA */}
              {canComment && (
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="size-4" />
                  12
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Urgent Notice */}
        <article className="rounded-xl border border-status-absent/30 bg-status-absent/5 p-4 space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-status-absent">Urgente</span>
          <h3 className="font-bold">Suspension de Talleres</h3>
          <p className="text-sm text-muted-foreground">
            Por mantenimiento edilicio, los talleres de la tarde se suspenden este viernes.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button 
              onClick={() => handleLike(2)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                likedPosts[2] ? "text-status-absent" : "text-muted-foreground hover:text-status-absent"
              }`}
            >
              <Heart className={`size-4 ${likedPosts[2] ? "fill-current" : ""}`} />
              {8 + (likedPosts[2] ? 1 : 0)}
            </button>
            {canComment && (
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="size-4" />
                3
              </button>
            )}
          </div>
          <button className="text-sm text-primary hover:underline">Leer Circular #452</button>
        </article>

        {/* Regular Post */}
        <article className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-status-present" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Alimentacion</span>
          </div>
          <h3 className="font-bold">Menu Semanal Nutritivo</h3>
          <p className="text-sm text-muted-foreground">
            Ya esta disponible la planificacion de almuerzos balanceados para el mes de Mayo.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleLike(3)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  likedPosts[3] ? "text-status-absent" : "text-muted-foreground hover:text-status-absent"
                }`}
              >
                <Heart className={`size-4 ${likedPosts[3] ? "fill-current" : ""}`} />
                {15 + (likedPosts[3] ? 1 : 0)}
              </button>
              {canComment && (
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="size-4" />
                  5
                </button>
              )}
            </div>
            <button className="h-8 px-4 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors">
              Descargar PDF
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
