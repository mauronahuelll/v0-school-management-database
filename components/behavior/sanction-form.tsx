"use client";

import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Send,
  Loader2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Sparkles,
  FileText,
  Eye,
  EyeOff,
  Bell,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StudentSelector } from "./student-selector";
import { SeveritySelector } from "./severity-selector";
import { SanctionPreview } from "./sanction-preview";
import {
  type BehaviorFormData,
  type StudentOption,
  DEFAULT_CATEGORIES,
  DEFAULT_SANCTION_TYPES,
} from "@/lib/types/behavior";

interface SanctionFormProps {
  students: StudentOption[];
  schoolId: string;
  courseId: string;
  onSubmit: (data: BehaviorFormData) => Promise<{ success: boolean; hash?: string }>;
}

const MAX_DESCRIPTION_LENGTH = 500;

export function SanctionForm({
  students,
  schoolId,
  courseId,
  onSubmit,
}: SanctionFormProps) {
  // Form state
  const [formData, setFormData] = useState<BehaviorFormData>({
    type: "SANCTION",
    studentIds: [],
    category: "",
    description: "",
    isPositive: false,
    date: new Date(),
    sanctionTypeId: "",
    severity: 2,
    requiresAcknowledgment: true,
    visibleToTutor: true,
    followUpRequired: false,
    followUpDate: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    hash?: string;
  } | null>(null);

  // Character count
  const charCount = formData.description.length;
  const charRemaining = MAX_DESCRIPTION_LENGTH - charCount;

  // Validation
  const isValid = useMemo(() => {
    return (
      formData.studentIds.length > 0 &&
      formData.category !== "" &&
      formData.description.trim().length >= 10 &&
      (formData.type === "OBSERVATION" || formData.sanctionTypeId !== "")
    );
  }, [formData]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof BehaviorFormData>(field: K, value: BehaviorFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle sanction type change
  const handleSanctionTypeChange = useCallback((typeId: string) => {
    const sanctionType = DEFAULT_SANCTION_TYPES.find((t) => t.id === typeId);
    if (sanctionType) {
      setFormData((prev) => ({
        ...prev,
        sanctionTypeId: typeId,
        severity: sanctionType.severity,
        requiresAcknowledgment: sanctionType.requiresAcknowledgment,
      }));
    }
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      setFormData((prev) => ({
        ...prev,
        category: categoryId,
        isPositive: category.isPositive,
        type: category.isPositive ? "OBSERVATION" : prev.type,
      }));
    }
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setShowConfirmDialog(true);
  }, [isValid]);

  // Confirm submission
  const confirmSubmit = useCallback(async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(formData);
      setSubmissionResult(result);

      if (result.success) {
        toast.success("Sancion registrada correctamente", {
          description: `Hash de verificacion: ${result.hash?.substring(0, 12)}...`,
          icon: <CheckCircle2 className="h-4 w-4 text-status-present" />,
        });

        // Reset form
        setFormData({
          type: "SANCTION",
          studentIds: [],
          category: "",
          description: "",
          isPositive: false,
          date: new Date(),
          sanctionTypeId: "",
          severity: 2,
          requiresAcknowledgment: true,
          visibleToTutor: true,
          followUpRequired: false,
          followUpDate: undefined,
        });
      } else {
        toast.error("Error al registrar la sancion", {
          description: "Por favor, intente nuevamente",
        });
      }
    } catch (error) {
      toast.error("Error de conexion", {
        description: "No se pudo conectar con el servidor",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const selectedStudentNames = useMemo(
    () =>
      students
        .filter((s) => formData.studentIds.includes(s.id))
        .map((s) => `${s.lastName}, ${s.firstName}`)
        .join(", "),
    [students, formData.studentIds]
  );

  return (
    <div className="flex gap-8 min-h-[calc(100vh-12rem)]">
      {/* Form Section */}
      <div className="flex-1 max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-absent/10">
                <FileText className="h-5 w-5 text-status-absent" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Nueva Sancion u Observacion
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Redacte con claridad y objetividad. El contenido quedara bloqueado
              una vez que el tutor firme la notificacion.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-8">
            {/* Student Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Alumno(s) Involucrado(s) <span className="text-destructive">*</span>
              </Label>
              <StudentSelector
                students={students}
                selectedIds={formData.studentIds}
                onChange={(ids) => updateField("studentIds", ids)}
                placeholder="Buscar y seleccionar alumnos..."
              />
            </div>

            {/* Type Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                {formData.type === "OBSERVATION" ? (
                  <Sparkles className="h-5 w-5 text-status-present" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-status-absent" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formData.type === "OBSERVATION"
                      ? "Observacion / Merito"
                      : "Sancion"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.type === "OBSERVATION"
                      ? "Registro positivo o neutro"
                      : "Registro disciplinario formal"}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.type === "SANCTION"}
                onCheckedChange={(checked) =>
                  updateField("type", checked ? "SANCTION" : "OBSERVATION")
                }
              />
            </div>

            {/* Date & Category Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha del Hecho</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 font-normal"
                    >
                      <Calendar className="mr-3 h-4 w-4 opacity-60" />
                      {format(formData.date, "d 'de' MMMM, yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && updateField("date", date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2024-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          {cat.isPositive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-status-present" />
                          )}
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sanction Type (only for sanctions) */}
            {formData.type === "SANCTION" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tipo de Sancion <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.sanctionTypeId}
                  onValueChange={handleSanctionTypeChange}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar tipo de sancion" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SANCTION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs text-muted-foreground">
                            (Gravedad {type.severity})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Severity Selector (only for sanctions) */}
            {formData.type === "SANCTION" && formData.sanctionTypeId && (
              <SeveritySelector
                value={formData.severity || 2}
                onChange={(severity) => updateField("severity", severity)}
              />
            )}

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Descripcion Detallada <span className="text-destructive">*</span>
                </Label>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    charRemaining < 50
                      ? "text-status-absent"
                      : "text-muted-foreground"
                  )}
                >
                  {charRemaining} caracteres restantes
                </span>
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  e.target.value.length <= MAX_DESCRIPTION_LENGTH &&
                  updateField("description", e.target.value)
                }
                placeholder="Describa los hechos de manera objetiva y clara. Incluya el contexto, las acciones observadas y cualquier detalle relevante..."
                className="min-h-[160px] resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Minimo 10 caracteres. Sea claro y objetivo en la redaccion.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4 rounded-xl bg-muted/30 p-5">
              <h4 className="text-sm font-medium text-foreground">Opciones</h4>

              {/* Visible to tutor */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  {formData.visibleToTutor ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-foreground">
                      Visible para el Tutor
                    </p>
                    <p className="text-xs text-muted-foreground">
                      El tutor podra ver este registro en la app
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibleToTutor}
                  onCheckedChange={(checked) =>
                    updateField("visibleToTutor", checked)
                  }
                />
              </div>

              {/* Requires acknowledgment */}
              {formData.type === "SANCTION" && (
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-foreground">
                        Requiere Firma Digital
                      </p>
                      <p className="text-xs text-muted-foreground">
                        El tutor debe confirmar recepcion
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.requiresAcknowledgment}
                    onCheckedChange={(checked) =>
                      updateField("requiresAcknowledgment", checked)
                    }
                  />
                </div>
              )}

              {/* Follow up */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-foreground">
                      Programar Seguimiento
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recordatorio para revisar el caso
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.followUpRequired}
                  onCheckedChange={(checked) =>
                    updateField("followUpRequired", checked)
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={cn(
                "w-full h-14 text-base font-medium rounded-xl shadow-lg transition-all",
                "bg-primary hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isValid && !isSubmitting && "hover:scale-[1.01] hover:shadow-xl"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? "Enviando..." : "Enviar y Notificar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="w-[380px] shrink-0 sticky top-24 h-fit">
        <SanctionPreview formData={formData} students={students} />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              Confirmar Envio
            </DialogTitle>
            <DialogDescription className="pt-2">
              Esta a punto de registrar una{" "}
              {formData.type === "SANCTION" ? "sancion" : "observacion"} para:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Students */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Alumno(s)</p>
              <p className="text-sm font-medium text-foreground">
                {selectedStudentNames || "Ninguno seleccionado"}
              </p>
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground space-y-2">
              {formData.visibleToTutor && (
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-present" />
                  Se enviara notificacion push al tutor
                </p>
              )}
              {formData.requiresAcknowledgment && formData.type === "SANCTION" && (
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Requiere firma digital del tutor
                </p>
              )}
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-absent" />
                El contenido quedara bloqueado (hash de integridad)
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmSubmit} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar y Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
