"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { GradesGrid } from "@/components/grades";
import { AcademicTrackingBoard } from "@/components/grades/academic-tracking-board";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/auth-context";
import { 
  BookOpen, Lock, AlertTriangle, Calculator, Hash, FileText, Loader2, Sliders, 
  Plus, Trash2, Pencil, X, Check, Grid3X3, ClipboardSignature, CheckCircle2,
  Bell, User, FileStack, Send, Download, BarChart3, AlertCircle, Eye, EyeOff,
  TrendingUp, BookMarked
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSchoolSettings } from "@/lib/context/school-settings-context";
import type {
  CourseGradeInfo,
  StudentGradeRow,
  GradeEntry,
  AssessmentConfig,
  GradeScale,
} from "@/lib/types/grades";
import { calculateSimpleAverage, isPassingGrade, roundToDecimals } from "@/lib/types/grades";
import { cn } from "@/lib/utils";

// ============================================
// MOCK DATA FOR DEMO
// ============================================

const MOCK_SCALE_NUMERIC: GradeScale = {
  type: "NUMERIC",
  minPassing: 7,
  maxGrade: 10,
};

const MOCK_SUBJECTS = [
  { id: "math-1", name: "Matematica", shortName: "MAT", defaultScale: "NUMERIC" },
  { id: "psico-1", name: "Psicologia del Deporte", shortName: "PSI", defaultScale: "NUMERIC" },
  { id: "lit-1", name: "Literatura", shortName: "LIT", defaultScale: "NUMERIC" },
  { id: "hist-1", name: "Historia", shortName: "HIS", defaultScale: "NUMERIC" },
  { id: "art-1", name: "Arte y Expresion", shortName: "ART", defaultScale: "CONCEPTUAL" },
  { id: "efi-1", name: "Educacion Fisica", shortName: "EFI", defaultScale: "CONCEPTUAL" },
];

