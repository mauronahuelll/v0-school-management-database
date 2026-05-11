/**
 * Acknowledge Sanction Callable Function
 *
 * This function handles the tutor's digital signature for sanctions.
 * It captures all verification metadata server-side to ensure integrity.
 *
 * Security considerations:
 * - Timestamp is generated server-side (not trusted from client)
 * - IP address is extracted from request headers
 * - Document hash is validated before accepting signature
 * - All metadata is logged for legal compliance
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type {
  BehaviorRecord,
  VerificationMetadata,
  SanctionAcknowledgment,
} from "../types";
import { generateDocumentHash } from "../triggers/behavior-signature.trigger";

const db = getFirestore();
const FUNCTION_NAME = "acknowledgeSanction";

// Legal notice version - must match behavior-signature.trigger.ts
const CURRENT_LEGAL_NOTICE_VERSION = "v1.0";
const LEGAL_CONSENT_TEXT =
  "Al confirmar, declaro haber sido legalmente notificado de la presente comunicación escolar. " +
  "Este acuse de recibo tiene validez legal según la normativa vigente.";

interface AcknowledgeRequest {
  schoolId: string;
  behaviorId: string;
  // Client-provided metadata (validated server-side)
  deviceId: string;
  deviceType: "MOBILE" | "TABLET" | "DESKTOP";
  appVersion: string;
  platform: "IOS" | "ANDROID" | "WEB";
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface AcknowledgeResponse {
  success: boolean;
  documentHash: string;
  acknowledgedAt: string;
  verificationId: string;
}

/**
 * Extracts IP address from request headers.
 * Handles various proxy configurations.
 */
function extractIpAddress(rawRequest: unknown): string {
  const req = rawRequest as {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
  };

  // Try X-Forwarded-For first (common in proxied environments)
  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0];
    return ips.trim();
  }

  // Try X-Real-IP
  const realIp = req.headers?.["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to direct IP
  return req.ip || "unknown";
}

/**
 * Extracts User-Agent from request headers.
 */
function extractUserAgent(rawRequest: unknown): string {
  const req = rawRequest as {
    headers?: Record<string, string | string[] | undefined>;
  };

  const userAgent = req.headers?.["user-agent"];
  if (!userAgent) return "unknown";

  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
}

/**
 * Validates that the user has permission to acknowledge this sanction.
 */
async function validateTutorPermission(
  userId: string,
  schoolId: string,
  studentId: string
): Promise<{ valid: boolean; tutorName: string; tutorDni: string }> {
  // Get user data
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return { valid: false, tutorName: "", tutorDni: "" };
  }

  const userData = userDoc.data();

  // Check if user has TUTOR role for this school
  const schoolRole = userData?.schoolRoles?.[schoolId];
  if (!schoolRole || schoolRole.role !== "TUTOR" || schoolRole.status !== "ACTIVE") {
    return { valid: false, tutorName: "", tutorDni: "" };
  }

  // Check if tutor is linked to this student
  const relationQuery = await db
    .collection("schools")
    .doc(schoolId)
    .collection("tutorRelations")
    .where("tutorId", "==", userId)
    .where("studentId", "==", studentId)
    .where("isActive", "==", true)
    .where("verificationStatus", "==", "VERIFIED")
    .where("canReceiveBehavior", "==", true)
    .limit(1)
    .get();

  if (relationQuery.empty) {
    return { valid: false, tutorName: "", tutorDni: "" };
  }

  const tutorName = `${userData?.profile?.lastName}, ${userData?.profile?.firstName}`;
  const tutorDni = userData?.profile?.dni || "";

  return { valid: true, tutorName, tutorDni };
}

/**
 * Main callable function for sanction acknowledgment.
 */
