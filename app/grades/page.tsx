"use client";

import { useState, useCallback, useEffect } from "react";
import { GradesGrid } from "@/components/grades";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
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
  minPassing: 6,
  maxGrade: 10,
};

const MOCK_ASSESSMENTS: AssessmentConfig[] = [
  { id: "eval-1", name: "Parcial 1", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-2", name: "TP 1", type: "HOMEWORK", weight: 1, maxValue: 10 },
  { id: "eval-3", name: "Parcial 2", type: "EXAM", weight: 1, maxValue: 10 },
  { id: "eval-4", name: "TP 2", type: "PROJECT", weight: 1, maxValue: 10 },
  { id: "eval-5", name: "Integradora", type: "FINAL", weight: 1, maxValue: 10 },
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
  { id: "s1", firstName: "Sofia", lastName: "Alvarez", photo: null, legajo: "2024-001", grades: [8, 7, 9, 8, 7] },
  { id: "s2", firstName: "Mateo", lastName: "Benitez", photo: null, legajo: "2024-002", grades: [6, 8, 5, 7, 6] },
  { id: "s3", firstName: "Valentina", lastName: "Castro", photo: null, legajo: "2024-003", grades: [10, 9, 10, 10, 9] },
  { id: "s4", firstName: "Lucas", lastName: "Diaz", photo: null, legajo: "2024-004", grades: [4, 5, 4, 6, null] },
  { id: "s5", firstName: "Martina", lastName: "Fernandez", photo: null, legajo: "2024-005", grades: [7, 8, 7, 8, 7] },
  { id: "s6", firstName: "Benjamin", lastName: "Garcia", photo: null, legajo: "2024-006", grades: [6, 6, 7, 5, 6] },
  { id: "s7", firstName: "Emma", lastName: "Hernandez", photo: null, legajo: "2024-007", grades: [9, 9, 8, 9, 9] },
  { id: "s8", firstName: "Joaquin", lastName: "Lopez", photo: null, legajo: "2024-008", grades: [5, 4, 5, 5, null] },
  { id: "s9", firstName: "Isabella", lastName: "Martinez", photo: null, legajo: "2024-009", grades: [7, 7, 8, 7, 7] },
  { id: "s10", firstName: "Thiago", lastName: "Nunez", photo: null, legajo: "2024-010", grades: [8, 8, 8, 9, 8] },
  { id: "s11", firstName: "Mia", lastName: "Ortiz", photo: null, legajo: "2024-011", grades: [6, 7, 6, 7, 6] },
  { id: "s12", firstName: "Santiago", lastName: "Perez", photo: null, legajo: "2024-012", grades: [3, 4, 3, 5, null] },
  { id: "s13", firstName: "Olivia", lastName: "Quiroga", photo: null, legajo: "2024-013", grades: [9, 10, 9, 9, 10] },
  { id: "s14", firstName: "Tomas", lastName: "Rodriguez", photo: null, legajo: "2024-014", grades: [7, 6, 7, 7, 7] },
  { id: "s15", firstName: "Camila", lastName: "Sanchez", photo: null, legajo: "2024-015", grades: [8, 9, 8, 8, 8] },
];

const createMockStudentRow = (
  data: typeof MOCK_STUDENTS_DATA[0]
): StudentGradeRow => {
  const grades: Record<string, GradeEntry | null> = {};
  
  MOCK_ASSESSMENTS.forEach((assessment, index) => {
    const value = data.grades[index];
    grades[assessment.id] = value !== null ? generateMockGrade(data.id, assessment.id, value) : null;
  });

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

const INITIAL_STUDENTS: StudentGradeRow[] = MOCK_STUDENTS_DATA.map(createMockStudentRow);

// ============================================
// PAGE COMPONENT
// ============================================

export default function GradesPage() {
  // Hydration guard
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<StudentGradeRow[]>(INITIAL_STUDENTS);
  const [publicationStatus, setPublicationStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [lastPublishedAt, setLastPublishedAt] = useState<Date | undefined>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const courseInfo: CourseGradeInfo = {
    courseId: "course-1",
    courseName: "4to Ano",
    divisionId: "div-b",
    divisionName: "B",
    periodId: "T1",
    periodName: "Primer Trimestre",
    subject: {
      id: "math-1",
      name: "Matematica",
      shortName: "MAT",
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

  // Handle grade update
  const handleGradeUpdate = useCallback(
    async (studentId: string, assessmentId: string, value: number | null) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      setStudents((prev) =>
        prev.map((student) => {
          if (student.studentId !== studentId) return student;

          const newGrades = { ...student.grades };
          
          if (value === null) {
            newGrades[assessmentId] = null;
          } else {
            newGrades[assessmentId] = {
              id: `${studentId}-${assessmentId}`,
              studentId,
              assessmentId,
              value: roundToDecimals(value),
              conceptual: null,
              isPublished: publicationStatus === "PUBLISHED",
              isRecovery: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: "teacher-1",
            };
          }

          const gradeEntries = Object.values(newGrades);
          const average = calculateSimpleAverage(gradeEntries);

          return {
            ...student,
            grades: newGrades,
            average,
            isPassing: average !== null && isPassingGrade(average, MOCK_SCALE),
            isComplete: gradeEntries.every((g) => g !== null && g.value !== null),
          };
        })
      );
    },
    [publicationStatus]
  );

  // Handle publish
  const handlePublish = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setPublicationStatus("PUBLISHED");
    setLastPublishedAt(new Date());

    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        grades: Object.fromEntries(
          Object.entries(student.grades).map(([key, grade]) => [
            key,
            grade ? { ...grade, isPublished: true } : null,
          ])
        ),
      }))
    );

    toast.success("Notas publicadas", {
      description: "Los tutores han sido notificados y pueden ver las notas.",
    });
  }, []);

  // Handle unpublish
  const handleUnpublish = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    setPublicationStatus("DRAFT");

    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        grades: Object.fromEntries(
          Object.entries(student.grades).map(([key, grade]) => [
            key,
            grade ? { ...grade, isPublished: false } : null,
          ])
        ),
      }))
    );

    toast.info("Notas despublicadas", {
      description: "Las notas ya no son visibles para los tutores.",
    });
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de notas y promedios del periodo activo
        </p>
      </header>

      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-md">
        <GradesGrid
          courseInfo={courseInfo}
          onGradeUpdate={handleGradeUpdate}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          canPublish={true}
          isReadOnly={false}
        />
      </div>
      <Toaster position="bottom-center" theme="dark" />
    </div>
  );
}