// Initial assessments - now dynamic
const INITIAL_ASSESSMENTS_NUMERIC: AssessmentConfig[] = [
  { id: "eval-1", name: "Parcial 1", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-2", name: "TP 1", type: "HOMEWORK", weight: 1, maxValue: 10 },
];

const INITIAL_ASSESSMENTS_CONCEPTUAL: AssessmentConfig[] = [
  { id: "eval-c1", name: "Evaluacion 1", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-c2", name: "Trabajo Practico", type: "PROJECT", weight: 1, maxValue: 10 },
];

// ============================================
// PENDING TOPICS - DERIVED STATE ARCHITECTURE
// ============================================

interface PendingTopic {
  id: string;
  studentId: string;
  studentName: string;
  studentLegajo: string;
  evaluationId: string;
  evaluationName: string;
  originalGrade: number;
  currentAttempt: number;
  status: "PENDING" | "CLEARED";
  clearedGrade: number | null;
  clearedAt: Date | null;
}

// Initial pending topics (from previous years - historical data)
const INITIAL_PENDING_TOPICS: PendingTopic[] = [
  { 
    id: "pt-hist-1", 
    studentId: "s3",
    studentName: "Valentina Castro",
    studentLegajo: "2024-003",
    evaluationId: "eval-hist-1",
    evaluationName: "Ecuaciones Cuadraticas (3° Ano 2024)",
    originalGrade: 4,
    currentAttempt: 2,
    status: "PENDING",
    clearedGrade: null,
    clearedAt: null,
  },
  { 
    id: "pt-hist-2", 
    studentId: "s4",
    studentName: "Lucas Diaz",
    studentLegajo: "2024-004",
    evaluationId: "eval-hist-2",
    evaluationName: "Funciones Trigonometricas (3° Ano 2024)",
    originalGrade: 5,
    currentAttempt: 1,
    status: "PENDING",
    clearedGrade: null,
    clearedAt: null,
  },
  { 
    id: "pt-hist-3", 
    studentId: "s10",
    studentName: "Thiago Nunez",
    studentLegajo: "2024-010",
    evaluationId: "eval-hist-3",
    evaluationName: "Probabilidad y Estadistica (3° Ano 2023)",
    originalGrade: 3,
    currentAttempt: 3,
    status: "PENDING",
    clearedGrade: null,
    clearedAt: null,
  },
];

const generateMockGrade = (
  studentId: string,
  assessmentId: string,
  value: number | null,
  conceptual: string | null = null
): GradeEntry => ({
  id: `${studentId}-${assessmentId}`,
  studentId,
  assessmentId,
  value,
  conceptual,
  isPublished: false,
  isRecovery: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "teacher-1",
});

const MOCK_STUDENTS_DATA = [
  { id: "s1", firstName: "Sofia", lastName: "Alvarez", legajo: "2024-001" },
  { id: "s2", firstName: "Mateo", lastName: "Benitez", legajo: "2024-002" },
  { id: "s3", firstName: "Valentina", lastName: "Castro", legajo: "2024-003" },
  { id: "s4", firstName: "Lucas", lastName: "Diaz", legajo: "2024-004" },
  { id: "s5", firstName: "Martina", lastName: "Fernandez", legajo: "2024-005" },
  { id: "s6", firstName: "Benjamin", lastName: "Garcia", legajo: "2024-006" },
  { id: "s7", firstName: "Emma", lastName: "Hernandez", legajo: "2024-007" },
  { id: "s8", firstName: "Joaquin", lastName: "Lopez", legajo: "2024-008" },
  { id: "s9", firstName: "Isabella", lastName: "Martinez", legajo: "2024-009" },
  { id: "s10", firstName: "Thiago", lastName: "Nunez", legajo: "2024-010" },
  { id: "s11", firstName: "Mia", lastName: "Ortiz", legajo: "2024-011" },
  { id: "s12", firstName: "Santiago", lastName: "Perez", legajo: "2024-012" },
];

const createMockStudentRow = (
  data: typeof MOCK_STUDENTS_DATA[0],
  grades: Record<string, GradeEntry | null>,
  scale: GradeScale
): StudentGradeRow => {
  const gradeEntries = Object.values(grades);
  const average = scale.type === "NUMERIC" ? calculateSimpleAverage(gradeEntries) : null;

  return {
    studentId: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    photoUrl: undefined,
    enrollmentNumber: data.legajo,
    grades,
    average,
    isPassing: average !== null && isPassingGrade(average, scale),
    isComplete: gradeEntries.every((g) => g !== null && (g.value !== null || g.conceptual !== null)),
  };
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function GradesPage() {
  const [mounted, setMounted] = useState(false);
  
  // Get auth context for role-based rendering
  const { role: currentRole } = useAuth();

  // PRECEPTOR solo puede ver la tab de Cierres — aterriza directamente ahí
  const [activeTab, setActiveTab] = useState(() =>
    currentRole === "PRECEPTOR" ? "cierres" : "regular"
  );
  
  // Get school settings from context
  const { settings, getAvailablePeriods } = useSchoolSettings();
  const schoolGradingType = settings.gradingScale.type;
  const availablePeriods = getAvailablePeriods();

  // Selection states
  const [selectedSubjectId, setSelectedSubjectId] = useState(MOCK_SUBJECTS[0].id);
  const [selectedPeriodId, setSelectedPeriodId] = useState(settings.currentPeriod);

  // Cuando el administrador cambia el academicPeriodLayout desde Configuracion,
  // nos aseguramos de que selectedPeriodId apunte a un periodo que realmente existe.
  // Si el ID actual ya no esta en la nueva lista, caemos al primer periodo disponible.
  useEffect(() => {
    const ids = availablePeriods.map(p => p.id);
    if (!ids.includes(selectedPeriodId)) {
      setSelectedPeriodId(ids[0] ?? "");
    }
  }, [availablePeriods, selectedPeriodId]);

  // Etiqueta legible del ciclo lectivo activo (para UI badges, botones, dialogs)
  const periodLayoutLabel = useMemo(() => {
    const map: Record<string, string> = {
      TRIMESTRAL:    "Trimestral",
      CUATRIMESTRAL: "Cuatrimestral",
      BIMESTRAL:     "Bimestral",
      SEMESTRAL:     "Semestral",
    };
    return map[settings.academicPeriodLayout] ?? settings.academicPeriodLayout;
  }, [settings.academicPeriodLayout]);
  
  // DYNAMIC COLUMNS STATE
  const [numericAssessments, setNumericAssessments] = useState<AssessmentConfig[]>(INITIAL_ASSESSMENTS_NUMERIC);
  const [conceptualAssessments, setConceptualAssessments] = useState<AssessmentConfig[]>(INITIAL_ASSESSMENTS_CONCEPTUAL);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  
  // PENDING TOPICS STATE (Derived State Architecture)
  const [pendingTopics, setPendingTopics] = useState<PendingTopic[]>(INITIAL_PENDING_TOPICS);
  const [recoveryGrades, setRecoveryGrades] = useState<Record<string, number | null>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
  // VALORACION PRELIMINAR STATE (TEA/TEP/TED Mid-term)
  const [isValoracionSheetOpen, setIsValoracionSheetOpen] = useState(false);
  const [valoracionData, setValoracionData] = useState<Record<string, "TEA" | "TEP" | "TED" | null>>({});
  const [valoracionJustificaciones, setValoracionJustificaciones] = useState<Record<string, string>>({});
  const [isSubmittingValoracion, setIsSubmittingValoracion] = useState(false);
  const [isExportingValoracion, setIsExportingValoracion] = useState(false);
  const [isExportingGrades, setIsExportingGrades] = useState(false);
  
  // Determine grading type: use school setting OR subject default
  const selectedSubject = MOCK_SUBJECTS.find((s) => s.id === selectedSubjectId)!;
  const gradingType: "NUMERIC" | "CONCEPTUAL" = 
    schoolGradingType === "ALPHABETIC" || schoolGradingType === "CONCEPTUAL" 
      ? "CONCEPTUAL" 
      : selectedSubject.defaultScale as "NUMERIC" | "CONCEPTUAL";
  
  // Current assessments based on grading type
  const currentAssessments = gradingType === "NUMERIC" ? numericAssessments : conceptualAssessments;
  const setCurrentAssessments = gradingType === "NUMERIC" ? setNumericAssessments : setConceptualAssessments;
  
  // Build current scale from school settings
  const currentScale: GradeScale = useMemo(() => {
    if (gradingType === "CONCEPTUAL") {
      return {
        type: "CONCEPTUAL",
        minPassing: settings.gradingScale.minPassing,
        maxGrade: settings.gradingScale.maxGrade,
        conceptualValues: settings.gradingScale.values || ["TEA", "TEP", "TED"],
      };
    }
    return {
      type: "NUMERIC",
      minPassing: settings.gradingScale.minPassing,
      maxGrade: settings.gradingScale.maxGrade,
    };
  }, [gradingType, settings.gradingScale]);

  // Grades data with real-time calculation - now tracks by assessment ID
  const [gradesData, setGradesData] = useState<Record<string, Record<string, number | string | null>>>(() => {
    const data: Record<string, Record<string, number | string | null>> = {};
    MOCK_STUDENTS_DATA.forEach((student) => {
      data[student.id] = {};
    });
    return data;
  });

  const [publicationStatus, setPublicationStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [lastPublishedAt, setLastPublishedAt] = useState<Date | undefined>();
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isTrimesterClosed, setIsTrimesterClosed] = useState(false);

  // ── TAB: CIERRES Y BOLETÍN ─────────────────────────────────────────────────
  // Nota por periodo: { [studentId]: { [periodId]: number | null } }
  const [periodGrades, setPeriodGrades] = useState<Record<string, Record<string, number | null>>>(() => {
    const data: Record<string, Record<string, number | null>> = {};
    MOCK_STUDENTS_DATA.forEach(s => { data[s.id] = {}; });
    return data;
  });
  // Override manual de la calificacion final: { [studentId]: number | null }
  const [finalGradeOverrides, setFinalGradeOverrides] = useState<Record<string, number | null>>({});
  // Flag para saber si el docente sobreescribio el calculo automatico
  const [manualOverrideFlags, setManualOverrideFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================
  // DYNAMIC COLUMN HANDLERS
  // ============================================
  
  const handleAddColumn = useCallback(() => {
    if (isTrimesterClosed) {
      toast.error("El trimestre esta cerrado. No se pueden agregar evaluaciones.");
      return;
    }
    
    const newId = `eval-${Date.now()}`;
    const columnCount = currentAssessments.length + 1;
    const newAssessment: AssessmentConfig = {
      id: newId,
      name: `Evaluacion ${columnCount}`,
      type: "EXAM",
      weight: 1,
      maxValue: 10,
    };
    
    setCurrentAssessments(prev => [...prev, newAssessment]);
    toast.success(`Columna "Evaluacion ${columnCount}" agregada`);
  }, [currentAssessments.length, isTrimesterClosed, setCurrentAssessments]);

  const handleRemoveColumn = useCallback((assessmentId: string) => {
    if (isTrimesterClosed) {
      toast.error("El trimestre esta cerrado. No se pueden eliminar evaluaciones.");
      return;
    }
    
    if (currentAssessments.length <= 1) {
      toast.error("Debe haber al menos una evaluacion.");
      return;
    }
    
    const assessment = currentAssessments.find(a => a.id === assessmentId);
    setCurrentAssessments(prev => prev.filter(a => a.id !== assessmentId));
    
    // Also remove grades for this assessment
    setGradesData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(studentId => {
        const { [assessmentId]: _, ...rest } = newData[studentId];
        newData[studentId] = rest;
      });
      return newData;
    });
    
    toast.info(`Columna "${assessment?.name}" eliminada`);
  }, [currentAssessments, isTrimesterClosed, setCurrentAssessments]);

  const handleStartEditColumn = useCallback((assessmentId: string) => {
    const assessment = currentAssessments.find(a => a.id === assessmentId);
    if (assessment) {
      setEditingColumnId(assessmentId);
      setEditingColumnName(assessment.name);
    }
  }, [currentAssessments]);

  const handleSaveColumnName = useCallback(() => {
    if (!editingColumnId || !editingColumnName.trim()) return;
    
    setCurrentAssessments(prev => prev.map(a => 
      a.id === editingColumnId ? { ...a, name: editingColumnName.trim() } : a
    ));
    
    setEditingColumnId(null);
    setEditingColumnName("");
    toast.success("Nombre actualizado");
  }, [editingColumnId, editingColumnName, setCurrentAssessments]);

  const handleCancelEditColumn = useCallback(() => {
    setEditingColumnId(null);
    setEditingColumnName("");
  }, []);

  // ============================================
  // PENDING TOPICS HANDLERS (Retry Logic)
  // ============================================

  const handleEvaluateTopic = useCallback(async (topicId: string) => {
    const grade = recoveryGrades[topicId];
    if (grade === null || grade === undefined || grade < 1 || grade > 10) {
      toast.error("Ingrese una nota valida entre 1 y 10");
      return;
    }

    const topic = pendingTopics.find(t => t.id === topicId);
    if (!topic) return;

    setEvaluatingId(topicId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (grade < 7) {
      // FAILED: Increment attempt counter
      setPendingTopics(prev => prev.map(t => 
        t.id === topicId 
          ? { ...t, currentAttempt: t.currentAttempt + 1 }
          : t
      ));
      setRecoveryGrades(prev => ({ ...prev, [topicId]: null }));
      setEvaluatingId(null);
      
      toast.error(
        `El alumno no ha alcanzado los saberes. Se habilita nueva instancia.`,
        {
          description: `${topic.studentName} - Intento #${topic.currentAttempt + 1} habilitado`,
          duration: 5000,
        }
      );
    } else {
      // PASSED: Mark as CLEARED
      setPendingTopics(prev => prev.map(t => 
        t.id === topicId 
          ? { ...t, status: "CLEARED" as const, clearedGrade: grade, clearedAt: new Date() }
          : t
      ));
      setEvaluatingId(null);

      toast.success(
        `Saberes acreditados. Notificando a familia y secretaria.`,
        {
          description: `${topic.studentName} aprobo "${topic.evaluationName}" con nota ${grade}`,
          duration: 5000,
        }
      );
    }
  }, [recoveryGrades, pendingTopics]);

  // Calculate students with real-time averages
  const students: StudentGradeRow[] = useMemo(() => {
    return MOCK_STUDENTS_DATA.map((studentData) => {
      const studentGrades: Record<string, GradeEntry | null> = {};
      
      currentAssessments.forEach((assessment) => {
        const gradeValue = gradesData[studentData.id]?.[assessment.id];
        
        if (gradingType === "NUMERIC") {
          const value = typeof gradeValue === "number" ? gradeValue : null;
          studentGrades[assessment.id] = value !== null 
            ? generateMockGrade(studentData.id, assessment.id, value)
            : null;
        } else {
          const conceptual = typeof gradeValue === "string" ? gradeValue : null;
          studentGrades[assessment.id] = conceptual !== null 
            ? generateMockGrade(studentData.id, assessment.id, null, conceptual)
            : null;
        }
      });

      return createMockStudentRow(studentData, studentGrades, currentScale);
    });
  }, [gradesData, gradingType, currentScale, currentAssessments]);

  // Statistics
  const stats = useMemo(() => {
    if (gradingType !== "NUMERIC") {
      const teaCount = students.filter(s => {
        const grades = Object.values(s.grades);
        return grades.some(g => g?.conceptual === "TEA");
      }).length;
      const tedCount = students.filter(s => {
        const grades = Object.values(s.grades);
        return grades.some(g => g?.conceptual === "TED");
      }).length;
      return { 
        total: students.length, 
        passing: teaCount, 
        failing: tedCount, 
        averageGeneral: 0,
        isConceptual: true 
      };
    }

    const total = students.length;
    const passing = students.filter((s) => s.isPassing).length;
    const failing = students.filter((s) => s.average !== null && !s.isPassing).length;
    const averageGeneral = students.reduce((acc, s) => acc + (s.average || 0), 0) / total;
    return { total, passing, failing, averageGeneral: roundToDecimals(averageGeneral), isConceptual: false };
  }, [students, gradingType]);

  // Pending stats (derived from pendingTopics)
  const pendingStats = useMemo(() => {
    const pending = pendingTopics.filter(t => t.status === "PENDING").length;
    const cleared = pendingTopics.filter(t => t.status === "CLEARED").length;
    const multipleAttempts = pendingTopics.filter(t => t.status === "PENDING" && t.currentAttempt > 1).length;
    return { pending, cleared, multipleAttempts, total: pendingTopics.length };
  }, [pendingTopics]);

  // Columnas dinamicas para Tab de Cierres: provienen del config del ciclo lectivo
  const periodColumns = useMemo(() => {
    return settings.academicPeriodConfig.periods.map(p => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
    }));
  }, [settings.academicPeriodConfig.periods]);

  // Calcula el promedio de los periodos para cada alumno (ignora nulls)
  const computedFinalGrades = useMemo(() => {
    const result: Record<string, number | null> = {};
    MOCK_STUDENTS_DATA.forEach(s => {
      const vals = periodColumns
        .map(col => periodGrades[s.id]?.[col.id] ?? null)
        .filter((v): v is number => v !== null);
      result[s.id] = vals.length > 0
        ? roundToDecimals(vals.reduce((a, b) => a + b, 0) / vals.length)
        : null;
    });
    return result;
  }, [periodGrades, periodColumns]);

  const selectedPeriod = availablePeriods.find((p) => p.id === selectedPeriodId) || availablePeriods[0];

  // Handle grade update with real-time average recalculation AND pending topics derivation
  const handleGradeUpdate = useCallback(
    async (studentId: string, assessmentId: string, value: number | null, conceptual?: string | null) => {
      if (isTrimesterClosed) {
        toast.error("El trimestre esta cerrado. No se pueden modificar las notas.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (gradingType === "NUMERIC") {
        if (value !== null && (value < 1 || value > 10)) {
          toast.error("La nota debe estar entre 1 y 10");
          return;
        }
        
        const roundedValue = value !== null ? roundToDecimals(value) : null;
        
        // Update grades data
        setGradesData((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [assessmentId]: roundedValue,
          },
        }));

        // DERIVED STATE: Handle pending topics creation/removal
        if (roundedValue !== null) {
          const studentData = MOCK_STUDENTS_DATA.find(s => s.id === studentId);
          const assessment = currentAssessments.find(a => a.id === assessmentId);
          
          if (studentData && assessment) {
            const pendingId = `pt-${studentId}-${assessmentId}`;
            const existingPending = pendingTopics.find(t => t.id === pendingId);
            
            if (roundedValue < 7) {
              // Create pending topic if doesn't exist
              if (!existingPending) {
                const newPendingTopic: PendingTopic = {
                  id: pendingId,
                  studentId,
                  studentName: `${studentData.firstName} ${studentData.lastName}`,
                  studentLegajo: studentData.legajo,
                  evaluationId: assessmentId,
                  evaluationName: `${assessment.name} - ${selectedSubject.name}`,
                  originalGrade: roundedValue,
                  currentAttempt: 1,
                  status: "PENDING",
                  clearedGrade: null,
                  clearedAt: null,
                };
                
                setPendingTopics(prev => [...prev, newPendingTopic]);
                toast.info(
                  `Tema pendiente registrado para ${studentData.firstName} ${studentData.lastName}`,
                  { description: `"${assessment.name}" agregado a lista de recuperacion`, duration: 3000 }
                );
              }
            } else {
              // Remove from pending if exists AND is still in attempt 1 (corrected in regular grid)
              if (existingPending && existingPending.currentAttempt === 1 && existingPending.status === "PENDING") {
                setPendingTopics(prev => prev.filter(t => t.id !== pendingId));
                toast.success(
                  `Tema aprobado para ${studentData.firstName} ${studentData.lastName}`,
                  { description: `"${assessment.name}" removido de lista de recuperacion`, duration: 3000 }
                );
              }
            }
          }
        }
      } else {
        setGradesData((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [assessmentId]: conceptual ?? null,
          },
        }));
      }
    },
    [isTrimesterClosed, gradingType, currentAssessments, pendingTopics, selectedSubject]
  );

  // Handle close trimester
  const handleCloseTrimester = useCallback(async () => {
    setIsClosing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsTrimesterClosed(true);
    setPublicationStatus("PUBLISHED");
    setLastPublishedAt(new Date());
    setIsCloseDialogOpen(false);
    setIsClosing(false);

    toast.success("Calificaciones guardadas y promedios congelados con exito", {
      description: "Las notas fueron enviadas a Secretaria Academica.",
    });
  }, []);

  // Handle valoracion preliminar submit
  const handleSubmitValoracion = useCallback(async () => {
    // Validate that TEP/TED have justifications
    const missingJustifications = Object.entries(valoracionData).filter(([studentId, val]) => {
      if (val === "TEP" || val === "TED") {
        const justif = valoracionJustificaciones[studentId];
        return !justif || justif.trim().length === 0;
      }
      return false;
    });

    if (missingJustifications.length > 0) {
      toast.error("Faltan justificaciones pedagogicas para alumnos con TEP/TED");
      return;
    }

    setIsSubmittingValoracion(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmittingValoracion(false);
    setIsValoracionSheetOpen(false);
    
    const tepCount = Object.values(valoracionData).filter(v => v === "TEP").length;
    const tedCount = Object.values(valoracionData).filter(v => v === "TED").length;
    
    toast.success(`Valoraciones registradas. ${tepCount + tedCount > 0 ? `${tepCount + tedCount} justificacion(es) pedagogica(s) adjuntadas.` : ""} Boletines parciales disponibles.`, {
      duration: 5000,
    });
  }, [valoracionData, valoracionJustificaciones]);

  // Export valoracion to CSV
  // Native Download Engine: crea un Blob, fuerza el click en un <a> oculto y limpia el DOM.
  const triggerDownload = useCallback((filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportValoracion = useCallback(async () => {
    setIsExportingValoracion(true);
    
    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Build CSV content with UTF-8 BOM for proper encoding
    const BOM = "\uFEFF";
    const headers = ["Legajo", "Apellido", "Nombre", "Promedio Parcial", "Valoracion Preliminar"];
    const rows = students.map((student) => {
      const valoracion = valoracionData[student.studentId] || "Sin Evaluar";
      const promedio = student.average !== null ? student.average.toFixed(1) : "-";
      
      return [
        student.enrollmentNumber,
        student.lastName,
        student.firstName,
        promedio,
        valoracion,
      ].map(cell => `"${cell}"`).join(",");
    });
    
    const csvContent = BOM + [headers.join(","), ...rows].join("\n");
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Generate filename
    const subjectSlug = selectedSubject.shortName.toLowerCase();
    const periodSlug = selectedPeriod.name.toLowerCase().replace(/\s+/g, "_");
    const filename = `valoraciones_preliminares_${subjectSlug}_${periodSlug}.csv`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExportingValoracion(false);
    toast.success("Planilla exportada con exito en su dispositivo");
  }, [students, valoracionData, selectedSubject, selectedPeriod]);

  // Exporta la planilla completa de calificaciones (alumnos visibles + notas por evaluacion)
  const handleExportGrades = useCallback(async () => {
    setIsExportingGrades(true);

    // Estado de carga ~1s antes de soltar el archivo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const BOM = "\uFEFF";
    // Columnas dinamicas: datos del alumno + una columna por evaluacion + promedio
    const headers = [
      "Legajo",
      "Apellido",
      "Nombre",
      ...currentAssessments.map((a) => a.name),
      "Promedio",
    ];
    const rows = students.map((student) => {
      const assessmentCells = currentAssessments.map((assessment) => {
        const grade = student.grades[assessment.id];
        if (!grade) return "-";
        return grade.value !== null && grade.value !== undefined
          ? String(grade.value)
          : grade.conceptual ?? "-";
      });
      const promedio = student.average !== null ? student.average.toFixed(1) : "-";
      return [
        student.enrollmentNumber,
        student.lastName,
        student.firstName,
        ...assessmentCells,
        promedio,
      ].map((cell) => `"${cell}"`).join(",");
    });

    const csvContent = BOM + [headers.join(","), ...rows].join("\n");
    triggerDownload("planilla_calificaciones.csv", csvContent, "text/csv;charset=utf-8;");

    setIsExportingGrades(false);
    toast.success("Planilla de calificaciones descargada", {
      description: `planilla_calificaciones.csv (${students.length} alumnos, ${currentAssessments.length} evaluaciones).`,
    });
  }, [students, currentAssessments]);

  if (!mounted) return null;

  // ============================================
  // ROLE-BASED RENDERING (Separation of Concerns)
  // ============================================
  // ADMIN: View prevention dashboard (cannot edit grades)
  // DOCENTE/PRECEPTOR: View and edit grades grid
  
  if (currentRole === "ADMIN") {
    return (
      <>
        <AcademicTrackingBoard />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  // Default view for DOCENTE, PRECEPTOR, and other roles
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">Calificaciones</h1>
          <p className="text-sm text-white/40 mt-1">
            Gestion de notas y promedios del periodo activo
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={isTrimesterClosed}>
            <SelectTrigger className="w-[220px] bg-white/[0.02] border-white/10 text-[#e4e1ea]">
              <BookOpen className="size-4 mr-2 text-[#d0bcff]" />
              <SelectValue placeholder="Seleccionar materia" />
            </SelectTrigger>
            <SelectContent className="bg-[#131319] border-white/10">
              {MOCK_SUBJECTS.map((subject) => (
                <SelectItem key={subject.id} value={subject.id} className="text-[#e4e1ea]">
                  <div className="flex items-center gap-2">
                    <span>{subject.name}</span>
                    {subject.defaultScale === "CONCEPTUAL" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d0bcff]/10 text-[#d0bcff] font-mono">
                        TEA/TEP/TED
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId} disabled={isTrimesterClosed}>
              <SelectTrigger className="w-[180px] bg-white/[0.02] border-white/10 text-[#e4e1ea]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent className="bg-[#131319] border-white/10">
                {availablePeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id} className="text-[#e4e1ea]">
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          <Link 
            href="/admin/config"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 ${
              gradingType === "NUMERIC" 
                ? "bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff]" 
                : "bg-white/[0.02] border-white/10 text-white/60"
            }`}
          >
            {gradingType === "NUMERIC" ? (
              <>
                <Hash className="size-4" />
                <span className="text-xs font-medium">Escala 1-10</span>
              </>
            ) : (
              <>
                <FileText className="size-4" />
                <span className="text-xs font-medium">
                  {settings.gradingScale.values?.join("/") || "TEA/TEP/TED"}
                </span>
              </>
            )}
            <Sliders className="size-3 opacity-50" />
          </Link>

          {/* Valoracion Preliminar Button */}
          <Button
            onClick={() => setIsValoracionSheetOpen(true)}
            variant="outline"
            className="border-[#d0bcff]/30 bg-[#d0bcff]/10 text-[#d0bcff] hover:bg-[#d0bcff]/20 hover:text-[#d0bcff]"
          >
            <FileStack className="size-4 mr-2" />
            Carga de Valoracion Preliminar
          </Button>
        </div>
      </header>

      {/* ── TABS SYSTEM ──────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-auto gap-0.5">

            {/* Tab 1: Seguimiento Continuo — solo DOCENTE */}
            {currentRole === "DOCENTE" && (
              <TabsTrigger
                value="regular"
                className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] gap-2 px-4 py-2"
              >
                <Grid3X3 className="size-4" />
                Seguimiento Continuo
              </TabsTrigger>
            )}

            {/* Tab 2: Cierres y Boletín — DOCENTE + PRECEPTOR */}
            <TabsTrigger
              value="cierres"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 gap-2 px-4 py-2"
            >
              <BarChart3 className="size-4" />
              Cierres y Boletin
              {currentRole === "PRECEPTOR" && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/50 font-mono">
                  <Eye className="size-3" /> Solo lectura
                </span>
              )}
            </TabsTrigger>

            {/* Tab 3: Temas Pendientes — solo DOCENTE */}
            {currentRole === "DOCENTE" && (
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] gap-2 px-4 py-2"
              >
                <ClipboardSignature className="size-4" />
                Temas Pendientes
                {pendingStats.pending > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold">
                    {pendingStats.pending}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Badge de ciclo lectivo activo */}
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/8 text-white/40">
            {periodLayoutLabel} · {availablePeriods.length} periodo{availablePeriods.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* TAB 1: CURSADA REGULAR */}
        <TabsContent value="regular" className="space-y-6 mt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Alumnos" value={stats.total} />
            {stats.isConceptual ? (
              <>
                <StatCard label="Avanzados (TEA)" value={stats.passing} color="text-[#4de082]" />
                <StatCard label="Dificultades (TED)" value={stats.failing} color="text-[#ffb4ab]" />
                <StatCard label="Evaluaciones" value={currentAssessments.length} color="text-[#d0bcff]" />
              </>
            ) : (
              <>
                <StatCard 
                  label="Aprobados" 
                  value={stats.passing} 
                  color="text-[#4de082]" 
                  subtext={`${Math.round((stats.passing / stats.total) * 100)}%`} 
                />
                <StatCard 
                  label="Desaprobados" 
                  value={stats.failing} 
                  color="text-[#ffb4ab]"
                  subtext={`${Math.round((stats.failing / stats.total) * 100)}%`}
                />
                <StatCard 
                  label="Promedio General" 
                  value={stats.averageGeneral.toFixed(1)} 
                  color={stats.averageGeneral >= 7 ? "text-[#4de082]" : "text-[#ffb4ab]"}
                />
              </>
            )}
          </div>

          {/* Grades Table with Dynamic Columns */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md overflow-hidden">
            {/* Dynamic Columns Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Calculator className="size-4" />
                  <span>{currentAssessments.length} columnas de evaluacion</span>
                </div>
                {!isTrimesterClosed ? (
                  <Button
                    onClick={() => setIsCloseDialogOpen(true)}
                    className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-bold"
                    size="sm"
                  >
                    <Lock className="size-4 mr-2" />
                    Cerrar Periodo
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4de082]/10 border border-[#4de082]/20 text-[#4de082] text-sm">
                    <Lock className="size-4" />
                    <span className="font-medium">Periodo Cerrado</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportGrades}
                  disabled={isExportingGrades}
                  className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                  {isExportingGrades ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Exportar Planilla
                    </>
                  )}
                </Button>
                {!isTrimesterClosed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddColumn}
                    className="text-[#d0bcff] hover:text-[#d0bcff] hover:bg-[#d0bcff]/10"
                  >
                    <Plus className="size-4 mr-1" />
                    Agregar Evaluacion
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="sticky left-0 z-10 bg-[#131319] px-4 py-3 text-left min-w-[200px]">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        Alumno
                      </span>
                    </th>
                    
                    {currentAssessments.map((assessment) => (
                      <th key={assessment.id} className="px-2 py-3 text-center min-w-[120px] group relative">
                        <div className="flex items-center justify-center gap-1">
                          {editingColumnId === assessment.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingColumnName}
                                onChange={(e) => setEditingColumnName(e.target.value)}
                                className="h-7 w-24 text-xs bg-white/5 border-[#d0bcff]/50 text-center"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveColumnName();
                                  if (e.key === "Escape") handleCancelEditColumn();
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-[#4de082] hover:bg-[#4de082]/10"
                                onClick={handleSaveColumnName}
                              >
                                <Check className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-white/40 hover:bg-white/5"
                                onClick={handleCancelEditColumn}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span 
                                className="text-xs font-semibold text-white/80 cursor-pointer hover:text-[#d0bcff] transition-colors"
                                onClick={() => !isTrimesterClosed && handleStartEditColumn(assessment.id)}
                                title="Clic para editar nombre"
                              >
                                {assessment.name}
                              </span>
                              {!isTrimesterClosed && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-5 text-white/40 hover:text-[#d0bcff] hover:bg-[#d0bcff]/10"
                                    onClick={() => handleStartEditColumn(assessment.id)}
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-5 text-white/40 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10"
                                    onClick={() => handleRemoveColumn(assessment.id)}
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </th>
                    ))}
                    
                    <th className="px-4 py-3 text-center min-w-[100px] bg-[#d0bcff]/5">
                      <span className="text-xs font-semibold text-[#d0bcff] uppercase tracking-wider">
                        Promedio
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="sticky left-0 z-10 bg-[#131319] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff]">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#e4e1ea]">
                              {student.lastName}, {student.firstName}
                            </p>
                            <p className="text-xs text-white/40">
                              {student.enrollmentNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {currentAssessments.map((assessment) => {
                        const gradeValue = gradesData[student.studentId]?.[assessment.id];
                        return (
                          <td key={assessment.id} className="px-2 py-3 text-center">
                            {gradingType === "NUMERIC" ? (
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={typeof gradeValue === "number" ? gradeValue : ""}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                  handleGradeUpdate(student.studentId, assessment.id, val);
                                }}
                                disabled={isTrimesterClosed}
                                className={cn(
                                  "w-16 h-9 text-center text-sm font-medium bg-white/[0.02] border-white/10",
                                  "focus:border-[#d0bcff] focus:ring-1 focus:ring-[#d0bcff]/20",
                                  typeof gradeValue === "number" && gradeValue >= 7 && "text-[#4de082]",
                                  typeof gradeValue === "number" && gradeValue < 7 && "text-[#ffb4ab]",
                                  isTrimesterClosed && "opacity-60 cursor-not-allowed"
                                )}
                              />
                            ) : (
                              <Select
                                value={typeof gradeValue === "string" ? gradeValue : ""}
                                onValueChange={(val) => handleGradeUpdate(student.studentId, assessment.id, null, val)}
                                disabled={isTrimesterClosed}
                              >
                                <SelectTrigger className={cn(
                                  "w-20 h-9 text-xs bg-white/[0.02] border-white/10",
                                  gradeValue === "TEA" && "text-[#4de082] border-[#4de082]/30",
                                  gradeValue === "TEP" && "text-[#d0bcff] border-[#d0bcff]/30",
                                  gradeValue === "TED" && "text-[#ffb4ab] border-[#ffb4ab]/30",
                                )}>
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#131319] border-white/10">
                                  {(currentScale.conceptualValues || ["TEA", "TEP", "TED"]).map((val) => (
                                    <SelectItem key={val} value={val} className="text-[#e4e1ea]">
                                      {val}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="px-4 py-3 text-center bg-[#d0bcff]/5">
                        {gradingType === "NUMERIC" ? (
                          <div className={cn(
                            "inline-flex items-center justify-center size-10 rounded-xl font-bold text-lg",
                            student.average !== null && student.average >= 7 
                              ? "bg-[#4de082]/20 text-[#4de082]" 
                              : student.average !== null 
                                ? "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                                : "bg-white/5 text-white/40"
                          )}>
                            {student.average !== null ? student.average.toFixed(1) : "-"}
                          </div>
                        ) : (
                          <span className="text-sm text-white/40">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: CIERRES Y BOLETÍN ─────────────────────────────────────── */}
        <TabsContent value="cierres" className="space-y-5 mt-0">

          {/* Banner PRECEPTOR: solo lectura */}
          {currentRole === "PRECEPTOR" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
              <Eye className="size-4 text-white/40 shrink-0" />
              <p className="text-xs text-white/50">
                Estas viendo los cierres de periodo en <span className="font-semibold text-white/70">modo Solo Lectura</span>. Puedes consultar y emitir boletines pero no modificar calificaciones.
              </p>
            </div>
          )}

          {/* Stats de la vista de Cierres */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Alumnos" value={MOCK_STUDENTS_DATA.length} />
            <StatCard
              label="Con Nota Final"
              value={Object.values(finalGradeOverrides).filter(v => v !== null).length + Object.entries(computedFinalGrades).filter(([id, v]) => v !== null && !manualOverrideFlags[id]).length}
              color="text-[#4de082]"
            />
            <StatCard
              label="Ajustes Manuales"
              value={Object.values(manualOverrideFlags).filter(Boolean).length}
              color="text-[#d0bcff]"
            />
            <StatCard
              label={`Periodos (${periodLayoutLabel})`}
              value={periodColumns.length}
              color="text-emerald-400"
            />
          </div>

          {/* Tabla principal de Cierres */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <BookMarked className="size-4 text-emerald-400" />
                <span>
                  {selectedSubject.name} — Calificaciones de Cierre por Periodo
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGrades}
                disabled={isExportingGrades}
                className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              >
                {isExportingGrades ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" />Procesando...</>
                ) : (
                  <><Download className="size-4 mr-2" />Exportar Boletin</>
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    {/* Columna alumno sticky */}
                    <th className="sticky left-0 z-10 bg-[#131319] px-4 py-3 text-left min-w-[200px]">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Alumno</span>
                    </th>

                    {/* Columnas dinamicas de periodos */}
                    {periodColumns.map(col => (
                      <th key={col.id} className="px-3 py-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-semibold text-emerald-300/80 uppercase tracking-wider">
                            {col.shortName}
                          </span>
                          <span className="text-[10px] text-white/30 font-normal normal-case">
                            {col.name}
                          </span>
                        </div>
                      </th>
                    ))}

                    {/* Columna Calificacion Final */}
                    <th className="px-4 py-3 text-center min-w-[140px] bg-emerald-500/5">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                          Cal. Final
                        </span>
                        <span className="text-[10px] text-white/30 font-normal normal-case">
                          {currentRole === "DOCENTE" ? "Editable" : "Calculado"}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {MOCK_STUDENTS_DATA.map(studentData => {
                    const isReadOnly = currentRole === "PRECEPTOR";
                    const computed = computedFinalGrades[studentData.id];
                    const override = finalGradeOverrides[studentData.id] ?? null;
                    const isManual = !!manualOverrideFlags[studentData.id];
                    // Valor mostrado: override manual si existe, sino calculado
                    const displayFinal = isManual ? override : computed;

                    return (
                      <tr key={studentData.id} className="hover:bg-white/[0.015] transition-colors">
                        {/* Alumno sticky */}
                        <td className="sticky left-0 z-10 bg-[#131319] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff] shrink-0">
                              {studentData.firstName[0]}{studentData.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#e4e1ea] truncate">
                                {studentData.lastName}, {studentData.firstName}
                              </p>
                              <p className="text-xs text-white/40">{studentData.legajo}</p>
                            </div>
                          </div>
                        </td>

                        {/* Celdas de nota por periodo */}
                        {periodColumns.map(col => {
                          const val = periodGrades[studentData.id]?.[col.id] ?? null;
                          return (
                            <td key={col.id} className="px-3 py-3 text-center">
                              {isReadOnly ? (
                                // PRECEPTOR: solo lectura
                                <div className={cn(
                                  "inline-flex items-center justify-center size-9 rounded-lg font-bold text-sm",
                                  val !== null && val >= 7 ? "bg-[#4de082]/15 text-[#4de082]"
                                  : val !== null ? "bg-[#ffb4ab]/15 text-[#ffb4ab]"
                                  : "bg-white/5 text-white/30"
                                )}>
                                  {val !== null ? val : "–"}
                                </div>
                              ) : (
                                // DOCENTE: editable
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  step={0.1}
                                  value={val ?? ""}
                                  onChange={e => {
                                    const n = e.target.value === "" ? null : parseFloat(e.target.value);
                                    setPeriodGrades(prev => ({
                                      ...prev,
                                      [studentData.id]: {
                                        ...prev[studentData.id],
                                        [col.id]: n,
                                      },
                                    }));
                                    // Si hay override manual, recalcular sugerencia
                                    if (manualOverrideFlags[studentData.id]) {
                                      // mantenemos el override — docente lo borrara si quiere
                                    }
                                  }}
                                  className={cn(
                                    "w-16 h-9 text-center text-sm font-medium bg-white/[0.02] border-white/10 mx-auto",
                                    "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20",
                                    val !== null && val >= 7 && "text-[#4de082]",
                                    val !== null && val < 7 && "text-[#ffb4ab]",
                                  )}
                                />
                              )}
                            </td>
                          );
                        })}

                        {/* Columna Calificacion Final */}
                        <td className="px-4 py-3 text-center bg-emerald-500/[0.02]">
                          {isReadOnly ? (
                            // PRECEPTOR: badge de solo lectura
                            <div className={cn(
                              "inline-flex items-center justify-center size-10 rounded-xl font-bold text-lg",
                              displayFinal !== null && displayFinal >= 7
                                ? "bg-[#4de082]/20 text-[#4de082]"
                                : displayFinal !== null
                                ? "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                                : "bg-white/5 text-white/30"
                            )}>
                              {displayFinal !== null ? displayFinal.toFixed(1) : "–"}
                            </div>
                          ) : (
                            // DOCENTE: input editable con indicador de override
                            <div className="flex flex-col items-center gap-1">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  step={0.01}
                                  value={
                                    isManual
                                      ? (override ?? "")
                                      : (computed !== null ? computed : "")
                                  }
                                  onChange={e => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      // Borrar override: volver al calculado
                                      setFinalGradeOverrides(prev => ({ ...prev, [studentData.id]: null }));
                                      setManualOverrideFlags(prev => ({ ...prev, [studentData.id]: false }));
                                    } else {
                                      const n = parseFloat(raw);
                                      const isChanged = n !== computed;
                                      setFinalGradeOverrides(prev => ({ ...prev, [studentData.id]: n }));
                                      setManualOverrideFlags(prev => ({ ...prev, [studentData.id]: isChanged }));
                                    }
                                  }}
                                  title={
                                    isManual
                                      ? `Automatico: ${computed ?? "–"}  |  Ajustado manualmente`
                                      : `Promedio calculado de ${periodColumns.length} periodo(s)`
                                  }
                                  className={cn(
                                    "w-20 h-9 text-center text-sm font-bold bg-white/[0.02] border-white/10",
                                    "focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20",
                                    displayFinal !== null && displayFinal >= 7 && "text-[#4de082]",
                                    displayFinal !== null && displayFinal < 7 && "text-[#ffb4ab]",
                                    isManual && "border-[#d0bcff]/40 bg-[#d0bcff]/5",
                                  )}
                                />
                                {/* Icono de override manual */}
                                {isManual && (
                                  <span
                                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 rounded-full bg-[#d0bcff] text-[#131319]"
                                    title="Nota ajustada manualmente por el docente"
                                  >
                                    <AlertCircle className="size-2.5" />
                                  </span>
                                )}
                              </div>
                              {/* Sugerencia calculada cuando hay override */}
                              {isManual && computed !== null && (
                                <span className="text-[10px] text-white/30 font-mono">
                                  auto: {computed.toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer con leyenda */}
            <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#4de082] inline-block" /> Aprobado ≥{settings.gradingScale.minPassing}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ffb4ab] inline-block" /> Desaprobado
                </span>
                {currentRole === "DOCENTE" && (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="size-3 text-[#d0bcff]" /> Nota ajustada manualmente
                  </span>
                )}
              </div>
              {currentRole === "DOCENTE" && (
                <p className="text-[11px] text-white/30">
                  La Cal. Final se calcula como promedio de periodos. Puedes sobreescribirla.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: TEMAS PENDIENTES */}
        <TabsContent value="pending" className="space-y-6 mt-0">
          {/* Info Alert */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
            <Bell className="size-5 text-[#d0bcff] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#d0bcff]">
                Informacion visible y notificada a la familia del estudiante en tiempo real
              </p>
              <p className="text-xs text-white/50 mt-1">
                Al acreditar un tema, se enviara automaticamente una notificacion a Secretaria Academica y al tutor legal del alumno.
              </p>
            </div>
          </div>

          {/* Pending Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Registros" value={pendingStats.total} />
            <StatCard label="Sin Acreditar" value={pendingStats.pending} color="text-[#ffb4ab]" />
            <StatCard label="Reintentos (+1)" value={pendingStats.multipleAttempts} color="text-[#d0bcff]" />
            <StatCard label="Acreditados" value={pendingStats.cleared} color="text-[#4de082]" />
          </div>

          {/* Pending Students Table */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-sm font-semibold text-[#e4e1ea]">
                Alumnos con Temas Adeudados - {selectedSubject.name}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Alumno</span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Evaluacion Adeudada</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nota Original</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Intento</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Estado</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nota Recuperacion</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Accion</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingTopics.map((topic) => {
                    const isCleared = topic.status === "CLEARED";
                    const isEvaluating = evaluatingId === topic.id;
                    
                    return (
                      <tr 
                        key={topic.id} 
                        className={cn(
                          "transition-colors",
                          isCleared ? "opacity-60 bg-[#4de082]/5" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "size-8 rounded-full flex items-center justify-center text-xs font-bold",
                              isCleared ? "bg-[#4de082]/20 text-[#4de082]" : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
                            )}>
                              {topic.studentName.split(' ')[0][0]}{topic.studentName.split(' ')[1]?.[0] || ''}
                            </div>
                            <div>
                              <p className={cn(
                                "text-sm font-medium",
                                isCleared ? "text-[#4de082] line-through" : "text-[#e4e1ea]"
                              )}>
                                {topic.studentName}
                              </p>
                              <p className="text-xs text-white/40">{topic.studentLegajo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={cn(
                            "text-sm",
                            isCleared ? "text-white/40 line-through" : "text-[#e4e1ea]"
                          )}>
                            {topic.evaluationName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-[#ffb4ab]">{topic.originalGrade}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase",
                            topic.currentAttempt === 1 && "bg-white/10 text-white/60",
                            topic.currentAttempt === 2 && "bg-[#d0bcff]/20 text-[#d0bcff]",
                            topic.currentAttempt >= 3 && "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                          )}>
                            Intento #{topic.currentAttempt}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                            topic.status === "PENDING" && "bg-[#ffb4ab]/20 text-[#ffb4ab]",
                            topic.status === "CLEARED" && "bg-[#4de082]/20 text-[#4de082]"
                          )}>
                            {topic.status === "PENDING" && "Pendiente"}
                            {topic.status === "CLEARED" && "Acreditado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isCleared ? (
                            <span className="text-lg font-bold text-[#4de082]">
                              {topic.clearedGrade}
                            </span>
                          ) : (
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={recoveryGrades[topic.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : parseInt(e.target.value);
                                setRecoveryGrades(prev => ({ ...prev, [topic.id]: val }));
                              }}
                              disabled={isEvaluating}
                              className="w-16 h-9 text-center text-sm font-medium bg-white/[0.02] border-white/10 mx-auto"
                              placeholder="-"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isCleared ? (
                            <div className="flex items-center justify-center gap-1 text-[#4de082]">
                              <CheckCircle2 className="size-4" />
                              <span className="text-xs">
                                {topic.clearedAt?.toLocaleDateString("es-AR")}
                              </span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleEvaluateTopic(topic.id)}
                              disabled={isEvaluating || !recoveryGrades[topic.id]}
                              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 text-xs"
                            >
                              {isEvaluating ? (
                                <>
                                  <Loader2 className="size-3 mr-1 animate-spin" />
                                  Evaluando...
                                </>
                              ) : (
                                "Evaluar Saberes"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Empty state */}
                  {pendingTopics.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="size-10 text-[#4de082]/40" />
                          <p className="text-sm text-white/40">No hay temas pendientes de acreditacion</p>
                          <p className="text-xs text-white/30">
                            Los temas se agregan automaticamente cuando un alumno obtiene nota menor a 7
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Close Period Confirmation Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-[#ffb4ab]/10">
                <AlertTriangle className="size-6 text-[#ffb4ab]" />
              </div>
              <DialogTitle className="text-xl text-[#e4e1ea]">Cerrar Periodo</DialogTitle>
            </div>
            <DialogDescription className="text-white/60">
              Esta accion cerrara el <strong className="text-white/80">{selectedPeriod.name}</strong> para{" "}
              <strong className="text-white/80">{selectedSubject.name}</strong>.
              <br /><br />
              Las calificaciones seran publicadas a las familias y enviadas a Secretaria Academica.{" "}
              <span className="text-[#ffb4ab]">Esta accion no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCloseDialogOpen(false)}
              className="border-white/10 text-white/60"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloseTrimester}
              disabled={isClosing}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isClosing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock className="size-4 mr-2" />
                  Confirmar y Cerrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Valoracion Preliminar Sheet */}
      <Sheet open={isValoracionSheetOpen} onOpenChange={setIsValoracionSheetOpen}>
        <SheetContent className="bg-[#131319] border-l-white/10 w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
                  <FileStack className="size-5 text-[#d0bcff]" />
                  Valoracion Preliminar del Periodo
                </SheetTitle>
                <SheetDescription className="text-white/50 mt-1">
                  {selectedSubject.name} - {selectedPeriod.name}
                </SheetDescription>
              </div>
              <Button
                onClick={handleExportValoracion}
                disabled={isExportingValoracion}
                variant="outline"
                size="sm"
                className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              >
                {isExportingValoracion ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Exportar a Excel
                  </>
                )}
              </Button>
            </div>
          </SheetHeader>

          <div className="py-6 space-y-4">
            {/* Info Alert */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
              <Bell className="size-4 text-[#d0bcff] mt-0.5 shrink-0" />
              <p className="text-xs text-white/60 leading-relaxed">
                La valoracion preliminar (TEA/TEP/TED) se basa en el promedio actual del alumno. 
                Al confirmar, las familias recibiran el boletin parcial.
              </p>
            </div>

            {/* Students Table */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Alumno</span>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Prom. Actual</span>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Valoracion</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => {
                    const currentValoracion = valoracionData[student.studentId] || null;
                    const needsJustification = currentValoracion === "TEP" || currentValoracion === "TED";
                    const currentJustification = valoracionJustificaciones[student.studentId] || "";
                    
                    return (
                      <tr key={student.studentId} className="hover:bg-white/[0.02] transition-colors align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff]">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#e4e1ea]">
                                {student.lastName}, {student.firstName}
                              </p>
                              <p className="text-xs text-white/40">
                                {student.enrollmentNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {gradingType === "NUMERIC" && student.average !== null ? (
                            <span className={cn(
                              "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold",
                              student.average >= 7 
                                ? "bg-[#4de082]/20 text-[#4de082]" 
                                : "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                            )}>
                              {student.average.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-sm text-white/40">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-center gap-2">
                            <Select
                              value={currentValoracion || ""}
                              onValueChange={(val) => {
                                setValoracionData(prev => ({
                                  ...prev,
                                  [student.studentId]: val as "TEA" | "TEP" | "TED"
                                }));
                                // Clear justification if changed to TEA
                                if (val === "TEA") {
                                  setValoracionJustificaciones(prev => {
                                    const updated = { ...prev };
                                    delete updated[student.studentId];
                                    return updated;
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className={cn(
                                "w-24 h-9 text-xs bg-white/[0.02] border-white/10",
                                currentValoracion === "TEA" && "text-[#4de082] border-[#4de082]/30 bg-[#4de082]/10",
                                currentValoracion === "TEP" && "text-[#d0bcff] border-[#d0bcff]/30 bg-[#d0bcff]/10",
                                currentValoracion === "TED" && "text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#ffb4ab]/10",
                              )}>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#131319] border-white/10">
                              <SelectItem value="TEA" className="text-[#4de082]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">TEA</span>
                                  <span className="text-white/40 text-[10px]">Avanzado</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="TEP" className="text-[#d0bcff]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">TEP</span>
                                  <span className="text-white/40 text-[10px]">En Proceso</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="TED" className="text-[#ffb4ab]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">TED</span>
                                  <span className="text-white/40 text-[10px]">Dificultades</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                            </Select>
                            
                            {/* Conditional Textarea for TEP/TED justification */}
                            {needsJustification && (
                              <Textarea
                                value={currentJustification}
                                onChange={(e) => {
                                  setValoracionJustificaciones(prev => ({
                                    ...prev,
                                    [student.studentId]: e.target.value
                                  }));
                                }}
                                placeholder="Justificacion pedagogica breve requerida para valoraciones en proceso/discontinuas..."
                                className={cn(
                                  "w-full min-h-[60px] text-xs bg-white/[0.02] border-white/10 resize-none",
                                  currentValoracion === "TEP" && "border-[#d0bcff]/30 focus:border-[#d0bcff]/50",
                                  currentValoracion === "TED" && "border-[#ffb4ab]/30 focus:border-[#ffb4ab]/50",
                                  !currentJustification.trim() && "border-red-500/30"
                                )}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-3 rounded-lg bg-[#4de082]/10 border border-[#4de082]/20 text-center">
                <p className="text-lg font-bold text-[#4de082]">
                  {Object.values(valoracionData).filter(v => v === "TEA").length}
                </p>
                <p className="text-[10px] text-white/50 uppercase">TEA</p>
              </div>
              <div className="p-3 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-center">
                <p className="text-lg font-bold text-[#d0bcff]">
                  {Object.values(valoracionData).filter(v => v === "TEP").length}
                </p>
                <p className="text-[10px] text-white/50 uppercase">TEP</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-center">
                <p className="text-lg font-bold text-[#ffb4ab]">
                  {Object.values(valoracionData).filter(v => v === "TED").length}
                </p>
                <p className="text-[10px] text-white/50 uppercase">TED</p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-white/5">
            <Button
              onClick={handleSubmitValoracion}
              disabled={isSubmittingValoracion || Object.keys(valoracionData).length === 0}
              className="w-full bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-bold py-5"
            >
              {isSubmittingValoracion ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enviando a Secretaria...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Confirmar y Enviar a Secretaria
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Toaster theme="dark" />
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
  subtext?: string;
}

function StatCard({ label, value, color = "text-[#e4e1ea]", subtext }: StatCardProps) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 backdrop-blur-sm">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold", color)}>{value}</span>
        {subtext && <span className="text-xs text-white/40">{subtext}</span>}
      </div>
    </div>
  );
}
