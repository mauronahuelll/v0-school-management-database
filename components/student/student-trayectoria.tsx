"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  History,
  Bell,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Types for pending subjects
export interface PendingSubject {
  id: string;
  name: string;
  originYear: number;
  originYearLabel: string;
  status: "PENDIENTE" | "EN_PROCESO" | "ACREDITADA";
  finalGrade?: number;
  approvalDate?: string;
  examAttempts: number;
}

interface StudentTrayectoriaProps {
  studentName: string;
  initialSubjects?: PendingSubject[];
  canEdit?: boolean;
}

// Mock data for demonstration
const MOCK_PENDING_SUBJECTS: PendingSubject[] = [
  {
    id: "prev-1",
    name: "Fisica",
    originYear: 3,
    originYearLabel: "3° Ano - 2024",
    status: "PENDIENTE",
    examAttempts: 1,
  },
  {
    id: "prev-2",
    name: "Matematica",
    originYear: 3,
    originYearLabel: "3° Ano - 2024",
    status: "EN_PROCESO",
    examAttempts: 2,
  },
  {
    id: "prev-3",
    name: "Historia",
    originYear: 2,
    originYearLabel: "2° Ano - 2023",
    status: "ACREDITADA",
    finalGrade: 7,
    approvalDate: "15/03/2025",
    examAttempts: 1,
  },
];

export function StudentTrayectoria({
  studentName,
  initialSubjects = MOCK_PENDING_SUBJECTS,
  canEdit = true,
}: StudentTrayectoriaProps) {
  const [pendingSubjects, setPendingSubjects] = useState<PendingSubject[]>(initialSubjects);
  const [selectedSubject, setSelectedSubject] = useState<PendingSubject | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "" as "PENDIENTE" | "EN_PROCESO" | "ACREDITADA" | "",
    finalGrade: "",
    approvalDate: "",
  });

  // Stats calculations
  const pendingCount = useMemo(
    () => pendingSubjects.filter((s) => s.status === "PENDIENTE").length,
    [pendingSubjects]
  );
  const inProgressCount = useMemo(
    () => pendingSubjects.filter((s) => s.status === "EN_PROCESO").length,
    [pendingSubjects]
  );
  const approvedCount = useMemo(
    () => pendingSubjects.filter((s) => s.status === "ACREDITADA").length,
    [pendingSubjects]
  );

  // Handle opening update modal
  const handleOpenUpdateModal = (subject: PendingSubject) => {
    setSelectedSubject(subject);
    setUpdateForm({
      status: subject.status,
      finalGrade: subject.finalGrade?.toString() || "",
      approvalDate: subject.approvalDate || "",
    });
    setIsUpdateModalOpen(true);
  };

  // Handle saving update
  const handleSaveUpdate = async () => {
    if (!selectedSubject || !updateForm.status) return;

    setIsUpdating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPendingSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubject.id
          ? {
              ...s,
              status: updateForm.status as PendingSubject["status"],
              finalGrade: updateForm.finalGrade ? parseFloat(updateForm.finalGrade) : undefined,
              approvalDate: updateForm.approvalDate || undefined,
            }
          : s
      )
    );

    setIsUpdating(false);
    setIsUpdateModalOpen(false);
    toast.success(
      updateForm.status === "ACREDITADA"
        ? "Materia acreditada exitosamente. Familia notificada."
        : "Estado actualizado correctamente."
    );
  };

  // Get status badge config
  const getStatusConfig = (status: PendingSubject["status"]) => {
    switch (status) {
      case "PENDIENTE":
        return {
          label: "Pendiente",
          color: "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30",
          icon: Clock,
        };
      case "EN_PROCESO":
        return {
          label: "En Proceso",
          color: "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30",
          icon: History,
        };
      case "ACREDITADA":
        return {
          label: "Acreditada",
          color: "bg-[#4de082]/20 text-[#4de082] border-[#4de082]/30",
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Family Notification Alert */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-primary/90">
          Informacion visible y notificada a la familia del estudiante en tiempo real.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-center">
          <p className="text-2xl font-bold text-[#ffb4ab]">{pendingCount}</p>
          <p className="text-xs text-[#ffb4ab]/70">Pendientes</p>
        </div>
        <div className="p-3 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-center">
          <p className="text-2xl font-bold text-[#d0bcff]">{inProgressCount}</p>
          <p className="text-xs text-[#d0bcff]/70">En Proceso</p>
        </div>
        <div className="p-3 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20 text-center">
          <p className="text-2xl font-bold text-[#4de082]">{approvedCount}</p>
          <p className="text-xs text-[#4de082]/70">Acreditadas</p>
        </div>
      </div>

      {/* Pending Subjects List */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Materias Previas / Pendientes de Acreditacion
        </h3>

        <div className="space-y-3">
          {pendingSubjects.map((subject) => {
            const statusConfig = getStatusConfig(subject.status);
            const StatusIcon = statusConfig.icon;
            const isApproved = subject.status === "ACREDITADA";

            return (
              <div
                key={subject.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  isApproved
                    ? "bg-[#4de082]/5 border-[#4de082]/20"
                    : "bg-black/20 border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isApproved ? "bg-[#4de082]/20" : "bg-white/5"
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        "h-5 w-5",
                        isApproved ? "text-[#4de082]" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        isApproved && "line-through text-muted-foreground"
                      )}
                    >
                      {subject.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subject.originYearLabel} | {subject.examAttempts} intento(s)
                    </p>
                    {isApproved && subject.finalGrade && (
                      <p className="text-xs text-[#4de082] mt-1">
                        Nota final: {subject.finalGrade} | Aprobada: {subject.approvalDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn("flex items-center gap-1.5 border", statusConfig.color)}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>

                  {canEdit && !isApproved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleOpenUpdateModal(subject)}
                    >
                      Actualizar
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {pendingSubjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-[#4de082]/50" />
              <p>No hay materias pendientes de acreditacion.</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Estado de Materia</DialogTitle>
            <DialogDescription>
              {selectedSubject?.name} - {selectedSubject?.originYearLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <Select
                value={updateForm.status}
                onValueChange={(value) =>
                  setUpdateForm((prev) => ({ ...prev, status: value as PendingSubject["status"] }))
                }
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="EN_PROCESO">En Proceso (Mesa programada)</SelectItem>
                  <SelectItem value="ACREDITADA">Acreditada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {updateForm.status === "ACREDITADA" && (
              <>
                <div className="space-y-2">
                  <Label>Nota Final Obtenida</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    placeholder="Ej: 7"
                    value={updateForm.finalGrade}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, finalGrade: e.target.value }))}
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Aprobacion</Label>
                  <Input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={updateForm.approvalDate}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, approvalDate: e.target.value }))}
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUpdateModalOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={!updateForm.status || isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
