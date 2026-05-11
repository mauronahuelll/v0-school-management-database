"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout";
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
  const [lastSubmittedHash, setLastSubmittedHash] = useState<string | null>(null);

  const handleSubmit = async (data: BehaviorFormData) => {
    // Simulate API call with hash generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock hash
    const mockHash = `SQ-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    setLastSubmittedHash(mockHash);

    console.log("[v0] Sanction submitted:", {
      ...data,
      generatedHash: mockHash,
      contentLocked: true,
    });

    return {
      success: true,
      hash: mockHash,
    };
  };

  return (
    <AppShell schoolName="Escuela Tecnica N°5">
      {/* Page Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Libro de Convivencia
              </h1>
              <p className="text-sm text-muted-foreground">
                4to Ano &quot;B&quot; - Turno Manana
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <SanctionForm
          students={MOCK_STUDENTS}
          schoolId="school-001"
          courseId="course-4b"
          onSubmit={handleSubmit}
        />
      </main>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "glass-subtle",
          duration: 5000,
        }}
      />
    </AppShell>
  );
}
