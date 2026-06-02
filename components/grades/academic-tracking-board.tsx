"use client";

import { useState, useMemo, Fragment } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  BookOpen,
  UserX,
  XCircle,
  CheckCircle2,
  Percent,
  BarChart3,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface StudentAtRisk {
  id: string;
  name: string;
  reason: string;
  tedCount: number;
  absences: number;
  pendingRecoveries: number;
}

interface CourseMetrics {
  id: string;
  name: string;
  year: number;
  division: string;
  totalStudents: number;
  // Attendance
  attendancePercent: number;
  // Grade Distribution (TEA/TEP/TED)
  teaPercent: number;
  tepPercent: number;
  tedPercent: number;
  // Alerts
  studentsAtRisk: number;
  criticalAlerts: number;
  // Drill-down data
  riskStudents: StudentAtRisk[];
}

interface PreventionKPI {
  label: string;
  value: string;
  detail: string;
  severity: "critical" | "warning" | "normal";
  icon: React.ElementType;
}

// ============================================
// MOCK DATA - Course Matrix
// ============================================

const MOCK_COURSES_MATRIX: CourseMetrics[] = [
  {
    id: "1a",
    name: "1er Ano A",
    year: 1,
    division: "A",
    totalStudents: 32,
    attendancePercent: 94,
    teaPercent: 68,
    tepPercent: 22,
    tedPercent: 10,
    studentsAtRisk: 1,
    criticalAlerts: 0,
    riskStudents: [
      { id: "s1", name: "Martin Sosa", reason: "Bajo rendimiento en Matematica", tedCount: 2, absences: 8, pendingRecoveries: 1 },
    ],
  },
  {
    id: "1b",
    name: "1er Ano B",
    year: 1,
    division: "B",
    totalStudents: 30,
    attendancePercent: 91,
    teaPercent: 62,
    tepPercent: 25,
    tedPercent: 13,
    studentsAtRisk: 2,
    criticalAlerts: 1,
    riskStudents: [
      { id: "s2", name: "Lucia Fernandez", reason: "Inasistencias reiteradas", tedCount: 1, absences: 15, pendingRecoveries: 0 },
      { id: "s3", name: "Tomas Aguirre", reason: "Multiples TED", tedCount: 3, absences: 5, pendingRecoveries: 2 },
    ],
  },
  {
    id: "2a",
    name: "2do Ano A",
    year: 2,
    division: "A",
    totalStudents: 28,
    attendancePercent: 88,
    teaPercent: 55,
    tepPercent: 28,
    tedPercent: 17,
    studentsAtRisk: 3,
    criticalAlerts: 2,
    riskStudents: [
      { id: "s4", name: "Valentina Castro", reason: "Riesgo academico severo", tedCount: 4, absences: 18, pendingRecoveries: 3 },
      { id: "s5", name: "Nicolas Peralta", reason: "Ausencias criticas", tedCount: 2, absences: 22, pendingRecoveries: 1 },
      { id: "s6", name: "Camila Rodriguez", reason: "Bajo rendimiento general", tedCount: 3, absences: 10, pendingRecoveries: 2 },
    ],
  },
  {
    id: "2b",
    name: "2do Ano B",
    year: 2,
    division: "B",
    totalStudents: 29,
    attendancePercent: 92,
    teaPercent: 70,
    tepPercent: 20,
    tedPercent: 10,
    studentsAtRisk: 1,
    criticalAlerts: 0,
    riskStudents: [
      { id: "s7", name: "Julian Mendez", reason: "Recuperatorios pendientes", tedCount: 1, absences: 6, pendingRecoveries: 2 },
    ],
  },
  {
    id: "3a",
    name: "3er Ano A",
    year: 3,
    division: "A",
    totalStudents: 27,
    attendancePercent: 78,
    teaPercent: 48,
    tepPercent: 30,
    tedPercent: 22,
    studentsAtRisk: 4,
    criticalAlerts: 3,
    riskStudents: [
      { id: "s8", name: "Sofia Gimenez", reason: "Ausentismo critico", tedCount: 2, absences: 25, pendingRecoveries: 1 },
      { id: "s9", name: "Mateo Alvarez", reason: "Multiples materias en TED", tedCount: 5, absences: 12, pendingRecoveries: 4 },
      { id: "s10", name: "Florencia Luna", reason: "Riesgo de repitencia", tedCount: 4, absences: 16, pendingRecoveries: 3 },
      { id: "s11", name: "Lucas Diaz", reason: "Tendencia descendente", tedCount: 3, absences: 9, pendingRecoveries: 2 },
    ],
  },
  {
    id: "3b",
    name: "3er Ano B",
    year: 3,
    division: "B",
    totalStudents: 26,
    attendancePercent: 85,
    teaPercent: 58,
    tepPercent: 27,
    tedPercent: 15,
    studentsAtRisk: 2,
    criticalAlerts: 1,
    riskStudents: [
      { id: "s12", name: "Agustina Moreno", reason: "Bajo rendimiento en Fisica", tedCount: 2, absences: 11, pendingRecoveries: 1 },
      { id: "s13", name: "Federico Ruiz", reason: "Ausencias frecuentes", tedCount: 1, absences: 14, pendingRecoveries: 0 },
    ],
  },
  {
    id: "4a",
    name: "4to Ano A",
    year: 4,
    division: "A",
    totalStudents: 25,
    attendancePercent: 93,
    teaPercent: 75,
    tepPercent: 18,
    tedPercent: 7,
    studentsAtRisk: 0,
    criticalAlerts: 0,
    riskStudents: [],
  },
  {
    id: "4b",
    name: "4to Ano B",
    year: 4,
    division: "B",
    totalStudents: 24,
    attendancePercent: 76,
    teaPercent: 42,
    tepPercent: 28,
    tedPercent: 30,
    studentsAtRisk: 5,
    criticalAlerts: 4,
    riskStudents: [
      { id: "s14", name: "Ignacio Torres", reason: "45% TED en Matematica", tedCount: 4, absences: 20, pendingRecoveries: 3 },
      { id: "s15", name: "Martina Vega", reason: "Riesgo academico", tedCount: 3, absences: 17, pendingRecoveries: 2 },
      { id: "s16", name: "Lautaro Sanchez", reason: "Multiples ausencias", tedCount: 2, absences: 23, pendingRecoveries: 1 },
      { id: "s17", name: "Paula Ortiz", reason: "Bajo rendimiento sostenido", tedCount: 3, absences: 14, pendingRecoveries: 2 },
      { id: "s18", name: "Bruno Garcia", reason: "Recuperatorios vencidos", tedCount: 2, absences: 10, pendingRecoveries: 4 },
    ],
  },
  {
    id: "5a",
    name: "5to Ano A",
    year: 5,
    division: "A",
    totalStudents: 23,
    attendancePercent: 89,
    teaPercent: 72,
    tepPercent: 20,
    tedPercent: 8,
    studentsAtRisk: 1,
    criticalAlerts: 0,
    riskStudents: [
      { id: "s19", name: "Carolina Paz", reason: "Recuperatorios pendientes", tedCount: 1, absences: 8, pendingRecoveries: 2 },
    ],
  },
  {
    id: "5b",
    name: "5to Ano B",
    year: 5,
    division: "B",
    totalStudents: 22,
    attendancePercent: 95,
    teaPercent: 82,
    tepPercent: 14,
    tedPercent: 4,
    studentsAtRisk: 0,
    criticalAlerts: 0,
    riskStudents: [],
  },
  {
    id: "6a",
    name: "6to Ano A",
    year: 6,
    division: "A",
    totalStudents: 21,
    attendancePercent: 97,
    teaPercent: 88,
    tepPercent: 10,
    tedPercent: 2,
    studentsAtRisk: 0,
    criticalAlerts: 0,
    riskStudents: [],
  },
];

