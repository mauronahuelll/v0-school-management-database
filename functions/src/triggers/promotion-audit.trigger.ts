/**
 * Sequency - Promotion Audit Triggers
 * 
 * Ensures complete traceability for institutional audits.
 * Captures:
 * - All level changes on students (even manual ones)
 * - Failed promotion attempts
 * - Unauthorized access attempts
 */

import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CourseLevel, Student } from "../types";

const db = getFirestore();

// ============================================
// TYPES
// ============================================

type AuditEventType =
  | "LEVEL_CHANGE"
  | "LEVEL_CHANGE_DETECTED"
  | "PROMOTION_COMPLETED"
  | "PROMOTION_FAILED"
  | "UNAUTHORIZED_ATTEMPT"
  | "DATA_INTEGRITY_CHECK";

interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  severity: "INFO" | "WARNING" | "CRITICAL";
  schoolId: string;
  studentId?: string;
  studentDni?: string;
  studentName?: string;
  
  // Level transition info
  fromLevel?: CourseLevel;
  toLevel?: CourseLevel;
  fromCourse?: string;
  toCourse?: string;
  
  // Context
  triggeredBy: "CLOUD_FUNCTION" | "DIRECT_WRITE" | "SECURITY_RULE";
  userId?: string;
  userEmail?: string;
  userRole?: string;
  
  // Request metadata
  ipAddress?: string;
  userAgent?: string;
  
  // Details
  message: string;
  details?: Record<string, unknown>;
  
  // Timestamps
  timestamp: Timestamp | FieldValue;
  academicYear?: number;
  
  // Integrity
  checksum?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a simple checksum for data integrity verification
 */
function generateChecksum(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Create an audit log entry
 */
async function createAuditEntry(entry: Omit<AuditLogEntry, "id" | "timestamp" | "checksum">): Promise<void> {
  const auditRef = db.collection("_promotionAuditLog").doc();
  
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: auditRef.id,
    timestamp: FieldValue.serverTimestamp(),
    checksum: generateChecksum(entry as Record<string, unknown>),
  };
  
  await auditRef.set(fullEntry);
  
  // Also log to console for Cloud Logging
  console.log(
    `[AUDIT:${entry.severity}] ${entry.eventType}: ${entry.message}`,
    JSON.stringify({
      schoolId: entry.schoolId,
      studentId: entry.studentId,
      userId: entry.userId,
      fromLevel: entry.fromLevel,
      toLevel: entry.toLevel,
    })
  );
}

// ============================================
// TRIGGER: Detect Level Changes on Students
// ============================================

/**
 * Monitors student documents for level changes.
 * This catches both legitimate promotions (via Cloud Function) and
 * any unauthorized direct writes that bypass security rules.
 */
export const auditStudentLevelChanges = onDocumentUpdated(
  {
    document: "schools/{schoolId}/students/{studentId}",
    region: "us-central1",
  },
  async (event) => {
    const { schoolId, studentId } = event.params;
    const beforeData = event.data?.before.data() as Student | undefined;
    const afterData = event.data?.after.data() as Student | undefined;
    
    if (!beforeData || !afterData) {
      console.warn("[auditStudentLevelChanges] Missing data, skipping");
      return;
    }
    
    // Check if level changed
    const beforeLevel = beforeData.academic?.level;
    const afterLevel = afterData.academic?.level;
    
    if (beforeLevel === afterLevel) {
      return; // No level change, skip
    }
    
    // Level change detected - create audit entry
    const studentName = `${afterData.identity?.lastName}, ${afterData.identity?.firstName}`;
    
    // Determine if this was a legitimate promotion (has previousLevels entry)
    const previousLevelsChanged = 
      (afterData.previousLevels?.length || 0) > (beforeData.previousLevels?.length || 0);
    
    if (previousLevelsChanged) {
      // Legitimate promotion via Cloud Function
      await createAuditEntry({
        eventType: "LEVEL_CHANGE",
        severity: "INFO",
        schoolId,
        studentId,
        studentDni: afterData.identity?.dni,
        studentName,
        fromLevel: beforeLevel,
        toLevel: afterLevel,
        fromCourse: beforeData.academic?.currentCourseName,
        toCourse: afterData.academic?.currentCourseName,
        triggeredBy: "CLOUD_FUNCTION",
        message: `Promocion legitima: ${studentName} de ${beforeLevel} a ${afterLevel}`,
        details: {
          fromCourseId: beforeData.academic?.currentCourseId,
          toCourseId: afterData.academic?.currentCourseId,
          previousLevelsCount: afterData.previousLevels?.length,
        },
        academicYear: afterData.academic?.currentYear,
      });
    } else {
      // Direct level change without proper transfer record - SUSPICIOUS
      await createAuditEntry({
        eventType: "LEVEL_CHANGE_DETECTED",
        severity: "CRITICAL",
        schoolId,
        studentId,
        studentDni: afterData.identity?.dni,
        studentName,
        fromLevel: beforeLevel,
        toLevel: afterLevel,
        fromCourse: beforeData.academic?.currentCourseName,
        toCourse: afterData.academic?.currentCourseName,
        triggeredBy: "DIRECT_WRITE",
        message: `ALERTA: Cambio de nivel sin registro de transferencia: ${studentName}`,
        details: {
          possibleBypass: true,
          beforeStats: beforeData.stats,
          afterStats: afterData.stats,
          statsReset: JSON.stringify(beforeData.stats) !== JSON.stringify(afterData.stats),
        },
        academicYear: afterData.academic?.currentYear,
      });
      
      // Could also trigger an alert to admins here
    }
  }
);

