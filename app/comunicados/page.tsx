"use client";

import { useState, useEffect } from "react";
import { PostCreator } from "@/components/communications/post-creator";
import { Toaster } from "@/components/ui/sonner";

export default function ComunicadosPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gestor de Comunicados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y publica avisos para el Muro de las Familias
        </p>
      </header>

      <div className="max-w-2xl">
        <div className="glass-panel rounded-2xl p-6">
          <PostCreator />
        </div>
      </div>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