// Prevention KPIs - Calculated from matrix data
const PREVENTION_KPIS: PreventionKPI[] = [
  {
    label: "Alumno con Mayor Ausentismo",
    value: "Lautaro Sanchez",
    detail: "4to B - 23 ausencias (25% del ciclo)",
    severity: "critical",
    icon: UserX,
  },
  {
    label: "Materia con Mayor Reprobacion",
    value: "Matematica",
    detail: "32% TED institucional promedio",
    severity: "critical",
    icon: XCircle,
  },
  {
    label: "Curso Mas Critico",
    value: "4to Ano B",
    detail: "30% TED, 76% Presentismo, 5 alumnos en riesgo",
    severity: "critical",
    icon: AlertTriangle,
  },
  {
    label: "Curso Modelo",
    value: "6to Ano A",
    detail: "88% TEA, 97% Presentismo, 0 alertas",
    severity: "normal",
    icon: CheckCircle2,
  },
];

// ============================================
// COMPONENT
// ============================================

export function AcademicTrackingBoard() {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const toggleExpand = (courseId: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // Calculate global metrics
  const globalMetrics = useMemo(() => {
    const totalStudents = MOCK_COURSES_MATRIX.reduce((acc, c) => acc + c.totalStudents, 0);
    const avgAttendance = MOCK_COURSES_MATRIX.reduce((acc, c) => acc + c.attendancePercent, 0) / MOCK_COURSES_MATRIX.length;
    const avgTEA = MOCK_COURSES_MATRIX.reduce((acc, c) => acc + c.teaPercent, 0) / MOCK_COURSES_MATRIX.length;
    const totalAtRisk = MOCK_COURSES_MATRIX.reduce((acc, c) => acc + c.studentsAtRisk, 0);
    const totalCritical = MOCK_COURSES_MATRIX.reduce((acc, c) => acc + c.criticalAlerts, 0);
    
    return {
      totalStudents,
      avgAttendance: Math.round(avgAttendance),
      avgTEA: Math.round(avgTEA),
      totalAtRisk,
      totalCritical,
      totalCourses: MOCK_COURSES_MATRIX.length,
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Tablero de Seguimiento Academico
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Matriz de control de cursos con metricas cruzadas y drill-down
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff]">
            <Eye className="size-3.5 mr-1.5" />
            Vista: Administrador
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60">
            <Clock className="size-3.5 mr-1.5" />
            Actualizado: Hoy 08:30
          </Badge>
        </div>
      </header>

      {/* Prevention KPIs - Top Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PREVENTION_KPIS.map((kpi, idx) => (
          <PreventionKPICard key={idx} kpi={kpi} />
        ))}
      </section>

      {/* Global Summary Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[#d0bcff]" />
          <span className="text-sm text-white/60">Total Alumnos:</span>
          <span className="text-sm font-bold text-[#e4e1ea]">{globalMetrics.totalStudents}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Percent className="size-4 text-[#4de082]" />
          <span className="text-sm text-white/60">Presentismo Prom:</span>
          <span className="text-sm font-bold text-[#e4e1ea]">{globalMetrics.avgAttendance}%</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[#4de082]" />
          <span className="text-sm text-white/60">TEA Prom:</span>
          <span className="text-sm font-bold text-[#e4e1ea]">{globalMetrics.avgTEA}%</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-400" />
          <span className="text-sm text-white/60">En Riesgo:</span>
          <span className="text-sm font-bold text-amber-400">{globalMetrics.totalAtRisk}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <XCircle className="size-4 text-red-400" />
          <span className="text-sm text-white/60">Alertas Criticas:</span>
          <span className="text-sm font-bold text-red-400">{globalMetrics.totalCritical}</span>
        </div>
      </div>

      {/* Course Control Matrix Table */}
      <section className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-[#d0bcff]" />
            <h2 className="font-semibold text-[#e4e1ea]">Grilla de Control de Cursos</h2>
          </div>
          <span className="text-xs text-white/40">{MOCK_COURSES_MATRIX.length} cursos</span>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60 text-xs uppercase tracking-wider w-[180px]">Curso</TableHead>
                <TableHead className="text-white/60 text-xs uppercase tracking-wider text-center">Alumnos</TableHead>
                <TableHead className="text-white/60 text-xs uppercase tracking-wider text-center">Presentismo</TableHead>
                <TableHead className="text-white/60 text-xs uppercase tracking-wider text-center">Distribucion TEA/TEP/TED</TableHead>
                <TableHead className="text-white/60 text-xs uppercase tracking-wider text-center">Alertas</TableHead>
                <TableHead className="text-white/60 text-xs uppercase tracking-wider text-center w-[120px]">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_COURSES_MATRIX.map((course) => {
                const isExpanded = expandedCourses.has(course.id);
                const hasRisk = course.studentsAtRisk > 0;
                const isCritical = course.attendancePercent < 80 || course.tedPercent >= 25;
                
                return (
                  <Fragment key={course.id}>
                    <TableRow 
                      className={cn(
                        "border-white/5 transition-colors",
                        isCritical ? "bg-red-500/5" : "hover:bg-white/[0.02]"
                      )}
                    >
                      {/* Course Name */}
                      <TableCell className="font-medium text-[#e4e1ea]">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-[#d0bcff]/60" />
                          {course.name}
                        </div>
                      </TableCell>
                      
                      {/* Students Count */}
                      <TableCell className="text-center text-white/70">
                        {course.totalStudents}
                      </TableCell>
                      
                      {/* Attendance Percentage */}
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          course.attendancePercent < 80 ? "text-red-400" : 
                          course.attendancePercent < 90 ? "text-amber-400" : 
                          "text-[#4de082]"
                        )}>
                          {course.attendancePercent}%
                        </span>
                      </TableCell>
                      
                      {/* TEA/TEP/TED Distribution Badges */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge 
                            variant="outline" 
                            className="bg-[#4de082]/10 text-[#4de082] border-[#4de082]/30 text-[10px] font-mono px-2"
                          >
                            TEA:{course.teaPercent}%
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono px-2"
                          >
                            TEP:{course.tepPercent}%
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] font-mono px-2",
                              course.tedPercent >= 25 
                                ? "bg-red-500/20 text-red-400 border-red-500/40 font-bold" 
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            )}
                          >
                            TED:{course.tedPercent}%
                          </Badge>
                        </div>
                      </TableCell>
                      
                      {/* Alerts */}
                      <TableCell className="text-center">
                        {hasRisk ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <AlertTriangle className={cn(
                              "size-4",
                              course.criticalAlerts > 0 ? "text-red-400" : "text-amber-400"
                            )} />
                            <span className={cn(
                              "text-sm font-medium",
                              course.criticalAlerts > 0 ? "text-red-400" : "text-amber-400"
                            )}>
                              {course.studentsAtRisk} en riesgo
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#4de082]">Sin alertas</span>
                        )}
                      </TableCell>
                      
                      {/* Action Button */}
                      <TableCell className="text-center">
                        {hasRisk ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(course.id)}
                            className={cn(
                              "text-xs gap-1",
                              isExpanded 
                                ? "text-[#d0bcff] bg-[#d0bcff]/10" 
                                : "text-white/60 hover:text-[#d0bcff]"
                            )}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="size-3" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronRight className="size-3" />
                                Ver Detalle
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-white/30">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* Drill-down Row - Students at Risk */}
                    {isExpanded && hasRisk && (
                      <TableRow className="bg-[#d0bcff]/5 border-white/5">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-[#d0bcff] uppercase tracking-wider font-bold">
                              Alumnos en Situacion de Riesgo - {course.name}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {course.riskStudents.map((student) => (
                                <StudentRiskCard key={student.id} student={student} />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 p-4 rounded-xl bg-white/[0.01] border border-white/5">
        <span className="font-medium text-white/60">Leyenda:</span>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-[#4de082]" />
          <span>TEA: Trayectoria Esperada Alcanzada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-amber-400" />
          <span>TEP: En Proceso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-red-400" />
          <span>TED: Con Dificultad</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-red-400">Presentismo &lt;80% = Critico</span>
        <span className="text-red-400">TED &gt;=25% = Alerta</span>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface PreventionKPICardProps {
  kpi: PreventionKPI;
}

function PreventionKPICard({ kpi }: PreventionKPICardProps) {
  const Icon = kpi.icon;
  
  const colors = {
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: "text-red-400",
      text: "text-red-400",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "text-amber-400",
      text: "text-amber-400",
    },
    normal: {
      bg: "bg-[#4de082]/10",
      border: "border-[#4de082]/20",
      icon: "text-[#4de082]",
      text: "text-[#4de082]",
    },
  }[kpi.severity];
  
  return (
    <div className={cn(
      "p-4 rounded-xl border backdrop-blur-sm",
      colors.bg,
      colors.border
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <Icon className={cn("size-5", colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
            {kpi.label}
          </p>
          <p className={cn("text-sm font-bold truncate", colors.text)}>
            {kpi.value}
          </p>
          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
            {kpi.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StudentRiskCardProps {
  student: StudentAtRisk;
}

function StudentRiskCard({ student }: StudentRiskCardProps) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#e4e1ea]">{student.name}</p>
        {student.tedCount >= 3 && (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px]">
            CRITICO
          </Badge>
        )}
      </div>
      <p className="text-xs text-white/50">{student.reason}</p>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-red-400">
          <XCircle className="size-3" />
          {student.tedCount} TED
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <UserX className="size-3" />
          {student.absences} faltas
        </span>
        {student.pendingRecoveries > 0 && (
          <span className="flex items-center gap-1 text-[#d0bcff]">
            <Clock className="size-3" />
            {student.pendingRecoveries} recup.
          </span>
        )}
      </div>
    </div>
  );
}
