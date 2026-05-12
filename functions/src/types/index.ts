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

export interface TransferRecord {
  fromLevel: CourseLevel;
  fromCourseId: string;
  fromCourseName: string;
  fromDivisionId: string;
  fromDivisionName: string;
  academicYear: number;
  transferDate: Timestamp;
  transferredBy: string;
  
  // Immutable performance snapshot at time of transfer
  performanceSnapshot: {
    finalAverage: number | null;
    totalAbsences: number;
    attendanceRate: number;
    totalSanctions: number;
    passingSubjects: number;
    totalSubjects: number;
    gradesBySubject: Record<string, number>;
  };
  
  // Pedagogical closure
  closureNote?: string;
  closureNoteBy?: string;
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
    level: CourseLevel; // NEW: Current education level
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
  
  // Level transfer history (immutable records)
  previousLevels?: TransferRecord[];
  
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

export type CourseLevel = "PRIMARY" | "SECONDARY" | "TERTIARY";

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
      assignedLevels?: CourseLevel[]; // NEW: Level-based access control
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
// BEHAVIOR & DIGITAL SIGNATURE TYPES
// ============================================

export type BehaviorType = "OBSERVATION" | "SANCTION";
export type AcknowledgmentStatus = "PENDING" | "ACKNOWLEDGED" | "DISPUTED";

/**
 * Verification metadata captured at the moment of digital signature.
 * This provides legal validity to the acknowledgment process.
 */
export interface VerificationMetadata {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  deviceType: "MOBILE" | "TABLET" | "DESKTOP";
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  appVersion: string;
  platform: "IOS" | "ANDROID" | "WEB";
}

/**
 * Digital signature acknowledgment for sanctions.
 * Implements a tamper-proof system using SHA-256 hashing.
 */
export interface SanctionAcknowledgment {
  status: AcknowledgmentStatus;
  
  // Tutor information
  tutorId: string;
  tutorName: string;
  tutorDni: string;
  
  // Timestamps (server-generated, not client)
  acknowledgedAt?: Timestamp;
  disputedAt?: Timestamp;
  
  // Digital signature data
  documentHash: string; // SHA-256 hash of: description + studentId + date + severity
  hashGeneratedAt: Timestamp;
  
  // Legal verification metadata
  verificationMetadata?: VerificationMetadata;
  
  // Dispute handling
  disputeReason?: string;
  disputeResolution?: {
    resolvedBy: string;
    resolvedAt: Timestamp;
    resolution: string;
    finalStatus: "UPHELD" | "MODIFIED" | "DISMISSED";
  };
  
  // Consent tracking
  legalNoticeVersion: string; // "v1.0" - version of legal text shown
  consentText: string; // The exact legal text the user accepted
}

export interface SanctionData {
  sanctionTypeId: string;
  sanctionTypeName: string;
  severity: 1 | 2 | 3 | 4 | 5;
  affectsRecord: boolean;
  
  requiresAcknowledgment: boolean;
  acknowledgment?: SanctionAcknowledgment;
  
  notificationSentAt?: Timestamp;
  remindersSent: number;
  nextReminderAt?: Timestamp;
}

export interface BehaviorRecord {
  id: string;
  schoolId: string;
  
  // References
  studentId: string;
  courseId: string;
  divisionId: string;
  
  // Denormalized data
  studentName: string;
  courseName: string;
  
  // Record type and content
  type: BehaviorType;
  date: Timestamp;
  dateString: string;
  category: string;
  description: string;
  isPositive: boolean;
  
  // Sanction-specific data
  sanction?: SanctionData;
  
  // Evidence
  attachments?: {
    type: "IMAGE" | "DOCUMENT" | "AUDIO";
    url: string;
    name: string;
  }[];
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Timestamp;
  followUpNotes?: string;
  resolved: boolean;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  
  // Visibility
  visibleToTutor: boolean;
  
  // Audit
  periodId: string;
  academicYear: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  createdByRole: string;
  
  // Integrity protection (set when sanction is acknowledged)
  contentLocked: boolean;
  contentLockedAt?: Timestamp;
  originalContentHash?: string;
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
