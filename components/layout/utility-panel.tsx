"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  progress: number;
  type: "exam" | "delivery" | "event";
}

interface PerformanceAlert {
  id: string;
  studentName: string;
  avatarUrl?: string;
  alertType: "attendance" | "grades" | "behavior";
  description: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "Apercibimiento",
    description: "Caceres, Julian - Uso de dispositivos durante examen",
    timestamp: "Hoy, 09:12",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Nota Positiva",
    description: "Benitez, Lucia - Colaboracion destacada",
    timestamp: "Ayer, 14:45",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Citacion",
    description: "Duarte, Martina - Reunion de seguimiento pedagogico",
    timestamp: "24 May",
    read: true,
  },
];

const MOCK_MILESTONES: Milestone[] = [
  {
    id: "1",
    title: "Cierre de 2do Trimestre",
    dueDate: "2024-06-15",
    daysRemaining: 14,
    progress: 75,
    type: "delivery",
  },
  {
    id: "2",
    title: "Corregir Examen Unidad 3",
    dueDate: "2024-06-05",
    daysRemaining: 4,
    progress: 25,
    type: "exam",
  },
  {
    id: "3",
    title: "Planificacion Anual v2",
    dueDate: "2024-06-02",
    daysRemaining: 1,
    progress: 90,
    type: "delivery",
  },
];

const MOCK_ALERTS: PerformanceAlert[] = [
  {
    id: "1",
    studentName: "Lopez, R.",
    alertType: "grades",
    description: "2+ TEP consecutivos",
  },
  {
    id: "2",
    studentName: "Gomez, V.",
    alertType: "attendance",
    description: "5 faltas este mes",
  },
  {
    id: "3",
    studentName: "Ibarra, E.",
    alertType: "behavior",
    description: "3 apercibimientos",
  },
];

// ============================================
// UTILITY PANEL COMPONENT
// ============================================

interface UtilityPanelProps {
  className?: string;
}

export function UtilityPanel({ className }: UtilityPanelProps) {
  const [activeTab, setActiveTab] = useState<"notifications" | "milestones">("milestones");

  return (
    <aside
      className={cn(
        "h-full flex flex-col",
        "bg-surface-container-low/30 border-l border-white/5",
        "overflow-hidden",
        className
      )}
    >
      {/* Header Tabs */}
      <div className="flex items-center gap-1 p-3 border-b border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("milestones")}
          className={cn(
            "text-label-caps text-[10px] h-7 px-3",
            activeTab === "milestones"
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Calendar className="size-3.5 mr-1.5" />
          Hitos
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "text-label-caps text-[10px] h-7 px-3 relative",
            activeTab === "notifications"
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Bell className="size-3.5 mr-1.5" />
          Convivencia
          {MOCK_NOTIFICATIONS.filter((n) => !n.read).length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-[9px] font-bold flex items-center justify-center text-destructive-foreground">
              {MOCK_NOTIFICATIONS.filter((n) => !n.read).length}
            </span>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === "milestones" ? (
            <MilestonesTab key="milestones" />
          ) : (
            <NotificationsTab key="notifications" />
          )}
        </AnimatePresence>
      </div>

      {/* Performance Alerts Footer */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-label-caps text-on-surface-variant/60">
            Alertas de Desempeno
          </span>
          <span className="text-label-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
            {MOCK_ALERTS.length} criticas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {MOCK_ALERTS.slice(0, 3).map((alert, i) => (
              <div
                key={alert.id}
                className="size-7 rounded-full bg-surface-container-high border-2 border-background flex items-center justify-center text-label-xs text-on-surface-variant"
              >
                {alert.studentName.charAt(0)}
              </div>
            ))}
          </div>
          {MOCK_ALERTS.length > 3 && (
            <span className="text-label-xs text-on-surface-variant">
              +{MOCK_ALERTS.length - 3}
            </span>
          )}
          <p className="text-body-sm text-on-surface-variant ml-2 truncate">
            Estudiantes con 2 o mas TEP/TED consecutivos.
          </p>
        </div>
      </div>
    </aside>
  );
}

// ============================================
// MILESTONES TAB
// ============================================

function MilestonesTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-4"
    >
      {/* Countdown Hero */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-body-sm text-on-surface-variant">
              {MOCK_MILESTONES[0].title}
            </p>
            <p className="text-display-sm text-foreground mt-1">
              {MOCK_MILESTONES[0].daysRemaining}{" "}
              <span className="text-headline-sm text-on-surface-variant">
                dias restantes
              </span>
            </p>
          </div>
          <div className="size-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
            <Clock className="size-5 text-primary" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${MOCK_MILESTONES[0].progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {MOCK_MILESTONES.slice(1).map((milestone) => (
          <div
            key={milestone.id}
            className="glass-panel rounded-xl p-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center",
                milestone.type === "exam"
                  ? "bg-primary/10 text-primary"
                  : "bg-success/10 text-success"
              )}
            >
              {milestone.type === "exam" ? (
                <FileText className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium truncate">{milestone.title}</p>
              <p className="text-label-xs text-on-surface-variant">
                Fecha limite: {milestone.dueDate === "2024-06-02" ? "Manana" : milestone.dueDate}, 08:00
              </p>
            </div>
            <ChevronRight className="size-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Group Stats */}
      <div className="glass-panel rounded-xl p-4">
        <p className="text-label-caps text-on-surface-variant/60 mb-3">
          Progreso del Grupo
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/[0.02] rounded-lg">
            <p className="text-label-caps text-on-surface-variant/60 mb-1">
              Promedio
            </p>
            <p className="text-headline-sm">7.42</p>
          </div>
          <div className="text-center p-3 bg-white/[0.02] rounded-lg">
            <p className="text-label-caps text-on-surface-variant/60 mb-1">
              Asistencia
            </p>
            <p className="text-headline-sm text-success">92%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================

function NotificationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-3"
    >
      <p className="text-label-caps text-on-surface-variant/60">
        Registro de Convivencia
      </p>
      <p className="text-body-sm text-on-surface-variant -mt-1 mb-3">
        Intervenciones recientes del curso
      </p>

      {MOCK_NOTIFICATIONS.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "glass-panel rounded-xl p-3 relative overflow-hidden",
            !notification.read && "border-l-2 border-l-primary"
          )}
        >
          <div className="flex items-start justify-between mb-1">
            <span
              className={cn(
                "text-label-caps px-2 py-0.5 rounded",
                notification.type === "warning" &&
                  "bg-destructive/20 text-destructive",
                notification.type === "success" &&
                  "bg-success/20 text-success",
                notification.type === "info" &&
                  "bg-primary/20 text-primary",
                notification.type === "error" &&
                  "bg-destructive/20 text-destructive"
              )}
            >
              {notification.title}
            </span>
            <span className="text-label-xs text-on-surface-variant/60">
              {notification.timestamp}
            </span>
          </div>
          <p className="text-body-sm text-on-surface mt-2">
            {notification.description.split(" - ")[0]}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {notification.description.split(" - ")[1]}
          </p>
          {notification.type !== "info" && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
              <div className="size-5 rounded-full bg-surface-container flex items-center justify-center">
                <span className="text-[8px]">P</span>
              </div>
              <span className="text-label-xs text-on-surface-variant">
                {notification.type === "warning" ? "Prof. Rodriguez" : "Preceptora Martinez"}
              </span>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

export default UtilityPanel;
