import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import type {
  NotificationLog,
  NotificationType,
  NotificationPriority,
} from "../types";

interface SendPushParams {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: NotificationPriority;
}

interface SendPushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  errors: string[];
}

/**
 * Sends push notifications via Firebase Cloud Messaging.
 * Handles multicast to multiple tokens and tracks invalid tokens for cleanup.
 */
export async function sendPushNotification(
  params: SendPushParams
): Promise<SendPushResult> {
  const { tokens, title, body, data = {}, priority = "NORMAL" } = params;

  if (tokens.length === 0) {
    console.log("[NotificationService] No tokens provided, skipping push");
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      errors: ["No tokens provided"],
    };
  }

  const messaging = getMessaging();

  // Map priority to FCM priority
  const fcmPriority = priority === "URGENT" || priority === "HIGH" ? "high" : "normal";

  const message: MulticastMessage = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: "FLUTTER_NOTIFICATION_CLICK", // For Flutter app handling
      timestamp: new Date().toISOString(),
    },
    android: {
      priority: fcmPriority,
      notification: {
        channelId: "sequency_alerts",
        priority: priority === "URGENT" ? "max" : "high",
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: "default",
          badge: 1,
        },
      },
      headers: {
        "apns-priority": priority === "URGENT" ? "10" : "5",
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    const invalidTokens: string[] = [];
    const errors: string[] = [];

    response.responses.forEach((resp, index) => {
      if (!resp.success && resp.error) {
        errors.push(resp.error.message);
        // Track tokens that should be removed
        if (
          resp.error.code === "messaging/invalid-registration-token" ||
          resp.error.code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    console.log(
      `[NotificationService] Push sent: ${response.successCount} success, ${response.failureCount} failures`
    );

    if (invalidTokens.length > 0) {
      console.log(
        `[NotificationService] Found ${invalidTokens.length} invalid tokens to clean up`
      );
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
      errors,
    };
  } catch (error) {
    console.error("[NotificationService] Failed to send push:", error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

interface LogNotificationParams {
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
  pushResult: SendPushResult;
  priority?: NotificationPriority;
}

/**
 * Logs a notification to the notifications_log collection for auditing.
 */
export async function logNotification(
  params: LogNotificationParams
): Promise<string> {
  const db = getFirestore();
  const {
    schoolId,
    recipientId,
    recipientType,
    studentId,
    studentName,
    type,
    title,
    body,
    data,
    sourceCollection,
    sourceDocId,
    pushResult,
    priority = "NORMAL",
  } = params;

  const notificationRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("notifications")
    .doc();

  const notificationLog: NotificationLog = {
    id: notificationRef.id,
    schoolId,
    recipientId,
    recipientType,
    ...(studentId && { studentId }),
    ...(studentName && { studentName }),
    type,
    title,
    body,
    data,
    sourceCollection,
    sourceDocId,
    channels: {
      push: {
        sent: pushResult.successCount > 0,
        sentAt: pushResult.successCount > 0 ? Timestamp.now() : undefined,
        error:
          pushResult.errors.length > 0 ? pushResult.errors.join("; ") : undefined,
      },
      email: {
        sent: false, // Email not implemented yet
      },
      inApp: {
        sent: true, // Always logged as in-app notification
        read: false,
      },
    },
    priority,
    createdAt: Timestamp.now(),
  };

  try {
    await notificationRef.set(notificationLog);
    console.log(
      `[NotificationService] Logged notification ${notificationRef.id} for ${recipientType} ${recipientId}`
    );
    return notificationRef.id;
  } catch (error) {
    console.error("[NotificationService] Failed to log notification:", error);
    throw error;
  }
}

/**
 * Removes invalid FCM tokens from a user's profile.
 * Should be called when we detect stale tokens.
 */
export async function removeInvalidTokens(
  userId: string,
  invalidTokens: string[]
): Promise<void> {
  if (invalidTokens.length === 0) return;

  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const currentTokens: string[] = userData?.notifications?.fcmTokens || [];
    const validTokens = currentTokens.filter(
      (token) => !invalidTokens.includes(token)
    );

    await userRef.update({
      "notifications.fcmTokens": validTokens,
      updatedAt: Timestamp.now(),
    });

    console.log(
      `[NotificationService] Removed ${invalidTokens.length} invalid tokens from user ${userId}`
    );
  } catch (error) {
    console.error(
      `[NotificationService] Failed to remove invalid tokens for user ${userId}:`,
      error
    );
  }
}
