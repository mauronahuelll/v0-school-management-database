"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { AttendancePage } from "@/components/attendance";
import { toast, Toaster } from "sonner";
import { 
  Users, 
  UserCheck, 
  Loader2,
  Search,
  Building2,
  AlertCircle,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  History,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  getTodayLocalISO, 
  parseLocalDateString, 
  formatDateForDisplay,
  isInCurrentMonth,
  isInCurrentYear,
  getCurrentMonthYear,
} from "@/lib/utils/date-utils";
import type {
  StudentAttendance,
  CourseInfo,
  AttendanceSubmission,
  LicenseFormData,
} from "@/lib/types/attendance";

import { downloadCsv } from "@/lib/utils/export-engine";

// Etiqueta legible para el estado de asistencia
function statusLabel(status: string): string {
  switch (status) {
    case "PRESENT": return "Presente";
    case "ABSENT": return "Ausente";
    case "TARDY": return "Tarde";
    case "ON_LICENSE": return "Con Licencia";
    default: return status;
  }
}

// ============================================
// MOCK DATA - STUDENTS
// ============================================

const AVAILABLE_COURSES: CourseInfo[] = [
  {
    id: "course-4b",
    name: "4to Año",
    year: 4,
    divisionId: "div-b",
    divisionName: "B",
    shift: "MORNING",
    studentCount: 30,
  },
  {
    id: "course-5a",
    name: "5to Año",
    year: 5,
    divisionId: "div-a",
    divisionName: "A",
    shift: "MORNING",
    studentCount: 25,
  },
  {
    id: "course-3c",
    name: "3er Año",
    year: 3,
    divisionId: "div-c",
    divisionName: "C",
    shift: "AFTERNOON",
    studentCount: 28,
  },
];

const MOCK_COURSE: CourseInfo = AVAILABLE_COURSES[0];

// ── Mock específico para Nivel INICIAL (Sala de 5) ──────────────────────────
const MOCK_SALA_COURSE: CourseInfo = {
  id: "sala-5-ositos",
  name: "Sala de 5 — Ositos",
  year: 5,
  divisionId: "sala-ositos",
  divisionName: "Ositos",
  shift: "MORNING",
  studentCount: 18,
};

const MOCK_SALA_STUDENTS: StudentAttendance[] = [
  { id: "si-1", firstName: "Abril",    lastName: "Acosta",    enrollmentNumber: "JI-001", status: "PRESENT", stats: { totalAbsences: 1, totalTardies: 0 } },
  { id: "si-2", firstName: "Bautista", lastName: "Blanco",    enrollmentNumber: "JI-002", status: "PRESENT", stats: { totalAbsences: 0, totalTardies: 0 } },
  { id: "si-3", firstName: "Catalina", lastName: "Cardozo",   enrollmentNumber: "JI-003", status: "PRESENT", stats: { totalAbsences: 2, totalTardies: 1 } },
  { id: "si-4", firstName: "Delfina",  lastName: "Diaz",      enrollmentNumber: "JI-004", status: "ABSENT",  stats: { totalAbsences: 3, totalTardies: 0 } },
  { id: "si-5", firstName: "Emanuel",  lastName: "Escobar",   enrollmentNumber: "JI-005", status: "PRESENT", stats: { totalAbsences: 0, totalTardies: 0 } },
  { id: "si-6", firstName: "Florencia",lastName: "Fuentes",   enrollmentNumber: "JI-006", status: "PRESENT", stats: { totalAbsences: 1, totalTardies: 0 } },
];

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
  absences: StaffAbsence[];
}

interface StaffAbsence {
  id: string;
  date: string;
  reason: string;
  reasonLabel: string;
  observations?: string;
}

