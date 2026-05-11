"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, BellOff, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import type { StudentAttendance, LicenseReason, LicenseFormData } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAttendance | null;
  onSave: (data: LicenseFormData) => Promise<void>;
  onDeactivate: (studentId: string) => Promise<void>;
}

const LICENSE_REASONS: { value: LicenseReason; label: string }[] = [
  { value: "HEALTH", label: "Salud" },
  { value: "TRAVEL", label: "Viaje" },
  { value: "FAMILY", label: "Familiar" },
  { value: "OTHER", label: "Otro" },
];

export function LicenseModal({
  isOpen,
  onClose,
  student,
  onSave,
  onDeactivate,
}: LicenseModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState<LicenseReason>("HEALTH");
  const [customReason, setCustomReason] = useState("");
  const [silenceNotifications, setSilenceNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isActiveLicense = student?.licenseMode?.isActive ?? false;

  // Reset form when modal opens with a new student
  useEffect(() => {
    if (student && isOpen) {
      if (student.licenseMode?.isActive) {
        // If editing an existing license, populate the form
        setDateRange({
          from: student.licenseMode.startDate,
          to: student.licenseMode.endDate,
        });
        setReason(student.licenseMode.category || "HEALTH");
        setCustomReason(student.licenseMode.reason || "");
        setSilenceNotifications(!student.licenseMode.notifyOnEnd);
      } else {
        // Reset for new license
        setDateRange(undefined);
        setReason("HEALTH");
        setCustomReason("");
        setSilenceNotifications(true);
      }
    }
  }, [student, isOpen]);

  const handleSave = async () => {
    if (!student || !dateRange?.from || !dateRange?.to) return;

    setIsSubmitting(true);
    try {
      await onSave({
        studentId: student.id,
        studentName: `${student.lastName}, ${student.firstName}`,
        startDate: dateRange.from,
        endDate: dateRange.to,
        reason,
        customReason: reason === "OTHER" ? customReason : undefined,
        silenceNotifications,
      });
      onClose();
    } catch (error) {
      console.error("Error saving license:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!student) return;

    setIsSubmitting(true);
    try {
      await onDeactivate(student.id);
      onClose();
    } catch (error) {
      console.error("Error deactivating license:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  const canSubmit = dateRange?.from && dateRange?.to && (reason !== "OTHER" || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            {isActiveLicense ? "Licencia Activa" : "Programar Licencia"}
          </DialogTitle>
          <DialogDescription>
            {student.lastName}, {student.firstName} - Legajo: {student.enrollmentNumber}
          </DialogDescription>
        </DialogHeader>

        {isActiveLicense && (
          <div className="rounded-lg border border-status-license bg-status-license/10 p-3 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Licencia vigente</p>
                <p className="text-xs text-muted-foreground">
                  {student.licenseMode?.startDate &&
                    format(student.licenseMode.startDate, "d MMM", { locale: es })}
                  {" - "}
                  {student.licenseMode?.endDate &&
                    format(student.licenseMode.endDate, "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-status-license text-status-license-foreground">
                {LICENSE_REASONS.find((r) => r.value === student.licenseMode?.category)?.label ||
                  student.licenseMode?.reason}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>Período de licencia</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="size-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d MMM", { locale: es })} -{" "}
                        {format(dateRange.to, "d MMM yyyy", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "d MMMM yyyy", { locale: es })
                    )
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason Select */}
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LicenseReason)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom reason textarea */}
          {reason === "OTHER" && (
            <div className="space-y-2">
              <Label>Especificar motivo</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describa el motivo de la licencia..."
                rows={2}
              />
            </div>
          )}

          {/* Silence notifications toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              {silenceNotifications ? (
                <BellOff className="size-5 text-muted-foreground" />
              ) : (
                <Bell className="size-5 text-foreground" />
              )}
              <div>
                <Label htmlFor="silence-notifications" className="cursor-pointer">
                  Silenciar notificaciones
                </Label>
                <p className="text-xs text-muted-foreground">
                  No enviar avisos de inasistencia durante la licencia
                </p>
              </div>
            </div>
            <Switch
              id="silence-notifications"
              checked={silenceNotifications}
              onCheckedChange={setSilenceNotifications}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isActiveLicense && (
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Finalizar Licencia
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSubmit || isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? "Guardando..." : isActiveLicense ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
