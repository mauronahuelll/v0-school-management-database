"use client";

import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Building2,
  Activity,
  ChevronRight,
  Eye,
  Clock,
  BookOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface CourseOverview {
  id: string;
  name: string;
  teaPercent: number;
  tepPercent: number;
  tedPercent: number;
  totalStudents: number;
  criticalAlerts: number;
}

interface AlertItem {
  id: string;
  type: "ACADEMIC_RISK" | "ATTENDANCE_CRITICAL" | "GRADE_DEVIATION" | "RECOVERY_PENDING";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  affectedEntity: string;
  timestamp: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_KPIS = {
  approvalIndex: 78,
  approvalTrend: 2.3,
  atRiskStudents: 12,
  atRiskTrend: -1,
  criticalAttendanceRooms: 2,
  criticalAttendanceTrend: 0,
};

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "alert-1",
    type: "GRADE_DEVIATION",
    severity: "HIGH",
    title: "Desviacion critica en valoraciones TED",
    description: "4to Ano Div B acumula un 45% de valoraciones TED en Matematica. Se requiere intervencion pedagogica.",
    affectedEntity: "4to Ano B - Matematica",
    timestamp: "Hace 2 horas",
  },
  {
    id: "alert-2",
    type: "ACADEMIC_RISK",
    severity: "HIGH",
    title: "Alumna en riesgo academico severo",
    description: "Valentina Castro (3ro A) supero el limite de inasistencias y adeuda 3 materias. Se recomienda citar al tutor.",
    affectedEntity: "Valentina Castro - 3ro A",
    timestamp: "Hace 4 horas",
  },
  {
    id: "alert-3",
    type: "ATTENDANCE_CRITICAL",
    severity: "HIGH",
    title: "Ausentismo critico en aula",
    description: "5to Ano A registro un 35% de ausentismo en la ultima semana. Patron atipico detectado.",
    affectedEntity: "5to Ano A",
    timestamp: "Hace 6 horas",
  },
  {
    id: "alert-4",
    type: "RECOVERY_PENDING",
    severity: "MEDIUM",
    title: "Recuperatorios sin evaluar",
    description: "3 alumnos de 4to B tienen instancias de recuperacion pendientes hace mas de 15 dias.",
    affectedEntity: "4to Ano B",
    timestamp: "Hace 1 dia",
  },
  {
    id: "alert-5",
    type: "ACADEMIC_RISK",
    severity: "MEDIUM",
    title: "Tendencia descendente en rendimiento",
    description: "Lucas Diaz (3ro B) muestra una caida sostenida en sus promedios durante las ultimas 4 semanas.",
    affectedEntity: "Lucas Diaz - 3ro B",
    timestamp: "Hace 1 dia",
  },
];

const MOCK_COURSES: CourseOverview[] = [
  { id: "3a", name: "3er Ano A", teaPercent: 65, tepPercent: 25, tedPercent: 10, totalStudents: 28, criticalAlerts: 1 },
  { id: "3b", name: "3er Ano B", teaPercent: 58, tepPercent: 30, tedPercent: 12, totalStudents: 26, criticalAlerts: 2 },
  { id: "4a", name: "4to Ano A", teaPercent: 72, tepPercent: 20, tedPercent: 8, totalStudents: 30, criticalAlerts: 0 },
  { id: "4b", name: "4to Ano B", teaPercent: 45, tepPercent: 25, tedPercent: 30, totalStudents: 27, criticalAlerts: 3 },
  { id: "5a", name: "5to Ano A", teaPercent: 70, tepPercent: 22, tedPercent: 8, totalStudents: 25, criticalAlerts: 1 },
  { id: "5b", name: "5to Ano B", teaPercent: 80, tepPercent: 15, tedPercent: 5, totalStudents: 24, criticalAlerts: 0 },
  { id: "6a", name: "6to Ano A", teaPercent: 85, tepPercent: 12, tedPercent: 3, totalStudents: 22, criticalAlerts: 0 },
];

// ============================================
// COMPONENT
// ============================================

