"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Users,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Send,
  PenLine,
  FileText,
  Sparkles,
  ChevronDown,
  X,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { GradeCell } from "./grade-cell";
import { PublicationBanner } from "./publication-banner";
import { ThemeToggleCompact } from "@/components/theme-toggle";
import { toast } from "sonner";
import type {
  CourseGradeInfo,
  StudentGradeRow,
  GradeEntry,
  AssessmentConfig,
} from "@/lib/types/grades";
import {
  roundToDecimals,
  calculateWeightedAverage,
  isPassingGrade,
  ASSESSMENT_TYPE_LABELS,
} from "@/lib/types/grades";

interface GradesGridProps {
  courseInfo: CourseGradeInfo;
  onGradeUpdate: (
    studentId: string,
    assessmentId: string,
    value: number | null
  ) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  canPublish: boolean;
  isReadOnly?: boolean;
  /** User role - PRECEPTOR and DOCENTE can edit grades */
  userRole?: "ADMIN" | "DOCENTE" | "PRECEPTOR" | "FAMILIA" | string | null;
}

type SortField = "name" | "average" | "status";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "passing" | "failing" | "incomplete";

export function GradesGrid({
  courseInfo,
  onGradeUpdate,
  onPublish,
  onUnpublish,
  canPublish,
  isReadOnly = false,
  userRole = null,
}: GradesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isPeriodLocked, setIsPeriodLocked] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  // Draft mode state
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Tracks which "studentId:assessmentId" cells have been edited in draft mode
  const [draftCells, setDraftCells] = useState<Set<string>>(new Set());

  const handleDraftGradeUpdate = useCallback(
    async (studentId: string, assessmentId: string, value: number | null) => {
      await onGradeUpdate(studentId, assessmentId, value);
      if (isDraftMode) {
        setDraftCells((prev) => {
          const next = new Set(prev);
          next.add(`${studentId}:${assessmentId}`);
          return next;
        });
      }
    },
    [onGradeUpdate, isDraftMode]
  );

  const handlePublishDraft = useCallback(async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setDraftCells(new Set());
      setIsDraftMode(false);
      toast.success("Calificaciones publicadas", {
        description: "Las familias ya pueden ver las calificaciones actualizadas.",
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  }, [onPublish]);

  const { subject, assessments, students, periodName, courseName, divisionName } =
    courseInfo;
  const scale = subject.gradeScale;

  /**
   * Nivel Inicial: si educationLevel es "INITIAL" O si el nombre del curso
   * contiene "Jardín", "Jardin", "Inicial" o "Pre-escolar" (fallback semántico).
   */
  const isInitialLevel =
    courseInfo.educationLevel === "INITIAL" ||
    /jardin|jardín|inicial|pre-escolar|preescolar/i.test(courseName);

  // Determine if user can edit grades based on role
  // DOCENTE and PRECEPTOR can edit, others cannot
  const canEditGrades = !isReadOnly && !isPeriodLocked && (userRole === "DOCENTE" || userRole === "PRECEPTOR" || userRole === "ADMIN");

  // Handle period lock
  const handleLockPeriod = useCallback(() => {
    setIsPeriodLocked(true);
    setIsLockDialogOpen(false);
    toast.success(
      "Periodo bloqueado exitosamente",
      {
        description: "Los promedios y valoraciones han sido congelados. La grilla se reiniciara para el proximo periodo.",
        duration: 5000,
      }
    );
  }, []);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.enrollmentNumber.includes(query)
      );
    }

    // Apply status filter
    switch (filterType) {
      case "passing":
        result = result.filter(
          (s) => s.average !== null && isPassingGrade(s.average, scale)
        );
        break;
      case "failing":
        result = result.filter(
          (s) => s.average !== null && !isPassingGrade(s.average, scale)
        );
        break;
      case "incomplete":
        result = result.filter((s) => !s.isComplete);
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`
          );
          break;
        case "average":
          const avgA = a.average ?? -1;
          const avgB = b.average ?? -1;
          comparison = avgA - avgB;
          break;
        case "status":
          const statusA = a.isPassing ? 1 : a.average !== null ? 0 : -1;
          const statusB = b.isPassing ? 1 : b.average !== null ? 0 : -1;
          comparison = statusA - statusB;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [students, searchQuery, filterType, sortField, sortDirection, scale]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getFilterLabel = (filter: FilterType): string => {
    const labels: Record<FilterType, string> = {
      all: "Todos",
      passing: "Aprobados",
      failing: "Desaprobados",
      incomplete: "Incompletos",
    };
    return labels[filter];
  };

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const withGrades = students.filter((s) => s.average !== null).length;
    const passing = students.filter(
      (s) => s.average !== null && isPassingGrade(s.average, scale)
    ).length;

    return { total, withGrades, passing, failing: withGrades - passing };
  }, [students, scale]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Course Info */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-lg">
                  {subject.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {courseName} {divisionName} - {periodName}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <StatBadge
                icon={Users}
                value={`${stats.withGrades}/${stats.total}`}
                label="cargadas"
              />
              <StatBadge
                icon={Eye}
                value={String(stats.passing)}
                label="aprobados"
                variant="success"
              />
              <StatBadge
                icon={EyeOff}
                value={String(stats.failing)}
                label="desaprob."
                variant={stats.failing > 0 ? "danger" : "neutral"}
              />
            </div>

            {/* Draft mode toggle + Publish */}
            <div className="flex items-center gap-3">
              {canEditGrades && (
                <div className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-300",
                  isDraftMode
                    ? "bg-amber-500/10 border-amber-500/25"
                    : "bg-white/[0.02] border-white/10"
                )}>
                  <PenLine className={cn(
                    "size-3.5 transition-colors",
                    isDraftMode ? "text-amber-400" : "text-white/40"
                  )} />
                  <Label
                    htmlFor="draft-mode-grid"
                    className={cn(
                      "text-xs font-medium cursor-pointer transition-colors select-none hidden sm:block",
                      isDraftMode ? "text-amber-300" : "text-white/50"
                    )}
                  >
                    {isDraftMode ? "Borrador activo" : "Modo Borrador"}
                  </Label>
                  <Switch
                    id="draft-mode-grid"
                    checked={isDraftMode}
                    onCheckedChange={(checked) => {
                      setIsDraftMode(checked);
                      if (!checked) setDraftCells(new Set());
                    }}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              )}

              {isDraftMode && draftCells.size > 0 && (
                <Button
                  onClick={handlePublishDraft}
                  disabled={isPublishing}
                  className="gap-2 bg-[#8A2BE2] hover:bg-[#7B22D6] text-white border-0 shadow-[0_0_20px_rgba(138,43,226,0.35)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] transition-all duration-300"
                >
                  <Send className="size-4" />
                  <span className="hidden lg:inline">
                    {isPublishing ? "Publicando..." : `Publicar Calificaciones a Familias (${draftCells.size})`}
                  </span>
                  <span className="lg:hidden">
                    {isPublishing ? "..." : "Publicar"}
                  </span>
                </Button>
              )}
            </div>

            {/* Lock Period Button */}
            <div className="flex items-center gap-3">
              {userRole === "ADMIN" && !isPeriodLocked && (
                <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      <Lock className="size-4" />
                      <span className="hidden lg:inline">Bloquear y Cerrar Periodo Activo</span>
                      <span className="lg:hidden">Cerrar Periodo</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#131319] border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
                        <AlertTriangle className="size-5 text-amber-400" />
                        Confirmar Cierre de Periodo
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60 leading-relaxed">
                        Esta accion <strong className="text-amber-400">congelara los promedios numericos actuales</strong> y 
                        las <strong className="text-amber-400">valoraciones (TEA/TEP/TED)</strong> para transferirlos al Boletin Oficial. 
                        La grilla se reiniciara para el proximo periodo. 
                        <span className="block mt-2 text-red-400">Esta accion no se puede deshacer.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="border-white/10 text-white/70 hover:bg-white/5">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLockPeriod}
                        className="bg-amber-500 text-black hover:bg-amber-400"
                      >
                        <Lock className="size-4 mr-2" />
                        Confirmar Bloqueo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {isPeriodLocked && (
                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 gap-1.5">
                  <Lock className="size-3" />
                  Periodo Bloqueado
                </Badge>
              )}
              
              <ThemeToggleCompact />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Draft mode banner */}
        {isDraftMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-semibold">Edicion Preliminar activa.</span>{" "}
              Las celdas editadas muestran un indicador ambar. Los cambios no son visibles para las familias hasta publicarlos.
              {draftCells.size > 0 && (
                <span className="ml-2 font-semibold">{draftCells.size} {draftCells.size === 1 ? "nota pendiente" : "notas pendientes"} de publicacion.</span>
              )}
            </p>
          </div>
        )}

        {/* Publication Banner */}
        <PublicationBanner
          periodName={periodName}
          subjectName={subject.name}
          status={courseInfo.publicationStatus}
          students={students}
          scale={scale}
          lastPublishedAt={courseInfo.lastPublishedAt}
          lastPublishedBy={courseInfo.lastPublishedBy}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
          canPublish={canPublish}
        />

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alumno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 transition-theme"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <Filter className="size-4" />
                {getFilterLabel(filterType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["all", "passing", "failing", "incomplete"] as FilterType[]).map(
                (filter) => (
                  <DropdownMenuItem
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={cn(filterType === filter && "bg-accent")}
                  >
                    {getFilterLabel(filter)}
                    {filter !== "all" && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {filter === "passing"
                          ? stats.passing
                          : filter === "failing"
                          ? stats.failing
                          : students.filter((s) => !s.isComplete).length}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Qualitative Reports (Nivel Inicial) */}
        {isInitialLevel && (
          <QualitativeReportList
            students={filteredStudents}
            periodName={periodName}
            subjectName={subject.name}
            isReadOnly={!canEditGrades}
            isPeriodLocked={isPeriodLocked}
          />
        )}

        {/* Grades Table (todos los demás niveles) */}
        {!isInitialLevel && <div className={cn(
          "bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative",
          isPeriodLocked && "opacity-60 pointer-events-none"
        )}>
          {/* Period Locked Overlay */}
          {isPeriodLocked && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Lock className="size-6 text-amber-400" />
                <div>
                  <p className="font-semibold text-amber-200">Periodo Cerrado</p>
                  <p className="text-xs text-amber-200/70">Calificaciones congeladas para boletin</p>
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/10">
                  {/* Student Name Column */}
                  <th className="sticky left-0 z-30 bg-[#0A0A0F]/90 backdrop-blur-xl border-r border-white/[0.05]">
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-2 px-4 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors w-full"
                    >
                      Alumno
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <SortAsc className="size-3.5" />
                        ) : (
                          <SortDesc className="size-3.5" />
                        ))}
                    </button>
                  </th>

                  {/* Assessment Columns */}
                  {assessments.map((assessment) => (
                    <th
                      key={assessment.id}
                      className="px-4 py-4 text-center min-w-[100px] border-l border-white/[0.05]"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-white/50 uppercase tracking-wider truncate max-w-[120px]">
                                {assessment.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 font-medium border-white/10 text-white/40 bg-transparent"
                              >
                                {ASSESSMENT_TYPE_LABELS[assessment.type]}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#131319] border-white/10">
                            <p className="font-medium text-white/90">{assessment.name}</p>
                            <p className="text-xs text-white/50">
                              {ASSESSMENT_TYPE_LABELS[assessment.type]} | Nota maxima: {assessment.maxValue}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}

                  {/* Average Column */}
                  <th className="px-4 py-4 text-center min-w-[100px] border-l border-white/[0.05] bg-[#8A2BE2]/[0.06]">
                    <button
                      onClick={() => toggleSort("average")}
                      className="flex items-center justify-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors w-full"
                    >
                      Promedio
                      {sortField === "average" &&
                        (sortDirection === "asc" ? (
                          <SortAsc className="size-3.5" />
                        ) : (
                          <SortDesc className="size-3.5" />
                        ))}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {filteredStudents.map((student, index) => (
                  <StudentRow
                    key={student.studentId}
                    student={student}
                    assessments={assessments}
                    scale={scale}
                    isPublished={courseInfo.publicationStatus === "PUBLISHED"}
                    onGradeUpdate={handleDraftGradeUpdate}
                    isReadOnly={!canEditGrades}
                    index={index}
                    isDraftMode={isDraftMode}
                    draftCells={draftCells}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No se encontraron alumnos
              </h3>
              <p className="text-sm text-muted-foreground">
                Intenta ajustar los filtros o la busqueda
              </p>
            </div>
          )}
        </div>}
      </main>
    </div>
  );
}

// ============================================
// QUALITATIVE REPORTS — NIVEL INICIAL
// ============================================

type ProgressValue = "LOGRADO" | "EN_PROCESO" | "AUN_NO_LOGRADO" | "";

const PROGRESS_OPTIONS: {
  value: Exclude<ProgressValue, "">;
  label: string;
  badge: string;
  dot: string;
}[] = [
  {
    value: "LOGRADO",
    label: "Logrado",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    value: "EN_PROCESO",
    label: "En Proceso",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  {
    value: "AUN_NO_LOGRADO",
    label: "Aun no logrado",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
  },
];

interface QualitativeReportListProps {
  students: StudentGradeRow[];
  periodName: string;
  subjectName: string;
  isReadOnly: boolean;
  isPeriodLocked: boolean;
}

function QualitativeReportList({
  students,
  periodName,
  subjectName,
  isReadOnly,
  isPeriodLocked,
}: QualitativeReportListProps) {
  return (
    <div className={cn(
      "bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative",
      isPeriodLocked && "opacity-60 pointer-events-none"
    )}>
      {/* Locked overlay */}
      {isPeriodLocked && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Lock className="size-6 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Periodo Cerrado</p>
              <p className="text-xs text-amber-200/70">Informes congelados para boletin</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/30">
            <Sparkles className="size-4 text-[#D0BCFF]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#E4E1EA] uppercase tracking-wider">
              Informes Cualitativos — Nivel Inicial
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {subjectName} · {periodName} · {students.length} alumno{students.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {PROGRESS_OPTIONS.map((opt) => (
            <span
              key={opt.value}
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border",
                opt.badge
              )}
            >
              <span className={cn("size-1.5 rounded-full", opt.dot)} />
              {opt.label}
            </span>
          ))}
        </div>
      </div>

      {/* Student rows */}
      <div className="divide-y divide-white/[0.04]">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="size-12 text-white/20 mb-4" />
            <p className="text-sm text-white/40">No se encontraron alumnos</p>
          </div>
        ) : (
          students.map((student, index) => (
            <QualitativeStudentRow
              key={student.studentId}
              student={student}
              index={index}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// QUALITATIVE STUDENT ROW
// ============================================

interface QualitativeStudentRowProps {
  student: StudentGradeRow;
  index: number;
  isReadOnly: boolean;
}

function QualitativeStudentRow({ student, index, isReadOnly }: QualitativeStudentRowProps) {
  const [progress, setProgress] = useState<ProgressValue>("");
  const [report, setReport] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftReport, setDraftReport] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const progressConfig = PROGRESS_OPTIONS.find((o) => o.value === progress);

  const handleOpenSheet = () => {
    setDraftReport(report);
    setSheetOpen(true);
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    // Simular guardado
    await new Promise((r) => setTimeout(r, 800));
    setReport(draftReport);
    setIsSaving(false);
    setSheetOpen(false);
    toast.success("Informe guardado", {
      description: `Observaciones de ${student.firstName} ${student.lastName} guardadas correctamente.`,
      duration: 3000,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-white/[0.03] transition-colors group"
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="size-11 shrink-0 ring-2 ring-[#8A2BE2]/20 ring-offset-1 ring-offset-[#0A0A0F]">
            <AvatarImage src={student.photoUrl} alt={student.firstName} />
            <AvatarFallback className="bg-[#8A2BE2]/20 text-[#D0BCFF] font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              href={`/student/${student.studentId}`}
              className="font-semibold text-[#E4E1EA] text-[15px] hover:text-[#D0BCFF] transition-colors truncate block"
            >
              {student.lastName}, {student.firstName}
            </Link>
            <p className="text-xs text-white/40 mt-0.5">
              Legajo: {student.enrollmentNumber}
            </p>
          </div>
        </div>

        {/* Progress Select */}
        <div className="flex items-center gap-3 shrink-0">
          {progressConfig && (
            <span className={cn(
              "hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border",
              progressConfig.badge
            )}>
              <span className={cn("size-1.5 rounded-full", progressConfig.dot)} />
              {progressConfig.label}
            </span>
          )}

          <Select
            value={progress}
            onValueChange={(v) => setProgress(v as ProgressValue)}
            disabled={isReadOnly}
          >
            <SelectTrigger
              className={cn(
                "w-[180px] bg-black/40 border-white/10 text-white/60 rounded-xl transition-all duration-200",
                "focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50",
                "hover:border-white/20 hover:text-white",
                !progress && "text-white/30",
                progressConfig && cn(progressConfig.badge, "border")
              )}
            >
              <SelectValue placeholder="Seleccionar progreso..." />
            </SelectTrigger>
            <SelectContent className="bg-[#131319] border-white/10 rounded-xl">
              {PROGRESS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-white/5 text-white/70 focus:text-white rounded-lg cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full shrink-0", opt.dot)} />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report preview + open button */}
        <div className="flex items-center gap-3 shrink-0">
          {report && (
            <p className="hidden xl:block max-w-[200px] text-xs text-white/40 truncate italic">
              &quot;{report}&quot;
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSheet}
            disabled={isReadOnly}
            className={cn(
              "gap-2 border-white/10 text-white/60 hover:text-white hover:border-[#8A2BE2]/40 hover:bg-[#8A2BE2]/10 transition-all duration-200",
              report && "border-[#8A2BE2]/25 text-[#D0BCFF]"
            )}
          >
            <FileText className="size-3.5" />
            {report ? "Editar Informe" : "Redactar Informe"}
          </Button>
        </div>
      </motion.div>

      {/* Report Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg bg-[#0d0d14]/95 backdrop-blur-2xl border-l border-white/10 p-0 flex flex-col"
        >
          {/* Sheet Header */}
          <SheetHeader className="px-6 py-5 border-b border-white/10 bg-[#0A0A0F]/60">
            <div className="flex items-start gap-4">
              <Avatar className="size-12 shrink-0 ring-2 ring-[#8A2BE2]/30 ring-offset-2 ring-offset-[#0A0A0F]">
                <AvatarImage src={student.photoUrl} alt={student.firstName} />
                <AvatarFallback className="bg-[#8A2BE2]/20 text-[#D0BCFF] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-[#E4E1EA] text-lg font-bold text-left">
                  {student.firstName} {student.lastName}
                </SheetTitle>
                <SheetDescription className="text-white/40 text-sm text-left mt-0.5">
                  Informe cualitativo de desempeno cognitivo y social
                </SheetDescription>
                <p className="text-xs text-white/30 mt-1">
                  Legajo: {student.enrollmentNumber}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Textarea area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Progress indicator in sheet */}
            <div>
              <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Progreso registrado
              </Label>
              {progressConfig ? (
                <span className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border",
                  progressConfig.badge
                )}>
                  <span className={cn("size-2 rounded-full", progressConfig.dot)} />
                  {progressConfig.label}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/30 border border-white/[0.06] bg-white/[0.02]">
                  Sin progreso seleccionado
                </span>
              )}
            </div>

            {/* Observations textarea */}
            <div className="space-y-2">
              <Label
                htmlFor={`report-${student.studentId}`}
                className="text-xs font-semibold text-white/50 uppercase tracking-wider block"
              >
                Observaciones de desempeno
              </Label>
              <Textarea
                id={`report-${student.studentId}`}
                value={draftReport}
                onChange={(e) => setDraftReport(e.target.value)}
                placeholder="Describe el desempeno cognitivo, emocional y social del alumno durante este periodo. Incluye logros, areas de mejora y recomendaciones para la familia..."
                rows={12}
                disabled={isReadOnly}
                className={cn(
                  "w-full resize-none rounded-xl",
                  "bg-black/40 border-white/10 text-white placeholder:text-white/25",
                  "focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50",
                  "transition-all duration-200 leading-relaxed"
                )}
              />
              <p className="text-xs text-white/30 text-right">
                {draftReport.length} caracteres
              </p>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-[#8A2BE2]/[0.06] border border-[#8A2BE2]/15">
              <p className="text-xs font-semibold text-[#D0BCFF]/80 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="size-3" />
                Guia de redaccion
              </p>
              <ul className="space-y-1 text-xs text-white/40 list-disc list-inside">
                <li>Describe conductas observables, no juicios de valor</li>
                <li>Menciona avances en autonomia, juego y lenguaje</li>
                <li>Incluye como se relaciona con pares y adultos</li>
                <li>Sugiere actividades para reforzar en casa</li>
              </ul>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0A0A0F]/60 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setSheetOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/5"
            >
              <X className="size-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReport}
              disabled={isSaving || isReadOnly}
              className="gap-2 bg-[#8A2BE2] hover:bg-[#7B22D6] text-white border-0 shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] transition-all duration-300"
            >
              <Save className="size-4" />
              {isSaving ? "Guardando..." : "Guardar Informe"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================
// STUDENT ROW SUB-COMPONENT
// ============================================

interface StudentRowProps {
  student: StudentGradeRow;
  assessments: AssessmentConfig[];
  scale: {
    type: string;
    minPassing: number;
    maxGrade: number;
    conceptualValues?: string[];
  };
  isPublished: boolean;
  onGradeUpdate: (
    studentId: string,
    assessmentId: string,
    value: number | null
  ) => Promise<void>;
  isReadOnly: boolean;
  index: number;
  isDraftMode: boolean;
  draftCells: Set<string>;
}

function StudentRow({
  student,
  assessments,
  scale,
  isPublished,
  onGradeUpdate,
  isReadOnly,
  index,
  isDraftMode,
  draftCells,
}: StudentRowProps) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const passing = student.average !== null && isPassingGrade(student.average, scale);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "group transition-colors duration-200",
        "hover:bg-white/[0.04]",
        !student.isComplete && "bg-amber-500/[0.03]"
      )}
    >
      {/* Student Info - Increased padding for breathing room */}
      <td className="sticky left-0 z-10 bg-[#0d0d14] group-hover:bg-[#0d0d14] backdrop-blur-xl transition-all border-r border-white/[0.05]">
        <div className="flex items-center gap-4 px-5 py-5">
          <Avatar className="size-11 ring-2 ring-border/40 shadow-sm">
            <AvatarImage src={student.photoUrl} alt={student.firstName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <Link 
              href={`/student/${student.studentId}`}
              className="font-medium text-foreground truncate text-[15px] hover:text-primary hover:underline underline-offset-2 transition-colors block"
            >
              {student.lastName}, {student.firstName}
            </Link>
            <p className="text-xs text-muted-foreground tracking-wide">
              Legajo: {student.enrollmentNumber}
            </p>
          </div>
        </div>
      </td>

      {/* Grade Cells */}
      {assessments.map((assessment) => {
        const grade = student.grades[assessment.id] || null;
        const cellKey = `${student.studentId}:${assessment.id}`;
        const isPreliminary = isDraftMode && draftCells.has(cellKey);
        return (
          <td
            key={assessment.id}
            className={cn(
              "px-4 py-5 text-center border-l border-white/[0.05] relative",
              isPreliminary && "bg-amber-500/[0.04]"
            )}
          >
            {/* Indicador de nota preliminar no publicada */}
            {isPreliminary && (
              <span
                className="absolute top-2 right-2 size-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                aria-label="Nota preliminar no publicada"
              />
            )}
            <GradeCell
              grade={grade}
              assessmentId={assessment.id}
              studentId={student.studentId}
              scale={scale}
              maxValue={assessment.maxValue}
              isPublished={isPublished}
              onUpdate={onGradeUpdate}
              disabled={isReadOnly}
            />
          </td>
        );
      })}

      {/* Average */}
      <td className="px-5 py-5 text-center border-l border-white/[0.05] bg-[#8A2BE2]/[0.04]">
        <div
          className={cn(
            "inline-flex items-center justify-center size-14 rounded-2xl font-bold text-xl transition-all shadow-sm",
            student.average !== null
              ? passing
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10"
                : "bg-red-500/10 text-red-400 border border-red-500/20 shadow-red-500/10"
              : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
          )}
        >
          {student.average !== null
            ? roundToDecimals(student.average).toFixed(1)
            : "-"}
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================
// STAT BADGE SUB-COMPONENT
// ============================================

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  variant?: "neutral" | "success" | "danger";
}

function StatBadge({ icon: Icon, value, label, variant = "neutral" }: StatBadgeProps) {
  const variantClasses = {
    neutral: "bg-muted/50 text-muted-foreground",
    success: "bg-status-present-soft/50 text-status-present-foreground",
    danger: "bg-status-absent-soft/50 text-status-absent-foreground",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-theme",
        variantClasses[variant]
      )}
    >
      <Icon className="size-4" />
      <span className="font-semibold">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}
