"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link href="/attendance">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">
                    Libro de Convivencia
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    4to Ano &quot;B&quot; · Turno Manana
                  </p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
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
    </div>
  );
}
