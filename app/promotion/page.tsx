"use client";

import { useState, useEffect } from "react";
import { PromotionWizard } from "@/components/promotion";
import { GraduationCap } from "lucide-react";

export default function PromotionPage() {
  // Hydration guard
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-lg">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Promocion de Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestion de traspaso de alumnos, cierres y ciclos lectivos.</p>
        </div>
      </header>

      <main className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-md shadow-lg">
        <PromotionWizard />
      </main>
    </div>
  );
}
