// ============================================
// INSTITUTIONAL DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  // Today's attendance
  attendance: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    tardyToday: number;
    onLicense: number;
    presenceRate: number; // percentage 0-100
  };

  // Behavior/Sanctions
  behavior: {
    totalSanctionsThisMonth: number;
    pendingSignatures: number;
    signedSanctions: number;
    signatureRate: number; // percentage 0-100
    disputedSanctions: number;
  };

  // Academic
  academic: {
    averageGrade: number;
    passingRate: number; // percentage 0-100
    gradesPublished: number;
    gradesPending: number;
  };

  // Transfers (Pasaporte Educativo)
  transfers: {
    incomingPending: number;
    outgoingPending: number;
    completedThisMonth: number;
  };

  // System health
  system: {
    status: "OPERATIONAL" | "DEGRADED" | "MAINTENANCE";
    lastSync: Date;
    pendingTasks: number;
    storageUsed: number; // percentage
  };
}

// ============================================
// COURSE ATTENDANCE SUMMARY
// ============================================

export interface CourseAttendanceSummary {
  courseId: string;
  courseName: string;
  divisionId: string;
  divisionName: string;
  shift: "MORNING" | "AFTERNOON" | "NIGHT";
  
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  licenseCount: number;
  
  presenceRate: number;
  hasAlerts: boolean; // true if absentCount > threshold
}

// ============================================
// ATTENDANCE TREND DATA
// ============================================

export interface AttendanceTrendPoint {
  date: string;
  dateLabel: string; // "Lun 15"
  present: number;
  absent: number;
  tardy: number;
  total: number;
  presenceRate: number;
}

// ============================================
// SIGNATURE STATUS
// ============================================

export interface SignatureStatus {
  sanctionId: string;
  studentName: string;
  courseName: string;
  category: string;
  severity: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
  status: "PENDING" | "ACKNOWLEDGED" | "DISPUTED";
  daysWaiting: number;
  tutorName?: string;
  acknowledgedAt?: Date;
}

// ============================================
// TRANSFER ALERT
// ============================================

export interface TransferAlert {
  id: string;
  type: "INCOMING" | "OUTGOING";
  studentName: string;
  studentDni: string;
  fromSchool?: string;
  toSchool?: string;
  requestDate: Date;
  status: "PENDING_DOCS" | "PENDING_APPROVAL" | "IN_TRANSIT" | "COMPLETED";
  daysInProcess: number;
}

// ============================================
// SYSTEM TASK
// ============================================

export interface SystemTask {
  id: string;
  name: string;
  type: "BACKUP" | "SYNC" | "CLEANUP" | "NOTIFICATION" | "REPORT";
  status: "RUNNING" | "COMPLETED" | "FAILED" | "SCHEDULED";
  startedAt?: Date;
  completedAt?: Date;
  scheduledFor?: Date;
  progress?: number;
  error?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getShiftLabel = (shift: CourseAttendanceSummary["shift"]): string => {
  const labels = {
    MORNING: "Manana",
    AFTERNOON: "Tarde",
    NIGHT: "Noche",
  };
  return labels[shift];
};

export const getSystemStatusLabel = (status: DashboardStats["system"]["status"]): string => {
  const labels = {
    OPERATIONAL: "Operativo",
    DEGRADED: "Degradado",
    MAINTENANCE: "Mantenimiento",
  };
  return labels[status];
};

export const getSystemStatusColor = (status: DashboardStats["system"]["status"]): string => {
  const colors = {
    OPERATIONAL: "bg-status-present text-status-present-foreground",
    DEGRADED: "bg-status-tardy text-status-tardy-foreground",
    MAINTENANCE: "bg-status-license text-status-license-foreground",
  };
  return colors[status];
};

export const getTransferStatusLabel = (status: TransferAlert["status"]): string => {
  const labels = {
    PENDING_DOCS: "Esperando Documentacion",
    PENDING_APPROVAL: "Pendiente de Aprobacion",
    IN_TRANSIT: "En Proceso",
    COMPLETED: "Completado",
  };
  return labels[status];
};

export const getSeverityLabel = (severity: number): string => {
  const labels: Record<number, string> = {
    1: "Leve",
    2: "Moderada",
    3: "Media",
    4: "Grave",
    5: "Muy Grave",
  };
  return labels[severity] || "Desconocida";
};
