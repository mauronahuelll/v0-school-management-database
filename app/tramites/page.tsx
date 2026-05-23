"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Eye, CheckCircle, Clock } from "lucide-react";

export default function TramitesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-display-sm font-bold text-foreground">Centro de Accion Legal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de autorizaciones y documentos
        </p>
      </header>

      {/* Upload Area */}
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center space-y-3">
        <div className="size-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="size-6 text-primary" />
        </div>
        <div>
          <p className="font-bold">Subir Apto Medico 2024</p>
          <p className="text-sm text-muted-foreground">Formato PDF o JPG hasta 5MB</p>
        </div>
      </div>

      {/* Pending Signatures */}
      <section className="space-y-3">
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Pendientes de Firma</h2>
        
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold">Salida Educativa: Planetario</p>
              <p className="text-sm text-muted-foreground">Fecha: 15 de Mayo. Transporte institucional incluido.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
              Firmar Digital
            </button>
            <button className="size-9 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
              <Eye className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="size-5 text-status-present" />
              <div>
                <p className="font-medium">Uso de Imagen 2024</p>
                <p className="text-xs text-muted-foreground">Autorizacion para fines pedagogicos y RRSS.</p>
              </div>
            </div>
            <span className="text-xs text-status-present font-mono">FIRMADO</span>
          </div>
        </div>
      </section>

      {/* Medical Summary */}
      <section className="space-y-3">
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Resumen Medico</h2>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Alergias</span>
            <span className="text-sm text-muted-foreground">Ninguna registrada</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Condiciones</span>
            <span className="text-sm text-muted-foreground">-</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Contacto emergencia</span>
            <span className="text-sm font-mono">+54 11 5555-1234</span>
          </div>
        </div>
      </section>
    </div>
  );
}
