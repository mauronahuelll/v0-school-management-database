"use client";

import { Send, AlertTriangle, CheckCircle2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasNotifications ? (
              <AlertTriangle className="size-5 text-status-tardy" />
            ) : (
              <CheckCircle2 className="size-5 text-status-present" />
            )}
            Confirmar Asistencia
          </DialogTitle>
          <DialogDescription>
            {courseName} - {new Date().toLocaleDateString("es-AR")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Resumen de la lista</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <SummaryItem
                label="Presentes"
                value={stats.present}
                colorClass="text-status-present"
              />
              <SummaryItem
                label="Ausentes"
                value={stats.absent}
                colorClass="text-status-absent"
              />
              <SummaryItem
                label="Tardes"
                value={stats.tardy}
                colorClass="text-status-tardy"
              />
              {stats.onLicense > 0 && (
                <SummaryItem
                  label="En Licencia"
                  value={stats.onLicense}
                  colorClass="text-muted-foreground"
                />
              )}
            </div>
          </div>

          {/* Notification warning */}
          {hasNotifications ? (
            <div className="flex items-start gap-3 rounded-lg bg-status-tardy/10 border border-status-tardy/20 p-3">
              <Send className="size-5 text-status-tardy shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Se enviarán {totalNotifications}{" "}
                  {totalNotifications === 1 ? "notificación" : "notificaciones"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los tutores de los alumnos ausentes y con tardanzas recibirán un aviso
                  en su teléfono.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg bg-status-present/10 border border-status-present/20 p-3">
              <CheckCircle2 className="size-5 text-status-present shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Todos presentes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No se enviarán notificaciones a los tutores.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Revisar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
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
  colorClass: string;
}

function SummaryItem({ label, value, colorClass }: SummaryItemProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}
