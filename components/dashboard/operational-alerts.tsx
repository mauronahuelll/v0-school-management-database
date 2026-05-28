"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Users,
  FileText,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/context/auth-context";

// ============================================
// TYPES
// ============================================

interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  count?: number;
  href?: string;
}

interface OperationalAlertsProps {
  role: UserRole | null;
  className?: string;
}

// ============================================
// MOCK ALERTS BY ROLE
// ============================================

const ADMIN_ALERTS: OperationalAlert[] = [
  {
    id: "1",
    severity: "critical",
    title: "Docentes ausentes",
    description: "3 docentes ausentes en el turno actual.",
    count: 3,
    href: "/users",
  },
  {
    id: "2",
    severity: "warning",
    title: "Tramites pendientes",
    description: "12 documentos familiares pendientes de revision.",
    count: 12,
    href: "/students",
  },
  {
    id: "3",
    severity: "info",
    title: "Alerta de desercion",
    description: "2 alumnos con 3 inasistencias consecutivas.",
    count: 2,
    href: "/attendance",
  },
];

const DOCENTE_PRECEPTOR_ALERTS: OperationalAlert[] = [
  {
    id: "1",
    severity: "warning",
    title: "Valoraciones pendientes",
    description: "Faltan cargar valoraciones preliminares en 4to Ano.",
    href: "/grades",
  },
  {
    id: "2",
    severity: "info",
    title: "Cierre de periodo",
    description: "12 dias para el cierre del trimestre.",
    href: "/grades",
  },
];

// ============================================
// SEVERITY CONFIG
// ============================================

const SEVERITY_CONFIG = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    icon: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  info: {
    border: "border-l-[#d0bcff]",
    bg: "bg-[#d0bcff]/5",
    icon: "text-[#d0bcff]",
    badge: "bg-[#d0bcff]/20 text-[#d0bcff]",
  },
  success: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function OperationalAlerts({ role, className }: OperationalAlertsProps) {
  // FAMILIA doesn't see this panel at all
  if (role === "FAMILIA") {
    return null;
  }

  // Get alerts based on role
  const alerts =
    role === "ADMIN"
      ? ADMIN_ALERTS
      : role === "DOCENTE" || role === "PRECEPTOR"
      ? DOCENTE_PRECEPTOR_ALERTS
      : [];

  const hasAlerts = alerts.length > 0;

  return (
    <aside
      className={cn(
        "h-fit rounded-2xl overflow-hidden",
        "bg-white/[0.02] border border-white/5 backdrop-blur-md",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#e4e1ea]">Centro de Alertas</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Operativas del dia
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {hasAlerts ? (
          alerts.map((alert, index) => (
            <motion.a
              key={alert.id}
              href={alert.href || "#"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "block p-3 rounded-xl border-l-[3px] transition-all cursor-pointer group",
                "hover:bg-white/[0.05]",
                SEVERITY_CONFIG[alert.severity].border,
                SEVERITY_CONFIG[alert.severity].bg
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#e4e1ea]">
                      {alert.title}
                    </span>
                    {alert.count !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          SEVERITY_CONFIG[alert.severity].badge
                        )}
                      >
                        {alert.count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
                <ChevronRight className="size-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
              </div>
            </motion.a>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Footer Summary */}
      {hasAlerts && (
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Total alertas activas
            </span>
            <span className="text-xs font-bold text-amber-400">{alerts.length}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-8 flex flex-col items-center justify-center text-center"
    >
      <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <CheckCircle2 className="size-7 text-emerald-400" />
      </div>
      <p className="text-sm font-medium text-[#e4e1ea] mb-1">Sistema al dia</p>
      <p className="text-xs text-white/40 max-w-[200px]">
        Ninguna accion requerida. Todo funciona correctamente.
      </p>
    </motion.div>
  );
}

export default OperationalAlerts;