export function AcademicTrackingBoard() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  
  const selectedCourse = useMemo(() => {
    return MOCK_COURSES.find(c => c.id === selectedCourseId);
  }, [selectedCourseId]);

  const highPriorityAlerts = MOCK_ALERTS.filter(a => a.severity === "HIGH");
  const mediumPriorityAlerts = MOCK_ALERTS.filter(a => a.severity === "MEDIUM");

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Tablero de Seguimiento Academico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panel de inteligencia para prevencion y gestion por excepcion
          </p>
        </div>
        <Badge variant="outline" className="bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff] w-fit">
          <Eye className="size-3.5 mr-1.5" />
          Vista: Administrador
        </Badge>
      </header>

      {/* KPIs Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Indice de Aprobacion General"
          value={`${MOCK_KPIS.approvalIndex}%`}
          trend={MOCK_KPIS.approvalTrend}
          trendLabel="vs. mes anterior"
          icon={TrendingUp}
          color="text-[#4de082]"
          bgColor="bg-[#4de082]/10"
        />
        <KPICard
          label="Alumnos en Riesgo Academico"
          value={MOCK_KPIS.atRiskStudents.toString()}
          trend={MOCK_KPIS.atRiskTrend}
          trendLabel="esta semana"
          icon={Users}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          invertTrend
        />
        <KPICard
          label="Aulas con Ausentismo Critico"
          value={MOCK_KPIS.criticalAttendanceRooms.toString()}
          trend={MOCK_KPIS.criticalAttendanceTrend}
          trendLabel="sin cambios"
          icon={Building2}
          color="text-red-400"
          bgColor="bg-red-500/10"
          invertTrend
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Alerts Section - Takes 3 columns */}
        <section className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e4e1ea] flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-400" />
              Alertas de Desviacion
            </h2>
            <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400">
              {highPriorityAlerts.length} criticas
            </Badge>
          </div>
          
          <div className="space-y-3">
            {/* High Priority */}
            {highPriorityAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
            
            {/* Medium Priority - Collapsible or secondary */}
            {mediumPriorityAlerts.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                  Prioridad Media ({mediumPriorityAlerts.length})
                </p>
                {mediumPriorityAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Course Selector Section - Takes 2 columns */}
        <section className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-[#e4e1ea] flex items-center gap-2">
            <BookOpen className="size-5 text-[#d0bcff]" />
            Resumen por Curso
          </h2>
          
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-white/[0.02] border-white/10">
                <SelectValue placeholder="Seleccionar curso para analizar..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {MOCK_COURSES.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{course.name}</span>
                      {course.criticalAlerts > 0 && (
                        <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20">
                          {course.criticalAlerts} alertas
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCourse ? (
              <div className="space-y-4 pt-2">
                {/* Course Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#e4e1ea]">{selectedCourse.name}</p>
                    <p className="text-xs text-white/40">{selectedCourse.totalStudents} alumnos</p>
                  </div>
                  {selectedCourse.criticalAlerts > 0 && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                      <AlertTriangle className="size-3 mr-1" />
                      {selectedCourse.criticalAlerts} alertas
                    </Badge>
                  )}
                </div>
                
                {/* TEA / TEP / TED Breakdown */}
                <div className="space-y-3">
                  <ProgressBar 
                    label="TEA (Trayectoria Esperada Alcanzada)" 
                    value={selectedCourse.teaPercent} 
                    color="bg-[#4de082]"
                    textColor="text-[#4de082]"
                  />
                  <ProgressBar 
                    label="TEP (Trayectoria Esperada en Proceso)" 
                    value={selectedCourse.tepPercent} 
                    color="bg-amber-400"
                    textColor="text-amber-400"
                  />
                  <ProgressBar 
                    label="TED (Trayectoria Esperada con Dificultad)" 
                    value={selectedCourse.tedPercent} 
                    color="bg-red-400"
                    textColor="text-red-400"
                  />
                </div>
                
                {/* Visual Summary */}
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                    Distribucion Visual
                  </p>
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-[#4de082] transition-all" 
                      style={{ width: `${selectedCourse.teaPercent}%` }}
                    />
                    <div 
                      className="bg-amber-400 transition-all" 
                      style={{ width: `${selectedCourse.tepPercent}%` }}
                    />
                    <div 
                      className="bg-red-400 transition-all" 
                      style={{ width: `${selectedCourse.tedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/40">
                    <span>TEA: {selectedCourse.teaPercent}%</span>
                    <span>TEP: {selectedCourse.tepPercent}%</span>
                    <span>TED: {selectedCourse.tedPercent}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Activity className="size-10 mx-auto text-white/20 mb-3" />
                <p className="text-sm text-white/40">
                  Selecciona un curso para ver el desglose de valoraciones
                </p>
              </div>
            )}
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {MOCK_COURSES.slice(0, 4).map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={cn(
                  "p-3 rounded-lg text-left transition-all",
                  "bg-white/[0.02] border hover:bg-white/[0.04]",
                  selectedCourseId === course.id 
                    ? "border-[#d0bcff]/50" 
                    : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-[#e4e1ea]">{course.name}</p>
                  <ChevronRight className="size-3 text-white/30" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full overflow-hidden flex bg-white/5">
                    <div className="bg-[#4de082]" style={{ width: `${course.teaPercent}%` }} />
                    <div className="bg-amber-400" style={{ width: `${course.tepPercent}%` }} />
                    <div className="bg-red-400" style={{ width: `${course.tedPercent}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40">{course.teaPercent}%</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface KPICardProps {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  invertTrend?: boolean;
}

function KPICard({ label, value, trend, trendLabel, icon: Icon, color, bgColor, invertTrend }: KPICardProps) {
  const isPositive = invertTrend ? trend <= 0 : trend > 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Activity;
  
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", bgColor)}>
          <Icon className={cn("size-5", color)} />
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            isPositive ? "bg-[#4de082]/10 text-[#4de082]" : "bg-red-500/10 text-red-400"
          )}>
            <TrendIcon className="size-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={cn("text-3xl font-bold mb-1", color)}>{value}</p>
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-[10px] text-white/30 mt-1">{trendLabel}</p>
    </div>
  );
}

interface AlertCardProps {
  alert: AlertItem;
}

function AlertCard({ alert }: AlertCardProps) {
  const isHigh = alert.severity === "HIGH";
  
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isHigh 
        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/30" 
        : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          isHigh ? "bg-red-500/10" : "bg-amber-500/10"
        )}>
          <AlertTriangle className={cn(
            "size-4",
            isHigh ? "text-red-400" : "text-amber-400"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "text-sm font-medium",
              isHigh ? "text-red-400" : "text-amber-400"
            )}>
              {alert.title}
            </p>
            <Badge variant="outline" className={cn(
              "text-[9px]",
              isHigh 
                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}>
              {isHigh ? "CRITICA" : "MEDIA"}
            </Badge>
          </div>
          <p className="text-xs text-white/60 mb-2 leading-relaxed">
            {alert.description}
          </p>
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {alert.affectedEntity}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {alert.timestamp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  textColor: string;
}

function ProgressBar({ label, value, color, textColor }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/60">{label}</p>
        <p className={cn("text-xs font-medium", textColor)}>{value}%</p>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