const MOCK_STAFF: StaffMember[] = [
  { id: "staff-1", firstName: "Maria", lastName: "Rodriguez", role: "DOCENTE", department: "Matematica", absences: [
    { id: "abs-1", date: "2026-05-15", reason: "MEDICAL", reasonLabel: "Licencia Medica", observations: "Certificado medico presentado" },
    { id: "abs-2", date: "2026-05-08", reason: "STRIKE", reasonLabel: "Paro", observations: "" },
  ]},
  { id: "staff-2", firstName: "Juan", lastName: "Perez", role: "DOCENTE", department: "Lengua", absences: [] },
  { id: "staff-3", firstName: "Laura", lastName: "Gomez", role: "PRECEPTOR", department: "Turno Manana", absences: [
    { id: "abs-3", date: "2026-05-20", reason: "PERSONAL", reasonLabel: "Permiso Especial", observations: "Tramite personal" },
  ]},
  { id: "staff-4", firstName: "Carlos", lastName: "Martinez", role: "DOCENTE", department: "Historia", absences: [] },
  { id: "staff-5", firstName: "Ana", lastName: "Fernandez", role: "DOCENTE", department: "Ingles", absences: [
    { id: "abs-4", date: "2026-05-22", reason: "FEMALE_DAY", reasonLabel: "Dia Femenino", observations: "" },
    { id: "abs-5", date: "2026-04-18", reason: "MEDICAL", reasonLabel: "Licencia Medica", observations: "" },
    { id: "abs-6", date: "2026-03-10", reason: "UNJUSTIFIED", reasonLabel: "Injustificado", observations: "" },
  ]},
  { id: "staff-6", firstName: "Roberto", lastName: "Silva", role: "AUXILIAR", department: "Mantenimiento", absences: [] },
  { id: "staff-7", firstName: "Patricia", lastName: "Lopez", role: "DOCENTE", department: "Ciencias Naturales", absences: [
    { id: "abs-7", date: "2026-05-05", reason: "STRIKE", reasonLabel: "Paro", observations: "" },
  ]},
  { id: "staff-8", firstName: "Diego", lastName: "Torres", role: "PRECEPTOR", department: "Turno Tarde", absences: [] },
];

