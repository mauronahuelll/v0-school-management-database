"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
  PlusCircle,
  Building2,
  Landmark,
  GitMerge,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Registro de calificacion historica cargada por equivalencia o pase
export interface TransferCredit {
  id: string;
  subjectName: string;
  academicYear: number;          // 1–6
  academicYearLabel: string;     // "1er Año", etc.
  finalGrade: number;
  approvalMonth: number;         // 1–12
  approvalYear: number;          // ej: 2023
  establishment: "ESTE_ESTABLECIMIENTO" | "OTRO_ESTABLECIMIENTO";
  loadedAt: string;              // fecha en que el admin la cargo
}

// Tipo de condicion de inscripcion granular
export type EnrollmentCondition = "REGULAR" | "RECURSANTE" | "PREVIA_LIBRE";

export interface GranularEnrollment {
  id: string;
  subjectName: string;
  originYear: number;
  originYearLabel: string;
  condition: EnrollmentCondition;
  addedAt: string;
}

interface StudentTrayectoriaProps {
  studentId?: string;
  studentName: string;
  currentGrade?: string;
  initialSubjects?: PendingSubject[];
}

// ============================================
// CATALOGS
// ============================================

// Inscripciones del ciclo lectivo actual (5to Año + excepciones cross-año)
const MOCK_CURRENT_ENROLLMENTS: GranularEnrollment[] = [
  { id: "enr-1", subjectName: "Matematica",              originYear: 5, originYearLabel: "5to Año", condition: "REGULAR",      addedAt: "01/03/2025" },
  { id: "enr-2", subjectName: "Lengua y Literatura",     originYear: 5, originYearLabel: "5to Año", condition: "REGULAR",      addedAt: "01/03/2025" },
  { id: "enr-3", subjectName: "Historia",                originYear: 5, originYearLabel: "5to Año", condition: "REGULAR",      addedAt: "01/03/2025" },
  { id: "enr-4", subjectName: "Fisica",                  originYear: 4, originYearLabel: "4to Año", condition: "RECURSANTE",   addedAt: "05/03/2025" },
  { id: "enr-5", subjectName: "Quimica",                 originYear: 3, originYearLabel: "3er Año", condition: "PREVIA_LIBRE", addedAt: "05/03/2025" },
];

const SUBJECTS_CATALOG = [
  "Matemática", "Lengua y Literatura", "Historia", "Geografía",
  "Biología", "Física", "Química", "Inglés", "Educación Física",
  "Formación Ética y Ciudadana", "Tecnología", "Artes Visuales",
  "Música", "Filosofía", "Economía", "Sociología",
];

const MONTHS: { value: number; label: string }[] = [
  { value: 1,  label: "Enero"      }, { value: 2,  label: "Febrero"   },
  { value: 3,  label: "Marzo"      }, { value: 4,  label: "Abril"     },
  { value: 5,  label: "Mayo"       }, { value: 6,  label: "Junio"     },
  { value: 7,  label: "Julio"      }, { value: 8,  label: "Agosto"    },
  { value: 9,  label: "Septiembre" }, { value: 10, label: "Octubre"   },
  { value: 11, label: "Noviembre"  }, { value: 12, label: "Diciembre" },
];

const ACADEMIC_YEAR_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1er Año" }, { value: 2, label: "2do Año" },
  { value: 3, label: "3er Año" }, { value: 4, label: "4to Año" },
  { value: 5, label: "5to Año" }, { value: 6, label: "6to Año" },
];

