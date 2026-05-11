import { Timestamp } from "firebase-admin/firestore";

// ============================================
// ATTENDANCE TYPES
// ============================================

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "TARDY"
  | "JUSTIFIED"
  | "LICENSE";

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  courseId: string;
  divisionId: string;
  studentName: string;
  courseName: string;
  date: Timestamp;
  dateString: string;
  status: AttendanceStatus;
  absenceValue: number;
  tardyValue: number;
  justification?: {
    reason: string;
    category: "MEDICAL" | "FAMILY" | "LEGAL" | "OTHER";
    documentUrl?: string;
    approvedBy?: string;
    approvedAt?: Timestamp;
  };
  isUnderLicense: boolean;
  notificationSent: boolean;
  notificationSentAt?: Timestamp;
  periodId: string;
  academicYear: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  modifiedBy?: string;
}

// ============================================
// STUDENT TYPES
// ============================================

export interface StudentStats {
  totalAbsences: number;
  totalTardies: number;
  absencesByPeriod: Record<string, number>;
  averageGrade?: number;
  behaviorIncidents: number;
  unacknowledgedSanctions: number;
}

export interface LicenseMode {
  isActive: boolean;
  reason: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  approvedBy: string;
  notifyOnEnd: boolean;
}

export interface Student {
  id: string;
  schoolId: string;
  identity: {
    dni: string;
    firstName: string;
    lastName: string;
    birthDate: Timestamp;
    gender: "M" | "F" | "X";
    nationality: string;
    photoUrl?: string;
  };
  academic: {
    enrollmentNumber: string;
    currentCourseId: string;
    currentDivisionId: string;
    currentCourseName: string;
    currentDivisionName: string;
    currentYear: number;
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
  };
  status: "ACTIVE" | "LICENSE" | "TRANSFERRED" | "GRADUATED" | "WITHDRAWN";
  licenseMode?: LicenseMode;
  stats: StudentStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// USER & NOTIFICATION TYPES
// ============================================

export interface UserNotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  fcmTokens: string[];
  preferences: {
    attendance: boolean;
    grades: boolean;
    behavior: boolean;
    announcements: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    dni: string;
    avatarUrl?: string;
  };
  schoolRoles: Record<
    string,
    {
      role: "SUPER_ADMIN" | "ADMIN" | "PRECEPTOR" | "TEACHER" | "TUTOR";
      status: "ACTIVE" | "INVITED" | "SUSPENDED";
      permissions: string[];
      assignedCourses?: string[];
      assignedDivisions?: string[];
      joinedAt: Timestamp;
    }
  >;
  notifications: UserNotificationPreferences;
  linkedStudents?: Record<
    string,
    {
      schoolId: string;
      studentName: string;
      relationship: string;
      courseName: string;
    }
  >;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// TUTOR RELATION TYPES
// ============================================

export interface TutorStudentRelation {
  id: string;
  schoolId: string;
  tutorId: string;
  studentId: string;
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  studentName: string;
  studentDni: string;
  courseName: string;
  relationship:
    | "FATHER"
    | "MOTHER"
    | "GUARDIAN"
    | "GRANDPARENT"
    | "SIBLING"
    | "OTHER";
  relationshipDetail?: string;
  isPrimaryContact: boolean;
  canPickUp: boolean;
  canReceiveGrades: boolean;
  canReceiveBehavior: boolean;
  canAuthorizeTrips: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// NOTIFICATION LOG TYPES
// ============================================

export type NotificationType =
  | "ATTENDANCE"
  | "GRADE"
  | "BEHAVIOR"
  | "ANNOUNCEMENT"
  | "SANCTION_ACK"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationLog {
  id: string;
  schoolId: string;
  recipientId: string;
  recipientType: "TUTOR" | "TEACHER" | "PRECEPTOR" | "ADMIN";
  studentId?: string;
  studentName?: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sourceCollection: string;
  sourceDocId: string;
  channels: {
    push: { sent: boolean; sentAt?: Timestamp; error?: string };
    email: { sent: boolean; sentAt?: Timestamp; error?: string };
    inApp: { sent: boolean; read: boolean; readAt?: Timestamp };
  };
  priority: NotificationPriority;
  createdAt: Timestamp;
}

// ============================================
// IDEMPOTENCY TYPES
// ============================================

export interface ProcessedEvent {
  eventId: string;
  processedAt: Timestamp;
  functionName: string;
  result: "SUCCESS" | "ERROR";
  errorMessage?: string;
}
