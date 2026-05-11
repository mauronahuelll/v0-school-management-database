import {
  onDocumentWritten,
  FirestoreEvent,
  Change,
  DocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { Timestamp, getFirestore, FieldValue } from "firebase-admin/firestore";
import { tryAcquireEventLock, markEventProcessed } from "../utils/idempotency";
import type { AttendanceRecord, StudentStats } from "../types";

const FUNCTION_NAME = "syncAttendanceStats";

/**
 * Cloud Function: Sync Attendance Statistics
 *
 * Triggered on any write (create, update, delete) to the attendance collection.
 * Recalculates the student's attendance statistics atomically.
 *
 * Key features:
 * - Handles decimal absence values (0, 0.5, 1)
 * - Updates both totalAbsences and absencesByPeriod
 * - Idempotent: safe to run multiple times for the same event
 * - Uses transactions for atomic updates
 */
export const syncAttendanceStats = onDocumentWritten(
  {
    document: "schools/{schoolId}/attendance/{attendanceId}",
    region: "us-central1",
  },
  async (
    event: FirestoreEvent<
      Change<DocumentSnapshot> | undefined,
      { schoolId: string; attendanceId: string }
    >
  ) => {
    const { schoolId, attendanceId } = event.params;
    const eventId = event.id;

    console.log(
      `[${FUNCTION_NAME}] Processing attendance ${attendanceId} in school ${schoolId}`
    );

    // Idempotency check - prevent duplicate processing
    const acquired = await tryAcquireEventLock(eventId, FUNCTION_NAME);
    if (!acquired) {
      console.log(`[${FUNCTION_NAME}] Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const beforeData = event.data?.before?.data() as AttendanceRecord | undefined;
      const afterData = event.data?.after?.data() as AttendanceRecord | undefined;

      // Determine the type of operation
      const isCreate = !beforeData && !!afterData;
      const isUpdate = !!beforeData && !!afterData;
      const isDelete = !!beforeData && !afterData;

      console.log(
        `[${FUNCTION_NAME}] Operation: ${isCreate ? "CREATE" : isUpdate ? "UPDATE" : "DELETE"}`
      );

      // Get student ID from the record
      const studentId = afterData?.studentId || beforeData?.studentId;
      if (!studentId) {
        console.error(`[${FUNCTION_NAME}] No studentId found in attendance record`);
        return;
      }

      // Calculate the delta (difference to apply)
      const delta = calculateStatsDelta(beforeData, afterData);

      if (delta.absenceDelta === 0 && delta.tardyDelta === 0) {
        console.log(`[${FUNCTION_NAME}] No change in values, skipping update`);
        return;
      }

      // Update student stats atomically
      await updateStudentStats(schoolId, studentId, delta, beforeData, afterData);

      await markEventProcessed(eventId, FUNCTION_NAME, "SUCCESS");
      console.log(
        `[${FUNCTION_NAME}] Successfully updated stats for student ${studentId}`
      );
    } catch (error) {
      console.error(`[${FUNCTION_NAME}] Error processing event:`, error);
      await markEventProcessed(
        eventId,
        FUNCTION_NAME,
        "ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error; // Rethrow to trigger retry
    }
  }
);

interface StatsDelta {
  absenceDelta: number;
  tardyDelta: number;
  periodId: string | null;
  oldPeriodId: string | null;
}

/**
 * Calculates the difference in absence/tardy values between old and new records.
 * Handles create, update, and delete scenarios.
 */
function calculateStatsDelta(
  before: AttendanceRecord | undefined,
  after: AttendanceRecord | undefined
): StatsDelta {
  const oldAbsence = before?.absenceValue ?? 0;
  const newAbsence = after?.absenceValue ?? 0;

  const oldTardy = before?.tardyValue ?? 0;
  const newTardy = after?.tardyValue ?? 0;

  return {
    absenceDelta: newAbsence - oldAbsence,
    tardyDelta: newTardy - oldTardy,
    periodId: after?.periodId ?? null,
    oldPeriodId: before?.periodId ?? null,
  };
}

/**
 * Updates the student's stats document atomically using a transaction.
 * Handles period changes and maintains consistency.
 */
async function updateStudentStats(
  schoolId: string,
  studentId: string,
  delta: StatsDelta,
  before: AttendanceRecord | undefined,
  after: AttendanceRecord | undefined
): Promise<void> {
  const db = getFirestore();
  const studentRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("students")
    .doc(studentId);

  await db.runTransaction(async (transaction) => {
    const studentDoc = await transaction.get(studentRef);

    if (!studentDoc.exists) {
      console.error(
        `[${FUNCTION_NAME}] Student ${studentId} not found in school ${schoolId}`
      );
      return;
    }

    const studentData = studentDoc.data();
    const currentStats: StudentStats = studentData?.stats ?? {
      totalAbsences: 0,
      totalTardies: 0,
      absencesByPeriod: {},
      behaviorIncidents: 0,
      unacknowledgedSanctions: 0,
    };

    // Update totals
    const newTotalAbsences = Math.max(
      0,
      currentStats.totalAbsences + delta.absenceDelta
    );
    const newTotalTardies = Math.max(
      0,
      currentStats.totalTardies + delta.tardyDelta
    );

    // Update period-specific absences
    const absencesByPeriod = { ...currentStats.absencesByPeriod };

    // If the period changed (update scenario), we need to adjust both periods
    if (delta.oldPeriodId && delta.periodId && delta.oldPeriodId !== delta.periodId) {
      // Remove from old period
      if (before) {
        absencesByPeriod[delta.oldPeriodId] = Math.max(
          0,
          (absencesByPeriod[delta.oldPeriodId] ?? 0) - before.absenceValue
        );
      }
      // Add to new period
      if (after) {
        absencesByPeriod[delta.periodId] =
          (absencesByPeriod[delta.periodId] ?? 0) + after.absenceValue;
      }
    } else {
      // Same period or create/delete - just apply the delta
      const periodId = delta.periodId || delta.oldPeriodId;
      if (periodId) {
        absencesByPeriod[periodId] = Math.max(
          0,
          (absencesByPeriod[periodId] ?? 0) + delta.absenceDelta
        );
      }
    }

    // Clean up zero values
    Object.keys(absencesByPeriod).forEach((key) => {
      if (absencesByPeriod[key] === 0) {
        delete absencesByPeriod[key];
      }
    });

    // Prepare the update
    const updatedStats: StudentStats = {
      ...currentStats,
      totalAbsences: newTotalAbsences,
      totalTardies: newTotalTardies,
      absencesByPeriod,
    };

    transaction.update(studentRef, {
      stats: updatedStats,
      updatedAt: Timestamp.now(),
    });

    console.log(
      `[${FUNCTION_NAME}] Stats update: totalAbsences ${currentStats.totalAbsences} -> ${newTotalAbsences}, totalTardies ${currentStats.totalTardies} -> ${newTotalTardies}`
    );
  });
}
