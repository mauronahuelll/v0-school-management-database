"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, Bell, Palette, Database, Users, Building2 } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    id: "institution",
    title: "Datos Institucionales",
    description: "Nombre, logo y configuracion general del establecimiento",
    icon: Building2,
  },
  {
    id: "users",
    title: "Gestion de Usuarios",
    description: "Roles, permisos y accesos del personal",
    icon: Users,
  },
  {
    id: "notifications",
    title: "Notificaciones",
    description: "Canales de comunicacion y alertas automaticas",
    icon: Bell,
  },
  {
    id: "security",
    title: "Seguridad",
    description: "Politicas de acceso y autenticacion",
    icon: Shield,
  },
  {
    id: "appearance",
    title: "Apariencia",
    description: "Tema visual y personalizacion de interfaz",
    icon: Palette,
  },
  {
    id: "data",
    title: "Datos y Respaldos",
    description: "Exportacion, importacion y copias de seguridad",
    icon: Database,
  },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajustes Institucionales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de configuracion general del sistema
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="p-5 bg-card/50 border border-border/50 rounded-2xl backdrop-blur-md hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground mb-1">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Modulo de configuracion en construccion. Proximamente disponible.
        </p>
      </div>
    </div>
  );
}
