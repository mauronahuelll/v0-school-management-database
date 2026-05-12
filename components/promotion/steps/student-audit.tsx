"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Calendar,
  AlertOctagon,
  FileText,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StudentAuditData } from "@/lib/types/promotion";

// ============================================
// STEP 2: STUDENT AUDIT
// Glassmorphism cards with performance summary
// ============================================

interface StudentAuditProps {
  students: StudentAuditData[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClosureNoteChange: (studentId: string, note: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StudentAudit({
  students,
  selectedIds,
  onSelectionChange,
  onClosureNoteChange,
  onNext,
  onBack,
}: StudentAuditProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "ineligible">("all");

  const filteredStudents = students.filter((s) => {
    if (filter === "eligible") return s.isEligible;
    if (filter === "ineligible") return !s.isEligible;
    return true;
  });

  const eligibleCount = students.filter((s) => s.isEligible).length;
  const selectedCount = selectedIds.length;

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAllEligible = () => {
    const eligibleIds = students.filter((s) => s.isEligible).map((s) => s.id);
    onSelectionChange(eligibleIds);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-8">
      {/* Header with stats and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Auditoria de Desempeno
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa cada alumno y agrega notas de cierre pedagogico
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-present-soft">
            <CheckCircle2 className="size-4 text-status-present" />
            <span className="text-sm font-medium text-status-present-foreground">
              {eligibleCount} aptos
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-absent-soft">
            <XCircle className="size-4 text-status-absent" />
            <span className="text-sm font-medium text-status-absent-foreground">
              {students.length - eligibleCount} pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Filter and bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2">
          {(["all", "eligible", "ineligible"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "all" && "Todos"}
              {f === "eligible" && "Aptos"}
              {f === "ineligible" && "Pendientes"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllEligible}
            className="rounded-xl"
          >
            <CheckSquare className="size-4 mr-2" />
            Seleccionar aptos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="rounded-xl"
          >
            <Square className="size-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Student cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student, index) => (
            <StudentAuditCard
              key={student.id}
              student={student}
              index={index}
              isSelected={selectedIds.includes(student.id)}
              isExpanded={expandedId === student.id}
              onToggleSelect={() => toggleSelection(student.id)}
              onToggleExpand={() =>
                setExpandedId(expandedId === student.id ? null : student.id)
              }
              onClosureNoteChange={(note) => onClosureNoteChange(student.id, note)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 glass-panel rounded-2xl">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="rounded-xl"
        >
          <ChevronLeft className="size-5 mr-2" />
          Volver
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Seleccionados para promocion
          </p>
          <p className="text-2xl font-bold text-foreground">
            {selectedCount} <span className="text-muted-foreground font-normal">/ {students.length}</span>
          </p>
        </div>

        <Button
          size="lg"
          onClick={onNext}
          disabled={selectedCount === 0}
          className="rounded-xl px-8 shadow-lg"
        >
          Continuar
          <ChevronRight className="size-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// STUDENT AUDIT CARD (Glassmorphism)
// ============================================

interface StudentAuditCardProps {
  student: StudentAuditData;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onClosureNoteChange: (note: string) => void;
}

function StudentAuditCard({
  student,
  index,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onClosureNoteChange,
}: StudentAuditCardProps) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const { stats } = student;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "glass-panel rounded-2xl overflow-hidden transition-all duration-300",
        isSelected && "ring-2 ring-primary shadow-lg",
        !student.isEligible && "opacity-80"
      )}
    >
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Selection checkbox */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleSelect}
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center",
                    "border-2 transition-all duration-200",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isSelected && <CheckCircle2 className="size-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isSelected ? "Deseleccionar" : "Seleccionar para promocion"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Avatar & Name */}
          <Avatar className="size-14 ring-2 ring-border/50">
            <AvatarImage src={student.photoUrl} alt={student.firstName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-lg truncate">
                {student.lastName}, {student.firstName}
              </h4>
              {student.isEligible ? (
                <Badge className="bg-status-present text-status-present-foreground">
                  Apto
                </Badge>
              ) : (
                <Badge className="bg-status-absent text-status-absent-foreground">
                  Pendiente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              DNI: {student.dni} | Legajo: {student.enrollmentNumber}
            </p>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Average */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <GraduationCap className="size-4" />
                <span className="text-xs uppercase tracking-wide">Promedio</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.finalAverage !== null && stats.finalAverage >= 6
                    ? "text-status-present"
                    : "text-status-absent"
                )}
              >
                {stats.finalAverage?.toFixed(1) || "-"}
              </p>
            </div>

            {/* Attendance */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-4" />
                <span className="text-xs uppercase tracking-wide">Asistencia</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.attendanceRate >= 75
                    ? "text-status-present"
                    : "text-status-absent"
                )}
              >
                {stats.attendanceRate.toFixed(0)}%
              </p>
            </div>

            {/* Sanctions */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertOctagon className="size-4" />
                <span className="text-xs uppercase tracking-wide">Sanciones</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.totalSanctions > 3
                    ? "text-status-absent"
                    : "text-foreground"
                )}
              >
                {stats.totalSanctions}
              </p>
            </div>
          </div>

          {/* Expand toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="rounded-xl"
          >
            <FileText className="size-4 mr-1" />
            {isExpanded ? "Cerrar" : "Notas"}
          </Button>
        </div>

        {/* Mobile stats */}
        <div className="lg:hidden mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className="font-bold text-lg">{stats.finalAverage?.toFixed(1) || "-"}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Asistencia</p>
            <p className="font-bold text-lg">{stats.attendanceRate.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Sanciones</p>
            <p className="font-bold text-lg">{stats.totalSanctions}</p>
          </div>
        </div>

        {/* Eligibility notes if not eligible */}
        {!student.isEligible && student.eligibilityNotes && (
          <div className="mt-4 p-3 rounded-xl bg-status-absent-soft/50 border border-status-absent/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-status-absent shrink-0 mt-0.5" />
              <p className="text-sm text-status-absent-foreground">
                {student.eligibilityNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded section - Closure note */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50 bg-muted/20"
          >
            <div className="p-5 space-y-3">
              <label className="text-sm font-medium text-foreground">
                Nota de Cierre Pedagogico
              </label>
              <Textarea
                placeholder="Escribe observaciones relevantes para el legajo del alumno..."
                value={student.closureNote || ""}
                onChange={(e) => onClosureNoteChange(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta nota se adjuntara al historial academico del alumno.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
