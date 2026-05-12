"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserX,
  BookOpen,
  Award,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roundToDecimals } from "@/lib/types/attendance";
import type { StudentStats } from "@/lib/types/student";

interface StatsOverviewProps {
  stats: StudentStats;
  minPassingGrade?: number;
}

export function StatsOverview({ stats, minPassingGrade = 6 }: StatsOverviewProps) {
  const absencePercentage = (stats.attendance.totalAbsences / stats.attendance.absenceLimit) * 100;
  const isAbsenceWarning = absencePercentage >= 60;
  const isAbsenceCritical = absencePercentage >= 80;

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Average - Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              {stats.grades.generalAverage !== null && (
                <Badge 
                  passing={stats.grades.generalAverage >= minPassingGrade}
                />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">Promedio General</p>
            
            <div className="flex items-baseline gap-2">
              <span 
                className={cn(
                  "text-5xl md:text-6xl font-bold tracking-tight",
                  stats.grades.generalAverage !== null
                    ? stats.grades.generalAverage >= minPassingGrade
                      ? "text-status-present"
                      : "text-status-absent"
                    : "text-muted-foreground"
                )}
              >
                {stats.grades.generalAverage !== null 
                  ? roundToDecimals(stats.grades.generalAverage).toFixed(2)
                  : "—"
                }
              </span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              {stats.grades.passingSubjects} de {stats.grades.totalSubjects} materias aprobadas
            </p>
          </div>
        </motion.div>

        {/* Attendance - Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 shadow-sm"
        >
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-br to-transparent",
              isAbsenceCritical 
                ? "from-status-absent/10" 
                : isAbsenceWarning 
                  ? "from-status-tardy/10"
                  : "from-status-present/5"
            )} 
          />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div 
                className={cn(
                  "p-2.5 rounded-xl",
                  isAbsenceCritical 
                    ? "bg-status-absent/10" 
                    : isAbsenceWarning 
                      ? "bg-status-tardy/10"
                      : "bg-status-present/10"
                )}
              >
                <UserX 
                  className={cn(
                    "size-5",
                    isAbsenceCritical 
                      ? "text-status-absent" 
                      : isAbsenceWarning 
                        ? "text-status-tardy"
                        : "text-status-present"
                  )} 
                />
              </div>
              {isAbsenceWarning && (
                <div 
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    isAbsenceCritical 
                      ? "bg-status-absent-soft text-status-absent"
                      : "bg-status-tardy-soft text-status-tardy-foreground"
                  )}
                >
                  <AlertTriangle className="size-3" />
                  {isAbsenceCritical ? "Critico" : "Alerta"}
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">Inasistencias</p>
            
            <div className="flex items-baseline gap-2">
              <span 
                className={cn(
                  "text-5xl md:text-6xl font-bold tracking-tight",
                  isAbsenceCritical 
                    ? "text-status-absent" 
                    : isAbsenceWarning 
                      ? "text-status-tardy"
                      : "text-foreground"
                )}
              >
                {roundToDecimals(stats.attendance.totalAbsences)}
              </span>
              <span className="text-lg text-muted-foreground">
                /{stats.attendance.absenceLimit}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(absencePercentage, 100)}%` }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  isAbsenceCritical 
                    ? "bg-status-absent" 
                    : isAbsenceWarning 
                      ? "bg-status-tardy"
                      : "bg-status-present"
                )}
              />
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              {stats.attendance.daysPresent} dias de asistencia ({stats.attendance.attendanceRate.toFixed(0)}%)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="size-4" />}
          label="Llegadas Tarde"
          value={stats.attendance.totalTardies.toString()}
          delay={0.2}
        />
        <StatCard
          icon={<Award className="size-4" />}
          label="Meritos"
          value={stats.behavior.positiveObservations.toString()}
          variant="success"
          delay={0.25}
        />
        <StatCard
          icon={<AlertCircle className="size-4" />}
          label="Observaciones"
          value={stats.behavior.negativeObservations.toString()}
          variant={stats.behavior.negativeObservations > 5 ? "warning" : "default"}
          delay={0.3}
        />
        <StatCard
          icon={<AlertTriangle className="size-4" />}
          label="Sanciones"
          value={stats.behavior.totalSanctions.toString()}
          variant={stats.behavior.totalSanctions > 0 ? "danger" : "default"}
          delay={0.35}
          badge={stats.behavior.pendingAcknowledgments > 0 
            ? `${stats.behavior.pendingAcknowledgments} sin firmar`
            : undefined
          }
        />
      </div>

      {/* Subject Averages */}
      {stats.grades.averagesBySubject.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-card border border-border/50 p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Promedios por Materia
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.grades.averagesBySubject.map((subject, index) => (
              <motion.div
                key={subject.subjectId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-colors",
                  subject.isPassing
                    ? "bg-status-present-soft/30 border-status-present/20"
                    : "bg-status-absent-soft/30 border-status-absent/20"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {subject.subjectName}
                  </span>
                  <TrendIcon trend={subject.trend} />
                </div>
                <span 
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    subject.isPassing ? "text-status-present" : "text-status-absent"
                  )}
                >
                  {subject.average !== null 
                    ? roundToDecimals(subject.average).toFixed(1) 
                    : "—"
                  }
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Helper components
function Badge({ passing }: { passing: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        passing 
          ? "bg-status-present-soft text-status-present-foreground"
          : "bg-status-absent-soft text-status-absent-foreground"
      )}
    >
      {passing ? (
        <>
          <CheckCircle2 className="size-3" />
          Aprobado
        </>
      ) : (
        <>
          <AlertCircle className="size-3" />
          En riesgo
        </>
      )}
    </div>
  );
}

function TrendIcon({ trend }: { trend: "UP" | "DOWN" | "STABLE" }) {
  if (trend === "UP") {
    return <TrendingUp className="size-3.5 text-status-present" />;
  }
  if (trend === "DOWN") {
    return <TrendingDown className="size-3.5 text-status-absent" />;
  }
  return <Minus className="size-3.5 text-muted-foreground" />;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: "default" | "success" | "warning" | "danger";
  delay?: number;
  badge?: string;
}

function StatCard({ 
  icon, 
  label, 
  value, 
  variant = "default",
  delay = 0,
  badge,
}: StatCardProps) {
  const variants = {
    default: "bg-card",
    success: "bg-status-present-soft/30",
    warning: "bg-status-tardy-soft/30",
    danger: "bg-status-absent-soft/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative p-4 rounded-xl border border-border/50 shadow-sm transition-theme",
        variants[variant]
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      
      {badge && (
        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-status-absent-soft text-status-absent font-medium">
          {badge}
        </span>
      )}
    </motion.div>
  );
}
