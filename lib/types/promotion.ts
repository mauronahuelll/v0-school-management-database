// ============================================
// PROMOTION WIZARD TYPES
// ============================================

import type { CourseLevel, Course, Division } from "./school-context";
import type { StudentStats } from "./student";

export type PromotionStep = 
  | "SOURCE_SELECTION"
  | "STUDENT_AUDIT"
  | "DESTINATION_CONFIG"
  | "EXECUTION";

export type PromotionStatus = 
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

// ============================================
// STUDENT AUDIT DATA
// ============================================

export interface StudentAuditData {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  photoUrl?: string;
  enrollmentNumber: string;
  
  // Current placement
  currentLevel: CourseLevel;
  currentCourseId: string;
  currentCourseName: string;
  currentDivisionId: string;
  currentDivisionName: string;
  
  // Performance summary
  stats: {
    finalAverage: number | null;
    attendanceRate: number;
    totalAbsences: number;
    totalSanctions: number;
    passingSubjects: number;
    totalSubjects: number;
  };
  
  // Promotion eligibility
  isEligible: boolean;
  eligibilityNotes?: string;
  
  // Pedagogical closure note
  closureNote?: string;
  
  // Selection state
  isSelected: boolean;
}

// ============================================
// WIZARD STATE
// ============================================

export interface PromotionWizardState {
  currentStep: PromotionStep;
  
  // Step 1: Source selection
  sourceLevel: CourseLevel | null;
  sourceCourse: Course | null;
  sourceDivision: Division | null;
  
  // Step 2: Student audit
  students: StudentAuditData[];
  selectedStudentIds: string[];
  
  // Step 3: Destination config
  destinationLevel: CourseLevel | null;
  destinationCourse: Course | null;
  destinationDivision: Division | null;
  
  // Step 4: Execution
  status: PromotionStatus;
  processedCount: number;
  totalCount: number;
  errors: string[];
}

// ============================================
// STEP CONFIGURATION
// ============================================

export interface StepConfig {
  id: PromotionStep;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const PROMOTION_STEPS: StepConfig[] = [
  {
    id: "SOURCE_SELECTION",
    label: "Origen",
    shortLabel: "Origen",
    description: "Selecciona el nivel y curso de procedencia",
    icon: "FolderInput",
  },
  {
    id: "STUDENT_AUDIT",
    label: "Auditoria",
    shortLabel: "Auditoria",
    description: "Revisa el desempeno de cada alumno",
    icon: "ClipboardCheck",
  },
  {
    id: "DESTINATION_CONFIG",
    label: "Destino",
    shortLabel: "Destino",
    description: "Configura el nivel y curso de destino",
    icon: "FolderOutput",
  },
  {
    id: "EXECUTION",
    label: "Ejecucion",
    shortLabel: "Ejecutar",
    description: "Confirma y procesa el traspaso masivo",
    icon: "Rocket",
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getStepIndex = (step: PromotionStep): number => {
  return PROMOTION_STEPS.findIndex((s) => s.id === step);
};

export const getNextStep = (current: PromotionStep): PromotionStep | null => {
  const idx = getStepIndex(current);
  if (idx < PROMOTION_STEPS.length - 1) {
    return PROMOTION_STEPS[idx + 1].id;
  }
  return null;
};

export const getPreviousStep = (current: PromotionStep): PromotionStep | null => {
  const idx = getStepIndex(current);
  if (idx > 0) {
    return PROMOTION_STEPS[idx - 1].id;
  }
  return null;
};

export const calculateEligibility = (stats: StudentAuditData["stats"]): {
  isEligible: boolean;
  notes: string;
} => {
  const issues: string[] = [];
  
  if (stats.finalAverage !== null && stats.finalAverage < 6) {
    issues.push(`Promedio insuficiente (${stats.finalAverage.toFixed(1)})`);
  }
  
  if (stats.attendanceRate < 75) {
    issues.push(`Asistencia baja (${stats.attendanceRate.toFixed(0)}%)`);
  }
  
  if (stats.passingSubjects < stats.totalSubjects) {
    const pending = stats.totalSubjects - stats.passingSubjects;
    issues.push(`${pending} materia${pending > 1 ? "s" : ""} pendiente${pending > 1 ? "s" : ""}`);
  }
  
  return {
    isEligible: issues.length === 0,
    notes: issues.length > 0 ? issues.join(" | ") : "Cumple todos los requisitos",
  };
};

export const generatePerformanceSummary = (stats: StudentAuditData["stats"]): string => {
  const avgText = stats.finalAverage !== null 
    ? `Promedio: ${stats.finalAverage.toFixed(1)}` 
    : "Sin calificaciones";
  const attendanceText = `Asistencia: ${stats.attendanceRate.toFixed(0)}%`;
  const subjectsText = `Materias aprobadas: ${stats.passingSubjects}/${stats.totalSubjects}`;
  
  return `${avgText} | ${attendanceText} | ${subjectsText}`;
};

// ============================================
// INITIAL STATE
// ============================================

export const INITIAL_WIZARD_STATE: PromotionWizardState = {
  currentStep: "SOURCE_SELECTION",
  sourceLevel: null,
  sourceCourse: null,
  sourceDivision: null,
  students: [],
  selectedStudentIds: [],
  destinationLevel: null,
  destinationCourse: null,
  destinationDivision: null,
  status: "PENDING",
  processedCount: 0,
  totalCount: 0,
  errors: [],
};
