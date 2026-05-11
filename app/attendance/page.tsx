"use client";

import { AttendancePage } from "@/components/attendance";
import type {
  StudentAttendance,
  CourseInfo,
  AttendanceSubmission,
  LicenseFormData,
} from "@/lib/types/attendance";

// ============================================
// MOCK DATA - Replace with real Firestore data
// ============================================

const MOCK_COURSE: CourseInfo = {
  id: "course-4b",
  name: "4° Año",
  year: 4,
  divisionId: "div-b",
  divisionName: "B",
  shift: "MORNING",
  studentCount: 30,
};

const MOCK_STUDENTS: StudentAttendance[] = [
  {
    id: "student-1",
    firstName: "Martín",
    lastName: "Álvarez",
    enrollmentNumber: "2024-001",
    status: "PRESENT",
    stats: { totalAbsences: 3, totalTardies: 2 },
  },
  {
    id: "student-2",
    firstName: "Luciana",
    lastName: "Benítez",
    enrollmentNumber: "2024-002",
    status: "PRESENT",
    stats: { totalAbsences: 1, totalTardies: 0 },
  },
  {
    id: "student-3",
    firstName: "Santiago",
    lastName: "Cabrera",
    enrollmentNumber: "2024-003",
    status: "PRESENT",
    stats: { totalAbsences: 16.5, totalTardies: 5 },
  },
  {
    id: "student-4",
    firstName: "Valentina",
    lastName: "Domínguez",
    enrollmentNumber: "2024-004",
    status: "PRESENT",
    licenseMode: {
      isActive: true,
      reason: "Cirugía programada",
      category: "HEALTH",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-03-15"),
      approvedBy: "preceptor-1",
      notifyOnEnd: false,
    },
    stats: { totalAbsences: 8, totalTardies: 1 },
  },
  {
    id: "student-5",
    firstName: "Tomás",
    lastName: "Fernández",
    enrollmentNumber: "2024-005",
    status: "PRESENT",
    stats: { totalAbsences: 0, totalTardies: 0 },
  },
  {
    id: "student-6",
    firstName: "Camila",
    lastName: "García",
    enrollmentNumber: "2024-006",
    status: "PRESENT",
    stats: { totalAbsences: 5.5, totalTardies: 3 },
  },
  {
    id: "student-7",
    firstName: "Nicolás",
    lastName: "González",
    enrollmentNumber: "2024-007",
    status: "PRESENT",
    stats: { totalAbsences: 2, totalTardies: 1 },
  },
  {
    id: "student-8",
    firstName: "Sofía",
    lastName: "Herrera",
    enrollmentNumber: "2024-008",
    status: "PRESENT",
    stats: { totalAbsences: 21, totalTardies: 8 },
  },
  {
    id: "student-9",
    firstName: "Mateo",
    lastName: "Ibáñez",
    enrollmentNumber: "2024-009",
    status: "PRESENT",
    stats: { totalAbsences: 4, totalTardies: 2 },
  },
  {
    id: "student-10",
    firstName: "Isabella",
    lastName: "Jiménez",
    enrollmentNumber: "2024-010",
    status: "PRESENT",
    stats: { totalAbsences: 0.5, totalTardies: 1 },
  },
  {
    id: "student-11",
    firstName: "Benjamín",
    lastName: "Klein",
    enrollmentNumber: "2024-011",
    status: "PRESENT",
    stats: { totalAbsences: 7, totalTardies: 4 },
  },
  {
    id: "student-12",
    firstName: "Emma",
    lastName: "López",
    enrollmentNumber: "2024-012",
    status: "PRESENT",
    stats: { totalAbsences: 2.5, totalTardies: 0 },
  },
  {
    id: "student-13",
    firstName: "Lautaro",
    lastName: "Martínez",
    enrollmentNumber: "2024-013",
    status: "PRESENT",
    stats: { totalAbsences: 9, totalTardies: 3 },
  },
  {
    id: "student-14",
    firstName: "Mía",
    lastName: "Navarro",
    enrollmentNumber: "2024-014",
    status: "PRESENT",
    stats: { totalAbsences: 1, totalTardies: 1 },
  },
  {
    id: "student-15",
    firstName: "Thiago",
    lastName: "Ortega",
    enrollmentNumber: "2024-015",
    status: "PRESENT",
    stats: { totalAbsences: 14, totalTardies: 6 },
  },
  {
    id: "student-16",
    firstName: "Olivia",
    lastName: "Pérez",
    enrollmentNumber: "2024-016",
    status: "PRESENT",
    stats: { totalAbsences: 3.5, totalTardies: 2 },
  },
  {
    id: "student-17",
    firstName: "Felipe",
    lastName: "Quiroga",
    enrollmentNumber: "2024-017",
    status: "PRESENT",
    stats: { totalAbsences: 6, totalTardies: 1 },
  },
  {
    id: "student-18",
    firstName: "Victoria",
    lastName: "Rodríguez",
    enrollmentNumber: "2024-018",
    status: "PRESENT",
    stats: { totalAbsences: 0, totalTardies: 2 },
  },
  {
    id: "student-19",
    firstName: "Joaquín",
    lastName: "Sánchez",
    enrollmentNumber: "2024-019",
    status: "PRESENT",
    licenseMode: {
      isActive: true,
      reason: "Viaje familiar",
      category: "TRAVEL",
      startDate: new Date("2024-03-10"),
      endDate: new Date("2024-03-20"),
      approvedBy: "preceptor-1",
      notifyOnEnd: true,
    },
    stats: { totalAbsences: 4.5, totalTardies: 0 },
  },
  {
    id: "student-20",
    firstName: "Alma",
    lastName: "Torres",
    enrollmentNumber: "2024-020",
    status: "PRESENT",
    stats: { totalAbsences: 2, totalTardies: 3 },
  },
  {
    id: "student-21",
    firstName: "Bruno",
    lastName: "Vargas",
    enrollmentNumber: "2024-021",
    status: "PRESENT",
    stats: { totalAbsences: 11, totalTardies: 5 },
  },
  {
    id: "student-22",
    firstName: "Delfina",
    lastName: "Weiss",
    enrollmentNumber: "2024-022",
    status: "PRESENT",
    stats: { totalAbsences: 1.5, totalTardies: 1 },
  },
  {
    id: "student-23",
    firstName: "Facundo",
    lastName: "Yáñez",
    enrollmentNumber: "2024-023",
    status: "PRESENT",
    stats: { totalAbsences: 5, totalTardies: 2 },
  },
  {
    id: "student-24",
    firstName: "Catalina",
    lastName: "Zarate",
    enrollmentNumber: "2024-024",
    status: "PRESENT",
    stats: { totalAbsences: 0, totalTardies: 0 },
  },
  {
    id: "student-25",
    firstName: "Ignacio",
    lastName: "Acosta",
    enrollmentNumber: "2024-025",
    status: "PRESENT",
    stats: { totalAbsences: 8.5, totalTardies: 4 },
  },
  {
    id: "student-26",
    firstName: "Renata",
    lastName: "Blanco",
    enrollmentNumber: "2024-026",
    status: "PRESENT",
    stats: { totalAbsences: 3, totalTardies: 1 },
  },
  {
    id: "student-27",
    firstName: "Agustín",
    lastName: "Castro",
    enrollmentNumber: "2024-027",
    status: "PRESENT",
    stats: { totalAbsences: 17, totalTardies: 7 },
  },
  {
    id: "student-28",
    firstName: "Emilia",
    lastName: "Díaz",
    enrollmentNumber: "2024-028",
    status: "PRESENT",
    stats: { totalAbsences: 2, totalTardies: 0 },
  },
  {
    id: "student-29",
    firstName: "Máximo",
    lastName: "Espinoza",
    enrollmentNumber: "2024-029",
    status: "PRESENT",
    stats: { totalAbsences: 6.5, totalTardies: 3 },
  },
  {
    id: "student-30",
    firstName: "Julieta",
    lastName: "Flores",
    enrollmentNumber: "2024-030",
    status: "PRESENT",
    stats: { totalAbsences: 4, totalTardies: 2 },
  },
];

