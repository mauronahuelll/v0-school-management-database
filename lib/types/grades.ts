// ============================================
// GRADES MODULE TYPES
// ============================================

export type AssessmentType =
  | "EXAM"
  | "QUIZ"
  | "HOMEWORK"
  | "PROJECT"
  | "PARTICIPATION"
  | "FINAL";

export type GradeScaleType = "NUMERIC" | "CONCEPTUAL" | "MIXED";

export type PublicationStatus = "DRAFT" | "PUBLISHED";

// ============================================
// GRADE CONFIGURATION
// ============================================

export interface GradeScale {
  type: GradeScaleType;
  minPassing: number;
  maxGrade: number;
  conceptualValues?: string[];
}

export interface AssessmentConfig {
  id: string;
  name: string;
  type: AssessmentType;
  weight: number; // 1.0 = normal, 2.0 = vale doble
  maxValue: number;
  date?: Date;
}

// ============================================
// GRADE DATA
// ============================================

export interface GradeEntry {
  id: string;
  studentId: string;
  assessmentId: string;
  value: number | null;
  conceptual: string | null;
  isPublished: boolean;
  feedback?: string;
  isRecovery: boolean;
  originalGradeId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface StudentGradeRow {
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  enrollmentNumber: string;
  grades: Record<string, GradeEntry | null>; // assessmentId -> grade
  average: number | null;
  isPassing: boolean;
  isComplete: boolean; // All assessments have grades
}

// ============================================
// PERIOD & SUBJECT INFO
// ============================================

export interface PeriodInfo {
  id: string;
  name: string;
  shortName: string; // "T1", "T2", "T3"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  gradeDeadline: Date;
  isPublished: boolean;
}

export interface SubjectInfo {
  id: string;
  name: string;
  shortName: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
  gradeScale: GradeScale;
  hasCustomScale: boolean;
}

export interface CourseGradeInfo {
  courseId: string;
  courseName: string;
  divisionId: string;
  divisionName: string;
  periodId: string;
  periodName: string;
  subject: SubjectInfo;
  assessments: AssessmentConfig[];
  students: StudentGradeRow[];
  publicationStatus: PublicationStatus;
  lastPublishedAt?: Date;
  lastPublishedBy?: string;
}

// ============================================
// FORM DATA
// ============================================

export interface GradeUpdatePayload {
  schoolId: string;
  courseId: string;
  subjectId: string;
  periodId: string;
  studentId: string;
  assessmentId: string;
  value: number | null;
  conceptual: string | null;
  feedback?: string;
  updatedBy: string;
}

export interface BulkPublishPayload {
  schoolId: string;
  courseId: string;
  subjectId: string;
  periodId: string;
  publishedBy: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Rounds a number to 2 decimal places to avoid JavaScript floating-point errors.
 */
export const roundToDecimals = (num: number): number =>
  Math.round(num * 100) / 100;

/**
 * Calculate weighted average of grades
 */
export const calculateWeightedAverage = (
  grades: (GradeEntry | null)[],
  assessments: AssessmentConfig[]
): number | null => {
  const validGrades = grades.filter(
    (g): g is GradeEntry => g !== null && g.value !== null
  );

  if (validGrades.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const grade of validGrades) {
    const assessment = assessments.find((a) => a.id === grade.assessmentId);
    if (assessment && grade.value !== null) {
      weightedSum += grade.value * assessment.weight;
      totalWeight += assessment.weight;
    }
  }

  if (totalWeight === 0) return null;

  return roundToDecimals(weightedSum / totalWeight);
};

/**
 * Check if a grade is passing based on the scale
 */
export const isPassingGrade = (
  value: number | null,
  scale: GradeScale
): boolean => {
  if (value === null) return false;
  return value >= scale.minPassing;
};

/**
 * Format grade for display
 */
export const formatGrade = (
  value: number | null,
  conceptual: string | null,
  scale: GradeScale
): string => {
  if (scale.type === "CONCEPTUAL" && conceptual) {
    return conceptual;
  }
  if (value === null) return "-";
  return value.toFixed(value % 1 === 0 ? 0 : 1);
};

/**
 * Get grade status color class
 */
export const getGradeColorClass = (
  value: number | null,
  scale: GradeScale
): string => {
  if (value === null) return "text-muted-foreground";
  if (value >= scale.minPassing) {
    return "text-status-present-foreground bg-status-present-soft";
  }
  return "text-status-absent-foreground bg-status-absent-soft";
};

// Assessment type labels
export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  EXAM: "Examen",
  QUIZ: "Prueba Corta",
  HOMEWORK: "Tarea",
  PROJECT: "Proyecto",
  PARTICIPATION: "Participacion",
  FINAL: "Final",
};

// Default conceptual values
export const DEFAULT_CONCEPTUAL_VALUES = [
  "Excelente",
  "Muy Bueno",
  "Bueno",
  "Regular",
  "Insuficiente",
];
