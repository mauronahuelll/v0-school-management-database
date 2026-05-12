"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Users,
  AlertTriangle,
  PartyPopper,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  type CourseLevel,
  type Course,
  type Division,
  getLevelLabel,
} from "@/lib/types/school-context";
import type { PromotionStatus, StudentAuditData } from "@/lib/types/promotion";

// ============================================
// STEP 4: EXECUTION
// Confirmation and processing with micro-interactions
// ============================================

interface ExecutionProps {
  // Transfer details
  sourceLevel: CourseLevel;
  sourceCourse: Course;
  sourceDivision: Division;
  destinationLevel: CourseLevel;
  destinationCourse: Course;
  destinationDivision: Division;
  
  // Students
  selectedStudents: StudentAuditData[];
  
  // Execution state
  status: PromotionStatus;
  processedCount: number;
  errors: string[];
  
  // Actions
  onExecute: () => Promise<void>;
  onBack: () => void;
  onReset: () => void;
}

export function Execution({
  sourceLevel,
  sourceCourse,
  sourceDivision,
  destinationLevel,
  destinationCourse,
  destinationDivision,
  selectedStudents,
  status,
  processedCount,
  errors,
  onExecute,
  onBack,
  onReset,
}: ExecutionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const totalCount = selectedStudents.length;
  const progress = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

  const handleExecute = async () => {
    setIsConfirming(false);
    await onExecute();
  };

  return (
    <div className="space-y-10">
      {/* Status-based content */}
      <AnimatePresence mode="wait">
        {status === "PENDING" && (
          <PendingState
            key="pending"
            sourceLevel={sourceLevel}
            sourceCourse={sourceCourse}
            sourceDivision={sourceDivision}
            destinationLevel={destinationLevel}
            destinationCourse={destinationCourse}
            destinationDivision={destinationDivision}
            selectedStudents={selectedStudents}
            isConfirming={isConfirming}
            onConfirm={() => setIsConfirming(true)}
            onExecute={handleExecute}
            onCancel={() => setIsConfirming(false)}
            onBack={onBack}
          />
        )}

        {status === "IN_PROGRESS" && (
          <InProgressState
            key="progress"
            progress={progress}
            processedCount={processedCount}
            totalCount={totalCount}
          />
        )}

        {status === "COMPLETED" && (
          <CompletedState
            key="completed"
            processedCount={processedCount}
            destinationLevel={destinationLevel}
            destinationCourse={destinationCourse}
            destinationDivision={destinationDivision}
            onReset={onReset}
          />
        )}

        {status === "FAILED" && (
          <FailedState
            key="failed"
            errors={errors}
            processedCount={processedCount}
            totalCount={totalCount}
            onRetry={handleExecute}
            onReset={onReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// PENDING STATE - Confirmation screen
// ============================================

interface PendingStateProps {
  sourceLevel: CourseLevel;
  sourceCourse: Course;
  sourceDivision: Division;
  destinationLevel: CourseLevel;
  destinationCourse: Course;
  destinationDivision: Division;
  selectedStudents: StudentAuditData[];
  isConfirming: boolean;
  onConfirm: () => void;
  onExecute: () => void;
  onCancel: () => void;
  onBack: () => void;
}

function PendingState({
  sourceLevel,
  sourceCourse,
  sourceDivision,
  destinationLevel,
  destinationCourse,
  destinationDivision,
  selectedStudents,
  isConfirming,
  onConfirm,
  onExecute,
  onCancel,
  onBack,
}: PendingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-primary/10 mb-6">
          <Rocket className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Confirmar Promocion
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Revisa los detalles del traspaso antes de ejecutar. Esta accion actualizara
          el legajo de cada alumno.
        </p>
      </div>

      {/* Transfer summary card */}
      <div className="hero-card p-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Source */}
          <div className="text-center md:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Origen
            </p>
            <p className="font-bold text-xl text-foreground">
              {getLevelLabel(sourceLevel)}
            </p>
            <p className="text-muted-foreground">
              {sourceCourse.name} &quot;{sourceDivision.name}&quot;
            </p>
          </div>

          {/* Arrow with count */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Users className="size-5" />
              <span className="text-2xl font-bold">{selectedStudents.length}</span>
              <span className="text-sm">alumnos</span>
            </div>
            <ArrowRight className="size-8 text-primary hidden md:block" />
          </div>

          {/* Destination */}
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Destino
            </p>
            <p className="font-bold text-xl text-foreground">
              {getLevelLabel(destinationLevel)}
            </p>
            <p className="text-muted-foreground">
              {destinationCourse.name} &quot;{destinationDivision.name}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Student list preview */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">
            Alumnos a Promover
          </h4>
          <span className="text-sm text-muted-foreground">
            {selectedStudents.length} seleccionados
          </span>
        </div>

        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {selectedStudents.slice(0, 10).map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
            >
              <span className="font-medium text-foreground">
                {student.lastName}, {student.firstName}
              </span>
              <span className="text-sm text-muted-foreground">
                Prom: {student.stats.finalAverage?.toFixed(1) || "-"}
              </span>
            </motion.div>
          ))}
          {selectedStudents.length > 10 && (
            <p className="text-center text-sm text-muted-foreground py-2">
              ... y {selectedStudents.length - 10} mas
            </p>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-status-tardy-soft/30 border border-status-tardy/20">
        <AlertTriangle className="size-5 text-status-tardy shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Accion irreversible</p>
          <p className="text-sm text-muted-foreground">
            Los alumnos seran movidos al nuevo curso y su historial sera actualizado.
            Esta accion no se puede deshacer automaticamente.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="rounded-xl"
        >
          <ChevronLeft className="size-5 mr-2" />
          Volver
        </Button>

        <AnimatePresence mode="wait">
          {!isConfirming ? (
            <motion.div
              key="confirm-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                size="lg"
                onClick={onConfirm}
                className="rounded-xl px-8 shadow-lg"
              >
                <Rocket className="size-5 mr-2" />
                Ejecutar Promocion
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/10 border border-destructive/30"
            >
              <span className="text-sm font-medium text-foreground">
                Confirmar?
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={onExecute}
                className="rounded-lg"
              >
                Si, ejecutar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="rounded-lg"
              >
                Cancelar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// IN PROGRESS STATE
// ============================================

interface InProgressStateProps {
  progress: number;
  processedCount: number;
  totalCount: number;
}

function InProgressState({
  progress,
  processedCount,
  totalCount,
}: InProgressStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center justify-center py-20 space-y-8"
    >
      {/* Animated loader */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="size-24 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 size-24 rounded-full border-4 border-transparent border-t-primary" />
        <Loader2 className="absolute inset-0 m-auto size-10 text-primary" />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Procesando Promocion
        </h2>
        <p className="text-muted-foreground">
          Actualizando legajos de alumnos...
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-3 rounded-full" />
        <p className="text-center text-sm text-muted-foreground">
          {processedCount} de {totalCount} alumnos procesados
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPLETED STATE
// ============================================

interface CompletedStateProps {
  processedCount: number;
  destinationLevel: CourseLevel;
  destinationCourse: Course;
  destinationDivision: Division;
  onReset: () => void;
}

function CompletedState({
  processedCount,
  destinationLevel,
  destinationCourse,
  destinationDivision,
  onReset,
}: CompletedStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 space-y-8"
    >
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
        className="relative"
      >
        <div className="size-28 rounded-full bg-status-present flex items-center justify-center">
          <CheckCircle2 className="size-14 text-status-present-foreground" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <PartyPopper className="size-8 text-primary" />
        </motion.div>
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Promocion Completada
        </h2>
        <p className="text-lg text-muted-foreground">
          {processedCount} alumnos fueron promovidos exitosamente
        </p>
      </div>

      {/* Result summary */}
      <div className="hero-card p-6 text-center max-w-md">
        <p className="text-sm text-muted-foreground mb-2">
          Los alumnos ahora pertenecen a
        </p>
        <p className="font-bold text-xl text-foreground">
          {getLevelLabel(destinationLevel)} - {destinationCourse.name} &quot;{destinationDivision.name}&quot;
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl"
        >
          <FileText className="size-5 mr-2" />
          Ver Reporte
        </Button>
        <Button
          size="lg"
          onClick={onReset}
          className="rounded-xl px-8"
        >
          Nueva Promocion
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// FAILED STATE
// ============================================

interface FailedStateProps {
  errors: string[];
  processedCount: number;
  totalCount: number;
  onRetry: () => void;
  onReset: () => void;
}

function FailedState({
  errors,
  processedCount,
  totalCount,
  onRetry,
  onReset,
}: FailedStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 space-y-8"
    >
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="size-28 rounded-full bg-status-absent flex items-center justify-center"
      >
        <XCircle className="size-14 text-status-absent-foreground" />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Error en la Promocion
        </h2>
        <p className="text-lg text-muted-foreground">
          {processedCount} de {totalCount} alumnos fueron procesados antes del error
        </p>
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-status-absent-soft/30 border border-status-absent/20">
          <p className="font-medium text-foreground mb-2">Errores encontrados:</p>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                - {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          size="lg"
          onClick={onRetry}
          className="rounded-xl px-8"
        >
          Reintentar
        </Button>
      </div>
    </motion.div>
  );
}
