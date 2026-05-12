/**
 * Sequency Cloud Functions
 *
 * This is the main entry point for all Firebase Cloud Functions.
 * Functions are organized by domain/trigger type in the /triggers folder.
 *
 * Deployed functions:
 * - syncAttendanceStats: Updates student statistics when attendance changes
 * - notifyAttendance: Sends push notifications to tutors for absences
 */

import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin SDK
// In Cloud Functions, this uses the default service account
initializeApp();

// ============================================
// ATTENDANCE TRIGGERS
// ============================================

export { syncAttendanceStats } from "./triggers/attendance-stats.trigger";
export { notifyAttendance } from "./triggers/attendance-notification.trigger";

// ============================================
// SCHEDULED FUNCTIONS (To be added)
// ============================================

// export { cleanupIdempotencyEvents } from "./scheduled/cleanup.scheduled";
// export { sendAbsenceSummaryReport } from "./scheduled/reports.scheduled";

// ============================================
// BEHAVIOR TRIGGERS
// ============================================

export {
  initializeBehaviorHash,
  validateBehaviorSignature,
} from "./triggers/behavior-signature.trigger";

// ============================================
// CALLABLE FUNCTIONS
// ============================================

export {
  acknowledgeSanction,
  disputeSanction,
} from "./callable/acknowledge-sanction.callable";

export { promoteStudentsToLevel } from "./callable/promote-students.callable";

// ============================================
// PROMOTION AUDIT TRIGGERS
// ============================================

export {
  auditStudentLevelChanges,
  auditNewStudentWithHistory,
  queryPromotionAuditLog,
} from "./triggers/promotion-audit.trigger";

// export { generateTransferToken } from "./callable/transfer.callable";
// export { acceptTransferStudent } from "./callable/transfer.callable";
