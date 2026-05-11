import { Timestamp, getFirestore } from "firebase-admin/firestore";
import type { ProcessedEvent } from "../types";

const IDEMPOTENCY_COLLECTION = "_processedEvents";
const EVENT_TTL_HOURS = 24; // Events older than this will be cleaned up

/**
 * Checks if an event has already been processed to ensure idempotency.
 * This prevents duplicate processing if Cloud Functions are triggered multiple times.
 *
 * @param eventId - Unique identifier for the event (usually from context.eventId)
 * @param functionName - Name of the function processing the event
 * @returns true if the event was already processed, false otherwise
 */
export async function isEventProcessed(
  eventId: string,
  functionName: string
): Promise<boolean> {
  const db = getFirestore();
  const docRef = db.collection(IDEMPOTENCY_COLLECTION).doc(eventId);

  try {
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data() as ProcessedEvent;
      console.log(
        `[Idempotency] Event ${eventId} already processed by ${data.functionName} at ${data.processedAt.toDate()}`
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[Idempotency] Error checking event ${eventId}:`, error);
    // In case of error, we assume not processed to avoid data loss
    return false;
  }
}

/**
 * Marks an event as processed for idempotency tracking.
 *
 * @param eventId - Unique identifier for the event
 * @param functionName - Name of the function that processed the event
 * @param result - Whether processing was successful or errored
 * @param errorMessage - Optional error message if result is ERROR
 */
export async function markEventProcessed(
  eventId: string,
  functionName: string,
  result: "SUCCESS" | "ERROR",
  errorMessage?: string
): Promise<void> {
  const db = getFirestore();
  const docRef = db.collection(IDEMPOTENCY_COLLECTION).doc(eventId);

  const processedEvent: ProcessedEvent = {
    eventId,
    processedAt: Timestamp.now(),
    functionName,
    result,
    ...(errorMessage && { errorMessage }),
  };

  try {
    await docRef.set(processedEvent);
    console.log(
      `[Idempotency] Marked event ${eventId} as processed (${result})`
    );
  } catch (error) {
    console.error(`[Idempotency] Error marking event ${eventId}:`, error);
    // Non-critical error, don't throw
  }
}

/**
 * Atomically check and mark an event as being processed.
 * Uses a transaction to prevent race conditions.
 *
 * @param eventId - Unique identifier for the event
 * @param functionName - Name of the function processing the event
 * @returns true if this is the first time processing, false if already processed
 */
export async function tryAcquireEventLock(
  eventId: string,
  functionName: string
): Promise<boolean> {
  const db = getFirestore();
  const docRef = db.collection(IDEMPOTENCY_COLLECTION).doc(eventId);

  try {
    const acquired = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (doc.exists) {
        // Already processed
        return false;
      }

      // Mark as being processed (we'll update result later)
      const processedEvent: ProcessedEvent = {
        eventId,
        processedAt: Timestamp.now(),
        functionName,
        result: "SUCCESS", // Optimistically mark as success
      };

      transaction.set(docRef, processedEvent);
      return true;
    });

    if (!acquired) {
      console.log(
        `[Idempotency] Event ${eventId} lock already acquired by another instance`
      );
    }

    return acquired;
  } catch (error) {
    console.error(`[Idempotency] Error acquiring lock for ${eventId}:`, error);
    // In case of transaction error, proceed cautiously
    return true;
  }
}

/**
 * Cleanup old processed events to prevent collection bloat.
 * Should be run periodically via a scheduled function.
 */
export async function cleanupOldEvents(): Promise<number> {
  const db = getFirestore();
  const cutoffTime = Timestamp.fromDate(
    new Date(Date.now() - EVENT_TTL_HOURS * 60 * 60 * 1000)
  );

  const query = db
    .collection(IDEMPOTENCY_COLLECTION)
    .where("processedAt", "<", cutoffTime)
    .limit(500); // Process in batches

  const snapshot = await query.get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`[Idempotency] Cleaned up ${snapshot.size} old events`);

  return snapshot.size;
}
