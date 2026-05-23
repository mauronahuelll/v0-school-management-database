"use client";

import { useEffect, useState } from "react";
import { SanctionAcknowledgmentDemo } from "@/components/behavior/sanction-acknowledgment";

export default function BehaviorDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gabinete y Convivencia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de notificaciones y actas disciplinarias
        </p>
      </header>

      <main className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-md">
        <SanctionAcknowledgmentDemo />
      </main>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h3 className="mb-2 font-medium text-primary">Sistema de Firma Digital Unificada</h3>
        <ul className="space-y-1 text-xs text-primary/70 font-mono">
          <li>&gt; Hash SHA-256 del contenido para integridad</li>
          <li>&gt; Validacion bajo el Art. 284 del CCyCN</li>
          <li>&gt; Captura de IP, User-Agent y dispositivo</li>
          <li>&gt; Timestamp generado en servidor</li>
          <li>&gt; Registro de auditoria inmutable</li>
        </ul>
      </div>
    </div>
  );
}
