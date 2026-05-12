"use client";

import { use } from "react";
import { toast } from "sonner";
import { Student360View } from "@/components/student";
import { AppShell } from "@/components/layout";
import type { Student360Data, TimelineEvent } from "@/lib/types/student";

// ============================================
// MOCK DATA FOR DEMO
// ============================================

function generateMockData(studentId: string): Student360Data {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  // Generate timeline events
  const events: TimelineEvent[] = [
    {
      id: "evt-1",
      type: "ATTENDANCE_ABSENT",
      date: new Date(now.getTime() - 2 * oneDay),
      title: "Inasistencia registrada",
      description: "El alumno no asistio a clases.",
      sourceCollection: "attendance",
      sourceDocId: "att-123",
      icon: "UserX",
      color: "absent",
      metadata: {
        attendanceStatus: "ABSENT",
        absenceValue: 1,
        isJustified: false,
      },
    },
    {
      id: "evt-2",
      type: "GRADE_PUBLISHED",
      date: new Date(now.getTime() - 3 * oneDay),
      title: "Nota publicada: Matematica",
      description: "Parcial 1 - Ecuaciones cuadraticas",
      sourceCollection: "grades",
      sourceDocId: "grade-456",
      icon: "BookOpen",
      color: "present",
      metadata: {
        subjectName: "Matematica",
        gradeValue: 8,
        assessmentName: "Parcial 1",
        isRecovery: false,
      },
    },
    {
      id: "evt-3",
      type: "BEHAVIOR_OBSERVATION",
      date: new Date(now.getTime() - 5 * oneDay),
      title: "Observacion positiva",
      description: "Excelente participacion en clase de Historia. Demostro liderazgo en el trabajo grupal.",
      sourceCollection: "behavior",
      sourceDocId: "beh-789",
      icon: "MessageSquare",
      color: "success",
      metadata: {
        category: "Participacion",
        isPositive: true,
      },
    },
    {
      id: "evt-4",
      type: "ATTENDANCE_TARDY",
      date: new Date(now.getTime() - 7 * oneDay),
      title: "Llegada tarde",
      description: "Ingreso 15 minutos tarde a primera hora.",
      sourceCollection: "attendance",
      sourceDocId: "att-124",
      icon: "Clock",
      color: "tardy",
      metadata: {
        attendanceStatus: "TARDY",
        absenceValue: 0.5,
      },
    },
    {
      id: "evt-5",
      type: "GRADE_PUBLISHED",
      date: new Date(now.getTime() - 10 * oneDay),
      title: "Nota publicada: Lengua",
      description: "Trabajo Practico - Analisis literario",
      sourceCollection: "grades",
      sourceDocId: "grade-457",
      icon: "BookOpen",
      color: "absent",
      metadata: {
        subjectName: "Lengua y Literatura",
        gradeValue: 5,
        assessmentName: "TP 1",
        isRecovery: false,
      },
    },
    {
      id: "evt-6",
      type: "BEHAVIOR_SANCTION",
      date: new Date(now.getTime() - 12 * oneDay),
      title: "Apercibimiento",
      description: "Uso de celular durante evaluacion.",
      sourceCollection: "behavior",
      sourceDocId: "beh-790",
      icon: "AlertTriangle",
      color: "warning",
      metadata: {
        category: "Conducta",
        severity: 2,
        isPositive: false,
        requiresAcknowledgment: true,
        acknowledgmentStatus: "ACKNOWLEDGED",
      },
    },
    {
      id: "evt-7",
      type: "ATTENDANCE_JUSTIFIED",
      date: new Date(now.getTime() - 15 * oneDay),
      title: "Falta justificada",
      description: "Turno medico programado. Certificado presentado.",
      sourceCollection: "attendance",
      sourceDocId: "att-125",
      icon: "FileCheck",
      color: "muted",
      metadata: {
        attendanceStatus: "ABSENT",
        absenceValue: 0,
        isJustified: true,
      },
    },
    {
      id: "evt-8",
      type: "GRADE_RECOVERY",
      date: new Date(now.getTime() - 18 * oneDay),
      title: "Recuperatorio aprobado: Lengua",
      description: "Recupero satisfactoriamente el TP 1.",
      sourceCollection: "grades",
      sourceDocId: "grade-458",
      icon: "RefreshCw",
      color: "primary",
      metadata: {
        subjectName: "Lengua y Literatura",
        gradeValue: 7,
        assessmentName: "Recuperatorio TP 1",
        isRecovery: true,
      },
    },
    {
      id: "evt-9",
      type: "BEHAVIOR_MERIT",
      date: new Date(now.getTime() - 20 * oneDay),
      title: "Merito academico",
      description: "Reconocimiento por mejor promedio del mes en Matematica.",
      sourceCollection: "behavior",
      sourceDocId: "beh-791",
      icon: "Award",
      color: "success",
      metadata: {
        category: "Merito",
        isPositive: true,
      },
    },
    {
      id: "evt-10",
      type: "ENROLLMENT",
      date: new Date(2024, 2, 1),
      title: "Inscripcion al ciclo lectivo",
      description: "Inscripcion confirmada para el ano academico 2024.",
      sourceCollection: "students",
      sourceDocId: studentId,
      icon: "Calendar",
      color: "primary",
    },
  ];

  return {
    profile: {
      id: studentId,
      schoolId: "school-demo-123",
      firstName: "Joaquin",
      lastName: "Martinez",
      dni: "45.678.912",
      birthDate: new Date(2008, 5, 15),
      gender: "M",
      photoUrl: undefined,
      enrollmentNumber: "2024-0042",
      courseId: "course-4b",
      courseName: "4to Ano",
      divisionId: "div-b",
      divisionName: "B",
      shift: "MORNING",
      academicYear: 2024,
      status: "ACTIVE",
      enrolledAt: new Date(2024, 2, 1),
    },
    stats: {
      attendance: {
        totalAbsences: 8.5,
        totalTardies: 4,
        absenceLimit: 25,
        absencesByPeriod: {
          T1: 5,
          T2: 3.5,
        },
        attendanceRate: 92,
        daysPresent: 85,
        totalDays: 92,
      },
      grades: {
        generalAverage: 7.45,
        averagesBySubject: [
          { subjectId: "mat", subjectName: "Matematica", average: 8.2, isPassing: true, trend: "UP" },
          { subjectId: "len", subjectName: "Lengua y Lit.", average: 6.8, isPassing: true, trend: "STABLE" },
          { subjectId: "his", subjectName: "Historia", average: 7.5, isPassing: true, trend: "UP" },
          { subjectId: "geo", subjectName: "Geografia", average: 7.0, isPassing: true, trend: "DOWN" },
          { subjectId: "bio", subjectName: "Biologia", average: 8.0, isPassing: true, trend: "STABLE" },
          { subjectId: "fis", subjectName: "Fisica", average: 5.5, isPassing: false, trend: "DOWN" },
          { subjectId: "ing", subjectName: "Ingles", average: 9.0, isPassing: true, trend: "UP" },
          { subjectId: "edf", subjectName: "Ed. Fisica", average: 8.5, isPassing: true, trend: "STABLE" },
        ],
        passingSubjects: 7,
        totalSubjects: 8,
      },
      behavior: {
        totalObservations: 5,
        positiveObservations: 3,
        negativeObservations: 2,
        totalSanctions: 1,
        pendingAcknowledgments: 0,
        lastIncidentDate: new Date(now.getTime() - 12 * oneDay),
      },
    },
    medical: {
      bloodType: "A+",
      allergies: ["Penicilina", "Frutos secos"],
      chronicConditions: ["Asma leve"],
      medications: ["Salbutamol (inhalador, segun necesidad)"],
      healthInsurance: {
        provider: "OSDE",
        memberId: "123456789",
      },
      emergencyNotes: "En caso de crisis asmatica, administrar 2 puffs de Salbutamol y llamar al contacto de emergencia.",
    },
    tutors: [
      {
        id: "tutor-1",
        name: "Maria Laura Gonzalez",
        relationship: "MOTHER",
        phone: "+54 11 5555-1234",
        email: "mlaura.gonzalez@email.com",
        isPrimaryContact: true,
        isVerified: true,
      },
      {
        id: "tutor-2",
        name: "Carlos Alberto Martinez",
        relationship: "FATHER",
        phone: "+54 11 5555-5678",
        email: "carlos.martinez@email.com",
        isPrimaryContact: false,
        isVerified: true,
      },
      {
        id: "tutor-3",
        name: "Ana Rosa Martinez",
        relationship: "GRANDPARENT",
        phone: "+54 11 5555-9999",
        isPrimaryContact: false,
        isVerified: false,
      },
    ],
    timeline: events,
    currentPeriod: {
      id: "T2",
      name: "Segundo Trimestre",
    },
  };
}

// ============================================
// PAGE COMPONENT
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentPage({ params }: PageProps) {
  const { id } = use(params);
  const studentData = generateMockData(id);

  const handleExportPDF = () => {
    toast.success("Preparando exportacion...", {
      description: "El legajo PDF se descargara en breve.",
    });
    // TODO: Implement actual PDF export
  };

  return (
    <AppShell schoolName="Escuela Tecnica N°5">
      <Student360View
        data={studentData}
        backUrl="/attendance"
        onExportPDF={handleExportPDF}
      />
    </AppShell>
  );
}
