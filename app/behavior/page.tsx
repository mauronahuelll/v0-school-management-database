"use client";

import { SanctionAcknowledgmentDemo } from "@/components/behavior/sanction-acknowledgment";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BehaviorDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <Link
            href="/attendance"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <h1 className="font-semibold text-foreground">Notificaciones</h1>
          <ThemeToggle variant="compact" />
        </div>
      </header>

      {/* Content */}
      <main className="pb-8 pt-4">
        <SanctionAcknowledgmentDemo />
      </main>

      {/* Info Banner */}
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="mb-2 font-medium text-foreground">
            Sistema de Firma Digital
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>- Hash SHA-256 del contenido para integridad</li>
            <li>- Captura de IP, User-Agent y dispositivo</li>
            <li>- Timestamp generado en servidor</li>
            <li>- Bloqueo de contenido post-firma</li>
            <li>- Registro de auditoria inmutable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