export const acknowledgeSanction = onCall<AcknowledgeRequest>(
  {
    region: "us-central1",
    // Enforce authentication
    enforceAppCheck: false, // Enable in production with App Check
  },
  async (request): Promise<AcknowledgeResponse> => {
    const { auth, data, rawRequest } = request;

    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    if (!auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "Debe iniciar sesion para firmar la notificacion."
      );
    }

    const userId = auth.uid;
    const { schoolId, behaviorId, deviceId, deviceType, appVersion, platform, geoLocation } =
      data;

    // Validate required fields
    if (!schoolId || !behaviorId || !deviceId || !deviceType || !appVersion || !platform) {
      throw new HttpsError(
        "invalid-argument",
        "Faltan datos requeridos para la firma."
      );
    }

    logger.info(`[${FUNCTION_NAME}] Signature request received`, {
      userId,
      schoolId,
      behaviorId,
    });

    try {
      // ========================================
      // 2. GET BEHAVIOR RECORD
      // ========================================
      const behaviorRef = db
        .collection("schools")
        .doc(schoolId)
        .collection("behavior")
        .doc(behaviorId);

      const behaviorDoc = await behaviorRef.get();

      if (!behaviorDoc.exists) {
        throw new HttpsError("not-found", "No se encontro la sancion.");
      }

      const record = behaviorDoc.data() as BehaviorRecord;

      // ========================================
      // 3. VALIDATE SANCTION STATE
      // ========================================
      if (record.type !== "SANCTION") {
        throw new HttpsError(
          "failed-precondition",
          "Este registro no es una sancion."
        );
      }

      if (!record.sanction?.requiresAcknowledgment) {
        throw new HttpsError(
          "failed-precondition",
          "Esta sancion no requiere firma."
        );
      }

      if (record.sanction.acknowledgment?.status === "ACKNOWLEDGED") {
        throw new HttpsError(
          "already-exists",
          "Esta sancion ya fue firmada."
        );
      }

      // ========================================
      // 4. VALIDATE TUTOR PERMISSION
      // ========================================
      const permission = await validateTutorPermission(
        userId,
        schoolId,
        record.studentId
      );

      if (!permission.valid) {
        throw new HttpsError(
          "permission-denied",
          "No tiene permiso para firmar esta sancion."
        );
      }

      // ========================================
      // 5. GENERATE DOCUMENT HASH
      // ========================================
      const documentHash = generateDocumentHash(
        record.description,
        record.studentId,
        record.date,
        record.sanction.severity,
        record.sanction.sanctionTypeId
      );

      // Validate against stored hash (if exists)
      if (
        record.originalContentHash &&
        record.originalContentHash !== documentHash
      ) {
        logger.error(`[${FUNCTION_NAME}] Hash mismatch detected`, {
          schoolId,
          behaviorId,
          storedHash: record.originalContentHash.substring(0, 8),
          computedHash: documentHash.substring(0, 8),
        });

        throw new HttpsError(
          "failed-precondition",
          "El contenido de la sancion ha sido modificado. Contacte a la institucion."
        );
      }

      // ========================================
      // 6. CAPTURE VERIFICATION METADATA
      // ========================================
      const verificationMetadata: VerificationMetadata = {
        ipAddress: extractIpAddress(rawRequest),
        userAgent: extractUserAgent(rawRequest),
        deviceId,
        deviceType,
        appVersion,
        platform,
        geoLocation,
      };

      const now = Timestamp.now();

      // ========================================
      // 7. BUILD ACKNOWLEDGMENT OBJECT
      // ========================================
      const acknowledgment: SanctionAcknowledgment = {
        status: "ACKNOWLEDGED",
        tutorId: userId,
        tutorName: permission.tutorName,
        tutorDni: permission.tutorDni,
        acknowledgedAt: now,
        documentHash,
        hashGeneratedAt: record.sanction.acknowledgment?.hashGeneratedAt || now,
        verificationMetadata,
        legalNoticeVersion: CURRENT_LEGAL_NOTICE_VERSION,
        consentText: LEGAL_CONSENT_TEXT,
      };

      // ========================================
      // 8. UPDATE RECORD
      // ========================================
      await behaviorRef.update({
        "sanction.acknowledgment": acknowledgment,
        contentLocked: true,
        contentLockedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // ========================================
      // 9. CREATE AUDIT LOG
      // ========================================
      const verificationId = `SIG-${Date.now()}-${documentHash.substring(0, 8)}`;

      await db.collection("_signatureAuditLog").add({
        verificationId,
        schoolId,
        behaviorId,
        studentId: record.studentId,
        tutorId: userId,
        tutorName: permission.tutorName,
        documentHash,
        verificationMetadata,
        signedAt: FieldValue.serverTimestamp(),
        legalNoticeVersion: CURRENT_LEGAL_NOTICE_VERSION,
      });

      logger.info(`[${FUNCTION_NAME}] Signature completed successfully`, {
        schoolId,
        behaviorId,
        tutorId: userId,
        verificationId,
      });

      return {
        success: true,
        documentHash,
        acknowledgedAt: now.toDate().toISOString(),
        verificationId,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(`[${FUNCTION_NAME}] Unexpected error`, {
        error: error instanceof Error ? error.message : "Unknown error",
        schoolId,
        behaviorId,
      });

      throw new HttpsError(
        "internal",
        "Error al procesar la firma. Intente nuevamente."
      );
    }
  }
);

/**
 * Callable function to dispute a sanction.
 */
export const disputeSanction = onCall<{
  schoolId: string;
  behaviorId: string;
  reason: string;
}>(
  {
    region: "us-central1",
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new HttpsError("unauthenticated", "Debe iniciar sesion.");
    }

    const { schoolId, behaviorId, reason } = data;

    if (!reason || reason.trim().length < 10) {
      throw new HttpsError(
        "invalid-argument",
        "Debe proporcionar un motivo detallado para la disputa."
      );
    }

    const behaviorRef = db
      .collection("schools")
      .doc(schoolId)
      .collection("behavior")
      .doc(behaviorId);

    const behaviorDoc = await behaviorRef.get();

    if (!behaviorDoc.exists) {
      throw new HttpsError("not-found", "No se encontro la sancion.");
    }

    const record = behaviorDoc.data() as BehaviorRecord;

    // Validate permission
    const permission = await validateTutorPermission(
      auth.uid,
      schoolId,
      record.studentId
    );

    if (!permission.valid) {
      throw new HttpsError(
        "permission-denied",
        "No tiene permiso para disputar esta sancion."
      );
    }

    // Can only dispute PENDING sanctions
    if (record.sanction?.acknowledgment?.status !== "PENDING") {
      throw new HttpsError(
        "failed-precondition",
        "Solo puede disputar sanciones pendientes de firma."
      );
    }

    await behaviorRef.update({
      "sanction.acknowledgment.status": "DISPUTED",
      "sanction.acknowledgment.tutorId": auth.uid,
      "sanction.acknowledgment.tutorName": permission.tutorName,
      "sanction.acknowledgment.disputedAt": FieldValue.serverTimestamp(),
      "sanction.acknowledgment.disputeReason": reason.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[${FUNCTION_NAME}] Sanction disputed`, {
      schoolId,
      behaviorId,
      tutorId: auth.uid,
    });

    return { success: true };
  }
);
