import {
  onDocumentCreated,
  FirestoreEvent,
  QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { tryAcquireEventLock, markEventProcessed } from "../utils/idempotency";
import { formatDateSpanish } from "../utils/dates";
import {
  sendPushNotification,
  logNotification,
  removeInvalidTokens,
} from "../services/notification.service";
import type {
  AttendanceRecord,
  Student,
  TutorStudentRelation,
  User,
} from "../types";

const FUNCTION_NAME = "notifyAttendance";

// Map attendance status to Spanish human-readable text
const STATUS_LABELS: Record<string, string> = {
  ABSENT: "Ausente",
  TARDY: "Tarde",
  JUSTIFIED: "Ausente Justificado",
  LICENSE: "Con Licencia",
};

/**
 * Cloud Function: Attendance Notification Engine
 *
 * Triggered when a new attendance record is created.
 * Sends push notifications to all linked tutors when a student is marked
 * as anything other than PRESENT.
 *
 * Key features:
 * - Respects student's licenseMode (silences notifications when active)
 * - Finds all linked tutors via tutorRelations collection
 * - Batches FCM tokens for efficient sending
 * - Logs all notifications for audit trail
 * - Cleans up invalid FCM tokens automatically
 */
export const notifyAttendance = onDocumentCreated(
  {
    document: "schools/{schoolId}/attendance/{attendanceId}",
    region: "us-central1",
  },
  async (
    event: FirestoreEvent<
      QueryDocumentSnapshot | undefined,
      { schoolId: string; attendanceId: string }
    >
  ) => {
    const { schoolId, attendanceId } = event.params;
    const eventId = event.id;

    console.log(
      `[${FUNCTION_NAME}] Processing new attendance ${attendanceId} in school ${schoolId}`
    );

    // Idempotency check
    const acquired = await tryAcquireEventLock(eventId, FUNCTION_NAME);
    if (!acquired) {
      console.log(`[${FUNCTION_NAME}] Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const attendanceData = event.data?.data() as AttendanceRecord | undefined;

      if (!attendanceData) {
        console.error(`[${FUNCTION_NAME}] No attendance data found`);
        return;
      }

      // Only notify for non-present statuses
      if (attendanceData.status === "PRESENT") {
        console.log(
          `[${FUNCTION_NAME}] Status is PRESENT, no notification needed`
        );
        return;
      }

      // Check if student is in license mode
      const isLicensed = await checkStudentLicenseMode(
        schoolId,
        attendanceData.studentId
      );

      if (isLicensed) {
        console.log(
          `[${FUNCTION_NAME}] Student ${attendanceData.studentId} is in license mode, skipping notification`
        );

        // Update the attendance record to mark that notification was skipped
        await updateAttendanceNotificationStatus(
          schoolId,
          attendanceId,
          false,
          "Student in license mode"
        );
        return;
      }

      // Find all tutors linked to this student
      const tutorRelations = await getTutorRelations(
        schoolId,
        attendanceData.studentId
      );

      if (tutorRelations.length === 0) {
        console.log(
          `[${FUNCTION_NAME}] No active tutors found for student ${attendanceData.studentId}`
        );
        return;
      }

      console.log(
        `[${FUNCTION_NAME}] Found ${tutorRelations.length} linked tutors`
      );

      // Get FCM tokens for all tutors
      const tutorTokensMap = await getTutorFcmTokens(
        tutorRelations.map((r) => r.tutorId)
      );

      // Prepare notification content
      const statusLabel = STATUS_LABELS[attendanceData.status] || attendanceData.status;
      const dateStr = formatDateSpanish(attendanceData.date);

      const title = "Aviso de Inasistencia";
      const body = `${attendanceData.studentName} ha sido registrado como ${statusLabel} el ${dateStr}.`;

      // Send notifications to each tutor and log them
      let totalSent = 0;
      const allInvalidTokens: { userId: string; tokens: string[] }[] = [];

      for (const relation of tutorRelations) {
        const tokens = tutorTokensMap.get(relation.tutorId) || [];

        if (tokens.length === 0) {
          console.log(
            `[${FUNCTION_NAME}] Tutor ${relation.tutorId} has no FCM tokens`
          );
          continue;
        }

        // Send push notification
        const pushResult = await sendPushNotification({
          tokens,
          title,
          body,
          data: {
            type: "ATTENDANCE",
            studentId: attendanceData.studentId,
            attendanceId,
            schoolId,
            status: attendanceData.status,
          },
          priority: "HIGH",
        });

        totalSent += pushResult.successCount;

        // Track invalid tokens for cleanup
        if (pushResult.invalidTokens.length > 0) {
          allInvalidTokens.push({
            userId: relation.tutorId,
            tokens: pushResult.invalidTokens,
          });
        }

        // Log the notification
        await logNotification({
          schoolId,
          recipientId: relation.tutorId,
          recipientType: "TUTOR",
          studentId: attendanceData.studentId,
          studentName: attendanceData.studentName,
          type: "ATTENDANCE",
          title,
          body,
          data: {
            attendanceId,
            status: attendanceData.status,
            absenceValue: attendanceData.absenceValue,
            relationship: relation.relationship,
          },
          sourceCollection: "attendance",
          sourceDocId: attendanceId,
          pushResult,
          priority: "HIGH",
        });
      }

      // Clean up invalid tokens
      for (const { userId, tokens } of allInvalidTokens) {
        await removeInvalidTokens(userId, tokens);
      }

      // Update attendance record to mark notification as sent
      await updateAttendanceNotificationStatus(schoolId, attendanceId, true);

      await markEventProcessed(eventId, FUNCTION_NAME, "SUCCESS");

      console.log(
        `[${FUNCTION_NAME}] Successfully sent ${totalSent} notifications for attendance ${attendanceId}`
      );
    } catch (error) {
      console.error(`[${FUNCTION_NAME}] Error processing event:`, error);
      await markEventProcessed(
        eventId,
        FUNCTION_NAME,
        "ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }
);

/**
 * Checks if the student has license mode active.
 * In license mode, notifications are silenced.
 */
async function checkStudentLicenseMode(
  schoolId: string,
  studentId: string
): Promise<boolean> {
  const db = getFirestore();
  const studentRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("students")
    .doc(studentId);

  try {
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      console.warn(
        `[${FUNCTION_NAME}] Student ${studentId} not found in school ${schoolId}`
      );
      return false;
    }

    const studentData = studentDoc.data() as Student;
    const licenseMode = studentData?.licenseMode;

    if (!licenseMode?.isActive) {
      return false;
    }

    // Check if license is still valid (not expired)
    if (licenseMode.endDate) {
      const now = Timestamp.now();
      if (licenseMode.endDate.toMillis() < now.toMillis()) {
        // License has expired, could trigger cleanup here
        console.log(
          `[${FUNCTION_NAME}] Student ${studentId} license has expired`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(
      `[${FUNCTION_NAME}] Error checking license mode for student ${studentId}:`,
      error
    );
    return false; // Default to sending notification on error
  }
}

/**
 * Retrieves all active tutor relations for a student.
 */
async function getTutorRelations(
  schoolId: string,
  studentId: string
): Promise<TutorStudentRelation[]> {
  const db = getFirestore();
  const relationsRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("tutorRelations");

  try {
    const snapshot = await relationsRef
      .where("studentId", "==", studentId)
      .where("isActive", "==", true)
      .where("verificationStatus", "==", "VERIFIED")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TutorStudentRelation[];
  } catch (error) {
    console.error(
      `[${FUNCTION_NAME}] Error fetching tutor relations for student ${studentId}:`,
      error
    );
    return [];
  }
}

/**
 * Retrieves FCM tokens for a list of tutor user IDs.
 * Returns a Map for efficient lookup.
 */
async function getTutorFcmTokens(
  tutorIds: string[]
): Promise<Map<string, string[]>> {
  const db = getFirestore();
  const tokenMap = new Map<string, string[]>();

  if (tutorIds.length === 0) {
    return tokenMap;
  }

  try {
    // Firestore 'in' queries support up to 30 items
    // For larger lists, we'd need to batch
    const batchSize = 30;
    const batches: string[][] = [];

    for (let i = 0; i < tutorIds.length; i += batchSize) {
      batches.push(tutorIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("__name__", "in", batch).get();

      snapshot.docs.forEach((doc) => {
        const userData = doc.data() as User;
        const notifications = userData?.notifications;

        // Check if push notifications are enabled and user wants attendance alerts
        if (
          notifications?.pushEnabled &&
          notifications?.preferences?.attendance &&
          notifications?.fcmTokens?.length > 0
        ) {
          tokenMap.set(doc.id, notifications.fcmTokens);
        }
      });
    }

    return tokenMap;
  } catch (error) {
    console.error(
      `[${FUNCTION_NAME}] Error fetching FCM tokens for tutors:`,
      error
    );
    return tokenMap;
  }
}

/**
 * Updates the attendance record with notification status.
 */
async function updateAttendanceNotificationStatus(
  schoolId: string,
  attendanceId: string,
  sent: boolean,
  skipReason?: string
): Promise<void> {
  const db = getFirestore();
  const attendanceRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("attendance")
    .doc(attendanceId);

  try {
    const updateData: Record<string, unknown> = {
      notificationSent: sent,
      updatedAt: Timestamp.now(),
    };

    if (sent) {
      updateData.notificationSentAt = Timestamp.now();
    }

    if (skipReason) {
      updateData.notificationSkipReason = skipReason;
    }

    await attendanceRef.update(updateData);
  } catch (error) {
    console.error(
      `[${FUNCTION_NAME}] Error updating notification status for ${attendanceId}:`,
      error
    );
    // Non-critical, don't throw
  }
}