const ABSENCE_REASONS = [
  { value: "MEDICAL", label: "Licencia Medica" },
  { value: "FEMALE_DAY", label: "Dia Femenino" },
  { value: "STRIKE", label: "Paro" },
  { value: "UNJUSTIFIED", label: "Injustificado" },
  { value: "PERSONAL", label: "Permiso Especial" },
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
// RRHH ATTENDANCE PANEL - Admin Only (Staff Management)
// ============================================

function RRHHAttendancePanel() {
  const [isExporting, setIsExporting] = useState(false);

  // Exporta el parte diario del personal (CSV) usando el padron de RRHH
  const handleExportParte = useCallback(async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const BOM = "\uFEFF";
    const today = getTodayLocalISO();
    const headers = ["Legajo/ID", "Apellido", "Nombre", "Rol", "Area", "AusenciasMes", "Fecha"];
    const rows = MOCK_STAFF.map((s) => {
      const ausenciasMes = s.absences.filter((a) => isInCurrentMonth(a.date)).length;
      return [
        s.id,
        s.lastName,
        s.firstName,
        s.role,
        s.department,
        String(ausenciasMes),
        today,
      ].map((cell) => `"${cell}"`).join(",");
    });

    const csvContent = BOM + [headers.join(","), ...rows].join("\n");
    downloadCsv(csvContent, "parte_asistencia_diaria.csv");

    setIsExporting(false);
    toast.success("Parte diario del personal exportado", {
      description: `parte_asistencia_diaria.csv (${MOCK_STAFF.length} integrantes del personal).`,
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Control RRHH - Presentismo del Personal
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestion de ausencias, justificaciones y calculo de presentismo por docente
          </p>
        </div>
        <Button
          onClick={handleExportParte}
          disabled={isExporting}
          variant="outline"
          className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 shrink-0"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Download className="size-4 mr-2" />
              Exportar Parte Diario
            </>
          )}
        </Button>
      </header>

      {/* Panel Container */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
            <Building2 className="size-5 text-[#d0bcff]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#e4e1ea]">Asistencia del Personal</h2>
            <p className="text-xs text-white/50">
              Docentes, preceptores y auxiliares - Modelo por excepcion
            </p>
          </div>
        </div>
        <StaffAttendancePanel />
      </div>
    </div>
  );
}

// ============================================
// STUDENT DAILY ATTENDANCE - Docente/Preceptor Only
// ============================================

interface StudentDailyAttendanceProps {
  students: StudentAttendance[];
  selectedCourse: CourseInfo;
  availableCourses: CourseInfo[];
  onCourseChange: (courseId: string) => void;
  /** INICIAL: activa columna "Autorizado a Retirar" */
  isInitialLevel?: boolean;
}

function StudentDailyAttendance({ 
  students, 
  selectedCourse, 
  availableCourses, 
  onCourseChange,
  isInitialLevel = false,
}: StudentDailyAttendanceProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Exporta el parte diario del curso (CSV) con los alumnos visibles y su estado actual
  const handleExportParte = useCallback(async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const BOM = "\uFEFF";
    const today = getTodayLocalISO();
    const headers = ["Legajo", "Apellido", "Nombre", "Estado", "AusenciasTotales", "TardanzasTotales", "Curso", "Fecha"];
    const cursoLabel = `${selectedCourse.year}° ${selectedCourse.divisionName}`;
    const rows = students.map((s) =>
      [
        s.enrollmentNumber,
        s.lastName,
        s.firstName,
        statusLabel(s.status),
        String(s.stats.totalAbsences),
        String(s.stats.totalTardies),
        cursoLabel,
        today,
      ].map((cell) => `"${cell}"`).join(",")
    );

    const csvContent = BOM + [headers.join(","), ...rows].join("\n");
    downloadCsv(csvContent, "parte_asistencia_diaria.csv");

    setIsExporting(false);
    toast.success("Parte diario exportado", {
      description: `parte_asistencia_diaria.csv (${students.length} alumnos de ${cursoLabel}).`,
    });
  }, [students, selectedCourse]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Parte Diario de Asistencia
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Toma de lista de alumnos por curso
          </p>
        </div>
        <Button
          onClick={handleExportParte}
          disabled={isExporting}
          variant="outline"
          className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 shrink-0"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Download className="size-4 mr-2" />
              Exportar Parte Diario
            </>
          )}
        </Button>
      </header>

      {/* Student Attendance Component */}
      <AttendancePage
        initialStudents={students}
        course={selectedCourse}
        availableCourses={availableCourses}
        schoolId="school-demo-123"
        periodId="T1"
        userId="preceptor-1"
        onSubmit={handleSubmit}
        onSaveLicense={handleSaveLicense}
        onDeactivateLicense={handleDeactivateLicense}
        onCourseChange={onCourseChange}
        isInitialLevel={isInitialLevel}
      />
    </div>
  );
}

