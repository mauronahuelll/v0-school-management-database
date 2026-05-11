import { Timestamp } from "firebase-admin/firestore";

/**
 * Formats a Timestamp to a human-readable date string in Spanish.
 * Example: "15 de marzo de 2024"
 */
export function formatDateSpanish(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return date.toLocaleDateString("es-AR", options);
}

/**
 * Formats a Timestamp to a short date string.
 * Example: "15/03/2024"
 */
export function formatDateShort(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Gets today's date as a string in YYYY-MM-DD format.
 */
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Checks if a timestamp is from today.
 */
export function isToday(timestamp: Timestamp): boolean {
  const date = timestamp.toDate();
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
