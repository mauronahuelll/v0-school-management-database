// ============================================
// STUDENT 360 VIEW TYPES
// ============================================

import type { AttendanceStatus } from "./attendance";
import type { AcknowledgmentStatus } from "./behavior";

export type StudentStatus = "ACTIVE" | "LICENSE" | "TRANSFERRED" | "GRADUATED" | "WITHDRAWN";

export type EventType = 
  | "ATTENDANCE_ABSENT" 
  | "ATTENDANCE_TARDY" 
  | "ATTENDANCE_JUSTIFIED"
  | "GRADE_PUBLISHED"
  | "GRADE_RECOVERY"
  | "BEHAVIOR_OBSERVATION"
  | "BEHAVIOR_SANCTION"
  | "BEHAVIOR_MERIT"
  | "LICENSE_START"
  | "LICENSE_END"
  | "ENROLLMENT"
  | "TRANSFER";

// ============================================
// STUDENT PROFILE
// ============================================

export interface StudentProfile {
  id: string;
  schoolId: string;
  
  // Identity
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date;
  gender: "M" | "F" | "X";
  photoUrl?: string;
  
  // Academic
  enrollmentNumber: string;
  courseId: string;
  courseName: string;
  divisionId: string;
  divisionName: string;
  shift: "MORNING" | "AFTERNOON" | "NIGHT";
  academicYear: number;
  
  // Status
  status: StudentStatus;
  enrolledAt: Date;
  
  // License mode if active
  licenseMode?: {
    isActive: boolean;
    reason: string;
    startDate: Date;
    endDate?: Date;
  };
}

// ============================================
// ACADEMIC STATS
// ============================================

export interface StudentStats {
  // Attendance
  attendance: {
    totalAbsences: number;
    totalTardies: number;
    absenceLimit: number;
    absencesByPeriod: Record<string, number>;
    attendanceRate: number; // percentage 0-100
    daysPresent: number;
    totalDays: number;
  };
  
  // Grades
  grades: {
    generalAverage: number | null;
    averagesBySubject: {
      subjectId: string;
      subjectName: string;
      average: number | null;
      isPassing: boolean;
      trend: "UP" | "DOWN" | "STABLE";
    }[];
    passingSubjects: number;
    totalSubjects: number;
  };
  
  // Behavior
  behavior: {
    totalObservations: number;
    positiveObservations: number;
    negativeObservations: number;
    totalSanctions: number;
    pendingAcknowledgments: number;
    lastIncidentDate?: Date;
  };
}

// ============================================
// MEDICAL & CONTACT INFO
// ============================================

export interface MedicalInfo {
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  healthInsurance?: {
    provider: string;
    memberId: string;
  };
  emergencyNotes?: string;
}

export interface TutorContact {
  id: string;
  name: string;
  relationship: "FATHER" | "MOTHER" | "GUARDIAN" | "GRANDPARENT" | "SIBLING" | "OTHER";
  phone: string;
  email?: string;
  isPrimaryContact: boolean;
  isVerified: boolean;
}

// ============================================
// TIMELINE EVENT
// ============================================

export interface TimelineEvent {
  id: string;
  type: EventType;
  date: Date;
  title: string;
  description: string;
  
  // Source reference
  sourceCollection: string;
  sourceDocId: string;
  
  // Visual
  icon: string; // Lucide icon name
  color: "present" | "absent" | "tardy" | "primary" | "warning" | "success" | "muted";
  
  // Additional data based on type
  metadata?: {
    // For attendance
    attendanceStatus?: AttendanceStatus;
    absenceValue?: number;
    isJustified?: boolean;
    
    // For grades
    subjectName?: string;
    gradeValue?: number;
    assessmentName?: string;
    isRecovery?: boolean;
    
    // For behavior
    category?: string;
    severity?: number;
    isPositive?: boolean;
    acknowledgmentStatus?: AcknowledgmentStatus;
    requiresAcknowledgment?: boolean;
  };
}

// ============================================
// COMPLETE STUDENT 360 DATA
// ============================================

export interface Student360Data {
  profile: StudentProfile;
  stats: StudentStats;
  medical: MedicalInfo;
  tutors: TutorContact[];
  timeline: TimelineEvent[];
  
  // Period info
  currentPeriod: {
    id: string;
    name: string;
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getStatusLabel = (status: StudentStatus): string => {
  const labels: Record<StudentStatus, string> = {
    ACTIVE: "Activo",
    LICENSE: "En Licencia",
    TRANSFERRED: "Trasladado",
    GRADUATED: "Egresado",
    WITHDRAWN: "Baja",
  };
  return labels[status];
};

export const getStatusColor = (status: StudentStatus): string => {
  const colors: Record<StudentStatus, string> = {
    ACTIVE: "bg-status-present text-status-present-foreground",
    LICENSE: "bg-status-license text-status-license-foreground",
    TRANSFERRED: "bg-status-tardy text-status-tardy-foreground",
    GRADUATED: "bg-primary text-primary-foreground",
    WITHDRAWN: "bg-status-absent text-status-absent-foreground",
  };
  return colors[status];
};

export const getRelationshipLabel = (relationship: TutorContact["relationship"]): string => {
  const labels: Record<TutorContact["relationship"], string> = {
    FATHER: "Padre",
    MOTHER: "Madre",
    GUARDIAN: "Tutor Legal",
    GRANDPARENT: "Abuelo/a",
    SIBLING: "Hermano/a",
    OTHER: "Otro",
  };
  return labels[relationship];
};

export const getEventTypeLabel = (type: EventType): string => {
  const labels: Record<EventType, string> = {
    ATTENDANCE_ABSENT: "Inasistencia",
    ATTENDANCE_TARDY: "Llegada Tarde",
    ATTENDANCE_JUSTIFIED: "Falta Justificada",
    GRADE_PUBLISHED: "Nota Publicada",
    GRADE_RECOVERY: "Recuperatorio",
    BEHAVIOR_OBSERVATION: "Observacion",
    BEHAVIOR_SANCTION: "Sancion",
    BEHAVIOR_MERIT: "Merito",
    LICENSE_START: "Inicio de Licencia",
    LICENSE_END: "Fin de Licencia",
    ENROLLMENT: "Inscripcion",
    TRANSFER: "Pase",
  };
  return labels[type];
};
