"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SanctionForm } from "@/components/behavior/sanction-form";
import type { BehaviorFormData, StudentOption } from "@/lib/types/behavior";

// Mock students for demo
const MOCK_STUDENTS: StudentOption[] = [
  {
    id: "st-001",
    firstName: "Joaquin",
    lastName: "Martinez",
    enrollmentNumber: "2024-001",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-002",
    firstName: "Valentina",
    lastName: "Rodriguez",
    enrollmentNumber: "2024-002",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-003",
    firstName: "Tomas",
    lastName: "Fernandez",
    enrollmentNumber: "2024-003",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-004",
    firstName: "Camila",
    lastName: "Lopez",
    enrollmentNumber: "2024-004",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-005",
    firstName: "Lucas",
    lastName: "Garcia",
    enrollmentNumber: "2024-005",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-006",
    firstName: "Sofia",
    lastName: "Perez",
    enrollmentNumber: "2024-006",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-007",
    firstName: "Mateo",
    lastName: "Gonzalez",
    enrollmentNumber: "2024-007",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
  {
    id: "st-008",
    firstName: "Isabella",
    lastName: "Sanchez",
    enrollmentNumber: "2024-008",
    courseName: "4to Ano",
    divisionName: "B",
    photoUrl: undefined,
  },
];

export default function SanctionsPage() {
  const [mounted, setMounted] = useState(false);
  const [lastSubmittedHash, setLastSubmittedHash] = useState<string | null>(null);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (data: BehaviorFormData) => {
    // Simulate API call with hash generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock hash
    const mockHash = `SQ-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    setLastSubmittedHash(mockHash);

    console.log("Sanction submitted:", {
      ...data,
      generatedHash: mockHash,
      contentLocked: true,
    });

    return {
      success: true,
      hash: mockHash,
    };
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Libro de Convivencia</h1>
          <p className="text-sm text-muted-foreground">4to Ano &quot;B&quot; - Turno Manana</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-md shadow-lg">
        <SanctionForm
          students={MOCK_STUDENTS}
          schoolId="school-001"
          courseId="course-4b"
          onSubmit={handleSubmit}
        />
      </main>

      {/* Hash confirmation display */}
      {lastSubmittedHash && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-2 font-medium text-primary">Registro Confirmado</h3>
          <p className="text-xs text-muted-foreground font-mono">
            Hash de integridad: {lastSubmittedHash}
          </p>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "glass-subtle",
          duration: 5000,
        }}
      />
    </div>
  );
}
