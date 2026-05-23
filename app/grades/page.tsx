"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { GradesGrid } from "@/components/grades";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { BookOpen, Lock, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CourseGradeInfo,
  StudentGradeRow,
  GradeEntry,
  AssessmentConfig,
  GradeScale,
} from "@/lib/types/grades";
import { calculateSimpleAverage, isPassingGrade, roundToDecimals } from "@/lib/types/grades";

// ============================================
// MOCK DATA FOR DEMO
// ============================================

const MOCK_SCALE: GradeScale = {
  type: "NUMERIC",
  minPassing: 7,
  maxGrade: 10,
};

const MOCK_SUBJECTS = [
  { id: "math-1", name: "Matematica", shortName: "MAT" },
  { id: "psico-1", name: "Psicologia del Deporte", shortName: "PSI" },
  { id: "lit-1", name: "Literatura", shortName: "LIT" },
  { id: "hist-1", name: "Historia", shortName: "HIS" },
];

const MOCK_PERIODS = [
  { id: "T1", name: "1er Trimestre" },
  { id: "T2", name: "2do Trimestre" },
  { id: "T3", name: "3er Trimestre" },
];

const MOCK_ASSESSMENTS: AssessmentConfig[] = [
  { id: "eval-1", name: "Parcial 1", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-2", name: "TP 1", type: "HOMEWORK", weight: 1, maxValue: 10 },
  { id: "eval-3", name: "Parcial 2", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-4", name: "TP 2", type: "PROJECT", weight: 1, maxValue: 10 },
];

const generateMockGrade = (
  studentId: string,
  assessmentId: string,
  value: number | null
): GradeEntry => ({
  id: `${studentId}-${assessmentId}`,
  studentId,
  assessmentId,
  value,
  conceptual: null,
  isPublished: false,
  isRecovery: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "teacher-1",
});

const MOCK_STUDENTS_DATA = [
  { id: "s1", firstName: "Sofia", lastName: "Alvarez", photo: null, legajo: "2024-001", grades: [8, 7, 9, 8] },
  { id: "s2", firstName: "Mateo", lastName: "Benitez", photo: null, legajo: "2024-002", grades: [6, 8, 5, 7] },
  { id: "s3", firstName: "Valentina", lastName: "Castro", photo: null, legajo: "2024-003", grades: [10, 9, 10, 10] },
  { id: "s4", firstName: "Lucas", lastName: "Diaz", photo: null, legajo: "2024-004", grades: [4, 5, 4, 6] },
  { id: "s5", firstName: "Martina", lastName: "Fernandez", photo: null, legajo: "2024-005", grades: [7, 8, 7, 8] },
  { id: "s6", firstName: "Benjamin", lastName: "Garcia", photo: null, legajo: "2024-006", grades: [6, 6, 7, 5] },
  { id: "s7", firstName: "Emma", lastName: "Hernandez", photo: null, legajo: "2024-007", grades: [9, 9, 8, 9] },
  { id: "s8", firstName: "Joaquin", lastName: "Lopez", photo: null, legajo: "2024-008", grades: [5, 4, 5, 5] },
  { id: "s9", firstName: "Isabella", lastName: "Martinez", photo: null, legajo: "2024-009", grades: [7, 7, 8, 7] },
  { id: "s10", firstName: "Thiago", lastName: "Nunez", photo: null, legajo: "2024-010", grades: [8, 8, 8, 9] },
  { id: "s11", firstName: "Mia", lastName: "Ortiz", photo: null, legajo: "2024-011", grades: [6, 7, 6, 7] },
  { id: "s12", firstName: "Santiago", lastName: "Perez", photo: null, legajo: "2024-012", grades: [3, 4, 3, 5] },
];

const createMockStudentRow = (
  data: typeof MOCK_STUDENTS_DATA[0],
  grades: Record<string, GradeEntry | null>
): StudentGradeRow => {
  const gradeEntries = Object.values(grades);
  const average = calculateSimpleAverage(gradeEntries);

  return {
    studentId: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    photoUrl: data.photo ?? undefined,
    enrollmentNumber: data.legajo,
    grades,
    average,
    isPassing: average !== null && isPassingGrade(average, MOCK_SCALE),
    isComplete: gradeEntries.every((g) => g !== null && g.value !== null),
  };
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function GradesPage() {
  // Hydration guard
  const [mounted, setMounted] = useState(false);
  
  // Selection states
  const [selectedSubjectId, setSelectedSubjectId] = useState(MOCK_SUBJECTS[0].id);
  const [selectedPeriodId, setSelectedPeriodId] = useState(MOCK_PERIODS[0].id);
  
  // Grades data with real-time calculation
  const [gradesData, setGradesData] = useState<Record<string, Record<string, number | null>>>(() => {
    const data: Record<string, Record<string, number | null>> = {};
    MOCK_STUDENTS_DATA.forEach((student, studentIndex) => {
      data[student.id] = {};
      MOCK_ASSESSMENTS.forEach((assessment, assessmentIndex) => {
        data[student.id][assessment.id] = student.grades[assessmentIndex] ?? null;
      });
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

  // Calculate students with real-time averages
  const students: StudentGradeRow[] = useMemo(() => {
    return MOCK_STUDENTS_DATA.map((studentData) => {
      const studentGrades: Record<string, GradeEntry | null> = {};
      
      MOCK_ASSESSMENTS.forEach((assessment) => {
        const value = gradesData[studentData.id]?.[assessment.id] ?? null;
        studentGrades[assessment.id] = value !== null 
          ? generateMockGrade(studentData.id, assessment.id, value)
          : null;
      });

      return createMockStudentRow(studentData, studentGrades);
    });
  }, [gradesData]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const passing = students.filter((s) => s.isPassing).length;
    const failing = students.filter((s) => s.average !== null && !s.isPassing).length;
    const averageGeneral = students.reduce((acc, s) => acc + (s.average || 0), 0) / total;
    return { total, passing, failing, averageGeneral: roundToDecimals(averageGeneral) };
  }, [students]);

  const selectedSubject = MOCK_SUBJECTS.find((s) => s.id === selectedSubjectId)!;
  const selectedPeriod = MOCK_PERIODS.find((p) => p.id === selectedPeriodId)!;

  const courseInfo: CourseGradeInfo = {
    courseId: "course-1",
    courseName: "4to Ano",
    divisionId: "div-b",
    divisionName: "B",
    periodId: selectedPeriodId,
    periodName: selectedPeriod.name,
    subject: {
      id: selectedSubjectId,
      name: selectedSubject.name,
      shortName: selectedSubject.shortName,
      teacherId: "teacher-1",
      teacherName: "Prof. Maria Gonzalez",
      weeklyHours: 5,
      gradeScale: MOCK_SCALE,
      hasCustomScale: false,
    },
    assessments: MOCK_ASSESSMENTS,
    students,
    publicationStatus,
    lastPublishedAt,
    lastPublishedBy: lastPublishedAt ? "Prof. Maria Gonzalez" : undefined,
  };

  // Handle grade update with real-time average recalculation
  const handleGradeUpdate = useCallback(
    async (studentId: string, assessmentId: string, value: number | null) => {
      if (isTrimesterClosed) {
        toast.error("El trimestre esta cerrado. No se pueden modificar las notas.");
        return;
      }

      // Validate numeric input (1-10)
      if (value !== null && (value < 1 || value > 10)) {
        toast.error("La nota debe estar entre 1 y 10");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      setGradesData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [assessmentId]: value !== null ? roundToDecimals(value) : null,
        },
      }));
    },
    [isTrimesterClosed]
  );

  // Handle publish
  const handlePublish = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setPublicationStatus("PUBLISHED");
    setLastPublishedAt(new Date());

    toast.success("Notas publicadas", {
      description: "Los tutores han sido notificados y pueden ver las notas.",
    });
  }, []);

  // Handle unpublish
  const handleUnpublish = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPublicationStatus("DRAFT");

    toast.info("Notas despublicadas", {
      description: "Las notas ya no son visibles para los tutores.",
    });
  }, []);

  // Handle close trimester
  const handleCloseTrimester = useCallback(async () => {
    setIsClosing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsTrimesterClosed(true);
    setPublicationStatus("PUBLISHED");
    setLastPublishedAt(new Date());
    setIsCloseDialogOpen(false);
    setIsClosing(false);

    toast.success("Trimestre cerrado exitosamente", {
      description: "Las notas fueron enviadas a Secretaria Academica y ya no pueden ser modificadas.",
    });
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion de notas y promedios del periodo activo
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Selector */}
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={isTrimesterClosed}>
            <SelectTrigger className="w-[200px] bg-white/[0.02] border-white/10">
              <BookOpen className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Seleccionar materia" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              {MOCK_SUBJECTS.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Selector */}
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId} disabled={isTrimesterClosed}>
            <SelectTrigger className="w-[160px] bg-white/[0.02] border-white/10">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              {MOCK_PERIODS.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Close Trimester Button */}
          {!isTrimesterClosed ? (
            <Button
              variant="outline"
              onClick={() => setIsCloseDialogOpen(true)}
              className="bg-white/[0.02] border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <Lock className="size-4" />
              <span>Cerrar Trimestre</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Lock className="size-4" />
              <span className="font-medium">Trimestre Cerrado</span>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Alumnos" value={stats.total} />
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
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 backdrop-blur-md">
        <GradesGrid
          courseInfo={courseInfo}
          onGradeUpdate={handleGradeUpdate}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          canPublish={!isTrimesterClosed}
          isReadOnly={isTrimesterClosed}
        />
      </div>

      {/* Close Trimester Confirmation Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">Cerrar Trimestre</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground leading-relaxed">
              Esta accion enviara las notas a Secretaria Academica para su archivo oficial.
              <span className="block mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                Las notas ya no podran ser editadas despues de esta accion.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)} disabled={isClosing}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCloseTrimester}
              disabled={isClosing}
            >
              {isClosing ? (
                <>
                  <span className="animate-spin mr-2">...</span>
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  Confirmar Cierre
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-center" theme="dark" />
    </div>
  );
}

// ============================================
// STAT CARD SUB-COMPONENT
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  subtext?: string;
}

function StatCard({ label, value, color = "text-foreground", subtext }: StatCardProps) {
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
      </div>
    </div>
  );
}
