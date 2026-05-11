"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PublicationStatus, StudentGradeRow, GradeScale } from "@/lib/types/grades";
import { isPassingGrade } from "@/lib/types/grades";

interface PublicationBannerProps {
  periodName: string;
  subjectName: string;
  status: PublicationStatus;
  students: StudentGradeRow[];
  scale: GradeScale;
  lastPublishedAt?: Date;
  lastPublishedBy?: string;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  canPublish: boolean;
}

export function PublicationBanner({
  periodName,
  subjectName,
  status,
  students,
  scale,
  lastPublishedAt,
  lastPublishedBy,
  onPublish,
  onUnpublish,
  canPublish,
}: PublicationBannerProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<"publish" | "unpublish">("publish");

  const isPublished = status === "PUBLISHED";

  // Calculate statistics
  const totalStudents = students.length;
  const studentsWithGrades = students.filter((s) => s.average !== null).length;
  const passingStudents = students.filter(
    (s) => s.average !== null && isPassingGrade(s.average, scale)
  ).length;
  const failingStudents = studentsWithGrades - passingStudents;
  const completionRate = Math.round((studentsWithGrades / totalStudents) * 100);
  const isComplete = studentsWithGrades === totalStudents;

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      if (action === "publish") {
        await onPublish();
      } else {
        await onUnpublish();
      }
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Publication error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPublishDialog = () => {
    setAction("publish");
    setShowConfirmDialog(true);
  };

  const openUnpublishDialog = () => {
    setAction("unpublish");
    setShowConfirmDialog(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border p-5 transition-theme",
          isPublished
            ? "bg-status-present-soft/30 border-status-present/20"
            : "bg-card border-border"
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center",
                isPublished
                  ? "bg-status-present text-status-present-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isPublished ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {subjectName} - {periodName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? "Las notas son visibles para los padres"
                  : "Las notas estan en modo borrador"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1.5 text-sm font-medium",
              isPublished
                ? "border-status-present/40 bg-status-present/10 text-status-present-foreground"
                : "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
            )}
          >
            {isPublished ? (
              <>
                <Eye className="size-3.5 mr-1.5" />
                Publicado
              </>
            ) : (
              <>
                <EyeOff className="size-3.5 mr-1.5" />
                Borrador
              </>
            )}
          </Badge>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard
            icon={Users}
            label="Alumnos"
            value={`${studentsWithGrades}/${totalStudents}`}
            subtext={`${completionRate}% completo`}
            variant={isComplete ? "success" : "warning"}
          />
          <StatCard
            icon={CheckCircle2}
            label="Aprobados"
            value={String(passingStudents)}
            subtext={studentsWithGrades > 0 
              ? `${Math.round((passingStudents / studentsWithGrades) * 100)}%` 
              : "0%"}
            variant="success"
          />
          <StatCard
            icon={AlertCircle}
            label="Desaprobados"
            value={String(failingStudents)}
            subtext={studentsWithGrades > 0 
              ? `${Math.round((failingStudents / studentsWithGrades) * 100)}%` 
              : "0%"}
            variant={failingStudents > 0 ? "danger" : "neutral"}
          />
          <StatCard
            icon={Bell}
            label="Notificaciones"
            value={isPublished ? "Activas" : "Pendientes"}
            subtext={isPublished ? "Padres notificados" : "Al publicar"}
            variant={isPublished ? "success" : "neutral"}
          />
        </div>

        {/* Last published info */}
        {lastPublishedAt && lastPublishedBy && (
          <p className="text-xs text-muted-foreground mb-4">
            Ultima publicacion: {new Date(lastPublishedAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            por {lastPublishedBy}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isPublished ? (
            <Button
              onClick={openPublishDialog}
              disabled={!canPublish || !isComplete}
              className="flex-1 gap-2 bg-status-present hover:bg-status-present/90 text-status-present-foreground"
            >
              <Eye className="size-4" />
              Publicar Notas
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={openUnpublishDialog}
              className="flex-1 gap-2 border-status-absent/30 text-status-absent hover:bg-status-absent-soft/50"
            >
              <EyeOff className="size-4" />
              Despublicar
            </Button>
          )}

          {!isComplete && !isPublished && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="size-4 text-status-tardy" />
              Completa todas las notas para publicar
            </p>
          )}
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === "publish" ? (
                <>
                  <Eye className="size-5 text-status-present" />
                  Publicar Notas
                </>
              ) : (
                <>
                  <EyeOff className="size-5 text-status-absent" />
                  Despublicar Notas
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              {action === "publish" ? (
                <>
                  Esta a punto de publicar las notas de{" "}
                  <strong>{subjectName}</strong> para el{" "}
                  <strong>{periodName}</strong>.
                  <br />
                  <br />
                  <span className="text-status-present-foreground bg-status-present-soft/50 px-2 py-1 rounded">
                    Los {totalStudents} tutores recibiran una notificacion push
                    informando que las notas estan disponibles.
                  </span>
                </>
              ) : (
                <>
                  Esta a punto de ocultar las notas de{" "}
                  <strong>{subjectName}</strong> para el{" "}
                  <strong>{periodName}</strong>.
                  <br />
                  <br />
                  <span className="text-muted-foreground">
                    Las notas dejaran de ser visibles para los padres hasta que
                    vuelva a publicarlas.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={cn(
                "flex-1 gap-2",
                action === "publish"
                  ? "bg-status-present hover:bg-status-present/90 text-status-present-foreground"
                  : "bg-status-absent hover:bg-status-absent/90 text-status-absent-foreground"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : action === "publish" ? (
                <>
                  <Eye className="size-4" />
                  Confirmar Publicacion
                </>
              ) : (
                <>
                  <EyeOff className="size-4" />
                  Confirmar Despublicacion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// STAT CARD SUB-COMPONENT
// ============================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
  variant: "success" | "warning" | "danger" | "neutral";
}

function StatCard({ icon: Icon, label, value, subtext, variant }: StatCardProps) {
  const variantClasses = {
    success: "bg-status-present-soft/50 text-status-present-foreground",
    warning: "bg-status-tardy-soft/50 text-status-tardy-foreground",
    danger: "bg-status-absent-soft/50 text-status-absent-foreground",
    neutral: "bg-muted/50 text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "rounded-lg p-3 transition-theme",
        variantClasses[variant]
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 opacity-70" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs opacity-70">{subtext}</p>
    </div>
  );
}
