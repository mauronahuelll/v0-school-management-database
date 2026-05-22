"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Settings, Bell, Shield, Palette, Database, Users } from "lucide-react";

const SETTINGS_SECTIONS = [
  { id: "general", name: "General", description: "Configuracion basica de la institucion", icon: Settings },
  { id: "notificaciones", name: "Notificaciones", description: "Alertas y comunicaciones", icon: Bell },
  { id: "permisos", name: "Permisos", description: "Control de acceso por rol", icon: Shield },
  { id: "tema", name: "Apariencia", description: "Tema y personalizacion visual", icon: Palette },
  { id: "datos", name: "Base de Datos", description: "Backup y restauracion", icon: Database },
  { id: "usuarios", name: "Usuarios", description: "Gestion de cuentas", icon: Users },
];

export default function AjustesPage() {
  return (
    <AppShell schoolName="Sequency" userName="Administrador" userRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-display-sm text-foreground">Ajustes del Sistema</h1>
          <p className="text-body-md text-muted-foreground mt-1">
            Configura las preferencias y parametros de Sequency
          </p>
        </header>

        {/* Settings Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="glass-panel rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-foreground">{section.name}</h3>
                    <p className="text-body-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
