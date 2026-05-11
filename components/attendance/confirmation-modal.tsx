"use client";

import { Send, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttendanceStats } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  stats: AttendanceStats;
  courseName: string;
  isSubmitting: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  stats,
  courseName,
  isSubmitting,
}: ConfirmationModalProps) {
  const totalNotifications = stats.absent + stats.tardy;
  const hasNotifications = totalNotifications > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass-strong border-glass-border">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3">
            <div 
              className={cn(
                "flex items-center justify-center size-10 rounded-xl",
                hasNotifications 
                  ? "bg-status-tardy-soft text-status-tardy" 
                  : "bg-status-present-soft text-status-present"
              )}
            >
              {hasNotifications ? (
                <AlertTriangle className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
            <span>Confirmar Asistencia</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {courseName} — {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long"
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Summary */}
          <div className="rounded-xl border-2 border-border bg-card/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Resumen de la lista</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <SummaryItem
                label="Presentes"
                value={stats.present}
                variant="present"
              />
              <SummaryItem
                label="Ausentes"
                value={stats.absent}
                variant="absent"
              />
              <SummaryItem
                label="Tardes"
                value={stats.tardy}
                variant="tardy"
              />
              {stats.onLicense > 0 && (
                <SummaryItem
                  label="En Licencia"
                  value={stats.onLicense}
                  variant="license"
                />
              )}
            </div>
          </div>

          {/* Notification warning */}
          {hasNotifications ? (
            <div 
              className={cn(
                "flex items-start gap-4 rounded-xl p-4",
                "bg-status-tardy-soft border-2 border-status-tardy/30"
              )}
            >
              <div className="flex items-center justify-center size-10 rounded-lg bg-status-tardy/20 shrink-0">
                <Send className="size-5 text-status-tardy" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Se enviaran {totalNotifications}{" "}
                  {totalNotifications === 1 ? "notificacion" : "notificaciones"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Los tutores de los alumnos ausentes y con tardanzas recibiran un aviso
                  en su telefono.
                </p>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "flex items-start gap-4 rounded-xl p-4",
                "bg-status-present-soft border-2 border-status-present/30"
              )}
            >
              <div className="flex items-center justify-center size-10 rounded-lg bg-status-present/20 shrink-0">
                <CheckCircle2 className="size-5 text-status-present" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Todos presentes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No se enviaran notificaciones a los tutores.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto transition-theme"
          >
            Revisar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "w-full sm:w-auto font-semibold",
              "transition-all active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              "Enviando..."
            ) : (
              <>
                <Send className="size-4" />
                Finalizar y Notificar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
  variant: "present" | "absent" | "tardy" | "license";
}

function SummaryItem({ label, value, variant }: SummaryItemProps) {
  const variantStyles = {
    present: "text-status-present bg-status-present-soft",
    absent: "text-status-absent bg-status-absent-soft",
    tardy: "text-status-tardy bg-status-tardy-soft",
    license: "text-status-license bg-status-license-soft",
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span 
        className={cn(
          "px-2.5 py-1 rounded-lg text-base font-bold tabular-nums",
          variantStyles[variant]
        )}
      >
        {value}
      </span>
    </div>
  );
}
