"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, type Role } from "@/lib/context/auth-context";
import { useSchoolSettings, ACADEMIC_PERIOD_PRESETS, type AcademicPeriodType } from "@/lib/context/school-settings-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Download,
  Sparkles,
  Flag,
  Check,
  GraduationCap,
  FileText,
  PenLine,
  Presentation,
  AlertTriangle,
  X,
  BookOpen,
  Calendar as CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { parseLocalDateString } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";
import { formatDateToLocalISO } from "@/lib/utils/date-utils";
import { MonthGrid, type DayEvent } from "@/components/calendar/month-grid";

// ============================================
// COMPLIANCE: Document Export Format Logic
// ============================================

type ExportFormat = "DOCX" | "PDF";

/**
 * Determines the export format based on user role.
 * ADMIN: Editable DOCX format
 * All other roles: Immutable PDF format
 */
function getExportFormat(role: Role | null): ExportFormat {
  return role === "ADMIN" ? "DOCX" : "PDF";
}

/**
 * Returns export button label based on role
 */
function getCalendarExportLabel(role: Role | null): string {
  const format = getExportFormat(role);
  return format === "DOCX" ? "Exportar (DOCX)" : "Descargar (PDF)";
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ============================================
// TYPES
// ============================================

type TeacherEventType = "EXAMEN" | "TRABAJO_PRACTICO" | "CLASE_ESPECIAL";
type CustomEventType = "JORNADA" | "FERIADO_LOCAL" | "SUSPENSION";

interface TeacherEvent {
  id: string;
  teacherId: string;
  date: string;
  type: TeacherEventType;
  title: string;
  course: string;
  notes: string;
}

interface AccreditationPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

interface CustomEvent {
  id: string;
  date: string;
  title: string;
  type: CustomEventType;
}

interface MarkedDay {
  date: string;
  type: "FERIADO" | "JORNADA_DOCENTE" | "SUSPENDIDO";
  label: string;
}

// ============================================
// CONSTANTS
// ============================================

const TEACHER_EVENT_CONFIG: Record<TeacherEventType, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  EXAMEN: { label: "Fecha de Examen", color: "text-[#ff6b6b]", bgColor: "bg-[#ff6b6b]/20", icon: FileText },
  TRABAJO_PRACTICO: { label: "Entrega de TP", color: "text-[#4ecdc4]", bgColor: "bg-[#4ecdc4]/20", icon: PenLine },
  CLASE_ESPECIAL: { label: "Clase Especial", color: "text-[#ffe66d]", bgColor: "bg-[#ffe66d]/20", icon: Presentation },
};

const CUSTOM_EVENT_CONFIG: Record<CustomEventType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  JORNADA: { label: "Jornada Docente", color: "text-[#63a4ff]", bgColor: "bg-[#63a4ff]/20", borderColor: "border-[#63a4ff]/30" },
  FERIADO_LOCAL: { label: "Feriado Local", color: "text-[#ff6b6b]", bgColor: "bg-[#ff6b6b]/20", borderColor: "border-[#ff6b6b]/30" },
  SUSPENSION: { label: "Suspension", color: "text-[#ffb93d]", bgColor: "bg-[#ffb93d]/20", borderColor: "border-[#ffb93d]/30" },
};

const MOCK_TEACHER_COURSES = [
  { id: "c1", name: "Matematica - 4to A" },
  { id: "c2", name: "Matematica - 4to B" },
  { id: "c3", name: "Matematica - 5to A" },
  { id: "c4", name: "Algebra - 6to A" },
];

const MOCK_CHILD_EVENTS: TeacherEvent[] = [
  { id: "cte-1", teacherId: "teacher-002", date: "2026-03-20", type: "EXAMEN", title: "Parcial 1 - Funciones", course: "Matematica - 4to A", notes: "Unidades 1 y 2" },
  { id: "cte-2", teacherId: "teacher-003", date: "2026-03-25", type: "TRABAJO_PRACTICO", title: "Entrega TP Celula", course: "Biologia - 4to A", notes: "Trabajo grupal" },
  { id: "cte-3", teacherId: "teacher-004", date: "2026-04-10", type: "EXAMEN", title: "Evaluacion Escrita", course: "Historia - 4to A", notes: "Rev. de Mayo hasta 1850" },
];

