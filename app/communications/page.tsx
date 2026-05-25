"use client";

import { useState, useEffect } from "react";
import { PostCreator } from "@/components/communications/post-creator";

export default function CommunicationsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Comunicados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y gestiona comunicados para las familias
        </p>
      </header>

      <PostCreator />
    </div>
  );
}
