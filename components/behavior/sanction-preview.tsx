"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  Shield,
  FileCheck,
  Smartphone,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  SEVERITY_CONFIG,
  DEFAULT_CATEGORIES,
  DEFAULT_SANCTION_TYPES,
  type BehaviorFormData,
  type StudentOption,
} from "@/lib/types/behavior";

interface SanctionPreviewProps {
  formData: BehaviorFormData;
  students: StudentOption[];
  className?: string;
}

export function SanctionPreview({
  formData,
  students,
  className,
}: SanctionPreviewProps) {
  const selectedStudent = useMemo(
    () =>
      students.find((s) => formData.studentIds.includes(s.id)) || {
        firstName: "Nombre",
        lastName: "Apellido",
      },
    [students, formData.studentIds]
  );

  const categoryInfo = useMemo(
    () =>
      DEFAULT_CATEGORIES.find((c) => c.id === formData.category) || {
        name: "Categoria",
      },
    [formData.category]
  );

  const sanctionInfo = useMemo(
    () =>
      DEFAULT_SANCTION_TYPES.find((s) => s.id === formData.sanctionTypeId) || {
        name: "Tipo de Sancion",
      },
    [formData.sanctionTypeId]
  );

  const severity = formData.severity || 1;
  const severityConfig = SEVERITY_CONFIG[severity];

  const formattedDate = useMemo(
    () =>
      format(formData.date || new Date(), "d 'de' MMMM, yyyy", { locale: es }),
    [formData.date]
  );

  const isComplete =
    formData.studentIds.length > 0 &&
    formData.category &&
    formData.description.trim().length > 10;

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          <span className="font-medium">Vista Previa - App Padres</span>
        </div>
      </div>

      {/* Mobile Preview Frame */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="mx-auto max-w-[320px]">
          {/* Phone Notch Simulation */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-6 bg-foreground/10 rounded-full" />
          </div>

          {/* Notification Card */}
          <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Card Header */}
            <div className="px-4 py-3 border-b border-border bg-status-absent/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-absent/10">
                  <AlertTriangle className="h-5 w-5 text-status-absent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {sanctionInfo.name || "Sancion"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{formattedDate}</p>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] px-2 py-0.5 shrink-0",
                    severityConfig.bgColor,
                    severityConfig.textColor
                  )}
                >
                  {severityConfig.label}
                </Badge>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
              {/* Student */}
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Estudiante
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedStudent.lastName}, {selectedStudent.firstName}
                </p>
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Descripcion
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {formData.description.trim() ||
                    "La descripcion de la sancion aparecera aqui..."}
                </p>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Categoria:</span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                  {categoryInfo.name}
                </span>
              </div>

              {/* Digital Signature Badge */}
              {formData.type === "SANCTION" && formData.requiresAcknowledgment && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">
                      Requiere Firma Digital
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                    Esta notificacion requiere acuse de recibo legal
                  </p>
                </div>
              )}

              {/* Action Button Preview */}
              <div className="pt-2">
                <div
                  className={cn(
                    "w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Confirmar Notificacion</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Badge */}
          {formData.visibleToTutor && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              <span>El tutor recibira una notificacion push</span>
            </div>
          )}

          {/* Validation Status */}
          <div className="mt-4 text-center">
            {isComplete ? (
              <p className="text-xs text-status-present flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-present animate-pulse" />
                Vista previa lista para enviar
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Complete el formulario para ver la vista previa
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
