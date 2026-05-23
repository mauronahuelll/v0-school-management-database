"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, Calendar, Clock, GraduationCap } from "lucide-react";

const MOCK_COURSES = [
  { id: "1", name: "4to Ano A", students: 28, teacher: "Prof. Maria Gonzalez", subject: "Matematica" },
  { id: "2", name: "4to Ano B", students: 30, teacher: "Prof. Juan Martinez", subject: "Historia" },
  { id: "3", name: "5to Ano A", students: 25, teacher: "Prof. Ana Rodriguez", subject: "Literatura" },
  { id: "4", name: "5to Ano B", students: 27, teacher: "Prof. Carlos Lopez", subject: "Fisica" },
];

export default function CoursesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Modulo de Cursos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de divisiones, materias y asignaciones docentes
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_COURSES.map((course) => (
          <div
            key={course.id}
            className="p-5 bg-card/50 border border-border/50 rounded-2xl backdrop-blur-md hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Activo
              </span>
            </div>

            <h3 className="text-base font-bold text-foreground mb-1">{course.name}</h3>
            <p className="text-sm text-primary mb-3">{course.subject}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{course.students} alumnos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{course.teacher}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Funcionalidad de creacion y edicion de cursos en desarrollo activo.
        </p>
      </div>
    </div>
  );
}