// ============================================
// MOCK HANDLERS - Replace with real API calls
// ============================================

async function handleSubmit(submission: AttendanceSubmission): Promise<void> {
  // Simulate API call to bulk-record endpoint
  console.log("[v0] Submitting attendance:", submission);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // In production, this would call:
  // await fetch('/api/attendance/bulk-record', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(submission),
  // });
  
  alert("Asistencia registrada correctamente. Se han enviado las notificaciones.");
}

async function handleSaveLicense(data: LicenseFormData): Promise<void> {
  // Simulate API call to save license
  console.log("[v0] Saving license:", data);
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // In production, this would update:
  // /schools/{schoolId}/students/{studentId} -> licenseMode field
}

async function handleDeactivateLicense(studentId: string): Promise<void> {
  // Simulate API call to deactivate license
  console.log("[v0] Deactivating license for student:", studentId);
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // In production, this would update:
  // /schools/{schoolId}/students/{studentId} -> licenseMode.isActive = false
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function AttendancePageDemo() {
  return (
    <AttendancePage
      initialStudents={MOCK_STUDENTS}
      course={MOCK_COURSE}
      schoolId="school-demo-123"
      periodId="T1"
      userId="preceptor-1"
      onSubmit={handleSubmit}
      onSaveLicense={handleSaveLicense}
      onDeactivateLicense={handleDeactivateLicense}
    />
  );
}
