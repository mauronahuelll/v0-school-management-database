"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, GraduationCap } from "lucide-react";

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-display-sm font-bold text-foreground">Consola de Analitica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Metricas de rendimiento institucional
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Presentismo Global", value: "94.2%", trend: "+2.4%", positive: true, icon: Users },
          { label: "Promedio General", value: "7.42", trend: "+0.3", positive: true, icon: GraduationCap },
          { label: "Alertas Tempranas", value: "12", trend: "-3", positive: true, icon: TrendingDown },
          { label: "Tasa Aprobacion", value: "89%", trend: "+5%", positive: true, icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <stat.icon className="size-5 text-primary" />
              <span className={`text-[10px] font-mono ${stat.positive ? "text-status-present" : "text-status-absent"}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Radar Institucional */}
      <section className="space-y-3">
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Radar Institucional</h2>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Mapa de Ausentismo</span>
            <span className="text-sm text-status-present font-mono">+2.4%</span>
          </div>
          
          {/* Simple heatmap visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>LUNES</span>
              <span>DOMINGO</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[0.2, 0.3, 0.5, 0.4, 0.8, 0.1, 0.1, 0.3, 0.4, 0.6, 0.5, 0.7, 0.2, 0.2].map((opacity, i) => (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{ backgroundColor: `rgba(77, 224, 130, ${opacity})` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-status-present" />
            <span className="text-sm">Presentismo Global</span>
          </div>
          <p className="text-2xl font-bold">94.2%</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-status-absent" />
            <span className="text-sm">Alertas Tempranas</span>
          </div>
          <p className="text-2xl font-bold">12</p>
        </div>
      </div>
    </div>
  );
}
