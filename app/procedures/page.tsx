"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";

const MOCK_PROCEDURES = [
  { id: "1", name: "Constancia de Alumno Regular", status: "completed", date: "2024-03-15" },
  { id: "2", name: "Certificado de Notas", status: "pending", date: "2024-03-18" },
  { id: "3", name: "Solicitud de Licencia", status: "in_review", date: "2024-03-20" },
];

export default function ProceduresPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tramites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicita y gestiona tramites administrativos
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Constancia de Alumno", desc: "Regular o historica" },
          { icon: Upload, label: "Subir Documentacion", desc: "Fichas medicas, autorizaciones" },
          { icon: Eye, label: "Ver Estado", desc: "Consultar tramites en curso" },
        ].map((action, i) => (
          <button
            key={i}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group"
          >
            <action.icon className="size-5 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Procedures List */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-medium text-foreground">Mis Tramites</h2>
        </div>
        <div className="divide-y divide-white/5">
          {MOCK_PROCEDURES.map((proc) => (
            <div key={proc.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{proc.name}</p>
                  <p className="text-xs text-muted-foreground">{proc.date}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                proc.status === "completed" 
                  ? "bg-[#4de082]/10 text-[#4de082]" 
                  : proc.status === "pending"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}>
                {proc.status === "completed" ? <CheckCircle className="size-3" /> : 
                 proc.status === "pending" ? <Clock className="size-3" /> : 
                 <AlertCircle className="size-3" />}
                {proc.status === "completed" ? "Completado" : 
                 proc.status === "pending" ? "Pendiente" : "En Revision"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
