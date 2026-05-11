// ============================================
// ATTENDANCE MODULE TYPES
// ============================================

export type AttendanceStatus = "PRESENT" | "ABSENT" | "TARDY";

export type LicenseReason = "HEALTH" | "TRAVEL" | "FAMILY" | "OTHER";

export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT";

export interface LicenseMode {
  isActive: boolean;
  reason: string;
  category: LicenseReason;
  startDate: Date;
  endDate?: Date;
  approvedBy: string;
  notifyOnEnd: boolean;
}

export interface StudentAttendance {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  enrollmentNumber: string;
  status: AttendanceStatus;
  licenseMode?: LicenseMode;
  stats: {
    totalAbsences: number;
    totalTardies: number;
  };
}

export interface CourseInfo {
  id: string;
  name: string;
  year: number;
  divisionId: string;
  divisionName: string;
  shift: ShiftType;
  studentCount: number;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  tardy: number;
  onLicense: number;
  total: number;
}

export interface AttendanceSubmission {
  schoolId: string;
  courseId: string;
  divisionId: string;
  date: string;
  periodId: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    absenceValue: number;
    tardyValue: number;
  }[];
  createdBy: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface LicenseFormData {
  studentId: string;
  studentName: string;
  startDate: Date;
  endDate: Date;
  reason: LicenseReason;
  customReason?: string;
  silenceNotifications: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Rounds a number to 2 decimal places to avoid JavaScript floating-point errors.
 * Example: 0.1 + 0.2 = 0.30000000000000004 -> 0.3
 */
export const roundToDecimals = (num: number): number =>
  Math.round(num * 100) / 100;

/**
 * Get the absence value for a given status
 */
export const getAbsenceValue = (status: AttendanceStatus): number => {
  switch (status) {
    case "ABSENT":
      return 1;
    case "TARDY":
      return 0.5;
    case "PRESENT":
    default:
      return 0;
  }
};

/**
 * Get the tardy value for a given status
 */
export const getTardyValue = (status: AttendanceStatus): number => {
  return status === "TARDY" ? 1 : 0;
};

/**
 * Format shift type to Spanish
 */
export const formatShift = (shift: ShiftType): string => {
  const shifts: Record<ShiftType, string> = {
    MORNING: "Turno Mañana",
    AFTERNOON: "Turno Tarde",
    NIGHT: "Turno Noche",
  };
  return shifts[shift];
};

/**
 * Format status to Spanish
 */
export const formatStatus = (status: AttendanceStatus): string => {
  const statuses: Record<AttendanceStatus, string> = {
    PRESENT: "Presente",
    ABSENT: "Ausente",
    TARDY: "Tarde",
  };
  return statuses[status];
};

/**
 * Get the next status in the rotation cycle
 */
export const getNextStatus = (current: AttendanceStatus): AttendanceStatus => {
  const cycle: AttendanceStatus[] = ["PRESENT", "ABSENT", "TARDY"];
  const currentIndex = cycle.indexOf(current);
  return cycle[(currentIndex + 1) % cycle.length];
};
