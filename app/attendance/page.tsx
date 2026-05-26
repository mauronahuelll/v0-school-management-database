"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { AttendancePage } from "@/components/attendance";
import { toast, Toaster } from "sonner";
import { 
  Users, 
  UserCheck, 
  Save, 
  Loader2,
  Search,
  Building2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  StudentAttendance,
  CourseInfo,
  AttendanceSubmission,
  LicenseFormData,
} from "@/lib/types/attendance";

// ============================================
// MOCK DATA - STUDENTS
// ============================================

const AVAILABLE_COURSES: CourseInfo[] = [
  {
    id: "course-4b",
    name: "4to Ano",
    year: 4,
    divisionId: "div-b",
    divisionName: "B",
    shift: "MORNING",
    studentCount: 30,
  },
  {
    id: "course-5a",
    name: "5to Ano",
    year: 5,
    divisionId: "div-a",
    divisionName: "A",
    shift: "MORNING",
    studentCount: 25,
  },
  {
    id: "course-3c",
    name: "3er Ano",
    year: 3,
    divisionId: "div-c",
    divisionName: "C",
    shift: "AFTERNOON",
    studentCount: 28,
  },
];

const MOCK_COURSE: CourseInfo = AVAILABLE_COURSES[0];

const MOCK_STUDENTS: StudentAttendance[] = [
  {
    id: "student-1",
    firstName: "Martin",
    lastName: "Alvarez",
    enrollmentNumber: "2024-001",
    status: "PRESENT",
    stats: { totalAbsences: 3, totalTardies: 2 },
  },
  {
    id: "student-2",
    firstName: "Luciana",
    lastName: "Benitez",
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
    lastName: "Dominguez",
    enrollmentNumber: "2024-004",
    status: "PRESENT",
    licenseMode: {
      isActive: true,
      reason: "Cirugia programada",
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
    firstName: "Tomas",
    lastName: "Fernandez",
    enrollmentNumber: "2024-005",
    status: "PRESENT",
    stats: { totalAbsences: 0, totalTardies: 0 },
  },
  {
    id: "student-6",
    firstName: "Camila",
    lastName: "Garcia",
    enrollmentNumber: "2024-006",
    status: "PRESENT",
    stats: { totalAbsences: 5.5, totalTardies: 3 },
  },
  {
    id: "student-7",
    firstName: "Nicolas",
    lastName: "Gonzalez",
    enrollmentNumber: "2024-007",
    status: "PRESENT",
    stats: { totalAbsences: 2, totalTardies: 1 },
  },
  {
    id: "student-8",
    firstName: "Sofia",
    lastName: "Herrera",
    enrollmentNumber: "2024-008",
    status: "PRESENT",
    stats: { totalAbsences: 21, totalTardies: 8 },
  },
];

// ============================================
// MOCK DATA - STAFF/PERSONNEL
// ============================================

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: "DOCENTE" | "PRECEPTOR" | "AUXILIAR";
  department: string;
  attendance: "PRESENT" | "ABSENT" | null;
  absenceReason: string | null;
}

const MOCK_STAFF: StaffMember[] = [
  { id: "staff-1", firstName: "Maria", lastName: "Rodriguez", role: "DOCENTE", department: "Matematica", attendance: null, absenceReason: null },
  { id: "staff-2", firstName: "Juan", lastName: "Perez", role: "DOCENTE", department: "Lengua", attendance: null, absenceReason: null },
  { id: "staff-3", firstName: "Laura", lastName: "Gomez", role: "PRECEPTOR", department: "Turno Manana", attendance: null, absenceReason: null },
  { id: "staff-4", firstName: "Carlos", lastName: "Martinez", role: "DOCENTE", department: "Historia", attendance: null, absenceReason: null },
  { id: "staff-5", firstName: "Ana", lastName: "Fernandez", role: "DOCENTE", department: "Ingles", attendance: null, absenceReason: null },
  { id: "staff-6", firstName: "Roberto", lastName: "Silva", role: "AUXILIAR", department: "Mantenimiento", attendance: null, absenceReason: null },
  { id: "staff-7", firstName: "Patricia", lastName: "Lopez", role: "DOCENTE", department: "Ciencias Naturales", attendance: null, absenceReason: null },
  { id: "staff-8", firstName: "Diego", lastName: "Torres", role: "PRECEPTOR", department: "Turno Tarde", attendance: null, absenceReason: null },
];

const ABSENCE_REASONS = [
  { value: "MEDICAL", label: "Licencia Medica" },
  { value: "PERSONAL", label: "Asuntos Personales" },
  { value: "UNJUSTIFIED", label: "Injustificado" },
  { value: "STRIKE", label: "Paro/Medida de Fuerza" },
  { value: "TRAINING", label: "Capacitacion" },
  { value: "EXAM_LEAVE", label: "Licencia por Examen" },
];

const ROLE_LABELS = {
  DOCENTE: "Docente",
  PRECEPTOR: "Preceptor",
  AUXILIAR: "Auxiliar",
};

const ROLE_COLORS = {
  DOCENTE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRECEPTOR: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  AUXILIAR: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

// ============================================
// STUDENT HANDLERS
// ============================================

async function handleSubmit(submission: AttendanceSubmission): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  toast.success("Parte diario registrado exitosamente en el sistema");
}

async function handleSaveLicense(data: LicenseFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  toast.success("Licencia registrada correctamente");
}

