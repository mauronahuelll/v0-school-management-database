"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { WizardStepper } from "./wizard-stepper";
import { SourceSelection } from "./steps/source-selection";
import { StudentAudit } from "./steps/student-audit";
import { DestinationConfig } from "./steps/destination-config";
import { Execution } from "./steps/execution";
import {
  type PromotionStep,
  type PromotionWizardState,
  type StudentAuditData,
  INITIAL_WIZARD_STATE,
  getNextStep,
  getPreviousStep,
  calculateEligibility,
} from "@/lib/types/promotion";
import type { CourseLevel, Course, Division } from "@/lib/types/school-context";

// ============================================
// PROMOTION WIZARD - Main Orchestrator
// ============================================

// Mock students for demonstration
const generateMockStudents = (count: number, courseId: string): StudentAuditData[] => {
  const firstNames = [
    "Lucia", "Mateo", "Valentina", "Santiago", "Camila",
    "Benjamin", "Sofia", "Nicolas", "Isabella", "Tomas",
    "Martina", "Lautaro", "Emilia", "Joaquin", "Mia",
    "Bautista", "Catalina", "Felipe", "Julieta", "Agustin",
  ];
  
  const lastNames = [
    "Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez",
    "Perez", "Sanchez", "Ramirez", "Torres", "Flores",
    "Rivera", "Gomez", "Diaz", "Reyes", "Morales",
    "Ortiz", "Silva", "Castro", "Romero", "Vargas",
  ];

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    
    const finalAverage = Math.round((Math.random() * 4 + 5) * 10) / 10; // 5.0 - 9.0
    const attendanceRate = Math.round(Math.random() * 30 + 70); // 70% - 100%
    const totalSanctions = Math.floor(Math.random() * 5);
    const passingSubjects = Math.floor(Math.random() * 3) + 8; // 8-10
    const totalSubjects = 10;

    const stats = {
      finalAverage,
      attendanceRate,
      totalAbsences: Math.round((100 - attendanceRate) * 1.8),
      totalSanctions,
      passingSubjects,
      totalSubjects,
    };

    const eligibility = calculateEligibility(stats);

    return {
      id: `student-${courseId}-${i + 1}`,
      firstName,
      lastName,
      dni: `${40000000 + i * 123456}`,
      enrollmentNumber: `${2024}${String(i + 1).padStart(4, "0")}`,
      currentLevel: "PRIMARY" as CourseLevel,
      currentCourseId: courseId,
      currentCourseName: "6° Grado",
      currentDivisionId: "primary-6-a",
      currentDivisionName: "A",
      stats,
      isEligible: eligibility.isEligible,
      eligibilityNotes: eligibility.notes,
      closureNote: "",
      isSelected: false,
    };
  });
};

