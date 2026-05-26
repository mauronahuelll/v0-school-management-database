"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Flag,
  Users,
  CloudRain,
  Sparkles,
  X,
  Check,
  Info,
  GraduationCap,
  Snowflake,
  ClipboardCheck,
  Eye,
  Plus,
  FileText,
  Presentation,
  PenLine,
  Download,
  Loader2,
  User,
  List,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, type Role } from "@/lib/context/auth-context";

// ============================================
// TYPES
// ============================================

type DayType = "FERIADO" | "JORNADA_DOCENTE" | "SUSPENDIDO" | null;
type PeriodSystem = "TRIMESTRAL" | "CUATRIMESTRAL";

interface MarkedDay {
  date: string;
  type: DayType;
  label: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface SpecialWindow {
  id: string;
  name: string;
  type: "RECESO" | "ACREDITACION";
  startDate: string;
  endDate: string;
}

type TeacherEventType = "EXAMEN" | "TRABAJO_PRACTICO" | "CLASE_ESPECIAL";

interface TeacherEvent {
  id: string;
  teacherId: string;
  date: string;
  type: TeacherEventType;
  title: string;
  course: string;
  notes: string;
}

// ============================================
// CONSTANTS
// ============================================

const TEACHER_EVENT_CONFIG: Record<TeacherEventType, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  EXAMEN: { label: "Fecha de Examen", color: "text-[#ff6b6b]", bgColor: "bg-[#ff6b6b]/20", icon: FileText },
  TRABAJO_PRACTICO: { label: "Entrega de TP", color: "text-[#4ecdc4]", bgColor: "bg-[#4ecdc4]/20", icon: PenLine },
  CLASE_ESPECIAL: { label: "Clase Especial", color: "text-[#ffe66d]", bgColor: "bg-[#ffe66d]/20", icon: Presentation },
};

const MOCK_TEACHER_COURSES = [
  { id: "c1", name: "Matematica - 4to A" },
  { id: "c2", name: "Matematica - 4to B" },
  { id: "c3", name: "Matematica - 5to A" },
  { id: "c4", name: "Algebra - 6to A" },
];

const MOCK_CHILD_TEACHER_EVENTS: TeacherEvent[] = [
  { id: "cte-1", teacherId: "teacher-002", date: "2025-03-20", type: "EXAMEN", title: "Parcial 1 - Funciones", course: "Matematica - 4to A", notes: "Unidades 1 y 2" },
  { id: "cte-2", teacherId: "teacher-003", date: "2025-03-25", type: "TRABAJO_PRACTICO", title: "Entrega TP Celula", course: "Biologia - 4to A", notes: "Trabajo grupal" },
  { id: "cte-3", teacherId: "teacher-004", date: "2025-04-10", type: "EXAMEN", title: "Evaluacion Escrita", course: "Historia - 4to A", notes: "Rev. de Mayo hasta 1850" },
  { id: "cte-4", teacherId: "teacher-002", date: "2025-04-22", type: "CLASE_ESPECIAL", title: "Clase de Repaso", course: "Matematica - 4to A", notes: "Preparacion para el parcial" },
  { id: "cte-5", teacherId: "teacher-005", date: "2025-05-08", type: "EXAMEN", title: "Parcial Literatura", course: "Lengua - 4to A", notes: "Romanticismo y Realismo" },
  { id: "cte-6", teacherId: "teacher-003", date: "2025-05-15", type: "TRABAJO_PRACTICO", title: "Informe de Laboratorio", course: "Biologia - 4to A", notes: "Microscopia" },
];

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const DAY_TYPE_CONFIG: Record<Exclude<DayType, null>, { label: string; color: string; bgColor: string; icon: typeof Flag }> = {
  FERIADO: { label: "Feriado Nacional", color: "text-[#ffb4ab]", bgColor: "bg-[#ffb4ab]/20", icon: Flag },
  JORNADA_DOCENTE: { label: "Jornada Docente", color: "text-[#63a4ff]", bgColor: "bg-[#63a4ff]/20", icon: Users },
  SUSPENDIDO: { label: "Suspendido (Inclemencias)", color: "text-[#f9e2af]", bgColor: "bg-[#f9e2af]/20", icon: CloudRain },
};

