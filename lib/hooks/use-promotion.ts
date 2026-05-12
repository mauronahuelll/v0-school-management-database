"use client";

import { useState, useCallback } from "react";
import type { CourseLevel } from "@/lib/types/school-context";

// ============================================
// TYPES
// ============================================

export interface PromoteStudentsRequest {
  schoolId: string;
  studentIds: string[];
  sourceLevel: CourseLevel;
  targetLevel: CourseLevel;
  targetCourseId: string;
  targetCourseName: string;
  targetDivisionId: string;
  targetDivisionName: string;
  academicYear: number;
  closureNotes?: Record<string, string>;
}

export interface PromotionResultItem {
  studentId: string;
  studentName: string;
  status: "SUCCESS" | "FAILED";
  error?: string;
}

export interface PromotionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: PromotionResultItem[];
}

export interface UsePromotionReturn {
  isLoading: boolean;
  error: string | null;
  result: PromotionResult | null;
  promoteStudents: (request: PromoteStudentsRequest) => Promise<PromotionResult>;
  reset: () => void;
}

// ============================================
// MOCK IMPLEMENTATION (Replace with Firebase callable)
// ============================================

/**
 * Simulates the Cloud Function call for demo purposes.
 * In production, this would call Firebase Functions.
 */
async function mockPromoteStudents(
  request: PromoteStudentsRequest
): Promise<PromotionResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  const results: PromotionResultItem[] = [];
  
  for (const studentId of request.studentIds) {
    // Simulate occasional failures for demo
    const willFail = Math.random() < 0.05; // 5% failure rate
    
    results.push({
      studentId,
      studentName: `Alumno ${studentId}`,
      status: willFail ? "FAILED" : "SUCCESS",
      error: willFail ? "Error de conexion simulado" : undefined,
    });
    
    // Simulate per-student processing time
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  
  const processedCount = results.filter((r) => r.status === "SUCCESS").length;
  const failedCount = results.filter((r) => r.status === "FAILED").length;
  
  return {
    success: failedCount === 0,
    processedCount,
    failedCount,
    results,
  };
}

// ============================================
// HOOK
// ============================================

export function usePromotion(): UsePromotionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromotionResult | null>(null);
  
  const promoteStudents = useCallback(
    async (request: PromoteStudentsRequest): Promise<PromotionResult> => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      try {
        // Validate input
        if (!request.studentIds || request.studentIds.length === 0) {
          throw new Error("No hay alumnos seleccionados");
        }
        
        if (!request.targetLevel || !request.targetCourseId) {
          throw new Error("Destino no especificado");
        }
        
        // In production, this would be:
        // const functions = getFunctions();
        // const promoteStudentsToLevel = httpsCallable(functions, "promoteStudentsToLevel");
        // const response = await promoteStudentsToLevel(request);
        // const result = response.data as PromotionResult;
        
        // For demo, use mock implementation
        const promotionResult = await mockPromoteStudents(request);
        
        setResult(promotionResult);
        
        if (!promotionResult.success) {
          setError(
            `Se procesaron ${promotionResult.processedCount} alumnos, ` +
            `pero ${promotionResult.failedCount} fallaron`
          );
        }
        
        return promotionResult;
        
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Error desconocido al procesar la promocion";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);
  
  return {
    isLoading,
    error,
    result,
    promoteStudents,
    reset,
  };
}
