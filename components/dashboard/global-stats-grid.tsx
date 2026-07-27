"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FileSignature,
  FileCheck,
  GraduationCap,
  TrendingUp,
  ArrowRightLeft,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types/dashboard";
import { getSystemStatusColor, getSystemStatusLabel } from "@/lib/types/dashboard";

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "default" | "present" | "absent" | "tardy" | "primary";
  size?: "default" | "large";
  delay?: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
  size = "default",
  delay = 0,
}: StatCardProps) {
  const colorClasses = {
    default: "bg-white/[0.02]",
    present: "bg-status-present-soft",
    absent: "bg-status-absent-soft",
    tardy: "bg-status-tardy-soft",
    primary: "bg-[#8A2BE2]/10",
  };

  const iconColorClasses = {
    default: "text-muted-foreground",
    present: "text-status-present",
    absent: "text-status-absent",
    tardy: "text-status-tardy",
    primary: "text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300",
        "hover:border-[#8A2BE2]/40 hover:shadow-[0_0_25px_rgba(138,43,226,0.12)]",
        colorClasses[color]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-current to-transparent opacity-5" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "p-2.5 rounded-xl",
              color === "default"
                ? "bg-[#8A2BE2]/20 border border-[#8A2BE2]/20"
                : "bg-white/[0.06] border border-white/10"
            )}
          >
            <Icon className={cn("size-5", iconColorClasses[color])} />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend.isPositive
                  ? "bg-status-present/10 text-status-present"
                  : "bg-status-absent/10 text-status-absent"
              )}
            >
              <TrendingUp
                className={cn(
                  "size-3",
                  !trend.isPositive && "rotate-180"
                )}
              />
              {trend.value}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p
            className={cn(
              "font-bold tracking-tight text-foreground",
              size === "large" ? "text-4xl" : "text-2xl"
            )}
          >
            {value}
          </p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface GlobalStatsGridProps {
  stats: DashboardStats;
}

export function GlobalStatsGrid({ stats }: GlobalStatsGridProps) {
  const { attendance, behavior, academic, transfers, system } = stats;
  
  // Fix hydration mismatch: only render time on client
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8">
      {/* Section: Asistencia de Hoy */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Asistencia de Hoy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Presentes"
            value={attendance.presentToday}
            subtitle={`${attendance.presenceRate.toFixed(1)}% del total`}
            icon={UserCheck}
            color="present"
            delay={0}
          />
          <StatCard
            title="Ausentes"
            value={attendance.absentToday}
            subtitle="Requieren seguimiento"
            icon={UserX}
            color="absent"
            delay={0.05}
          />
          <StatCard
            title="Llegadas Tarde"
            value={attendance.tardyToday}
            icon={Clock}
            color="tardy"
            delay={0.1}
          />
          <StatCard
            title="En Licencia"
            value={attendance.onLicense}
            subtitle="Sin notificacion"
            icon={Users}
            color="default"
            delay={0.15}
          />
        </div>
      </section>

      {/* Section: Firmas Digitales */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileSignature className="size-5 text-primary" />
          Estado de Firmas Digitales
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="Sanciones Emitidas"
            value={behavior.totalSanctionsThisMonth}
            subtitle="Este mes"
            icon={FileSignature}
            color="default"
            delay={0.2}
          />
          <StatCard
            title="Firmadas"
            value={behavior.signedSanctions}
            subtitle={`${behavior.signatureRate.toFixed(0)}% completado`}
            icon={FileCheck}
            color="present"
            trend={{ value: behavior.signatureRate, isPositive: behavior.signatureRate > 70 }}
            delay={0.25}
          />
          <StatCard
            title="Pendientes de Firma"
            value={behavior.pendingSignatures}
            subtitle={behavior.pendingSignatures > 5 ? "Requiere atencion" : "Dentro del rango normal"}
            icon={FileSignature}
            color={behavior.pendingSignatures > 5 ? "absent" : "tardy"}
            delay={0.3}
          />
        </div>
      </section>

      {/* Section: Resumen Academico y Transferencias */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Academic */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            Rendimiento Academico
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Promedio General"
              value={academic.averageGrade.toFixed(1)}
              icon={GraduationCap}
              color="primary"
              size="large"
              delay={0.35}
            />
            <StatCard
              title="Tasa de Aprobacion"
              value={`${academic.passingRate.toFixed(0)}%`}
              icon={TrendingUp}
              color={academic.passingRate > 70 ? "present" : "tardy"}
              delay={0.4}
            />
          </div>
        </section>

        {/* Transfers */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-primary" />
            Pasaporte Educativo
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Pases Entrantes"
              value={transfers.incomingPending}
              subtitle="Pendientes de recepcion"
              icon={ArrowRightLeft}
              color={transfers.incomingPending > 0 ? "tardy" : "default"}
              delay={0.45}
            />
            <StatCard
              title="Pases Salientes"
              value={transfers.outgoingPending}
              subtitle="En tramite"
              icon={ArrowRightLeft}
              color={transfers.outgoingPending > 0 ? "tardy" : "default"}
              delay={0.5}
            />
          </div>
        </section>
      </div>

      {/* Section: System Status */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="size-5 text-primary" />
          Estado del Sistema
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-[#8A2BE2]/30 transition-all duration-300"
        >
          <div className="flex flex-wrap items-center gap-6">
            {/* Status indicator */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-3 rounded-full animate-pulse",
                  system.status === "OPERATIONAL" && "bg-status-present",
                  system.status === "DEGRADED" && "bg-status-tardy",
                  system.status === "MAINTENANCE" && "bg-status-license"
                )}
              />
              <span className={cn("text-sm font-medium px-3 py-1 rounded-full", getSystemStatusColor(system.status))}>
                {getSystemStatusLabel(system.status)}
              </span>
            </div>

            {/* Last sync */}
            <div className="text-sm text-muted-foreground">
              Ultima sincronizacion:{" "}
              <span className="font-medium text-foreground">
                {mounted 
                  ? system.lastSync.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
            </div>

            {/* Pending tasks */}
            {system.pendingTasks > 0 && (
              <div className="text-sm text-muted-foreground">
                Tareas pendientes:{" "}
                <span className="font-medium text-foreground">{system.pendingTasks}</span>
              </div>
            )}

            {/* Storage */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Almacenamiento:</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    system.storageUsed < 70
                      ? "bg-status-present"
                      : system.storageUsed < 90
                      ? "bg-status-tardy"
                      : "bg-status-absent"
                  )}
                  style={{ width: `${system.storageUsed}%` }}
                />
              </div>
              <span className="font-medium text-foreground">{system.storageUsed}%</span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
