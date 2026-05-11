"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, BellOff, Bell, Shield } from "lucide-react";
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

const LICENSE_REASONS: { value: LicenseReason; label: string; icon: string }[] = [
  { value: "HEALTH", label: "Salud", icon: "🏥" },
  { value: "TRAVEL", label: "Viaje", icon: "✈️" },
  { value: "FAMILY", label: "Familiar", icon: "👨‍👩‍👧" },
  { value: "OTHER", label: "Otro", icon: "📝" },
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
        setDateRange({
          from: student.licenseMode.startDate,
          to: student.licenseMode.endDate,
        });
        setReason(student.licenseMode.category || "HEALTH");
        setCustomReason(student.licenseMode.reason || "");
        setSilenceNotifications(!student.licenseMode.notifyOnEnd);
      } else {
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
      <DialogContent className="sm:max-w-lg glass-strong border-glass-border">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex items-center justify-center size-10 rounded-xl bg-status-license/20 text-status-license-foreground">
              <Shield className="size-5" />
            </div>
            <span>{isActiveLicense ? "Licencia Activa" : "Programar Licencia"}</span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            <span className="font-medium text-foreground">
              {student.lastName}, {student.firstName}
            </span>
            <span className="mx-2">·</span>
            <span>Legajo: {student.enrollmentNumber}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Active license indicator */}
        {isActiveLicense && (
          <div className="rounded-xl border-2 border-status-license/30 bg-status-license-soft p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Licencia vigente</p>
                <p className="text-xs text-muted-foreground">
                  {student.licenseMode?.startDate &&
                    format(student.licenseMode.startDate, "d MMM", { locale: es })}
                  {" — "}
                  {student.licenseMode?.endDate &&
                    format(student.licenseMode.endDate, "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className="bg-status-license text-status-license-foreground font-medium"
              >
                {LICENSE_REASONS.find((r) => r.value === student.licenseMode?.category)?.label ||
                  student.licenseMode?.reason}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-5 py-3">
          {/* Date Range Picker */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Periodo de licencia</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 transition-theme",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="font-medium">
                        {format(dateRange.from, "d MMM", { locale: es })} —{" "}
                        {format(dateRange.to, "d MMM yyyy", { locale: es })}
                      </span>
                    ) : (
                      format(dateRange.from, "d MMMM yyyy", { locale: es })
                    )
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-strong" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason Select */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LicenseReason)}>
              <SelectTrigger className="w-full h-11 transition-theme">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                {LICENSE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom reason textarea */}
          {reason === "OTHER" && (
            <div className="space-y-2.5">
              <Label className="text-sm font-medium">Especificar motivo</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describa el motivo de la licencia..."
                rows={3}
                className="resize-none transition-theme leading-relaxed"
              />
            </div>
          )}

          {/* Silence notifications toggle */}
          <div 
            className={cn(
              "flex items-center justify-between rounded-xl border-2 p-4 transition-theme",
              silenceNotifications 
                ? "border-primary/30 bg-primary/5" 
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "flex items-center justify-center size-10 rounded-xl transition-theme",
                  silenceNotifications 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {silenceNotifications ? (
                  <BellOff className="size-5" />
                ) : (
                  <Bell className="size-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <Label 
                  htmlFor="silence-notifications" 
                  className="cursor-pointer text-sm font-medium"
                >
                  Silenciar notificaciones
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
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

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
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
          <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none transition-theme"
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