function StaffAttendancePanel() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Absence dialog state
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [absenceDate, setAbsenceDate] = useState(() => getTodayLocalISO());
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceObservations, setAbsenceObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStaff = staff.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRow = (staffId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const openAbsenceDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setAbsenceDate(getTodayLocalISO());
    setAbsenceReason("");
    setAbsenceObservations("");
    setIsAbsenceDialogOpen(true);
  };

  const handleConfirmAbsence = async () => {
    if (!selectedStaff || !absenceReason) return;
    
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const reasonLabel = ABSENCE_REASONS.find(r => r.value === absenceReason)?.label || absenceReason;
    
    const newAbsence: StaffAbsence = {
      id: `abs-${Date.now()}`,
      date: absenceDate,
      reason: absenceReason,
      reasonLabel,
      observations: absenceObservations,
    };
    
    setStaff(prev => prev.map(s => 
      s.id === selectedStaff.id 
        ? { ...s, absences: [newAbsence, ...s.absences] }
        : s
    ));
    
    setIsSubmitting(false);
    setIsAbsenceDialogOpen(false);
    toast.success(`Inasistencia registrada para ${selectedStaff.firstName} ${selectedStaff.lastName}`);
  };

  // Calculate stats using timezone-safe utilities
  const totalStaff = staff.length;
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  
  const totalAbsencesThisMonth = staff.reduce((acc, s) => {
    return acc + s.absences.filter(a => isInCurrentMonth(a.date)).length;
  }, 0);

  // Calculate presenteeism (assume 20 working days per month, simplified)
  const calculatePresenteeism = (absences: StaffAbsence[]) => {
    const yearAbsences = absences.filter(a => isInCurrentYear(a.date)).length;
    const workingDaysYTD = (currentMonth + 1) * 20; // Simplified: 20 days per month
    const presentDays = workingDaysYTD - yearAbsences;
    return Math.max(0, Math.round((presentDays / workingDaysYTD) * 100));
  };

  const getMonthAbsences = (absences: StaffAbsence[]) => {
    return absences.filter(a => isInCurrentMonth(a.date)).length;
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar - Management by Exception */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
          <div className="flex items-center gap-2 text-[#4de082]">
            <UserCheck className="size-4" />
            <span className="text-2xl font-bold">{totalStaff}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Personal Activo (Presentes por defecto)</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="size-4" />
            <span className="text-2xl font-bold">{totalAbsencesThisMonth}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Inasistencias este mes</p>
        </div>
        <div className="hidden md:block p-4 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
          <div className="flex items-center gap-2 text-[#d0bcff]">
            <TrendingUp className="size-4" />
            <span className="text-2xl font-bold">Excepcion</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Modelo de Gestion</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <FileText className="size-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-200/80 leading-relaxed">
          <strong>Gestion por Excepcion:</strong> El sistema asume que todos los docentes estan presentes 
          basandose en los dias habiles del calendario. Solo registre las ausencias cuando ocurran.
        </p>
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

      {/* Staff Table with Expandable Rows */}
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Personal</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider hidden md:table-cell">Area</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Ausencias Mes</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredStaff.map((member) => {
              const isExpanded = expandedRows.has(member.id);
              const monthAbsences = getMonthAbsences(member.absences);
              const presenteeism = calculatePresenteeism(member.absences);
              
              return (
                <React.Fragment key={member.id}>
                    <tr className="transition-colors hover:bg-white/[0.04]">
                      <td className="px-4 py-3">
                        <button 
                          type="button"
                          onClick={() => toggleRow(member.id)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                        >
                            {isExpanded ? (
                              <ChevronUp className="size-4 text-white/40" />
                            ) : (
                              <ChevronDown className="size-4 text-white/40" />
                            )}
                          </button>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          type="button"
                          onClick={() => toggleRow(member.id)}
                          className="flex items-center gap-3 text-left hover:text-[#d0bcff] transition-colors"
                        >
                            <div className="size-9 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff]">
                              {member.firstName[0]}{member.lastName[0]}
                            </div>
                            <span className="font-medium text-[#e4e1ea]">
                              {member.lastName}, {member.firstName}
                            </span>
                          </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium border",
                          ROLE_COLORS[member.role]
                        )}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60 hidden md:table-cell">
                        {member.department}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold border",
                          monthAbsences === 0 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : monthAbsences >= 3 
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {monthAbsences}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          onClick={() => openAbsenceDialog(member)}
                          size="sm"
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs"
                        >
                          <UserMinus className="size-3.5 mr-1.5" />
                          Registrar Ausencia
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Expanded Content - Individual History */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-black/20 border-t border-white/[0.04]">
                          <div className="p-4 space-y-4">
                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-4">
                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 min-w-[140px]">
                                <p className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-1">Ausencias este mes</p>
                                <p className="text-lg font-bold text-amber-400">{monthAbsences}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[#4de082]/5 border border-[#4de082]/20 min-w-[140px]">
                                <p className="text-[10px] uppercase tracking-wider text-[#4de082]/70 mb-1">Presentismo Anual</p>
                                <p className="text-lg font-bold text-[#4de082]">{presenteeism}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[#d0bcff]/5 border border-[#d0bcff]/20 min-w-[140px]">
                                              <p className="text-[10px] uppercase tracking-wider text-[#d0bcff]/70 mb-1">Total Ausencias Anio</p>
                                              <p className="text-lg font-bold text-[#d0bcff]">
                                                {member.absences.filter(a => isInCurrentYear(a.date)).length}
                                              </p>
                                            </div>
                            </div>
                            
                            {/* Absence History */}
                            <div>
                              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <History className="size-3.5" />
                                Historial de Inasistencias
                              </h4>
                              {member.absences.length > 0 ? (
                                <div className="space-y-2">
                                  {member.absences.slice(0, 5).map(absence => (
                                    <div 
                                      key={absence.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded bg-red-500/10">
                                          <Calendar className="size-3.5 text-red-400" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-[#e4e1ea]">
                                            {formatDateForDisplay(absence.date)}
                                          </p>
                                          <p className="text-xs text-white/50">{absence.reasonLabel}</p>
                                        </div>
                                      </div>
                                      {absence.observations && (
                                        <span className="text-xs text-white/40 max-w-[200px] truncate">
                                          {absence.observations}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {member.absences.length > 5 && (
                                    <p className="text-xs text-white/40 text-center py-2">
                                      +{member.absences.length - 5} registros mas...
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-white/40 py-4 text-center">
                                  Sin inasistencias registradas este anio
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Absence Registration Dialog */}
      <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <UserMinus className="size-5 text-red-400" />
              Registrar Inasistencia
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedStaff && `${selectedStaff.firstName} ${selectedStaff.lastName} - ${selectedStaff.department}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Fecha</label>
              <Input
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Motivo</label>
              <Select value={absenceReason} onValueChange={setAbsenceReason}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {ABSENCE_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Observaciones <span className="text-white/30">(opcional)</span>
              </label>
              <Textarea
                value={absenceObservations}
                onChange={(e) => setAbsenceObservations(e.target.value)}
                placeholder="Notas adicionales..."
                className="bg-white/[0.02] border-white/10 min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAbsenceDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAbsence}
              disabled={!absenceReason || isSubmitting}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserMinus className="size-4 mr-2" />
                  Confirmar Inasistencia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// PAGE COMPONENT - Separation of Concerns (SoC)
// ============================================

export default function AttendancePageDemo() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo>(MOCK_COURSE);
  const [students, setStudents] = useState<StudentAttendance[]>(MOCK_STUDENTS);

  useEffect(() => {
    setMounted(true);
    const role  = activeContext?.role  || localStorage.getItem("sequency_dev_role") || "ADMIN";
    const level = activeContext?.level || null;
    setCurrentRole(role);
    setCurrentLevel(level);
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

  // ============================================
  // LEVEL + ROLE BASED RENDERING
  // ADMIN                  → Panel RRHH (gestión de personal)
  // DOCENTE/PRECEPTOR INICIAL → Parte Diario con columna "Autorizado a Retirar"
  // DOCENTE/PRECEPTOR otros  → Parte Diario con métricas de ausentismo
  // ============================================

  if (currentRole === "ADMIN") {
    return (
      <>
        <RRHHAttendancePanel />
        <Toaster theme="dark" />
      </>
    );
  }

  // NIVEL INICIAL — datos de sala y columna de retiro
  if (currentLevel === "INICIAL") {
    return (
      <>
        <StudentDailyAttendance
          students={MOCK_SALA_STUDENTS}
          selectedCourse={MOCK_SALA_COURSE}
          availableCourses={[MOCK_SALA_COURSE]}
          onCourseChange={() => {}}
          isInitialLevel
        />
        <Toaster theme="dark" />
      </>
    );
  }

  // Default: PRIMARIO / SECUNDARIO
  return (
    <>
      <StudentDailyAttendance
        students={students}
        selectedCourse={selectedCourse}
        availableCourses={AVAILABLE_COURSES}
        onCourseChange={handleCourseChange}
      />
      <Toaster theme="dark" />
    </>
  );
}