// Datos iniciales de equivalencias para demostración
const MOCK_TRANSFER_CREDITS: TransferCredit[] = [
  {
    id: "tc-1",
    subjectName: "Inglés",
    academicYear: 2,
    academicYearLabel: "2do Año",
    finalGrade: 9,
    approvalMonth: 12,
    approvalYear: 2022,
    establishment: "OTRO_ESTABLECIMIENTO",
    loadedAt: "15/03/2024",
  },
  {
    id: "tc-2",
    subjectName: "Educación Física",
    academicYear: 3,
    academicYearLabel: "3er Año",
    finalGrade: 8,
    approvalMonth: 11,
    approvalYear: 2023,
    establishment: "OTRO_ESTABLECIMIENTO",
    loadedAt: "15/03/2024",
  },
];

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

  // Equivalencias / Pases — Transfer Credits
  const [transferCredits, setTransferCredits] = useState<TransferCredit[]>(MOCK_TRANSFER_CREDITS);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const CURRENT_YEAR = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - i);
  const [transferForm, setTransferForm] = useState({
    subjectName: "",
    academicYear: "",
    finalGrade: "",
    approvalMonth: "",
    approvalYear: "",
    establishment: "OTRO_ESTABLECIMIENTO" as TransferCredit["establishment"],
  });

  // ── Motor de Inscripcion Granular ──────────────────────────────────
  const [currentEnrollments, setCurrentEnrollments] = useState<GranularEnrollment[]>(MOCK_CURRENT_ENROLLMENTS);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isSavingEnroll, setIsSavingEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    originYear: "",
    subjectName: "",
    condition: "RECURSANTE" as EnrollmentCondition,
  });

  const resetEnrollForm = useCallback(() => {
    setEnrollForm({ originYear: "", subjectName: "", condition: "RECURSANTE" });
  }, []);

  const handleSaveEnrollment = useCallback(async () => {
    const { originYear, subjectName, condition } = enrollForm;
    if (!originYear || !subjectName) {
      toast.error("Completa el Año Academico y la Asignatura antes de guardar.");
      return;
    }
    setIsSavingEnroll(true);
    await new Promise((r) => setTimeout(r, 800));
    const yearNum   = parseInt(originYear, 10);
    const yearLabel = ACADEMIC_YEAR_OPTIONS.find(y => y.value === yearNum)?.label ?? `${yearNum}° Año`;
    const newEnroll: GranularEnrollment = {
      id:              `enr-${Date.now()}`,
      subjectName,
      originYear:      yearNum,
      originYearLabel: yearLabel,
      condition,
      addedAt:         new Date().toLocaleDateString("es-AR"),
    };
    setCurrentEnrollments((prev) => [...prev, newEnroll]);
    setIsSavingEnroll(false);
    setIsEnrollModalOpen(false);
    resetEnrollForm();
    toast.success(
      condition === "RECURSANTE"
        ? `${subjectName} inscripta como Recursante (${yearLabel}).`
        : `${subjectName} inscripta como Previa Libre (${yearLabel}).`,
      { description: "El legajo academico fue actualizado." }
    );
  }, [enrollForm, resetEnrollForm]);

  const resetTransferForm = useCallback(() => {
    setTransferForm({
      subjectName: "",
      academicYear: "",
      finalGrade: "",
      approvalMonth: "",
      approvalYear: "",
      establishment: "OTRO_ESTABLECIMIENTO",
    });
  }, []);

  const handleSaveTransfer = useCallback(async () => {
    const { subjectName, academicYear, finalGrade, approvalMonth, approvalYear } = transferForm;
    if (!subjectName || !academicYear || !finalGrade || !approvalMonth || !approvalYear) {
      toast.error("Completá todos los campos antes de guardar.");
      return;
    }
    const grade = parseFloat(finalGrade);
    if (isNaN(grade) || grade < 1 || grade > 10) {
      toast.error("La calificación debe estar entre 1 y 10.");
      return;
    }
    setIsSavingTransfer(true);
    await new Promise((r) => setTimeout(r, 900));
    const yearNum = parseInt(academicYear, 10);
    const yearLabel = ACADEMIC_YEAR_OPTIONS.find(y => y.value === yearNum)?.label ?? `${yearNum}° Año`;
    const monthLabel = MONTHS.find(m => m.value === parseInt(approvalMonth, 10))?.label ?? "";
    const newCredit: TransferCredit = {
      id: `tc-${Date.now()}`,
      subjectName,
      academicYear: yearNum,
      academicYearLabel: yearLabel,
      finalGrade: grade,
      approvalMonth: parseInt(approvalMonth, 10),
      approvalYear: parseInt(approvalYear, 10),
      establishment: transferForm.establishment,
      loadedAt: new Date().toLocaleDateString("es-AR"),
    };
    setTransferCredits((prev) => [newCredit, ...prev]);
    setIsSavingTransfer(false);
    setIsTransferModalOpen(false);
    resetTransferForm();
    toast.success("Materia aprobada por equivalencia registrada.", {
      description: `${subjectName} — ${monthLabel} ${approvalYear}`,
    });
  }, [transferForm, resetTransferForm]);

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

  const getEnrollmentConditionConfig = (condition: EnrollmentCondition) => {
    switch (condition) {
      case "REGULAR":
        return { label: "Regular",       color: "bg-[#d0bcff]/15 text-[#d0bcff] border-[#d0bcff]/30" };
      case "RECURSANTE":
        return { label: "Recursante",    color: "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/40" };
      case "PREVIA_LIBRE":
        return { label: "Previa Libre",  color: "bg-amber-500/20 text-amber-300 border-amber-500/35"  };
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              onClick={() => setIsTransferModalOpen(true)}
              variant="outline"
              className="border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 hover:border-[#d0bcff]/50 bg-[#d0bcff]/5"
            >
              <GitMerge className="size-4 mr-2" />
              Cargar Equivalencia / Pase
            </Button>
            <Button
              onClick={() => setIsPromotionDialogOpen(true)}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              <ArrowUpRight className="size-4 mr-2" />
              Realizar Promocion
            </Button>
          </div>
        )}
      </div>

      {/* Family Notification Alert */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
        <Bell className="size-4 text-[#d0bcff] shrink-0" />
        <p className="text-xs text-white/60">
          Informacion visible y notificada a la familia del estudiante en tiempo real.
        </p>
      </div>

      {/* ── Inscripciones del Ciclo Actual ──────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-4">

        {/* Header de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#e4e1ea] flex items-center gap-2">
            <BookOpen className="size-4 text-[#d0bcff]" />
            Inscripciones — Ciclo Lectivo Actual
            <Badge
              variant="outline"
              className="text-[10px] font-mono bg-white/5 text-white/40 border-white/10 ml-1"
            >
              {currentEnrollments.length} materia{currentEnrollments.length !== 1 ? "s" : ""}
            </Badge>
          </h3>

          {/* Boton visible solo para ADMIN — RBAC */}
          {isAdmin && (
            <Button
              onClick={() => setIsEnrollModalOpen(true)}
              size="sm"
              className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/20 hover:border-[#ffb4ab]/50 gap-2"
              variant="outline"
            >
              <PlusCircle className="size-4" />
              Inscribir en Materia Previa / Recursada
            </Button>
          )}
        </div>

        {/* Grilla de inscripciones */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  Asignatura
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  Año de Origen
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  Condicion
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">
                  Inscripto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {currentEnrollments.map((enr) => {
                const condConfig = getEnrollmentConditionConfig(enr.condition);
                const isException = enr.condition !== "REGULAR";
                return (
                  <tr
                    key={enr.id}
                    className={cn(
                      "transition-colors",
                      isException
                        ? "bg-[#ffb4ab]/[0.03] hover:bg-[#ffb4ab]/[0.05]"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isException && (
                          <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className={cn(
                          "font-medium",
                          isException ? "text-[#e4e1ea]" : "text-white/70"
                        )}>
                          {enr.subjectName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {enr.originYearLabel}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold border", condConfig.color)}
                      >
                        {condConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-white/35 text-xs hidden sm:table-cell">
                      {enr.addedAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

      {/* Historial Consolidado de Equivalencias y Pases */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-[#e4e1ea] flex items-center gap-2">
            <GitMerge className="size-4 text-[#d0bcff]" />
            Historial Consolidado — Equivalencias y Pases
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-mono bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/25"
            >
              {transferCredits.length} registro{transferCredits.length !== 1 ? "s" : ""}
            </Badge>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
                className="h-7 px-2.5 text-xs bg-[#d0bcff]/10 border border-[#d0bcff]/25 text-[#d0bcff] hover:bg-[#d0bcff]/20"
              >
                <PlusCircle className="size-3 mr-1.5" />
                Agregar
              </Button>
            )}
          </div>
        </div>

        {transferCredits.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#d0bcff]/8 border border-[#d0bcff]/15 flex items-center justify-center">
              <GitMerge className="size-5 text-[#d0bcff]/40" />
            </div>
            <p className="text-sm text-white/35">Sin equivalencias o pases registrados.</p>
            {isAdmin && (
              <p className="text-xs text-white/25">
                Usá el botón "Cargar Equivalencia / Pase" para agregar calificaciones históricas.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Asignatura
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Año Académico
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Nota Final
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Aprobación
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Establecimiento
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">
                    Cargado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transferCredits.map((credit) => {
                  const monthLabel = MONTHS.find(m => m.value === credit.approvalMonth)?.label ?? "";
                  const isExternalEstab = credit.establishment === "OTRO_ESTABLECIMIENTO";
                  const gradeColor =
                    credit.finalGrade >= 7
                      ? "text-[#4de082]"
                      : credit.finalGrade >= 4
                      ? "text-[#ffb93d]"
                      : "text-[#ffb4ab]";
                  return (
                    <tr
                      key={credit.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-[#d0bcff]/8 border border-[#d0bcff]/15 flex items-center justify-center shrink-0">
                            <BookOpen className="size-3.5 text-[#d0bcff]/60" />
                          </div>
                          <span className="font-medium text-[#e4e1ea]">{credit.subjectName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono bg-[#d0bcff]/8 text-[#d0bcff]/80 border-[#d0bcff]/20"
                        >
                          {credit.academicYearLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-lg font-bold", gradeColor)}>
                          {credit.finalGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {monthLabel} {credit.approvalYear}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isExternalEstab ? (
                            <Building2 className="size-3.5 text-[#ffb93d]/70 shrink-0" />
                          ) : (
                            <Landmark className="size-3.5 text-[#4de082]/70 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-xs",
                              isExternalEstab ? "text-[#ffb93d]/80" : "text-[#4de082]/80"
                            )}
                          >
                            {isExternalEstab ? "Otro establecimiento" : "Este establecimiento"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/30 font-mono hidden sm:table-cell">
                        {credit.loadedAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Motor de Inscripcion Granular — Dialog ─────────────────────── */}
      <Dialog open={isEnrollModalOpen} onOpenChange={(open) => { setIsEnrollModalOpen(open); if (!open) resetEnrollForm(); }}>
        <DialogContent className="sm:max-w-[480px] bg-[#131319] border-white/10 p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <PlusCircle className="size-5 text-[#ffb4ab]" />
              Inscribir en Materia Previa / Recursada
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs mt-1">
              Asigna una materia de un año anterior a la cursada actual del alumno.
              Aparecera diferenciada con un badge en la grilla de inscripciones.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
            {/* Año Academico Origen */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Año Academico de Origen
              </Label>
              <Select
                value={enrollForm.originYear}
                onValueChange={(v) => setEnrollForm((p) => ({ ...p, originYear: v }))}
              >
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-[#e4e1ea] focus:ring-[#d0bcff]/30">
                  <SelectValue placeholder="Seleccionar año..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {ACADEMIC_YEAR_OPTIONS.filter(y => y.value <= 6).map((y) => (
                    <SelectItem key={y.value} value={String(y.value)} className="text-[#e4e1ea] focus:bg-white/10">
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asignatura */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Asignatura Pendiente
              </Label>
              <Select
                value={enrollForm.subjectName}
                onValueChange={(v) => setEnrollForm((p) => ({ ...p, subjectName: v }))}
              >
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-[#e4e1ea] focus:ring-[#d0bcff]/30">
                  <SelectValue placeholder="Seleccionar materia..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-52 overflow-y-auto">
                  {SUBJECTS_CATALOG.map((s) => (
                    <SelectItem key={s} value={s} className="text-[#e4e1ea] focus:bg-white/10">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condicion de Inscripcion */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Condicion de Inscripcion
              </Label>
              <RadioGroup
                value={enrollForm.condition}
                onValueChange={(v) => setEnrollForm((p) => ({ ...p, condition: v as EnrollmentCondition }))}
                className="space-y-2"
              >
                <label
                  htmlFor="cond-recursante"
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                    enrollForm.condition === "RECURSANTE"
                      ? "bg-[#ffb4ab]/[0.07] border-[#ffb4ab]/35"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <RadioGroupItem value="RECURSANTE" id="cond-recursante" className="mt-0.5 shrink-0 border-[#ffb4ab]/50 text-[#ffb4ab]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#ffb4ab]">Recursante (Presencial)</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">
                      El alumno asiste a clases presenciales y rinde con el curso de origen.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="cond-libre"
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                    enrollForm.condition === "PREVIA_LIBRE"
                      ? "bg-amber-500/[0.07] border-amber-500/35"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <RadioGroupItem value="PREVIA_LIBRE" id="cond-libre" className="mt-0.5 shrink-0 border-amber-500/50 text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-300">Rinde Libre (Previa)</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">
                      El alumno rinde en mesa examinadora sin asistir a clase.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Preview del badge resultante */}
            {enrollForm.subjectName && enrollForm.originYear && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                <p className="text-xs text-white/50">
                  Se sumara a la grilla como{" "}
                  <span className="font-semibold text-[#e4e1ea]">{enrollForm.subjectName}</span>
                  {" "}con el badge{" "}
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] border inline-flex", getEnrollmentConditionConfig(enrollForm.condition).color)}
                  >
                    {getEnrollmentConditionConfig(enrollForm.condition).label}
                  </Badge>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01] shrink-0">
            <Button
              variant="ghost"
              onClick={() => { setIsEnrollModalOpen(false); resetEnrollForm(); }}
              className="text-white/50 hover:text-white"
              disabled={isSavingEnroll}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEnrollment}
              disabled={isSavingEnroll || !enrollForm.originYear || !enrollForm.subjectName}
              className="bg-[#ffb4ab] text-[#1a0a0a] hover:bg-[#ffb4ab]/90 gap-2 disabled:opacity-50"
            >
              {isSavingEnroll ? (
                <><Loader2 className="size-4 animate-spin" /> Guardando...</>
              ) : (
                <><PlusCircle className="size-4" /> Confirmar Inscripcion</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Modal: Cargar Materia por Equivalencia / Pase — solo ADMIN */}
      <Dialog
        open={isTransferModalOpen}
        onOpenChange={(o) => { if (!o) resetTransferForm(); setIsTransferModalOpen(o); }}
      >
        <DialogContent className="bg-[#0e0e16] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2 text-lg">
              <GitMerge className="size-5 text-[#d0bcff]" />
              Cargar Materia Aprobada por Equivalencia / Pase
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Registrá calificaciones históricas de otro establecimiento o de este mismo colegio.
              Quedarán en el Historial Consolidado del alumno.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* Alerta */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
              <Shield className="size-4 text-[#d0bcff] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#d0bcff]/70 leading-relaxed">
                Esta carga queda registrada en el legajo del alumno y es visible para la familia.
                Solo los administradores pueden editarla o eliminarla.
              </p>
            </div>

            {/* Establecimiento de Origen — RadioGroup */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/70">
                Establecimiento de Origen
              </Label>
              <RadioGroup
                value={transferForm.establishment}
                onValueChange={(v) =>
                  setTransferForm((p) => ({ ...p, establishment: v as TransferCredit["establishment"] }))
                }
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: "OTRO_ESTABLECIMIENTO",  label: "Otro Establecimiento",  icon: Building2,  desc: "Pase externo / Colegio de origen" },
                  { value: "ESTE_ESTABLECIMIENTO",  label: "Este Establecimiento",   icon: Landmark,   desc: "Equivalencia interna del colegio" },
                ].map(({ value, label, icon: Icon, desc }) => {
                  const isSelected = transferForm.establishment === value;
                  return (
                    <label
                      key={value}
                      htmlFor={`estab-${value}`}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "bg-[#d0bcff]/10 border-[#d0bcff]/40"
                          : "bg-white/[0.02] border-white/8 hover:border-white/15"
                      )}
                    >
                      <RadioGroupItem
                        value={value}
                        id={`estab-${value}`}
                        className="mt-0.5 border-white/30 text-[#d0bcff]"
                      />
                      <div>
                        <div className={cn("flex items-center gap-1.5 text-sm font-semibold", isSelected ? "text-[#d0bcff]" : "text-white/60")}>
                          <Icon className="size-3.5 shrink-0" />
                          {label}
                        </div>
                        <p className="text-[10px] text-white/35 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Asignatura */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Asignatura</Label>
              <Select
                value={transferForm.subjectName}
                onValueChange={(v) => setTransferForm((p) => ({ ...p, subjectName: v }))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                  <SelectValue placeholder="Seleccionar asignatura..." />
                </SelectTrigger>
                <SelectContent className="bg-[#131319] border-white/10 max-h-52">
                  {SUBJECTS_CATALOG.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Año Académico correspondiente */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Año Académico correspondiente</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACADEMIC_YEAR_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTransferForm((p) => ({ ...p, academicYear: String(value) }))}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      transferForm.academicYear === String(value)
                        ? "bg-[#d0bcff]/15 border-[#d0bcff]/40 text-[#d0bcff]"
                        : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/20 hover:text-white/70"
                    )}
                  >
                    <span className="text-base font-bold leading-none">{value}°</span>
                    <span className="text-[10px] font-normal mt-0.5 opacity-70">Año</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calificación Final */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Calificación Final</Label>
              <Input
                type="number"
                min={1}
                max={10}
                step={0.5}
                placeholder="Ej: 8"
                value={transferForm.finalGrade}
                onChange={(e) => setTransferForm((p) => ({ ...p, finalGrade: e.target.value }))}
                className="bg-white/[0.02] border-white/10 h-11"
              />
              <p className="text-[10px] text-white/30 pl-1">Rango 1–10. Se almacena tal como se ingresa.</p>
            </div>

            {/* Mes y Año de Aprobación — dos columnas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Mes de Aprobación</Label>
                <Select
                  value={transferForm.approvalMonth}
                  onValueChange={(v) => setTransferForm((p) => ({ ...p, approvalMonth: v }))}
                >
                  <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                    <SelectValue placeholder="Mes..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131319] border-white/10 max-h-52">
                    {MONTHS.map(({ value, label }) => (
                      <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Año de Aprobación</Label>
                <Select
                  value={transferForm.approvalYear}
                  onValueChange={(v) => setTransferForm((p) => ({ ...p, approvalYear: v }))}
                >
                  <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                    <SelectValue placeholder="Año..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131319] border-white/10 max-h-52">
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview del registro */}
            {transferForm.subjectName && transferForm.academicYear && transferForm.finalGrade && transferForm.approvalMonth && transferForm.approvalYear && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#4de082]/5 border border-[#4de082]/15">
                <CheckCircle2 className="size-4 text-[#4de082] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#4de082]/80 leading-relaxed">
                  <span className="font-semibold">{transferForm.subjectName}</span> —{" "}
                  {ACADEMIC_YEAR_OPTIONS.find(y => y.value === parseInt(transferForm.academicYear))?.label} —{" "}
                  Nota <span className="font-bold">{transferForm.finalGrade}</span> —{" "}
                  {MONTHS.find(m => m.value === parseInt(transferForm.approvalMonth))?.label} {transferForm.approvalYear}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => { resetTransferForm(); setIsTransferModalOpen(false); }}
              disabled={isSavingTransfer}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTransfer}
              disabled={isSavingTransfer}
              className="bg-[#d0bcff] text-[#0e0e16] hover:bg-[#d0bcff]/90 font-semibold"
            >
              {isSavingTransfer ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <GitMerge className="size-4 mr-2" />
                  Registrar Equivalencia
                </>
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
