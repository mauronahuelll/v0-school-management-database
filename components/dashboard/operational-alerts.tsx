"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  PanelRightClose,
  Users,
  FileText,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/context/auth-context";

// ============================================
// TYPES
// ============================================

interface AlertTask {
  id: string;
  text: string;
  href?: string;
}

interface AlertCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  badgeColor: string;
  tasks: AlertTask[];
  allowedRoles: UserRole[];
}

interface OperationalAlertsProps {
  role: UserRole | null;
  className?: string;
}

// ============================================
// CATEGORIZED ALERTS DATA
// ============================================

const ALERT_CATEGORIES: AlertCategory[] = [
  {
    id: "rrhh",
    title: "RRHH & Personal",
    icon: <Users className="size-4" />,
    color: "text-red-400",
    borderColor: "border-l-red-500",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    tasks: [
      { id: "rrhh-1", text: "3 docentes ausentes en el turno actual", href: "/users" },
      { id: "rrhh-2", text: "1 preceptor sin parte de asistencia cargado", href: "/attendance" },
      { id: "rrhh-3", text: "Vencimiento de licencia medica - Prof. Rodriguez", href: "/users" },
    ],
    allowedRoles: ["ADMIN"],
  },
  {
    id: "tramites",
    title: "Tramites Administrativos",
    icon: <FileText className="size-4" />,
    color: "text-amber-400",
    borderColor: "border-l-amber-500",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tasks: [
      { id: "tram-1", text: "12 documentos familiares pendientes de revision", href: "/students" },
      { id: "tram-2", text: "5 constancias de alumno regular solicitadas", href: "/students" },
      { id: "tram-3", text: "2 pedidos de certificado de estudios", href: "/students" },
    ],
    allowedRoles: ["ADMIN"],
  },
  {
    id: "academica",
    title: "Gestion Academica",
    icon: <GraduationCap className="size-4" />,
    color: "text-blue-400",
    borderColor: "border-l-blue-500",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tasks: [
      { id: "acad-1", text: "Valoraciones preliminares pendientes en 4to Ano A", href: "/grades" },
      { id: "acad-2", text: "Cierre de trimestre en 12 dias habiles", href: "/calendar" },
      { id: "acad-3", text: "3 materias sin calificaciones cargadas", href: "/grades" },
    ],
    allowedRoles: ["ADMIN", "DOCENTE", "PRECEPTOR"],
  },
  {
    id: "convivencia",
    title: "Convivencia & Gabinete",
    icon: <HeartHandshake className="size-4" />,
    color: "text-[#d0bcff]",
    borderColor: "border-l-[#d0bcff]",
    badgeColor: "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30",
    tasks: [
      { id: "conv-1", text: "2 alumnos con 3 inasistencias consecutivas (alerta desercion)", href: "/attendance" },
      { id: "conv-2", text: "1 caso derivado a gabinete pendiente de seguimiento", href: "/behavior" },
    ],
    allowedRoles: ["ADMIN", "PRECEPTOR"],
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function OperationalAlerts({ role, className }: OperationalAlertsProps) {
  // FAMILIA doesn't see this panel at all
  if (role === "FAMILIA") {
    return null;
  }

  // Filter categories based on role
  const visibleCategories = ALERT_CATEGORIES.filter(
    (cat) => role && cat.allowedRoles.includes(role)
  );

  // Calculate total alerts
  const totalAlerts = visibleCategories.reduce((acc, cat) => acc + cat.tasks.length, 0);
  const hasAlerts = totalAlerts > 0;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "h-fit rounded-2xl overflow-hidden",
        "bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)]",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#e4e1ea]">Tareas Pendientes</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                Gestor operativo
          </p>
          </div>
          </div>
          </div>
          </div>

      {/* Content - Accordion Categories */}
      <div className="p-3">
        {hasAlerts ? (
          <Accordion type="single" collapsible className="space-y-2">
            {visibleCategories.map((category) => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className={cn(
                  "border-l-[3px] rounded-xl overflow-hidden transition-all duration-200",
                  "bg-white/[0.02] border border-white/10 hover:border-white/15",
                  category.borderColor
                )}
              >
                <AccordionTrigger className="px-3 py-2.5 hover:bg-white/[0.03] hover:no-underline [&[data-state=open]]:bg-white/[0.02]">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className={category.color}>{category.icon}</span>
                    <span className="text-xs font-semibold text-[#e4e1ea] flex-1 text-left">
                      {category.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0 h-5 min-w-[24px] justify-center",
                        category.badgeColor
                      )}
                    >
                      {category.tasks.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-1.5">
                    {category.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (task.href && task.href !== "#") {
                            window.location.href = task.href;
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors group w-full text-left"
                      >
                        <span className={cn("size-1.5 rounded-full shrink-0", category.color.replace("text-", "bg-"))} />
                        <span className="text-[11px] text-white/60 group-hover:text-white/80 flex-1 leading-relaxed">
                          {task.text}
                        </span>
                        <ChevronRight className="size-3 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Footer Summary */}
      {hasAlerts && (
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Total tareas pendientes
            </span>
            <span className="text-xs font-bold text-amber-400">{totalAlerts}</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

// ============================================
// GET ALERTS COUNT (Export for external use)
// ============================================

export function getAlertsCount(role: UserRole | null): number {
  if (role === "FAMILIA") return 0;
  
  const visibleCategories = ALERT_CATEGORIES.filter(
    (cat) => role && cat.allowedRoles.includes(role)
  );
  
  return visibleCategories.reduce((acc, cat) => acc + cat.tasks.length, 0);
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