const FERIADOS_NACIONALES_2026: MarkedDay[] = [
  { date: "2026-01-01", type: "FERIADO", label: "Ano Nuevo" },
  { date: "2026-02-16", type: "FERIADO", label: "Carnaval" },
  { date: "2026-02-17", type: "FERIADO", label: "Carnaval" },
  { date: "2026-03-24", type: "FERIADO", label: "Dia de la Memoria" },
  { date: "2026-04-02", type: "FERIADO", label: "Dia del Veterano" },
  { date: "2026-04-03", type: "FERIADO", label: "Viernes Santo" },
  { date: "2026-05-01", type: "FERIADO", label: "Dia del Trabajador" },
  { date: "2026-05-25", type: "FERIADO", label: "Revolucion de Mayo" },
  { date: "2026-06-15", type: "FERIADO", label: "Guemes" },
  { date: "2026-06-20", type: "FERIADO", label: "Dia de la Bandera" },
  { date: "2026-07-09", type: "FERIADO", label: "Independencia" },
  { date: "2026-08-17", type: "FERIADO", label: "San Martin" },
  { date: "2026-10-12", type: "FERIADO", label: "Diversidad Cultural" },
  { date: "2026-11-23", type: "FERIADO", label: "Soberania Nacional" },
  { date: "2026-12-08", type: "FERIADO", label: "Inmaculada Concepcion" },
  { date: "2026-12-25", type: "FERIADO", label: "Navidad" },
];

// ============================================
// HELPER: Get role from localStorage fallback
// ============================================

function getDevRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("sequency_dev_role");
    if (stored && ["ADMIN", "DOCENTE", "PRECEPTOR", "FAMILIA"].includes(stored)) {
      return stored as Role;
    }
  } catch {
    // localStorage might not be available
  }
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CalendarPage() {
  const { activeContext } = useAuth();
  const { settings, updateAcademicPeriodConfig } = useSchoolSettings();
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [markedDays, setMarkedDays] = useState<MarkedDay[]>([]);
  // Visible month for the full-width monthly grid
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date(2026, 4, 1));
  
  // Admin config state - synced from context
  const [periodSystem, setPeriodSystem] = useState<AcademicPeriodType>(settings.academicPeriodConfig.type);
  const [periodDates, setPeriodDates] = useState(settings.academicPeriodConfig.periods);
  const [recesoStart, setRecesoStart] = useState("2026-07-20");
  const [recesoEnd, setRecesoEnd] = useState("2026-07-31");
  
  // DYNAMIC: Multiple Accreditation Periods
  const [accreditationPeriods, setAccreditationPeriods] = useState<AccreditationPeriod[]>([
    { id: "acred-1", label: "Mesas de Febrero", startDate: "2026-02-23", endDate: "2026-02-27" },
    { id: "acred-2", label: "Instancia Intermedia Julio", startDate: "2026-07-06", endDate: "2026-07-10" },
    { id: "acred-3", label: "Acreditacion Final Diciembre", startDate: "2026-12-14", endDate: "2026-12-18" },
  ]);
  
  // DYNAMIC: Custom Events (Jornadas, Feriados Locales, Suspensiones)
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [customEventDialogOpen, setCustomEventDialogOpen] = useState(false);
  const [newCustomEvent, setNewCustomEvent] = useState<Partial<CustomEvent>>({
    title: "",
    type: "JORNADA",
  });
  
  // Teacher event state
  const [teacherEvents, setTeacherEvents] = useState<TeacherEvent[]>([]);
  const [teacherEventDialogOpen, setTeacherEventDialogOpen] = useState(false);
  const [newTeacherEvent, setNewTeacherEvent] = useState<Partial<TeacherEvent>>({
    type: "EXAMEN",
    title: "",
    course: "",
    notes: "",
  });
  
  const currentTeacherId = activeContext?.id || "teacher-001";
  const childName = "Santiago Martinez";

  // ========================================
  // Logica de Sincronizacion e Inmunidad a Hydration Mismatch
  // ========================================
  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || getDevRole() || "ADMIN";
    setCurrentRole(role);
  }, [activeContext]);

  // ========================================
  // Memos
  // ========================================
  const myTeacherEvents = useMemo(() => 
    teacherEvents.filter(e => e.teacherId === currentTeacherId), 
    [teacherEvents, currentTeacherId]
  );
  
  const childEvents = useMemo(() => {
    if (currentRole !== "FAMILIA") return [];
    return [...MOCK_CHILD_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
  }, [currentRole]);

  // Check if a date is in receso
  const isInReceso = useCallback((dateStr: string) => {
    return dateStr >= recesoStart && dateStr <= recesoEnd;
  }, [recesoStart, recesoEnd]);

  // ========================================
  // Month Navigation (Full-Width Grid)
  // ========================================
  const handlePrevMonth = useCallback(() => {
    setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleGoToday = useCallback(() => {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  // ========================================
  // Aggregate all event pills for a given calendar day
  // ========================================
  const getEventsForDate = useCallback((dateStr: string): DayEvent[] => {
    const pills: DayEvent[] = [];

    // National holidays + marked days
    markedDays
      .filter(d => d.date === dateStr && d.type === "FERIADO")
      .forEach(d => pills.push({
        id: `feriado-${dateStr}`,
        label: d.label,
        className: "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30",
      }));

    // Winter recess
    if (isInReceso(dateStr)) {
      pills.push({
        id: `receso-${dateStr}`,
        label: "Receso",
        className: "bg-[#ffb93d]/20 text-[#ffb93d] border-[#ffb93d]/30",
      });
    }

    // Accreditation periods
    accreditationPeriods
      .filter(p => p.startDate && p.endDate && dateStr >= p.startDate && dateStr <= p.endDate)
      .forEach(p => pills.push({
        id: `acred-${p.id}-${dateStr}`,
        label: p.label || "Acreditacion",
        className: "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30",
      }));

    // Custom events (Jornadas, Feriados Locales, Suspensiones)
    customEvents
      .filter(e => e.date === dateStr)
      .forEach(e => {
        const config = CUSTOM_EVENT_CONFIG[e.type];
        pills.push({
          id: e.id,
          label: e.title,
          className: cn(config.bgColor, config.color, config.borderColor),
        });
      });

    // Teacher evaluations (Docente sees own, Familia sees child's)
    const evalEvents = currentRole === "FAMILIA" ? childEvents : myTeacherEvents;
    evalEvents
      .filter(e => e.date === dateStr)
      .forEach(e => {
        const config = TEACHER_EVENT_CONFIG[e.type];
        pills.push({
          id: e.id,
          label: e.title,
          className: cn(config.bgColor, config.color, "border-white/10"),
        });
      });

    return pills;
  }, [markedDays, isInReceso, accreditationPeriods, customEvents, currentRole, childEvents, myTeacherEvents]);

  // ========================================
  // Handlers
  // ========================================
  // Handle period system change - updates context and local state
  const handlePeriodSystemChange = useCallback((newType: AcademicPeriodType) => {
    setPeriodSystem(newType);
    const newConfig = ACADEMIC_PERIOD_PRESETS[newType];
    setPeriodDates(newConfig.periods);
    updateAcademicPeriodConfig(newConfig);
    toast.success(`Regimen academico cambiado a ${newType === "TRIMESTRAL" ? "Trimestres" : newType === "CUATRIMESTRAL" ? "Cuatrimestres" : "Bimestres"}`);
  }, [updateAcademicPeriodConfig]);

  // Handle period date update
  const handlePeriodDateUpdate = useCallback((periodId: string, field: "startDate" | "endDate", value: string) => {
    setPeriodDates(prev => {
      const updated = prev.map(p => p.id === periodId ? { ...p, [field]: value } : p);
      // Also update context
      updateAcademicPeriodConfig({ type: periodSystem, periods: updated });
      return updated;
    });
  }, [periodSystem, updateAcademicPeriodConfig]);

  const handleAutoFillFeriados = useCallback(() => {
    const existingDates = new Set(markedDays.filter(d => d.type === "FERIADO").map(d => d.date));
    const newFeriados = FERIADOS_NACIONALES_2026.filter(f => !existingDates.has(f.date));
    if (newFeriados.length === 0) {
      toast.info("Todos los feriados nacionales ya estan cargados");
      return;
    }
    setMarkedDays(prev => [...prev, ...newFeriados]);
    toast.success(`${newFeriados.length} feriados nacionales agregados al calendario`);
  }, [markedDays]);

  const handlePublishCalendar = useCallback(() => {
    toast.success("Calendario global guardado y publicado para toda la institucion");
  }, []);

  // Accreditation Period Handlers
  const handleAddAccreditationPeriod = useCallback(() => {
    const newPeriod: AccreditationPeriod = {
      id: `acred-${Date.now()}`,
      label: "",
      startDate: "",
      endDate: "",
    };
    setAccreditationPeriods(prev => [...prev, newPeriod]);
  }, []);

  const handleUpdateAccreditationPeriod = useCallback((id: string, field: keyof AccreditationPeriod, value: string) => {
    setAccreditationPeriods(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  }, []);

  const handleDeleteAccreditationPeriod = useCallback((id: string) => {
    setAccreditationPeriods(prev => prev.filter(p => p.id !== id));
    toast.success("Periodo de acreditacion eliminado");
  }, []);

  // Custom Event Handlers
  const handleOpenCustomEventDialog = useCallback((date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setNewCustomEvent({ title: "", type: "JORNADA" });
    setCustomEventDialogOpen(true);
  }, []);

  const handleCreateCustomEvent = useCallback(() => {
    if (!selectedDate || !newCustomEvent.title || !newCustomEvent.type) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    const dateKey = formatDateToLocalISO(selectedDate);
    const newEvent: CustomEvent = {
      id: `ce-${Date.now()}`,
      date: dateKey,
      title: newCustomEvent.title,
      type: newCustomEvent.type as CustomEventType,
    };
    setCustomEvents(prev => [...prev, newEvent]);
    setCustomEventDialogOpen(false);
    setSelectedDate(undefined);
    setNewCustomEvent({ title: "", type: "JORNADA" });
    toast.success("Evento personalizado agregado al calendario");
  }, [selectedDate, newCustomEvent]);

  const handleDeleteCustomEvent = useCallback((id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Evento eliminado del calendario");
  }, []);

  // Teacher Event Handlers
  const handleCreateTeacherEvent = useCallback(() => {
    if (!selectedDate || !newTeacherEvent.title || !newTeacherEvent.course) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    const dateKey = formatDateToLocalISO(selectedDate);
    const newEvent: TeacherEvent = {
      id: `te-${Date.now()}`,
      teacherId: currentTeacherId,
      date: dateKey,
      type: newTeacherEvent.type as TeacherEventType,
      title: newTeacherEvent.title,
      course: newTeacherEvent.course,
      notes: newTeacherEvent.notes || "",
    };
    setTeacherEvents(prev => [...prev, newEvent]);
    setTeacherEventDialogOpen(false);
    setSelectedDate(undefined);
    setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
    toast.success("Fecha de evaluacion programada y publicada para el curso asignado");
  }, [selectedDate, newTeacherEvent, currentTeacherId]);

  const handleDeleteTeacherEvent = useCallback((eventId: string) => {
    setTeacherEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success("Evento eliminado del calendario");
  }, []);

  const handleExportCalendar = useCallback(() => {
    const format = getExportFormat(currentRole);
    
    if (format === "DOCX") {
      toast.loading("Generando archivo editable en formato Word...", { id: "calendar-export" });
      
      // Simulate DOCX generation
      setTimeout(() => {
        const docxContent = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>CALENDARIO INSTITUCIONAL 2026 - SEQUENCY</w:t></w:r></w:p>
    <w:p><w:r><w:t>Regimen: ${periodSystem}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Formato: Editable (Uso administrativo)</w:t></w:r></w:p>
  </w:body>
</w:document>`;
        
        const blob = new Blob([docxContent], { 
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Calendario_Institucional_2026.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.dismiss("calendar-export");
        toast.success("Calendario exportado en formato Word editable");
      }, 1500);
    } else {
      toast.loading("Compilando calendario PDF cerrado e inmutable...", { id: "calendar-export" });
      
      // Simulate PDF generation
      setTimeout(() => {
        const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 18 Tf
50 700 Td
(CALENDARIO INSTITUCIONAL 2026) Tj
0 -30 Td
/F1 12 Tf
(Documento oficial - Solo lectura) Tj
ET
endstream endobj
xref
0 5
trailer << /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`;
        
        const blob = new Blob([pdfContent], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Calendario_Institucional_2026.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.dismiss("calendar-export");
        toast.success("Calendario descargado en formato PDF oficial");
      }, 1500);
    }
  }, [currentRole, periodSystem]);

  // ========================================
  // Render Guard
  // ========================================
  if (!mounted || !currentRole) return null;

  const isAdmin = currentRole === "ADMIN";

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col gap-6 text-[#e4e1ea]">
      {/* HEADER DE LA PAGINA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.01] border border-white/[0.05] rounded-3xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">Cronograma General</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Calendario Institucional</h1>
          <p className="text-xs text-white/40">Planificacion de ciclos, recesos y fechas de evaluacion.</p>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-300 font-mono text-xs">
            Vista: {currentRole}
          </Badge>
          {isAdmin && (
            <Button 
              size="sm" 
              variant="outline" 
              className="border-purple-500/30 text-purple-300 text-xs"
              onClick={() => handleOpenCustomEventDialog()}
            >
              <Plus className="size-3.5 mr-1.5" />
              Agregar Evento
            </Button>
          )}
        </div>
      </header>

      {/* REGLAS DE NEGOCIO - ALERT */}
      <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200 rounded-3xl p-5">
        <ShieldAlert className="size-5 text-amber-400" />
        <AlertTitle className="text-sm font-bold uppercase tracking-wide">Reglas de Negocio de Presentismo</AlertTitle>
        <AlertDescription className="text-xs text-amber-200/80 mt-2 leading-relaxed space-y-2">
          <div className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#ff6b6b] mt-1.5 shrink-0" />
            <p>
              <strong className="text-[#ffb4ab]">Regla A (Feriados / Receso de Invierno):</strong> Bloquean la toma de asistencia y suspenden los disparadores automaticos de notificaciones por inasistencia.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#4de082] mt-1.5 shrink-0" />
            <p>
              <strong className="text-[#4de082]">Regla B (Multiples Semanas de Acreditacion):</strong> Mantienen el presentismo y el control de inasistencias plenamente activo en todas sus instancias por corresponder a dias escolares obligatorios de examen.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* RENDER CONDICIONAL MAESTRO */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CONFIGURACION DEL ADMIN (COLUMNA IZQUIERDA) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Parametros Basicos */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Parametros de Ciclo Lectivo
              </h2>
              
              <div className="space-y-2">
                <Label className="text-xs text-white/50">Regimen Academico</Label>
                <Select value={periodSystem} onValueChange={(v) => handlePeriodSystemChange(v as AcademicPeriodType)}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIMESTRAL">Trimestres (3 periodos)</SelectItem>
                    <SelectItem value="CUATRIMESTRAL">Cuatrimestres (2 periodos)</SelectItem>
                    <SelectItem value="BIMESTRAL">Bimestres (4 periodos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DYNAMIC PERIOD DATE INPUTS */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-purple-400" />
                  <h3 className="text-xs font-bold text-white/70">Fechas de {periodSystem === "TRIMESTRAL" ? "Trimestres" : periodSystem === "CUATRIMESTRAL" ? "Cuatrimestres" : "Bimestres"}</h3>
                </div>
                <div className="space-y-2">
                  {periodDates.map((period, idx) => (
                    <div key={period.id} className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2">
                      <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20">
                        {period.name}
                      </Badge>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-white/40 uppercase">Inicio</Label>
                          <Input 
                            type="date" 
                            className="bg-black/40 border-white/10 text-[10px] h-7" 
                            value={period.startDate}
                            onChange={(e) => handlePeriodDateUpdate(period.id, "startDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-white/40 uppercase">Fin</Label>
                          <Input 
                            type="date" 
                            className="bg-black/40 border-white/10 text-[10px] h-7" 
                            value={period.endDate}
                            onChange={(e) => handlePeriodDateUpdate(period.id, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#ffb93d]" />
                  <h3 className="text-xs font-bold text-white/70">Receso de Invierno</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="date" 
                    className="bg-black/40 border-white/10 text-xs" 
                    value={recesoStart}
                    onChange={(e) => setRecesoStart(e.target.value)}
                  />
                  <Input 
                    type="date" 
                    className="bg-black/40 border-white/10 text-xs" 
                    value={recesoEnd}
                    onChange={(e) => setRecesoEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SEMANAS DE ACREDITACION DINAMICAS */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  Semanas de Acreditacion
                </h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs text-purple-400 hover:text-purple-300"
                  onClick={handleAddAccreditationPeriod}
                >
                  <Plus className="size-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-3">
                {accreditationPeriods.map((period, idx) => (
                  <div 
                    key={period.id}
                    className="p-3 bg-[#d0bcff]/10 border border-[#d0bcff]/20 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/30">
                        Periodo {idx + 1}
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-6 text-white/40 hover:text-[#ff6b6b]"
                        onClick={() => handleDeleteAccreditationPeriod(period.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Nombre del periodo (Ej: Mesas de Febrero)"
                      value={period.label}
                      onChange={(e) => handleUpdateAccreditationPeriod(period.id, "label", e.target.value)}
                      className="bg-black/40 border-white/10 text-xs h-8"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="date" 
                        className="bg-black/40 border-white/10 text-[10px] h-7" 
                        value={period.startDate}
                        onChange={(e) => handleUpdateAccreditationPeriod(period.id, "startDate", e.target.value)}
                      />
                      <Input 
                        type="date" 
                        className="bg-black/40 border-white/10 text-[10px] h-7" 
                        value={period.endDate}
                        onChange={(e) => handleUpdateAccreditationPeriod(period.id, "endDate", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                {accreditationPeriods.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4">
                    No hay periodos de acreditacion configurados
                  </p>
                )}
              </div>
            </div>

            {/* Feriados y Eventos Personalizados */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Flag className="size-4" />
                Feriados y Eventos
              </h2>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-white/10 text-xs"
                onClick={handleAutoFillFeriados}
              >
                <Sparkles className="size-3.5 mr-2" />
                Cargar Feriados Nacionales 2026
              </Button>
              
              <p className="text-[10px] text-white/30 text-center">
                {markedDays.filter(d => d.type === "FERIADO").length} feriados nacionales cargados
              </p>

              {/* Custom Events List */}
              {customEvents.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Eventos Personalizados</p>
                  {customEvents.map((event) => {
                    const config = CUSTOM_EVENT_CONFIG[event.type];
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium truncate", config.color)}>{event.title}</p>
                          <p className="text-[10px] text-white/40">{event.date}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="size-6 shrink-0"
                          onClick={() => handleDeleteCustomEvent(event.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Publicar */}
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-5 rounded-xl transition-all shadow-lg" 
              onClick={handlePublishCalendar}
            >
              <Check className="size-4 mr-2" />
              Publicar Calendario Maestro
            </Button>
          </div>

          {/* CALENDARIO VISUAL (COLUMNA DERECHA - 2 PARTES) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
              <MonthGrid
                monthDate={visibleMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleGoToday}
                getEventsForDate={getEventsForDate}
                onDayClick={(date) => handleOpenCustomEventDialog(date)}
                onNewEvent={() => handleOpenCustomEventDialog()}
                canCreate
                newEventLabel="Nuevo Evento/Feriado"
              />
            </div>
            
            {/* Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-[10px] text-white/40 uppercase">Feriados</p>
                <p className="text-xl font-bold text-[#ffb4ab]">{markedDays.filter(d => d.type === "FERIADO").length}</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-[10px] text-white/40 uppercase">Dias Receso</p>
                <p className="text-xl font-bold text-[#ffb93d]">
                  {recesoStart && recesoEnd ? Math.ceil((parseLocalDateString(recesoEnd).getTime() - parseLocalDateString(recesoStart).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0}
                </p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-[10px] text-white/40 uppercase">Periodos Acred.</p>
                <p className="text-xl font-bold text-[#d0bcff]">{accreditationPeriods.length}</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-[10px] text-white/40 uppercase">Eventos Custom</p>
                <p className="text-xl font-bold text-[#63a4ff]">{customEvents.length}</p>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Leyenda:</span>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-[#ff6b6b]/30" />
                <span className="text-[10px] text-white/60">Feriados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-[#ffb93d]/30" />
                <span className="text-[10px] text-white/60">Receso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-[#d0bcff]/30" />
                <span className="text-[10px] text-white/60">Acreditacion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-[#63a4ff]/30" />
                <span className="text-[10px] text-white/60">Eventos</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PARA OTROS ROLES (DOCENTE, PRECEPTOR, FAMILIA) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 p-4 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
            <MonthGrid
              monthDate={visibleMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleGoToday}
              getEventsForDate={getEventsForDate}
              onDayClick={(date) => {
                setSelectedDate(date);
                if (currentRole === "DOCENTE") {
                  setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
                  setTeacherEventDialogOpen(true);
                }
              }}
              onNewEvent={currentRole === "DOCENTE" ? () => {
                setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
                setTeacherEventDialogOpen(true);
              } : undefined}
              canCreate={currentRole === "DOCENTE"}
              newEventLabel="Agendar Evaluacion"
            />

            {/* Leyenda para no-admin */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5 w-full">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-[#ff6b6b]/30" />
                <span className="text-[10px] text-white/50">Feriados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-[#ffb93d]/30" />
                <span className="text-[10px] text-white/50">Receso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-[#d0bcff]/30" />
                <span className="text-[10px] text-white/50">Acreditacion</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400">Fechas Importantes</h2>
              {currentRole === "DOCENTE" && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-purple-400 h-7 text-xs" 
                  onClick={() => {
                    if (selectedDate) {
                      setTeacherEventDialogOpen(true);
                    } else {
                      toast.info("Selecciona un dia en el calendario primero");
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agendar
                </Button>
              )}
              {currentRole === "FAMILIA" && (
                <Button 
                size="sm"
                variant="outline"
                className={cn(
                  "text-xs h-8",
                  isAdmin 
                    ? "border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10" 
                    : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                )}
                onClick={handleExportCalendar}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> {getCalendarExportLabel(currentRole)}
              </Button>
            )}
          </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {/* Hitos Institucionales */}
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-white">Inicio de Clases - Ciclo 2026</p>
                <p className="text-white/40 font-mono text-[10px]">02 de Marzo - Hito Institucional</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-300">Receso de Invierno</p>
                <p className="text-amber-400/50 font-mono text-[10px]">20 Jul - 31 Jul - Sin asistencia</p>
              </div>
              
              {/* Periodos de Acreditacion */}
              {accreditationPeriods.filter(p => p.label && p.startDate).map((period) => (
                <div key={period.id} className="p-3 bg-[#d0bcff]/10 border border-[#d0bcff]/20 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#d0bcff]">{period.label}</p>
                  <p className="text-[#d0bcff]/50 font-mono text-[10px]">
                    {period.startDate} al {period.endDate}
                  </p>
                </div>
              ))}
              
              {/* Teacher Events (Docente) */}
              {currentRole === "DOCENTE" && myTeacherEvents.length > 0 && (
                <>
                  <div className="h-px bg-white/5 my-2" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Mis Evaluaciones</p>
                  {myTeacherEvents.map((event) => {
                    const config = TEACHER_EVENT_CONFIG[event.type];
                    const Icon = config.icon;
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border",
                          config.bgColor,
                          "border-white/5"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{event.title}</p>
                          <p className="text-[10px] text-white/40">{event.course} - {event.date}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="size-6"
                          onClick={() => handleDeleteTeacherEvent(event.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Child Events (Familia) */}
              {currentRole === "FAMILIA" && childEvents.length > 0 && (
                <>
                  <div className="h-px bg-white/5 my-2" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Evaluaciones de {childName.split(" ")[0]}</p>
                  {childEvents.map((event) => {
                    const config = TEACHER_EVENT_CONFIG[event.type];
                    const Icon = config.icon;
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border",
                          config.bgColor,
                          "border-white/5"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{event.title}</p>
                          <p className="text-[10px] text-white/40">{event.course} - {event.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Crear Evento Personalizado (Admin) */}
      <Dialog open={customEventDialogOpen} onOpenChange={setCustomEventDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <CalendarDays className="size-5 text-purple-400" />
              Agregar Evento al Calendario
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedDate && (
                <span>
                  Fecha seleccionada:{" "}
                  <span className="text-purple-400 font-medium">
                    {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Tipo de Evento</Label>
              <Select
                value={newCustomEvent.type}
                onValueChange={(v) => setNewCustomEvent(prev => ({ ...prev, type: v as CustomEventType }))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CUSTOM_EVENT_CONFIG) as Array<CustomEventType>).map((type) => {
                    const config = CUSTOM_EVENT_CONFIG[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div className={cn("size-2 rounded-full", config.bgColor.replace("/20", ""))} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/60">Titulo del Evento *</Label>
              <Input
                placeholder="Ej: Jornada Institucional Docente, Feriado Municipal..."
                value={newCustomEvent.title}
                onChange={(e) => setNewCustomEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setCustomEventDialogOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCustomEvent}
              disabled={!newCustomEvent.title}
              className="bg-purple-600 text-white hover:bg-purple-500"
            >
              <Check className="size-4 mr-2" />
              Guardar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Crear Evento Docente */}
      <Dialog open={teacherEventDialogOpen} onOpenChange={setTeacherEventDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <BookOpen className="size-5 text-purple-400" />
              Agendar Evaluacion
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedDate && (
                <span>
                  Programar para el{" "}
                  <span className="text-purple-400 font-medium">
                    {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Tipo de Evento</Label>
              <Select
                value={newTeacherEvent.type}
                onValueChange={(v) => setNewTeacherEvent(prev => ({ ...prev, type: v as TeacherEventType }))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TEACHER_EVENT_CONFIG) as Array<TeacherEventType>).map((type) => {
                    const config = TEACHER_EVENT_CONFIG[type];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("size-4", config.color)} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/60">Titulo de la Evaluacion *</Label>
              <Input
                placeholder="Ej: Parcial Unidad 3"
                value={newTeacherEvent.title}
                onChange={(e) => setNewTeacherEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/60">Curso / Division *</Label>
              <Select
                value={newTeacherEvent.course}
                onValueChange={(v) => setNewTeacherEvent(prev => ({ ...prev, course: v }))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TEACHER_COURSES.map((course) => (
                    <SelectItem key={course.id} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/60">Notas Adicionales</Label>
              <Textarea
                placeholder="Temas a evaluar, indicaciones especiales..."
                value={newTeacherEvent.notes}
                onChange={(e) => setNewTeacherEvent(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white/[0.02] border-white/10 resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setTeacherEventDialogOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTeacherEvent}
              disabled={!newTeacherEvent.title || !newTeacherEvent.course}
              className="bg-purple-600 text-white hover:bg-purple-500"
            >
              <Check className="size-4 mr-2" />
              Programar Evaluacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
