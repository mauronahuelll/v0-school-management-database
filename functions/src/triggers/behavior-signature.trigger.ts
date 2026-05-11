/**
 * Behavior Signature Validation Trigger
 *
 * This Cloud Function ensures the integrity of the digital signature system
 * for sanctions acknowledgment. It validates:
 *
 * 1. Document hash matches content when status changes to ACKNOWLEDGED
 * 2. Content cannot be modified once a signature exists
 * 3. All signature metadata is server-generated
 *
 * Security: This function acts as a tamper-proof guardian for legal records.
 */

import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "crypto";
import { logger } from "firebase-functions/v2";
import type { BehaviorRecord, SanctionAcknowledgment } from "../types";

const db = getFirestore();
const FUNCTION_NAME = "validateBehaviorSignature";

// Legal notice version - update this when changing the consent text
const CURRENT_LEGAL_NOTICE_VERSION = "v1.0";
const LEGAL_CONSENT_TEXT =
  "Al confirmar, declaro haber sido legalmente notificado de la presente comunicación escolar. " +
  "Este acuse de recibo tiene validez legal según la normativa vigente.";

/**
 * Generates a SHA-256 hash from sanction content.
 * This hash is used to verify content integrity at signature time.
 */
export function generateDocumentHash(
  description: string,
  studentId: string,
  date: Timestamp,
  severity: number,
  sanctionTypeId: string
): string {
  const content = JSON.stringify({
    description: description.trim().toLowerCase(),
    studentId,
    dateMillis: date.toMillis(),
    severity,
    sanctionTypeId,
  });

  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Validates that the provided hash matches the current document content.
 */
function validateDocumentHash(
  record: BehaviorRecord,
  providedHash: string
): boolean {
  if (!record.sanction) return false;

  const expectedHash = generateDocumentHash(
    record.description,
    record.studentId,
    record.date,
    record.sanction.severity,
    record.sanction.sanctionTypeId
  );

  return expectedHash === providedHash;
}

/**
 * Checks if protected fields have been modified.
 * These fields cannot change once a signature exists.
 */
function hasProtectedFieldsChanged(
  before: BehaviorRecord,
  after: BehaviorRecord
): { changed: boolean; fields: string[] } {
  const changedFields: string[] = [];

  // Check description
  if (before.description !== after.description) {
    changedFields.push("description");
  }

  // Check category
  if (before.category !== after.category) {
    changedFields.push("category");
  }

  // Check sanction severity
  if (before.sanction?.severity !== after.sanction?.severity) {
    changedFields.push("sanction.severity");
  }

  // Check sanction type
  if (before.sanction?.sanctionTypeId !== after.sanction?.sanctionTypeId) {
    changedFields.push("sanction.sanctionTypeId");
  }

  // Check date
  if (before.date.toMillis() !== after.date.toMillis()) {
    changedFields.push("date");
  }

  return {
    changed: changedFields.length > 0,
    fields: changedFields,
  };
}

/**
 * Trigger: When a behavior record is CREATED
 * Action: Generate initial document hash for sanctions that require acknowledgment
 */
export const initializeBehaviorHash = onDocumentCreated(
  {
    document: "schools/{schoolId}/behavior/{behaviorId}",
    region: "us-central1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const record = snapshot.data() as BehaviorRecord;
    const { schoolId, behaviorId } = event.params;

    // Only process sanctions that require acknowledgment
    if (
      record.type !== "SANCTION" ||
      !record.sanction?.requiresAcknowledgment
    ) {
      return;
    }

    try {
      // Generate the initial document hash
      const documentHash = generateDocumentHash(
        record.description,
        record.studentId,
        record.date,
        record.sanction.severity,
        record.sanction.sanctionTypeId
      );

      // Initialize the acknowledgment with PENDING status and hash
      const initialAcknowledgment: Partial<SanctionAcknowledgment> = {
        status: "PENDING",
        documentHash,
        hashGeneratedAt: Timestamp.now(),
        legalNoticeVersion: CURRENT_LEGAL_NOTICE_VERSION,
        consentText: LEGAL_CONSENT_TEXT,
      };

      await db
        .collection("schools")
        .doc(schoolId)
        .collection("behavior")
        .doc(behaviorId)
        .update({
          "sanction.acknowledgment": initialAcknowledgment,
          originalContentHash: documentHash,
          contentLocked: false,
          updatedAt: FieldValue.serverTimestamp(),
        });

      logger.info(`[${FUNCTION_NAME}] Initialized hash for behavior record`, {
        schoolId,
        behaviorId,
        hashPrefix: documentHash.substring(0, 8),
      });
    } catch (error) {
      logger.error(`[${FUNCTION_NAME}] Error initializing hash`, {
        schoolId,
        behaviorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
);

/**
 * Trigger: When a behavior record is UPDATED
 * Actions:
 * 1. Validate signature integrity when acknowledging
 * 2. Block modifications to protected fields after signature
 * 3. Log all integrity violations
 */
export const validateBehaviorSignature = onDocumentUpdated(
  {
    document: "schools/{schoolId}/behavior/{behaviorId}",
    region: "us-central1",
  },
  async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    if (!beforeSnap || !afterSnap) return;

    const before = beforeSnap.data() as BehaviorRecord;
    const after = afterSnap.data() as BehaviorRecord;
    const { schoolId, behaviorId } = event.params;

    // Only validate sanctions with acknowledgment requirements
    if (after.type !== "SANCTION" || !after.sanction?.requiresAcknowledgment) {
      return;
    }

    const beforeStatus = before.sanction?.acknowledgment?.status || "PENDING";
    const afterStatus = after.sanction?.acknowledgment?.status || "PENDING";

    try {
      // ========================================
      // CASE 1: Content modification after signature
      // ========================================
      if (before.contentLocked === true) {
        const protectedCheck = hasProtectedFieldsChanged(before, after);

        if (protectedCheck.changed) {
          // INTEGRITY VIOLATION: Attempt to modify signed content
          logger.error(
            `[${FUNCTION_NAME}] INTEGRITY VIOLATION: Attempted modification of signed content`,
            {
              schoolId,
              behaviorId,
              attemptedFields: protectedCheck.fields,
              originalHash: before.originalContentHash,
            }
          );

          // Log the violation to a separate audit collection
          await db.collection("_integrityViolations").add({
            type: "CONTENT_MODIFICATION_AFTER_SIGNATURE",
            schoolId,
            behaviorId,
            attemptedFields: protectedCheck.fields,
            originalHash: before.originalContentHash,
            attemptedAt: FieldValue.serverTimestamp(),
            // We don't know who attempted this (could be a bug or attack)
          });

          // Revert to original values
          await db
            .collection("schools")
            .doc(schoolId)
            .collection("behavior")
            .doc(behaviorId)
            .update({
              description: before.description,
              category: before.category,
              "sanction.severity": before.sanction?.severity,
              "sanction.sanctionTypeId": before.sanction?.sanctionTypeId,
              date: before.date,
              updatedAt: FieldValue.serverTimestamp(),
            });

          logger.warn(
            `[${FUNCTION_NAME}] Reverted unauthorized changes to behavior record`,
            {
              schoolId,
              behaviorId,
            }
          );

          return;
        }
      }

      // ========================================
      // CASE 2: Status changing to ACKNOWLEDGED
      // ========================================
      if (beforeStatus === "PENDING" && afterStatus === "ACKNOWLEDGED") {
        const acknowledgment = after.sanction?.acknowledgment;

        if (!acknowledgment?.documentHash) {
          throw new Error("Document hash is required for acknowledgment");
        }

        // Validate the hash matches current content
        const isValid = validateDocumentHash(after, acknowledgment.documentHash);

        if (!isValid) {
          // INTEGRITY VIOLATION: Hash mismatch
          logger.error(
            `[${FUNCTION_NAME}] INTEGRITY VIOLATION: Hash mismatch during acknowledgment`,
            {
              schoolId,
              behaviorId,
              providedHash: acknowledgment.documentHash.substring(0, 8),
            }
          );

          // Reject the acknowledgment by reverting status
          await db
            .collection("schools")
            .doc(schoolId)
            .collection("behavior")
            .doc(behaviorId)
            .update({
              "sanction.acknowledgment.status": "PENDING",
              updatedAt: FieldValue.serverTimestamp(),
            });

          // Log the violation
          await db.collection("_integrityViolations").add({
            type: "HASH_MISMATCH_ON_ACKNOWLEDGMENT",
            schoolId,
            behaviorId,
            providedHash: acknowledgment.documentHash,
            attemptedAt: FieldValue.serverTimestamp(),
            tutorId: acknowledgment.tutorId,
          });

          throw new Error(
            "Document integrity check failed. The content may have been modified."
          );
        }

        // Hash is valid - lock the content and finalize the signature
        await db
          .collection("schools")
          .doc(schoolId)
          .collection("behavior")
          .doc(behaviorId)
          .update({
            contentLocked: true,
            contentLockedAt: FieldValue.serverTimestamp(),
            "sanction.acknowledgment.acknowledgedAt":
              FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

        logger.info(
          `[${FUNCTION_NAME}] Successfully validated and locked signature`,
          {
            schoolId,
            behaviorId,
            tutorId: acknowledgment.tutorId,
            hashPrefix: acknowledgment.documentHash.substring(0, 8),
          }
        );

        // Update student stats
        await updateStudentSanctionStats(schoolId, after.studentId, -1);
      }

      // ========================================
      // CASE 3: Status changing to DISPUTED
      // ========================================
      if (beforeStatus !== "DISPUTED" && afterStatus === "DISPUTED") {
        logger.info(`[${FUNCTION_NAME}] Sanction disputed`, {
          schoolId,
          behaviorId,
          tutorId: after.sanction?.acknowledgment?.tutorId,
          reason: after.sanction?.acknowledgment?.disputeReason,
        });

        // Create a notification for school admin about the dispute
        await db
          .collection("schools")
          .doc(schoolId)
          .collection("notifications")
          .add({
            type: "BEHAVIOR",
            title: "Sancion Disputada",
            body: `El tutor ha disputado una sancion para ${after.studentName}`,
            recipientType: "ADMIN",
            studentId: after.studentId,
            studentName: after.studentName,
            data: {
              behaviorId,
              disputeReason: after.sanction?.acknowledgment?.disputeReason,
            },
            sourceCollection: "behavior",
            sourceDocId: behaviorId,
            channels: {
              push: { sent: false },
              email: { sent: false },
              inApp: { sent: true, read: false },
            },
            priority: "HIGH",
            createdAt: FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      logger.error(`[${FUNCTION_NAME}] Error validating signature`, {
        schoolId,
        behaviorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
);

/**
 * Updates the unacknowledgedSanctions counter in student stats.
 */
async function updateStudentSanctionStats(
  schoolId: string,
  studentId: string,
  delta: number
): Promise<void> {
  const studentRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("students")
    .doc(studentId);

  await db.runTransaction(async (transaction) => {
    const studentDoc = await transaction.get(studentRef);

    if (!studentDoc.exists) {
      logger.warn("Student not found for stats update", { schoolId, studentId });
      return;
    }

    const currentStats = studentDoc.data()?.stats || {};
    const currentUnacknowledged = currentStats.unacknowledgedSanctions || 0;

    transaction.update(studentRef, {
      "stats.unacknowledgedSanctions": Math.max(
        0,
        currentUnacknowledged + delta
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
