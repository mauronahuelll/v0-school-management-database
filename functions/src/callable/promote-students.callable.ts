/**
 * Sequency - Student Promotion Cloud Function
 * 
 * Non-destructive migration of students between education levels.
 * This function:
 * 1. Creates an immutable TransferRecord with performance snapshot
 * 2. Moves the record to previousLevels array
 * 3. Resets active stats while preserving identity and medical data
 * 4. Blocks edit access from previous level's teachers
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CourseLevel, Student, TransferRecord } from "../types";

const db = getFirestore();

// ============================================
// TYPES
// ============================================

interface PromoteStudentsRequest {
  schoolId: string;
  studentIds: string[];
  sourceLevel: CourseLevel;
  targetLevel: CourseLevel;
  targetCourseId: string;
  targetCourseName: string;
  targetDivisionId: string;
  targetDivisionName: string;
  academicYear: number;
  closureNotes?: Record<string, string>; // studentId -> note
}

interface PromotionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: {
    studentId: string;
    studentName: string;
    status: "SUCCESS" | "FAILED";
    error?: string;
  }[];
}

interface PerformanceSnapshot {
  finalAverage: number | null;
  totalAbsences: number;
  attendanceRate: number;
  totalSanctions: number;
  passingSubjects: number;
  totalSubjects: number;
  gradesBySubject: Record<string, number>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate that user has permission to perform promotions
 */
async function validateUserPermissions(
  userId: string,
  schoolId: string,
  sourceLevel: CourseLevel,
  targetLevel: CourseLevel
): Promise<void> {
  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Usuario no encontrado");
  }
  
  const userData = userDoc.data();
  const schoolRole = userData?.schoolRoles?.[schoolId];
  
  if (!schoolRole || schoolRole.status !== "ACTIVE") {
    throw new HttpsError(
      "permission-denied",
      "No tienes acceso activo a esta institucion"
    );
  }
  
  // Only SUPER_ADMIN and ADMIN can perform level promotions
  if (!["SUPER_ADMIN", "ADMIN"].includes(schoolRole.role)) {
    throw new HttpsError(
      "permission-denied",
      "Solo administradores pueden realizar promociones entre niveles"
    );
  }
}

/**
 * Calculate attendance rate for a student
 */
async function calculateAttendanceRate(
  schoolId: string,
  studentId: string,
  academicYear: number
): Promise<{ totalAbsences: number; attendanceRate: number }> {
  const attendanceRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("attendance");
  
  const attendanceSnap = await attendanceRef
    .where("studentId", "==", studentId)
    .where("academicYear", "==", academicYear)
    .get();
  
  if (attendanceSnap.empty) {
    return { totalAbsences: 0, attendanceRate: 100 };
  }
  
  let totalAbsences = 0;
  let totalDays = attendanceSnap.size;
  
  attendanceSnap.forEach((doc) => {
    const data = doc.data();
    totalAbsences += data.absenceValue || 0;
  });
  
  const presentDays = totalDays - totalAbsences;
  const attendanceRate = totalDays > 0 
    ? Math.round((presentDays / totalDays) * 100) 
    : 100;
  
  return { totalAbsences, attendanceRate };
}

/**
 * Get grades summary for a student
 */
async function getGradesSummary(
  schoolId: string,
  studentId: string,
  academicYear: number
): Promise<{
  finalAverage: number | null;
  gradesBySubject: Record<string, number>;
  passingSubjects: number;
  totalSubjects: number;
}> {
  const gradesRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("grades");
  
  const gradesSnap = await gradesRef
    .where("studentId", "==", studentId)
    .where("academicYear", "==", academicYear)
    .where("isPublished", "==", true)
    .get();
  
  if (gradesSnap.empty) {
    return {
      finalAverage: null,
      gradesBySubject: {},
      passingSubjects: 0,
      totalSubjects: 0,
    };
  }
  
  const gradesBySubject: Record<string, number[]> = {};
  
  gradesSnap.forEach((doc) => {
    const data = doc.data();
    if (data.value !== null && data.subjectId) {
      if (!gradesBySubject[data.subjectId]) {
        gradesBySubject[data.subjectId] = [];
      }
      gradesBySubject[data.subjectId].push(data.value);
    }
  });
  
  const subjectAverages: Record<string, number> = {};
  let totalAverage = 0;
  let passingSubjects = 0;
  const totalSubjects = Object.keys(gradesBySubject).length;
  
  for (const [subjectId, grades] of Object.entries(gradesBySubject)) {
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    const roundedAvg = Math.round(avg * 100) / 100;
    subjectAverages[subjectId] = roundedAvg;
    totalAverage += roundedAvg;
    if (roundedAvg >= 6) passingSubjects++;
  }
  
  const finalAverage = totalSubjects > 0 
    ? Math.round((totalAverage / totalSubjects) * 100) / 100 
    : null;
  
  return {
    finalAverage,
    gradesBySubject: subjectAverages,
    passingSubjects,
    totalSubjects,
  };
}