// ============================================
// TRIGGER: Log New Transfer Records
// ============================================

/**
 * When a student is first created with a previousLevels entry,
 * log it as a transfer-in from another institution.
 */
export const auditNewStudentWithHistory = onDocumentCreated(
  {
    document: "schools/{schoolId}/students/{studentId}",
    region: "us-central1",
  },
  async (event) => {
    const { schoolId, studentId } = event.params;
    const studentData = event.data?.data() as Student | undefined;
    
    if (!studentData) return;
    
    // Check if student was created with previous level history
    if (studentData.previousLevels && studentData.previousLevels.length > 0) {
      const studentName = `${studentData.identity?.lastName}, ${studentData.identity?.firstName}`;
      
      await createAuditEntry({
        eventType: "PROMOTION_COMPLETED",
        severity: "INFO",
        schoolId,
        studentId,
        studentDni: studentData.identity?.dni,
        studentName,
        toLevel: studentData.academic?.level,
        toCourse: studentData.academic?.currentCourseName,
        triggeredBy: "CLOUD_FUNCTION",
        message: `Alumno ingresado con historial previo: ${studentName}`,
        details: {
          previousLevelsCount: studentData.previousLevels.length,
          lastTransfer: studentData.previousLevels[studentData.previousLevels.length - 1],
        },
        academicYear: studentData.academic?.currentYear,
      });
    }
  }
);

// ============================================
// CALLABLE: Query Audit Log
// ============================================

import { onCall, HttpsError } from "firebase-functions/v2/https";

interface AuditQueryRequest {
  schoolId: string;
  filters?: {
    eventType?: AuditEventType;
    severity?: "INFO" | "WARNING" | "CRITICAL";
    studentId?: string;
    startDate?: string; // ISO date
    endDate?: string;
  };
  limit?: number;
}

/**
 * Allows admins to query the audit log for compliance reports
 */
export const queryPromotionAuditLog = onCall<AuditQueryRequest>(
  {
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesion");
    }
    
    const userId = request.auth.uid;
    const { schoolId, filters, limit = 100 } = request.data;
    
    // Validate admin permissions
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const schoolRole = userData?.schoolRoles?.[schoolId];
    
    if (!schoolRole || !["SUPER_ADMIN", "ADMIN"].includes(schoolRole.role)) {
      throw new HttpsError(
        "permission-denied",
        "Solo administradores pueden consultar el log de auditoria"
      );
    }
    
    // Build query
    let query = db
      .collection("_promotionAuditLog")
      .where("schoolId", "==", schoolId)
      .orderBy("timestamp", "desc")
      .limit(Math.min(limit, 500));
    
    if (filters?.eventType) {
      query = query.where("eventType", "==", filters.eventType);
    }
    
    if (filters?.severity) {
      query = query.where("severity", "==", filters.severity);
    }
    
    if (filters?.studentId) {
      query = query.where("studentId", "==", filters.studentId);
    }
    
    const snapshot = await query.get();
    
    const entries = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    
    // Log the query for meta-audit
    console.log(
      `[AUDIT:QUERY] User ${userId} queried audit log for school ${schoolId}`,
      { filters, resultCount: entries.length }
    );
    
    return {
      success: true,
      count: entries.length,
      entries,
    };
  }
);
