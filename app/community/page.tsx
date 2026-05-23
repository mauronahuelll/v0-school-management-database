"use client";

import { Users, MessageCircle, Heart, Image as ImageIcon } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-display-sm font-bold text-foreground">Muro de Comunidad Escolar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ultimas actualizaciones de la institucion
        </p>
      </header>

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
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-status-absent transition-colors">
                <Heart className="size-4" />
                24
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="size-4" />
                12
              </button>
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
          <button className="h-8 px-4 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors">
            Descargar PDF
          </button>
        </article>
      </div>
    </div>
  );
}