/**
 * Count sanctions for a student in a given year
 */
async function countSanctions(
  schoolId: string,
  studentId: string,
  academicYear: number
): Promise<number> {
  const behaviorRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("behavior");
  
  const sanctionsSnap = await behaviorRef
    .where("studentId", "==", studentId)
    .where("academicYear", "==", academicYear)
    .where("type", "==", "SANCTION")
    .get();
  
  return sanctionsSnap.size;
}

/**
 * Create an immutable performance snapshot
 */
async function createPerformanceSnapshot(
  schoolId: string,
  studentId: string,
  academicYear: number
): Promise<PerformanceSnapshot> {
  const [attendance, grades, sanctions] = await Promise.all([
    calculateAttendanceRate(schoolId, studentId, academicYear),
    getGradesSummary(schoolId, studentId, academicYear),
    countSanctions(schoolId, studentId, academicYear),
  ]);
  
  return {
    finalAverage: grades.finalAverage,
    totalAbsences: attendance.totalAbsences,
    attendanceRate: attendance.attendanceRate,
    totalSanctions: sanctions,
    passingSubjects: grades.passingSubjects,
    totalSubjects: grades.totalSubjects,
    gradesBySubject: grades.gradesBySubject,
  };
}

/**
 * Process a single student promotion
 */
