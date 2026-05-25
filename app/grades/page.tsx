"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { GradesGrid } from "@/components/grades";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  BookOpen, Lock, AlertTriangle, Calculator, Hash, FileText, Loader2, Sliders, 
  Plus, Trash2, Pencil, X, Check, Grid3X3, ClipboardSignature, CheckCircle2,
  Bell, User
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

const MOCK_PERIODS = [
  { id: "T1", name: "Primer Trimestre" },
  { id: "T2", name: "Segundo Trimestre" },
  { id: "T3", name: "Tercer Trimestre" },
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
  const [activeTab, setActiveTab] = useState("regular");
  
  // Get school settings from context
  const { settings } = useSchoolSettings();
  const schoolGradingType = settings.gradingScale.type;
  
  // Selection states
  const [selectedSubjectId, setSelectedSubjectId] = useState(MOCK_SUBJECTS[0].id);
  const [selectedPeriodId, setSelectedPeriodId] = useState(MOCK_PERIODS[0].id);
  
  // DYNAMIC COLUMNS STATE
  const [numericAssessments, setNumericAssessments] = useState<AssessmentConfig[]>(INITIAL_ASSESSMENTS_NUMERIC);
  const [conceptualAssessments, setConceptualAssessments] = useState<AssessmentConfig[]>(INITIAL_ASSESSMENTS_CONCEPTUAL);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  
  // PENDING TOPICS STATE (Derived State Architecture)
  const [pendingTopics, setPendingTopics] = useState<PendingTopic[]>(INITIAL_PENDING_TOPICS);
  const [recoveryGrades, setRecoveryGrades] = useState<Record<string, number | null>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
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

  const selectedPeriod = MOCK_PERIODS.find((p) => p.id === selectedPeriodId)!;

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

  if (!mounted) return null;

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
              {MOCK_PERIODS.map((period) => (
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
        </div>
      </header>

      {/* TABS SYSTEM */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1">
          <TabsTrigger 
            value="regular" 
            className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] gap-2"
          >
            <Grid3X3 className="size-4" />
            Cursada Regular
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] gap-2"
          >
            <ClipboardSignature className="size-4" />
            Acreditacion de Temas Pendientes
            {pendingStats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold">
                {pendingStats.pending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

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

        {/* TAB 2: TEMAS PENDIENTES */}
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
