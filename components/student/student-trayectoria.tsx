"use client";

import { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  History,
  Bell,
  ChevronRight,
  ChevronDown,
  Loader2,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  FileText,
  ArrowUpRight,
  Shield,
  AlertTriangle,
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
import { useAuth } from "@/lib/context/auth-context";

// ============================================
// TYPES
// ============================================

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

interface AcademicYearRecord {
  id: string;
  year: number;
  yearLabel: string;
  grade: string; // e.g., "4to Ano", "5to Ano"
  status: "APROBADO" | "EN_CURSO" | "REPITENTE";
  averageGrade: number;
  qualitativeAssessment: string;
  subjects: {
    name: string;
    finalGrade: number;
    status: "APROBADA" | "PENDIENTE";
  }[];
}

interface StudentTrayectoriaProps {
  studentId?: string;
  studentName: string;
  currentGrade?: string;
  initialSubjects?: PendingSubject[];
}

// ============================================
// MOCK DATA
// ============================================

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

const MOCK_ACADEMIC_HISTORY: AcademicYearRecord[] = [
  {
    id: "year-2025",
    year: 2025,
    yearLabel: "Ciclo Lectivo 2025",
    grade: "4to Ano",
    status: "EN_CURSO",
    averageGrade: 7.8,
    qualitativeAssessment: "Trayectoria en desarrollo. Destacado en Lengua y Literatura. Requiere acompanamiento en Matematica.",
    subjects: [
      { name: "Matematica", finalGrade: 6, status: "APROBADA" },
      { name: "Lengua", finalGrade: 9, status: "APROBADA" },
      { name: "Historia", finalGrade: 8, status: "APROBADA" },
      { name: "Geografia", finalGrade: 7, status: "APROBADA" },
      { name: "Fisica", finalGrade: 0, status: "PENDIENTE" },
    ],
  },
  {
    id: "year-2024",
    year: 2024,
    yearLabel: "Ciclo Lectivo 2024",
    grade: "3er Ano",
    status: "APROBADO",
    averageGrade: 7.2,
    qualitativeAssessment: "Ano aprobado con materias previas. Buena participacion en actividades extracurriculares. Se recomienda refuerzo en ciencias exactas.",
    subjects: [
      { name: "Matematica", finalGrade: 6, status: "APROBADA" },
      { name: "Lengua", finalGrade: 8, status: "APROBADA" },
      { name: "Historia", finalGrade: 7, status: "APROBADA" },
      { name: "Geografia", finalGrade: 7, status: "APROBADA" },
      { name: "Fisica", finalGrade: 5, status: "PENDIENTE" },
      { name: "Quimica", finalGrade: 7, status: "APROBADA" },
    ],
  },
  {
    id: "year-2023",
    year: 2023,
    yearLabel: "Ciclo Lectivo 2023",
    grade: "2do Ano",
    status: "APROBADO",
    averageGrade: 7.5,
    qualitativeAssessment: "Excelente desempeno general. Destaca por su compromiso y responsabilidad. Promovido sin materias pendientes.",
    subjects: [
      { name: "Matematica", finalGrade: 7, status: "APROBADA" },
      { name: "Lengua", finalGrade: 8, status: "APROBADA" },
      { name: "Historia", finalGrade: 7, status: "APROBADA" },
      { name: "Geografia", finalGrade: 8, status: "APROBADA" },
      { name: "Biologia", finalGrade: 8, status: "APROBADA" },
    ],
  },
];

const PROMOTION_OPTIONS = [
  { value: "1er-ano", label: "1er Ano Secundario" },
  { value: "2do-ano", label: "2do Ano Secundario" },
  { value: "3er-ano", label: "3er Ano Secundario" },
  { value: "4to-ano", label: "4to Ano Secundario" },
  { value: "5to-ano", label: "5to Ano Secundario" },
  { value: "6to-ano", label: "6to Ano Secundario" },
  { value: "egresado", label: "Egresado" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function StudentTrayectoria({
  studentId = "std-001",
  studentName,
  currentGrade = "4to Ano",
  initialSubjects = MOCK_PENDING_SUBJECTS,
}: StudentTrayectoriaProps) {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // State
  const [pendingSubjects, setPendingSubjects] = useState<PendingSubject[]>(initialSubjects);
  const [academicHistory] = useState<AcademicYearRecord[]>(MOCK_ACADEMIC_HISTORY);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(["year-2025"]));
  const [selectedSubject, setSelectedSubject] = useState<PendingSubject | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "" as "PENDIENTE" | "EN_PROCESO" | "ACREDITADA" | "",
    finalGrade: "",
    approvalDate: "",
  });

  // Promotion state
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [promotionTarget, setPromotionTarget] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // Mount and role detection
  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || "FAMILIA";
    setCurrentRole(role);
  }, [activeContext]);

  // Permission check
  const isAdmin = currentRole === "ADMIN";
  const canEdit = isAdmin;

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

  // Toggle accordion
  const toggleYear = (yearId: string) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(yearId)) {
        newSet.delete(yearId);
      } else {
        newSet.add(yearId);
      }
      return newSet;
    });
  };

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

  // Handle promotion
  const handlePromotion = async () => {
    if (!promotionTarget) return;

    setIsPromoting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsPromoting(false);
    setIsPromotionDialogOpen(false);
    setPromotionTarget("");

    toast.success("Alumno promovido. Legajo historico actualizado y consolidado.", {
      description: `${studentName} ha sido promovido a ${PROMOTION_OPTIONS.find(o => o.value === promotionTarget)?.label}`,
      duration: 5000,
    });
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
          label: "En Mesa",
          color: "bg-[#ffb93d]/20 text-[#ffb93d] border-[#ffb93d]/30",
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

  const getYearStatusConfig = (status: AcademicYearRecord["status"]) => {
    switch (status) {
      case "EN_CURSO":
        return { label: "En Curso", color: "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30" };
      case "APROBADO":
        return { label: "Aprobado", color: "bg-[#4de082]/20 text-[#4de082] border-[#4de082]/30" };
      case "REPITENTE":
        return { label: "Repitente", color: "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30" };
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header with Promotion Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#e4e1ea] flex items-center gap-2">
            <TrendingUp className="size-5 text-[#d0bcff]" />
            Trayectoria Academica
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Historial completo y situacion de materias previas
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsPromotionDialogOpen(true)}
            className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
          >
            <ArrowUpRight className="size-4 mr-2" />
            Realizar Promocion
          </Button>
        )}
      </div>

      {/* Family Notification Alert */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
        <Bell className="size-4 text-[#d0bcff] shrink-0" />
        <p className="text-xs text-white/60">
          Informacion visible y notificada a la familia del estudiante en tiempo real.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-center">
          <p className="text-2xl font-bold text-[#ffb4ab]">{pendingCount}</p>
          <p className="text-[10px] text-[#ffb4ab]/70 uppercase tracking-wide">Pendientes</p>
        </div>
        <div className="p-3 rounded-xl bg-[#ffb93d]/10 border border-[#ffb93d]/20 text-center">
          <p className="text-2xl font-bold text-[#ffb93d]">{inProgressCount}</p>
          <p className="text-[10px] text-[#ffb93d]/70 uppercase tracking-wide">En Mesa</p>
        </div>
        <div className="p-3 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20 text-center">
          <p className="text-2xl font-bold text-[#4de082]">{approvedCount}</p>
          <p className="text-[10px] text-[#4de082]/70 uppercase tracking-wide">Acreditadas</p>
        </div>
      </div>

      {/* Academic History Accordion */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-[#e4e1ea] mb-4 flex items-center gap-2">
          <FileText className="size-4 text-[#d0bcff]" />
          Historial de Boletines por Ciclo Lectivo
        </h3>

        <div className="space-y-2">
          {academicHistory.map((record) => {
            const isExpanded = expandedYears.has(record.id);
            const statusConfig = getYearStatusConfig(record.status);

            return (
              <div
                key={record.id}
                className="rounded-xl border border-white/5 overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleYear(record.id)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[#d0bcff]/10">
                      <Calendar className="size-4 text-[#d0bcff]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#e4e1ea]">{record.yearLabel}</p>
                      <p className="text-xs text-white/40">{record.grade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-[10px]", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                    <div className="text-right mr-2">
                      <p className="text-sm font-bold text-[#e4e1ea]">{record.averageGrade.toFixed(1)}</p>
                      <p className="text-[10px] text-white/40">Promedio</p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-5 text-white/40 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
                    {/* Qualitative Assessment */}
                    <div className="p-3 rounded-lg bg-[#d0bcff]/5 border border-[#d0bcff]/20">
                      <p className="text-xs font-medium text-[#d0bcff] mb-1">Valoracion Cualitativa</p>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {record.qualitativeAssessment}
                      </p>
                    </div>

                    {/* Subjects Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {record.subjects.map((subject, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-lg border",
                            subject.status === "APROBADA"
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-[#ffb4ab]/5 border-[#ffb4ab]/20"
                          )}
                        >
                          <p className="text-xs font-medium text-[#e4e1ea] truncate">{subject.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span
                              className={cn(
                                "text-lg font-bold",
                                subject.status === "APROBADA"
                                  ? subject.finalGrade >= 7
                                    ? "text-[#4de082]"
                                    : "text-[#ffb93d]"
                                  : "text-[#ffb4ab]"
                              )}
                            >
                              {subject.finalGrade > 0 ? subject.finalGrade : "-"}
                            </span>
                            {subject.status === "PENDIENTE" && (
                              <Badge variant="outline" className="text-[8px] bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30">
                                Previa
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Subjects Dashboard */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-[#e4e1ea] mb-4 flex items-center gap-2">
          <BookOpen className="size-4 text-[#ffb4ab]" />
          Situacion Academica Actual - Materias Pendientes
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
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3",
                  isApproved
                    ? "bg-[#4de082]/5 border-[#4de082]/20"
                    : subject.status === "EN_PROCESO"
                    ? "bg-[#ffb93d]/5 border-[#ffb93d]/20"
                    : "bg-black/20 border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isApproved
                        ? "bg-[#4de082]/20"
                        : subject.status === "EN_PROCESO"
                        ? "bg-[#ffb93d]/20"
                        : "bg-white/5"
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        "size-5",
                        isApproved
                          ? "text-[#4de082]"
                          : subject.status === "EN_PROCESO"
                          ? "text-[#ffb93d]"
                          : "text-white/60"
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-medium text-[#e4e1ea]",
                        isApproved && "line-through text-white/40"
                      )}
                    >
                      {subject.name}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {subject.originYearLabel} | {subject.examAttempts} intento(s)
                    </p>
                    {isApproved && subject.finalGrade && (
                      <p className="text-xs text-[#4de082] mt-1">
                        Nota final: {subject.finalGrade} | Aprobada: {subject.approvalDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <Badge
                    variant="outline"
                    className={cn("flex items-center gap-1.5 border text-xs", statusConfig.color)}
                  >
                    <StatusIcon className="size-3" />
                    {statusConfig.label}
                  </Badge>

                  {canEdit && !isApproved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#d0bcff] hover:text-[#d0bcff] hover:bg-[#d0bcff]/10"
                      onClick={() => handleOpenUpdateModal(subject)}
                    >
                      Actualizar
                      <ChevronRight className="size-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {pendingSubjects.length === 0 && (
            <div className="text-center py-8 text-white/40">
              <CheckCircle2 className="size-12 mx-auto mb-3 text-[#4de082]/50" />
              <p>No hay materias pendientes de acreditacion.</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea]">Actualizar Estado de Materia</DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedSubject?.name} - {selectedSubject?.originYearLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/60">Nuevo Estado</Label>
              <Select
                value={updateForm.status}
                onValueChange={(value) =>
                  setUpdateForm((prev) => ({ ...prev, status: value as PendingSubject["status"] }))
                }
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#131319] border-white/10">
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="EN_PROCESO">En Mesa de Examen</SelectItem>
                  <SelectItem value="ACREDITADA">Acreditada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {updateForm.status === "ACREDITADA" && (
              <>
                <div className="space-y-2">
                  <Label className="text-white/60">Nota Final Obtenida</Label>
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
                  <Label className="text-white/60">Fecha de Aprobacion</Label>
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
            <Button
              variant="ghost"
              onClick={() => setIsUpdateModalOpen(false)}
              disabled={isUpdating}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={!updateForm.status || isUpdating}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Dialog (Admin Only) */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <Award className="size-5 text-[#d0bcff]" />
              Promocion de Alumno
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Promover a {studentName} ({currentGrade}) al siguiente nivel academico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Alert */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#ffb93d]/10 border border-[#ffb93d]/20">
              <AlertTriangle className="size-4 text-[#ffb93d] shrink-0 mt-0.5" />
              <p className="text-xs text-white/60 leading-relaxed">
                Esta accion actualizara el legajo del alumno manteniendo todo el historial academico.
                El cambio sera efectivo inmediatamente.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60">Promover a</Label>
              <Select value={promotionTarget} onValueChange={setPromotionTarget}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar nivel de destino" />
                </SelectTrigger>
                <SelectContent className="bg-[#131319] border-white/10">
                  {PROMOTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20">
                <Shield className="size-4 text-[#ffb4ab] shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">
                  Este alumno tiene <strong className="text-[#ffb4ab]">{pendingCount} materia(s) pendiente(s)</strong>. 
                  La promocion se realizara manteniendo las materias previas en su legajo.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsPromotionDialogOpen(false)}
              disabled={isPromoting}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePromotion}
              disabled={!promotionTarget || isPromoting}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isPromoting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4 mr-2" />
                  Confirmar Promocion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
