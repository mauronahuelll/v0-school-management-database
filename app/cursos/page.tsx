"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, GraduationCap } from "lucide-react";

const MOCK_CURSOS = [
  { id: "1", name: "6to Ano - Division B", level: "SECONDARY", students: 27, shift: "Manana" },
  { id: "2", name: "5to Ano - Division A", level: "SECONDARY", students: 24, shift: "Manana" },
  { id: "3", name: "4to Ano - Division A", level: "SECONDARY", students: 28, shift: "Tarde" },
  { id: "4", name: "3er Ano - Division B", level: "SECONDARY", students: 25, shift: "Tarde" },
];

export default function CursosPage() {
  // Hydration guard
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion de Cursos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra los cursos y divisiones de la institucion
        </p>
      </header>

      <div className="grid gap-4">
        {MOCK_CURSOS.map((curso) => (
          <div
            key={curso.id}
            className="glass-panel rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{curso.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Turno {curso.shift} - Ciclo Lectivo 2024
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{curso.students} estudiantes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="size-4" />
                  <span className="text-xs font-mono uppercase tracking-widest text-primary">{curso.level}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