export function PromotionWizard() {
  const [state, setState] = useState<PromotionWizardState>(INITIAL_WIZARD_STATE);

  // ============================================
  // STEP 1: Source Selection
  // ============================================

  const handleSourceLevelChange = useCallback((level: CourseLevel) => {
    setState((prev) => ({
      ...prev,
      sourceLevel: level,
      sourceCourse: null,
      sourceDivision: null,
      students: [],
      selectedStudentIds: [],
    }));
  }, []);

  const handleSourceCourseChange = useCallback((course: Course) => {
    setState((prev) => ({
      ...prev,
      sourceCourse: course,
    }));
  }, []);

  const handleSourceDivisionChange = useCallback((division: Division) => {
    setState((prev) => ({
      ...prev,
      sourceDivision: division,
      // Load mock students when division is selected
      students: generateMockStudents(division.studentCount, division.id),
      selectedStudentIds: [],
    }));
  }, []);

  // ============================================
  // STEP 2: Student Audit
  // ============================================

  const handleSelectionChange = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedStudentIds: ids,
    }));
  }, []);

  const handleClosureNoteChange = useCallback(
    (studentId: string, note: string) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, closureNote: note } : s
        ),
      }));
    },
    []
  );

  // ============================================
  // STEP 3: Destination Config
  // ============================================

  const handleDestinationLevelChange = useCallback((level: CourseLevel) => {
    setState((prev) => ({
      ...prev,
      destinationLevel: level,
      destinationCourse: null,
      destinationDivision: null,
    }));
  }, []);

  const handleDestinationCourseChange = useCallback((course: Course) => {
    setState((prev) => ({
      ...prev,
      destinationCourse: course,
    }));
  }, []);

  const handleDestinationDivisionChange = useCallback((division: Division) => {
    setState((prev) => ({
      ...prev,
      destinationDivision: division,
    }));
  }, []);

  // ============================================
  // STEP 4: Execution
  // ============================================

  const handleExecute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: "IN_PROGRESS",
      processedCount: 0,
      totalCount: prev.selectedStudentIds.length,
      errors: [],
    }));

    // Simulate processing with delay
    const total = state.selectedStudentIds.length;
    for (let i = 0; i < total; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setState((prev) => ({
        ...prev,
        processedCount: i + 1,
      }));
    }

    // Simulate success
    setState((prev) => ({
      ...prev,
      status: "COMPLETED",
    }));
  }, [state.selectedStudentIds.length]);

  const handleReset = useCallback(() => {
    setState(INITIAL_WIZARD_STATE);
  }, []);

  // ============================================
  // NAVIGATION
  // ============================================

  const goToNextStep = useCallback(() => {
    const nextStep = getNextStep(state.currentStep);
    if (nextStep) {
      setState((prev) => ({ ...prev, currentStep: nextStep }));
    }
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    const prevStep = getPreviousStep(state.currentStep);
    if (prevStep) {
      setState((prev) => ({ ...prev, currentStep: prevStep }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: PromotionStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Get completed steps for stepper
  const getCompletedSteps = (): PromotionStep[] => {
    const completed: PromotionStep[] = [];
    
    if (state.sourceLevel && state.sourceCourse && state.sourceDivision) {
      completed.push("SOURCE_SELECTION");
    }
    if (state.selectedStudentIds.length > 0) {
      completed.push("STUDENT_AUDIT");
    }
    if (state.destinationLevel && state.destinationCourse && state.destinationDivision) {
      completed.push("DESTINATION_CONFIG");
    }
    if (state.status === "COMPLETED") {
      completed.push("EXECUTION");
    }
    
    return completed;
  };

  // ============================================
  // RENDER
  // ============================================

  const selectedStudents = state.students.filter((s) =>
    state.selectedStudentIds.includes(s.id)
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground text-balance">
          Asistente de Promocion
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto text-pretty">
          Gestiona el pase de alumnos entre niveles educativos de forma segura y ordenada
        </p>
      </div>

      {/* Stepper */}
      <WizardStepper
        currentStep={state.currentStep}
        completedSteps={getCompletedSteps()}
        onStepClick={state.status === "PENDING" ? goToStep : undefined}
      />

      {/* Step Content */}
      <motion.div
        key={state.currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {state.currentStep === "SOURCE_SELECTION" && (
          <SourceSelection
            selectedLevel={state.sourceLevel}
            selectedCourse={state.sourceCourse}
            selectedDivision={state.sourceDivision}
            onLevelChange={handleSourceLevelChange}
            onCourseChange={handleSourceCourseChange}
            onDivisionChange={handleSourceDivisionChange}
            onNext={goToNextStep}
          />
        )}

        {state.currentStep === "STUDENT_AUDIT" && (
          <StudentAudit
            students={state.students}
            selectedIds={state.selectedStudentIds}
            onSelectionChange={handleSelectionChange}
            onClosureNoteChange={handleClosureNoteChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {state.currentStep === "DESTINATION_CONFIG" &&
          state.sourceLevel &&
          state.sourceCourse &&
          state.sourceDivision && (
            <DestinationConfig
              sourceLevel={state.sourceLevel}
              sourceCourse={state.sourceCourse}
              sourceDivision={state.sourceDivision}
              selectedCount={state.selectedStudentIds.length}
              destinationLevel={state.destinationLevel}
              destinationCourse={state.destinationCourse}
              destinationDivision={state.destinationDivision}
              onLevelChange={handleDestinationLevelChange}
              onCourseChange={handleDestinationCourseChange}
              onDivisionChange={handleDestinationDivisionChange}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}

        {state.currentStep === "EXECUTION" &&
          state.sourceLevel &&
          state.sourceCourse &&
          state.sourceDivision &&
          state.destinationLevel &&
          state.destinationCourse &&
          state.destinationDivision && (
            <Execution
              sourceLevel={state.sourceLevel}
              sourceCourse={state.sourceCourse}
              sourceDivision={state.sourceDivision}
              destinationLevel={state.destinationLevel}
              destinationCourse={state.destinationCourse}
              destinationDivision={state.destinationDivision}
              selectedStudents={selectedStudents}
              status={state.status}
              processedCount={state.processedCount}
              errors={state.errors}
              onExecute={handleExecute}
              onBack={goToPreviousStep}
              onReset={handleReset}
            />
          )}
      </motion.div>
    </div>
  );
}