async function handleDeactivateLicense(studentId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  toast.info("Licencia desactivada");
}

// ============================================
// STAFF ATTENDANCE COMPONENT
// ============================================

function StaffAttendancePanel() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredStaff = staff.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAttendanceChange = (staffId: string, status: "PRESENT" | "ABSENT") => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, attendance: status, absenceReason: status === "PRESENT" ? null : s.absenceReason }
          : s
      )
    );
  };

  const handleReasonChange = (staffId: string, reason: string) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, absenceReason: reason } : s))
    );
  };

  const handleSaveStaffAttendance = async () => {
    const unmarked = staff.filter((s) => s.attendance === null);
    if (unmarked.length > 0) {
      toast.error(`Faltan ${unmarked.length} miembros del personal sin marcar`);
      return;
    }

    const absentWithoutReason = staff.filter(
      (s) => s.attendance === "ABSENT" && !s.absenceReason
    );
    if (absentWithoutReason.length > 0) {
      toast.error("Debe indicar el motivo de ausencia para todo el personal ausente");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Parte de personal registrado. Se recalcularon las listas de asistencia automaticamente.");
  };

  const presentCount = staff.filter((s) => s.attendance === "PRESENT").length;
  const absentCount = staff.filter((s) => s.attendance === "ABSENT").length;
  const unmarkedCount = staff.filter((s) => s.attendance === null).length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
          <div className="flex items-center gap-2 text-[#4de082]">
            <UserCheck className="size-4" />
            <span className="text-2xl font-bold">{presentCount}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Presentes</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="size-4" />
            <span className="text-2xl font-bold">{absentCount}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Ausentes</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="size-4" />
            <span className="text-2xl font-bold">{unmarkedCount}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Sin Marcar</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <Input
          placeholder="Buscar personal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/[0.02] border-white/10"
        />
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Personal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Area</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">Asistencia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Motivo Ausencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff]">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <span className="font-medium text-[#e4e1ea]">
                      {member.lastName}, {member.firstName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    ROLE_COLORS[member.role]
                  )}>
                    {ROLE_LABELS[member.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white/60">
                  {member.department}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleAttendanceChange(member.id, "PRESENT")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        member.attendance === "PRESENT"
                          ? "bg-[#4de082] text-[#0a1f0d]"
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      Presente
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(member.id, "ABSENT")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        member.attendance === "ABSENT"
                          ? "bg-red-500 text-white"
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      Ausente
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {member.attendance === "ABSENT" ? (
                    <Select
                      value={member.absenceReason || ""}
                      onValueChange={(val) => handleReasonChange(member.id, val)}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs bg-white/[0.02] border-white/10">
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {ABSENCE_REASONS.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-white/30 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveStaffAttendance}
          disabled={isSaving}
          className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-semibold px-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Guardar Parte de Personal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function AttendancePageDemo() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo>(MOCK_COURSE);
  const [students, setStudents] = useState<StudentAttendance[]>(MOCK_STUDENTS);

  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || "ADMIN";
    setCurrentRole(role);
  }, [activeContext]);

  const handleCourseChange = useCallback((courseId: string) => {
    const newCourse = AVAILABLE_COURSES.find((c) => c.id === courseId);
    if (newCourse) {
      setSelectedCourse(newCourse);
      setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" as const })));
      toast.info(`Cargando estudiantes de ${newCourse.year}° "${newCourse.divisionName}"...`);
    }
  }, []);

  if (!mounted || !currentRole) return null;

  const isAdmin = currentRole === "ADMIN";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
          Parte Diario de Asistencia
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Control de presentismo y seguimiento de alumnos y personal
        </p>
      </header>

      {isAdmin ? (
        <Tabs defaultValue="alumnos" className="w-full">
          <TabsList className="w-full md:w-auto bg-white/[0.02] border border-white/5 p-1">
            <TabsTrigger
              value="alumnos"
              className="flex-1 md:flex-none data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff]"
            >
              <Users className="size-4 mr-2" />
              Alumnos
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="flex-1 md:flex-none data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff]"
            >
              <Building2 className="size-4 mr-2" />
              Personal / RRHH
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alumnos" className="mt-6">
            <AttendancePage
              initialStudents={students}
              course={selectedCourse}
              availableCourses={AVAILABLE_COURSES}
              schoolId="school-demo-123"
              periodId="T1"
              userId="preceptor-1"
              onSubmit={handleSubmit}
              onSaveLicense={handleSaveLicense}
              onDeactivateLicense={handleDeactivateLicense}
              onCourseChange={handleCourseChange}
            />
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
                  <Building2 className="size-5 text-[#d0bcff]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#e4e1ea]">Asistencia del Personal</h2>
                  <p className="text-xs text-white/50">
                    Gestion de presentismo de docentes, preceptores y auxiliares
                  </p>
                </div>
              </div>
              <StaffAttendancePanel />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-admin view: Only students tab
        <AttendancePage
          initialStudents={students}
          course={selectedCourse}
          availableCourses={AVAILABLE_COURSES}
          schoolId="school-demo-123"
          periodId="T1"
          userId="preceptor-1"
          onSubmit={handleSubmit}
          onSaveLicense={handleSaveLicense}
          onDeactivateLicense={handleDeactivateLicense}
          onCourseChange={handleCourseChange}
        />
      )}

      <Toaster theme="dark" />
    </div>
  );
}