async function promoteStudent(
  batch: FirebaseFirestore.WriteBatch,
  schoolId: string,
  studentId: string,
  studentData: Student,
  targetLevel: CourseLevel,
  targetCourseId: string,
  targetCourseName: string,
  targetDivisionId: string,
  targetDivisionName: string,
  academicYear: number,
  closureNote: string | undefined,
  userId: string
): Promise<void> {
  // Create performance snapshot
  const performanceSnapshot = await createPerformanceSnapshot(
    schoolId,
    studentId,
    academicYear
  );
  
  // Create immutable transfer record
  const transferRecord: TransferRecord = {
    fromLevel: studentData.academic.level,
    fromCourseId: studentData.academic.currentCourseId,
    fromCourseName: studentData.academic.currentCourseName,
    fromDivisionId: studentData.academic.currentDivisionId,
    fromDivisionName: studentData.academic.currentDivisionName,
    academicYear: academicYear,
    transferDate: Timestamp.now(),
    transferredBy: userId,
    performanceSnapshot,
    closureNote: closureNote,
    closureNoteBy: closureNote ? userId : undefined,
  };
  
  // Prepare student update
  const studentRef = db
    .collection("schools")
    .doc(schoolId)
    .collection("students")
    .doc(studentId);
  
  const updateData = {
    // Update academic placement
    "academic.level": targetLevel,
    "academic.currentCourseId": targetCourseId,
    "academic.currentCourseName": targetCourseName,
    "academic.currentDivisionId": targetDivisionId,
    "academic.currentDivisionName": targetDivisionName,
    "academic.currentYear": academicYear + 1,
    
    // Reset active stats (but keep identity and medical intact)
    "stats.totalAbsences": 0,
    "stats.totalTardies": 0,
    "stats.absencesByPeriod": {},
    "stats.averageGrade": null,
    "stats.behaviorIncidents": 0,
    "stats.unacknowledgedSanctions": 0,
    
    // Add transfer record to history
    previousLevels: FieldValue.arrayUnion(transferRecord),
    
    // Audit
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  batch.update(studentRef, updateData);
  
  // Log to audit collection
  const auditRef = db.collection("_promotionAuditLog").doc();
  batch.set(auditRef, {
    id: auditRef.id,
    schoolId,
    studentId,
    studentName: `${studentData.identity.lastName}, ${studentData.identity.firstName}`,
    studentDni: studentData.identity.dni,
    fromLevel: studentData.academic.level,
    toLevel: targetLevel,
    fromCourse: studentData.academic.currentCourseName,
    toCourse: targetCourseName,
    academicYear,
    performanceSnapshot,
    closureNote,
    promotedBy: userId,
    promotedAt: FieldValue.serverTimestamp(),
  });
}

// ============================================
// MAIN CALLABLE FUNCTION
// ============================================

export const promoteStudentsToLevel = onCall<PromoteStudentsRequest>(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (request): Promise<PromotionResult> => {
    // Validate authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesion");
    }
    
    const userId = request.auth.uid;
    const {
      schoolId,
      studentIds,
      sourceLevel,
      targetLevel,
      targetCourseId,
      targetCourseName,
      targetDivisionId,
      targetDivisionName,
      academicYear,
      closureNotes,
    } = request.data;
    
    // Validate input
    if (!schoolId || !studentIds || studentIds.length === 0) {
      throw new HttpsError("invalid-argument", "Datos de entrada invalidos");
    }
    
    if (!targetLevel || !targetCourseId || !targetDivisionId) {
      throw new HttpsError("invalid-argument", "Destino no especificado");
    }
    
    // Validate permissions
    await validateUserPermissions(userId, schoolId, sourceLevel, targetLevel);
    
    // Process students in batches (Firestore limit: 500 writes per batch)
    const results: PromotionResult["results"] = [];
    const batches: FirebaseFirestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let operationsInBatch = 0;
    const MAX_OPERATIONS_PER_BATCH = 250; // 2 writes per student
    
    for (const studentId of studentIds) {
      try {
        // Get student data
        const studentRef = db
          .collection("schools")
          .doc(schoolId)
          .collection("students")
          .doc(studentId);
        
        const studentDoc = await studentRef.get();
        
        if (!studentDoc.exists) {
          results.push({
            studentId,
            studentName: "Desconocido",
            status: "FAILED",
            error: "Alumno no encontrado",
          });
          continue;
        }
        
        const studentData = studentDoc.data() as Student;
        
        // Validate student is in the expected source level
        if (studentData.academic.level !== sourceLevel) {
          results.push({
            studentId,
            studentName: `${studentData.identity.lastName}, ${studentData.identity.firstName}`,
            status: "FAILED",
            error: `Alumno no pertenece al nivel de origen (${sourceLevel})`,
          });
          continue;
        }
        
        // Check if we need a new batch
        if (operationsInBatch >= MAX_OPERATIONS_PER_BATCH) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationsInBatch = 0;
        }
        
        // Process promotion
        await promoteStudent(
          currentBatch,
          schoolId,
          studentId,
          studentData,
          targetLevel,
          targetCourseId,
          targetCourseName,
          targetDivisionId,
          targetDivisionName,
          academicYear,
          closureNotes?.[studentId],
          userId
        );
        
        operationsInBatch += 2; // Student update + audit log
        
        results.push({
          studentId,
          studentName: `${studentData.identity.lastName}, ${studentData.identity.firstName}`,
          status: "SUCCESS",
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        results.push({
          studentId,
          studentName: "Error",
          status: "FAILED",
          error: errorMessage,
        });
      }
    }
    
    // Add final batch if it has operations
    if (operationsInBatch > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    try {
      await Promise.all(batches.map((batch) => batch.commit()));
    } catch (error) {
      console.error("[promoteStudentsToLevel] Batch commit failed:", error);
      throw new HttpsError(
        "internal",
        "Error al guardar los cambios. Algunos alumnos pueden no haberse procesado."
      );
    }
    
    const processedCount = results.filter((r) => r.status === "SUCCESS").length;
    const failedCount = results.filter((r) => r.status === "FAILED").length;
    
    console.log(
      `[promoteStudentsToLevel] Completed: ${processedCount} success, ${failedCount} failed`
    );
    
    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      results,
    };
  }
);