const FERIADOS_NACIONALES_2025: MarkedDay[] = [
  { date: "2025-01-01", type: "FERIADO", label: "Ano Nuevo" },
  { date: "2025-02-12", type: "FERIADO", label: "Carnaval" },
  { date: "2025-02-13", type: "FERIADO", label: "Carnaval" },
  { date: "2025-03-24", type: "FERIADO", label: "Dia de la Memoria" },
  { date: "2025-04-02", type: "FERIADO", label: "Dia del Veterano" },
  { date: "2025-04-18", type: "FERIADO", label: "Viernes Santo" },
  { date: "2025-05-01", type: "FERIADO", label: "Dia del Trabajador" },
  { date: "2025-05-25", type: "FERIADO", label: "Revolucion de Mayo" },
  { date: "2025-06-16", type: "FERIADO", label: "Guemes" },
  { date: "2025-06-20", type: "FERIADO", label: "Dia de la Bandera" },
  { date: "2025-07-09", type: "FERIADO", label: "Independencia" },
  { date: "2025-08-18", type: "FERIADO", label: "San Martin" },
  { date: "2025-10-13", type: "FERIADO", label: "Diversidad Cultural" },
  { date: "2025-11-24", type: "FERIADO", label: "Soberania Nacional" },
  { date: "2025-12-08", type: "FERIADO", label: "Inmaculada Concepcion" },
  { date: "2025-12-25", type: "FERIADO", label: "Navidad" },
];

const DEFAULT_TRIMESTRES: AcademicPeriod[] = [
  { id: "t1", name: "1er Trimestre", startDate: "2025-03-03", endDate: "2025-05-30" },
  { id: "t2", name: "2do Trimestre", startDate: "2025-06-02", endDate: "2025-09-12" },
  { id: "t3", name: "3er Trimestre", startDate: "2025-09-15", endDate: "2025-12-15" },
];

const DEFAULT_CUATRIMESTRES: AcademicPeriod[] = [
  { id: "c1", name: "1er Cuatrimestre", startDate: "2025-03-03", endDate: "2025-07-04" },
  { id: "c2", name: "2do Cuatrimestre", startDate: "2025-08-04", endDate: "2025-12-15" },
];

const DEFAULT_SPECIAL_WINDOWS: SpecialWindow[] = [
  { id: "receso", name: "Receso de Invierno", type: "RECESO", startDate: "2025-07-14", endDate: "2025-07-25" },
  { id: "acred1", name: "Mesa de Examen Julio", type: "ACREDITACION", startDate: "2025-07-28", endDate: "2025-08-01" },
  { id: "acred2", name: "Mesa de Examen Diciembre", type: "ACREDITACION", startDate: "2025-12-01", endDate: "2025-12-12" },
];

// ============================================
// HELPERS
// ============================================

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isDateInRange(dateKey: string, startDate: string, endDate: string): boolean {
  return dateKey >= startDate && dateKey <= endDate;
}

// Get role from localStorage as fallback for dev sandbox
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
// COMPONENTS
// ============================================

function ReadOnlyBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
      <Eye className="size-3.5 text-white/50" />
      <span className="text-xs text-white/50">Solo lectura</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 text-[#d0bcff] animate-spin" />
        <p className="text-sm text-white/50">Cargando calendario...</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  
  // ========================================
  // ROBUST ROLE DETECTION (Anti-Bloqueo)
  // ========================================
  // 1. Primary: from activeContext
  // 2. Fallback: from localStorage (dev sandbox)
  const [effectiveRole, setEffectiveRole] = useState<Role | null>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // Determine effective role
    const contextRole = activeContext?.role ?? null;
    const devRole = getDevRole();
    
    // Use context role if available, otherwise fallback to dev role
    const role = contextRole || devRole;
    setEffectiveRole(role);
  }, [activeContext]);

  // Derived permission flags
  const isAdmin = effectiveRole === "ADMIN";
  const isDocente = effectiveRole === "DOCENTE";
  const isPreceptor = effectiveRole === "PRECEPTOR";
  const isFamilia = effectiveRole === "FAMILIA";
  const canEditGlobal = isAdmin;
  const canAddTeacherEvents = isDocente;
  
  const currentTeacherId = activeContext?.id || "teacher-001";
  const childName = "Santiago Martinez";
  
  // ========================================
  // STATE
  // ========================================
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [markedDays, setMarkedDays] = useState<MarkedDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [teacherEvents, setTeacherEvents] = useState<TeacherEvent[]>([]);
  const [teacherEventDialogOpen, setTeacherEventDialogOpen] = useState(false);
  const [newTeacherEvent, setNewTeacherEvent] = useState<Partial<TeacherEvent>>({
    type: "EXAMEN",
    title: "",
    course: "",
    notes: "",
  });
  
  const [academicYear, setAcademicYear] = useState({
    startDate: "2025-03-03",
    endDate: "2025-12-15",
  });
  
  const [periodSystem, setPeriodSystem] = useState<PeriodSystem>("TRIMESTRAL");
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>(DEFAULT_TRIMESTRES);
  const [specialWindows, setSpecialWindows] = useState<SpecialWindow[]>(DEFAULT_SPECIAL_WINDOWS);

  // Update periods when system changes
  useEffect(() => {
    if (periodSystem === "TRIMESTRAL") {
      setAcademicPeriods(DEFAULT_TRIMESTRES);
    } else {
      setAcademicPeriods(DEFAULT_CUATRIMESTRES);
    }
  }, [periodSystem]);

  // ========================================
  // MEMOS
  // ========================================
  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const markedDaysMap = useMemo(() => {
    const map = new Map<string, MarkedDay>();
    markedDays.forEach(day => map.set(day.date, day));
    return map;
  }, [markedDays]);

  const myTeacherEvents = useMemo(() => teacherEvents.filter(e => e.teacherId === currentTeacherId), [teacherEvents, currentTeacherId]);

  const teacherEventsMap = useMemo(() => {
    const map = new Map<string, TeacherEvent[]>();
    myTeacherEvents.forEach(event => {
      const existing = map.get(event.date) || [];
      map.set(event.date, [...existing, event]);
    });
    return map;
  }, [myTeacherEvents]);

  const childEventsMap = useMemo(() => {
    const map = new Map<string, TeacherEvent[]>();
    if (isFamilia) {
      MOCK_CHILD_TEACHER_EVENTS.forEach(event => {
        const existing = map.get(event.date) || [];
        map.set(event.date, [...existing, event]);
      });
    }
    return map;
  }, [isFamilia]);

  const calendarEventsMap = useMemo(() => {
    if (isFamilia) return childEventsMap;
    if (isDocente) return teacherEventsMap;
    return new Map<string, TeacherEvent[]>();
  }, [isFamilia, isDocente, childEventsMap, teacherEventsMap]);

  const sortedChildEvents = useMemo(() => {
    if (!isFamilia) return [];
    return [...MOCK_CHILD_TEACHER_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
  }, [isFamilia]);

  const getSpecialWindowType = useCallback((dateKey: string): "RECESO" | "ACREDITACION" | null => {
    for (const window of specialWindows) {
      if (isDateInRange(dateKey, window.startDate, window.endDate)) {
        return window.type;
      }
    }
    return null;
  }, [specialWindows]);

  const stats = useMemo(() => {
    const feriados = markedDays.filter(d => d.type === "FERIADO").length;
    const jornadas = markedDays.filter(d => d.type === "JORNADA_DOCENTE").length;
    const suspendidos = markedDays.filter(d => d.type === "SUSPENDIDO").length;
    const recesoWindow = specialWindows.find(w => w.type === "RECESO");
    let recesoDays = 0;
    if (recesoWindow) {
      const start = new Date(recesoWindow.startDate);
      const end = new Date(recesoWindow.endDate);
      recesoDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return { feriados, jornadas, suspendidos, recesoDays, total: feriados + jornadas + suspendidos };
  }, [markedDays, specialWindows]);

  // ========================================
  // HANDLERS
  // ========================================
  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth]);

  const handleDayClick = useCallback((date: Date) => {
    if (canEditGlobal) {
      setSelectedDate(date);
      setPopoverOpen(true);
    } else if (canAddTeacherEvents) {
      setSelectedDate(date);
      setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
      setTeacherEventDialogOpen(true);
    }
  }, [canEditGlobal, canAddTeacherEvents]);

  const handleMarkDay = useCallback((type: DayType) => {
    if (!selectedDate || !canEditGlobal) return;
    const dateKey = formatDateKey(selectedDate);
    
    if (type === null) {
      setMarkedDays(prev => prev.filter(d => d.date !== dateKey));
      toast.success("Dia desmarcado del calendario");
    } else {
      const config = DAY_TYPE_CONFIG[type];
      setMarkedDays(prev => {
        const filtered = prev.filter(d => d.date !== dateKey);
        return [...filtered, { date: dateKey, type, label: config.label }];
      });
      toast.success(`Dia marcado como: ${config.label}`);
    }
    setPopoverOpen(false);
    setSelectedDate(null);
  }, [selectedDate, canEditGlobal]);

  const handleAutoFillFeriados = useCallback(() => {
    if (!canEditGlobal) return;
    const existingDates = new Set(markedDays.filter(d => d.type === "FERIADO").map(d => d.date));
    const newFeriados = FERIADOS_NACIONALES_2025.filter(f => !existingDates.has(f.date));
    if (newFeriados.length === 0) {
      toast.info("Todos los feriados nacionales ya estan cargados");
      return;
    }
    setMarkedDays(prev => [...prev, ...newFeriados]);
    toast.success(`${newFeriados.length} feriados nacionales agregados al calendario`);
  }, [markedDays, canEditGlobal]);

  const handlePeriodDateChange = useCallback((periodId: string, field: "startDate" | "endDate", value: string) => {
    if (!canEditGlobal) return;
    setAcademicPeriods(prev => prev.map(p => p.id === periodId ? { ...p, [field]: value } : p));
  }, [canEditGlobal]);

  const handleSpecialWindowChange = useCallback((windowId: string, field: "startDate" | "endDate", value: string) => {
    if (!canEditGlobal) return;
    setSpecialWindows(prev => prev.map(w => w.id === windowId ? { ...w, [field]: value } : w));
  }, [canEditGlobal]);

  const handleCreateTeacherEvent = useCallback(() => {
    if (!selectedDate || !canAddTeacherEvents || !newTeacherEvent.title || !newTeacherEvent.course) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    const dateKey = formatDateKey(selectedDate);
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
    setSelectedDate(null);
    setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
    toast.success("Fecha de evaluacion programada y publicada para el curso asignado");
  }, [selectedDate, canAddTeacherEvents, newTeacherEvent, currentTeacherId]);

  const handleDeleteTeacherEvent = useCallback((eventId: string) => {
    setTeacherEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success("Evento eliminado del calendario");
  }, []);

  const handleExportCalendar = useCallback(async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsExporting(false);
    toast.success("Sincronizando con Google Calendar / Descargando PDF del ciclo lectivo...");
  }, []);

  // ========================================
  // RENDER GUARDS
  // ========================================
  if (!mounted) return <LoadingState />;

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
            <CalendarIcon className="size-5 text-[#d0bcff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#e4e1ea]">Calendario Institucional</h1>
            <p className="text-xs text-white/40">
              {isAdmin && "Panel de Administracion - Configuracion del ciclo lectivo"}
              {isDocente && "Vista Docente - Agregar fechas de evaluacion"}
              {isPreceptor && "Vista Preceptor - Calendario de solo lectura"}
              {isFamilia && `Calendario escolar de ${childName}`}
              {!effectiveRole && "Vista del ciclo lectivo institucional"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {effectiveRole && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20">
              <Settings className="size-3.5 text-[#d0bcff]" />
              <span className="text-xs text-[#d0bcff]">Rol: {effectiveRole}</span>
            </div>
          )}
          {(!canEditGlobal && !canAddTeacherEvents && !isFamilia) && <ReadOnlyBadge />}
          {canAddTeacherEvents && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4ecdc4]/10 border border-[#4ecdc4]/20">
              <Plus className="size-3.5 text-[#4ecdc4]" />
              <span className="text-xs text-[#4ecdc4]">Clic en un dia para agregar evento</span>
            </div>
          )}
          {isFamilia && (
            <Button
              onClick={handleExportCalendar}
              disabled={isExporting}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Exportar Calendario
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Alert Banner - Business Rules */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20">
        <AlertTriangle className="size-5 text-[#ffb4ab] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#ffb4ab]">Reglas de Bloqueo del Sistema</p>
          <p className="text-xs text-white/60 mt-1 leading-relaxed">
            Durante el <span className="text-[#ffb93d] font-medium">Receso de Invierno</span> y los 
            <span className="text-[#ffb4ab] font-medium"> Feriados oficiales</span>, el sistema 
            pausara automaticamente el envio de alertas por inasistencia y bloqueara la toma de lista.
          </p>
          <p className="text-xs text-[#4de082] mt-2 flex items-center gap-1.5">
            <Check className="size-3.5" />
            Las <span className="font-medium">Semanas de Acreditacion de Saberes</span> mantienen el control de presentismo y la toma de lista completamente activos por corresponder a dias escolares.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid gap-6",
        isAdmin ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"
      )}>
        {/* Calendar Grid */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-white/60 hover:text-white hover:bg-white/5">
              <ChevronLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[#e4e1ea]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-white/60 hover:text-white hover:bg-white/5">
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-[10px] text-white/40 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, idx) => {
              const dateKey = formatDateKey(date);
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = formatDateKey(new Date()) === dateKey;
              const weekend = isWeekend(date);
              const marked = markedDaysMap.get(dateKey);
              const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;
              const inAcademicYear = dateKey >= academicYear.startDate && dateKey <= academicYear.endDate;
              const specialType = getSpecialWindowType(dateKey);
              const dayEvents = calendarEventsMap.get(dateKey) || [];
              const hasEvents = dayEvents.length > 0;
              
              return (
                <Popover
                  key={idx}
                  open={isSelected && popoverOpen && canEditGlobal}
                  onOpenChange={(open) => {
                    if (!open) {
                      setPopoverOpen(false);
                      setSelectedDate(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => handleDayClick(date)}
                      disabled={!canEditGlobal && !canAddTeacherEvents}
                      className={cn(
                        "relative aspect-square p-1 rounded-lg text-sm font-medium transition-all",
                        (canEditGlobal || canAddTeacherEvents) && "hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/50",
                        (!canEditGlobal && !canAddTeacherEvents) && "cursor-default",
                        !isCurrentMonth && "opacity-30",
                        isCurrentMonth && !marked && !weekend && !specialType && "text-[#e4e1ea]",
                        isCurrentMonth && !marked && weekend && "text-white/40",
                        isToday && "ring-1 ring-[#d0bcff]/50",
                        marked && DAY_TYPE_CONFIG[marked.type!].bgColor,
                        marked && DAY_TYPE_CONFIG[marked.type!].color,
                        isSelected && "ring-2 ring-[#d0bcff]",
                        specialType === "RECESO" && !marked && "bg-[#ffb93d]/15 text-[#ffb93d]",
                        specialType === "ACREDITACION" && !marked && "bg-[#d0bcff]/15 text-[#d0bcff]",
                        inAcademicYear && !marked && !weekend && !specialType && "bg-white/[0.02]",
                        hasEvents && "ring-1 ring-[#4ecdc4]/50"
                      )}
                    >
                      <span className="relative z-10">{date.getDate()}</span>
                      
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {marked && (
                          <div className={cn(
                            "size-1.5 rounded-full",
                            marked.type === "FERIADO" && "bg-[#ffb4ab]",
                            marked.type === "JORNADA_DOCENTE" && "bg-[#63a4ff]",
                            marked.type === "SUSPENDIDO" && "bg-[#f9e2af]"
                          )} />
                        )}
                        {specialType === "RECESO" && !marked && <div className="size-1.5 rounded-full bg-[#ffb93d]" />}
                        {specialType === "ACREDITACION" && !marked && <div className="size-1.5 rounded-full bg-[#d0bcff]" />}
                        {dayEvents.slice(0, 3).map((evt, i) => (
                          <div key={i} className={cn("size-1.5 rounded-full", TEACHER_EVENT_CONFIG[evt.type].bgColor.replace('/20', ''))} />
                        ))}
                      </div>
                    </button>
                  </PopoverTrigger>

                  {canEditGlobal && (
                    <PopoverContent className="w-56 p-3 bg-[#1a1a2e] border-white/10" align="start">
                      <div className="space-y-2">
                        <p className="text-xs text-white/60 mb-3">
                          {selectedDate?.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        {(Object.keys(DAY_TYPE_CONFIG) as Array<Exclude<DayType, null>>).map((type) => {
                          const config = DAY_TYPE_CONFIG[type];
                          const Icon = config.icon;
                          return (
                            <Button
                              key={type}
                              variant="ghost"
                              className={cn("w-full justify-start gap-2 h-9", config.color, "hover:bg-white/5")}
                              onClick={() => handleMarkDay(type)}
                            >
                              <Icon className="size-4" />
                              <span className="text-xs">{config.label}</span>
                            </Button>
                          );
                        })}
                        {marked && (
                          <>
                            <div className="h-px bg-white/10 my-2" />
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 h-9 text-white/50 hover:bg-white/5"
                              onClick={() => handleMarkDay(null)}
                            >
                              <X className="size-4" />
                              <span className="text-xs">Quitar marca</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/5">
            {(Object.keys(DAY_TYPE_CONFIG) as Array<Exclude<DayType, null>>).map((type) => {
              const config = DAY_TYPE_CONFIG[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("size-3 rounded", config.bgColor)} />
                  <span className="text-xs text-white/50">{config.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-[#ffb93d]/20" />
              <span className="text-xs text-white/50">Receso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-[#d0bcff]/20" />
              <span className="text-xs text-white/50">Acreditacion</span>
            </div>
            {(canAddTeacherEvents || isFamilia) && (
              <>
                <div className="w-px h-4 bg-white/10 mx-2" />
                {(Object.keys(TEACHER_EVENT_CONFIG) as Array<TeacherEventType>).map((type) => {
                  const config = TEACHER_EVENT_CONFIG[type];
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("size-3 rounded", config.bgColor)} />
                      <span className="text-xs text-white/50">{config.label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Admin Configuration Panel */}
        {isAdmin && (
          <div className="space-y-4">
            {/* Ciclo Lectivo */}
            <div className="p-4 rounded-2xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="size-4 text-[#d0bcff]" />
                <h3 className="text-sm font-semibold text-[#d0bcff]">Ciclo Lectivo 2025</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">Inicio de Clases</label>
                  <Input
                    type="date"
                    value={academicYear.startDate}
                    onChange={(e) => setAcademicYear(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">Fin de Clases</label>
                  <Input
                    type="date"
                    value={academicYear.endDate}
                    onChange={(e) => setAcademicYear(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Period System Selector */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="size-4 text-[#63a4ff]" />
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Regimen Anual</h3>
              </div>
              
              <Select value={periodSystem} onValueChange={(v) => setPeriodSystem(v as PeriodSystem)}>
                <SelectTrigger className="bg-white/[0.02] border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIMESTRAL">Trimestral (3 periodos)</SelectItem>
                  <SelectItem value="CUATRIMESTRAL">Cuatrimestral (2 periodos)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 space-y-3">
                {academicPeriods.map((period) => (
                  <div key={period.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-medium text-[#e4e1ea] mb-2">{period.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Inicio</label>
                        <Input
                          type="date"
                          value={period.startDate}
                          onChange={(e) => handlePeriodDateChange(period.id, "startDate", e.target.value)}
                          className="bg-white/[0.02] border-white/10 text-xs h-7"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Fin</label>
                        <Input
                          type="date"
                          value={period.endDate}
                          onChange={(e) => handlePeriodDateChange(period.id, "endDate", e.target.value)}
                          className="bg-white/[0.02] border-white/10 text-xs h-7"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Windows */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Snowflake className="size-4 text-[#ffb93d]" />
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Receso de Invierno</h3>
              </div>
              
              {specialWindows.filter(w => w.type === "RECESO").map((window) => (
                <div key={window.id} className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">Inicio</label>
                    <Input
                      type="date"
                      value={window.startDate}
                      onChange={(e) => handleSpecialWindowChange(window.id, "startDate", e.target.value)}
                      className="bg-[#ffb93d]/10 border-[#ffb93d]/20 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">Fin</label>
                    <Input
                      type="date"
                      value={window.endDate}
                      onChange={(e) => handleSpecialWindowChange(window.id, "endDate", e.target.value)}
                      className="bg-[#ffb93d]/10 border-[#ffb93d]/20 text-xs h-8"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Acreditacion Windows */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="size-4 text-[#d0bcff]" />
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Semanas de Acreditacion</h3>
              </div>
              
              <div className="space-y-3">
                {specialWindows.filter(w => w.type === "ACREDITACION").map((window) => (
                  <div key={window.id} className="p-3 rounded-lg bg-[#d0bcff]/5 border border-[#d0bcff]/10">
                    <p className="text-xs font-medium text-[#d0bcff] mb-2">{window.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Inicio</label>
                        <Input
                          type="date"
                          value={window.startDate}
                          onChange={(e) => handleSpecialWindowChange(window.id, "startDate", e.target.value)}
                          className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-7"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Fin</label>
                        <Input
                          type="date"
                          value={window.endDate}
                          onChange={(e) => handleSpecialWindowChange(window.id, "endDate", e.target.value)}
                          className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-7"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feriados */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="size-4 text-[#ffb4ab]" />
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Feriados y Dias Inhabiles</h3>
              </div>
              
              <p className="text-xs text-white/40 mb-3">
                Haz clic en cualquier dia del calendario para marcarlo como Feriado, Jornada Docente o Suspendido.
              </p>
              
              <Button
                onClick={handleAutoFillFeriados}
                className="w-full bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 text-sm"
              >
                <Sparkles className="size-4 mr-2" />
                Autocompletar Feriados Nacionales 2025
              </Button>
              
              <p className="text-[10px] text-white/30 mt-2 text-center">
                Carga automatica de {FERIADOS_NACIONALES_2025.length} feriados oficiales
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="p-2 rounded-lg bg-[#ffb4ab]/10 text-center">
                  <p className="text-lg font-bold text-[#ffb4ab]">{stats.feriados}</p>
                  <p className="text-[10px] text-white/40">Feriados</p>
                </div>
                <div className="p-2 rounded-lg bg-[#ffb93d]/10 text-center">
                  <p className="text-lg font-bold text-[#ffb93d]">{stats.recesoDays}</p>
                  <p className="text-[10px] text-white/40">Dias Receso</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Events Panel */}
      {canAddTeacherEvents && myTeacherEvents.length > 0 && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-4 text-[#4ecdc4]" />
            <h3 className="text-sm font-semibold text-[#e4e1ea]">Mis Eventos Programados</h3>
            <span className="ml-auto text-xs text-white/40">{myTeacherEvents.length} eventos</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {myTeacherEvents.sort((a, b) => a.date.localeCompare(b.date)).map((event) => {
              const config = TEACHER_EVENT_CONFIG[event.type];
              const Icon = config.icon;
              const eventDate = new Date(event.date + "T00:00:00");
              
              return (
                <div key={event.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", config.bgColor, "border-white/5 hover:border-white/10")}>
                  <Icon className={cn("size-4 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e4e1ea] truncate">{event.title}</p>
                    <p className="text-xs text-white/50">
                      {event.course} · {eventDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTeacherEvent(event.id)}
                    className="size-7 text-white/40 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Familia Event List */}
      {isFamilia && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-4 text-[#d0bcff]" />
            <h3 className="text-sm font-semibold text-[#e4e1ea]">Proximas Evaluaciones de {childName}</h3>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedChildEvents.map((event) => {
              const config = TEACHER_EVENT_CONFIG[event.type];
              const Icon = config.icon;
              const eventDate = new Date(event.date + "T00:00:00");
              const isPast = new Date(event.date) < new Date();
              
              return (
                <div key={event.id} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors", "bg-white/[0.02] border-white/5", isPast && "opacity-50")}>
                  <div className={cn("p-1.5 rounded-lg shrink-0", config.bgColor)}>
                    <Icon className={cn("size-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e4e1ea]">{event.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{event.course}</p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {eventDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {sortedChildEvents.length === 0 && (
              <div className="text-center py-6">
                <CalendarIcon className="size-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">No hay evaluaciones programadas</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#63a4ff]/10 border border-[#63a4ff]/20">
              <Info className="size-4 text-[#63a4ff] shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/60 leading-relaxed">
                Este calendario muestra las evaluaciones de las materias que cursa {childName.split(' ')[0]}. 
                Los hitos institucionales (feriados, recesos) son visibles para toda la comunidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Event Dialog */}
      <Dialog open={teacherEventDialogOpen} onOpenChange={setTeacherEventDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <Plus className="size-5 text-[#d0bcff]" />
              Agregar Evento de Catedra
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedDate && (
                <span>
                  Programar para el{" "}
                  <span className="text-[#d0bcff] font-medium">
                    {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Tipo de Evento</label>
              <Select value={newTeacherEvent.type} onValueChange={(v) => setNewTeacherEvent(prev => ({ ...prev, type: v as TeacherEventType }))}>
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
              <label className="text-xs text-white/60 font-medium">Titulo de la Evaluacion *</label>
              <Input
                placeholder="Ej: Parcial Unidad 3"
                value={newTeacherEvent.title}
                onChange={(e) => setNewTeacherEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Curso / Division *</label>
              <Select value={newTeacherEvent.course} onValueChange={(v) => setNewTeacherEvent(prev => ({ ...prev, course: v }))}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TEACHER_COURSES.map((course) => (
                    <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Notas Adicionales</label>
              <Textarea
                placeholder="Temas a evaluar, indicaciones especiales..."
                value={newTeacherEvent.notes}
                onChange={(e) => setNewTeacherEvent(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white/[0.02] border-white/10 resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setTeacherEventDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTeacherEvent}
              disabled={!newTeacherEvent.title || !newTeacherEvent.course}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              <Check className="size-4 mr-2" />
              Programar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
