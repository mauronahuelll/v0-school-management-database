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
  BookOpen,
  Sparkles,
  X,
  Check,
  Info,
  Lock,
  GraduationCap,
  Snowflake,
  ClipboardCheck,
  Shield,
  Eye,
  Plus,
  FileText,
  Presentation,
  PenLine
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
import { useAuth } from "@/lib/context/auth-context";

// ============================================
// TYPES
// ============================================

type DayType = "FERIADO" | "JORNADA_DOCENTE" | "SUSPENDIDO" | null;
type PeriodSystem = "TRIMESTRAL" | "CUATRIMESTRAL";

interface MarkedDay {
  date: string; // YYYY-MM-DD
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

// Teacher private events
type TeacherEventType = "EXAMEN" | "TRABAJO_PRACTICO" | "CLASE_ESPECIAL";

interface TeacherEvent {
  id: string;
  teacherId: string; // Scoped to specific teacher
  date: string; // YYYY-MM-DD
  type: TeacherEventType;
  title: string;
  course: string;
  notes: string;
}

const TEACHER_EVENT_CONFIG: Record<TeacherEventType, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  EXAMEN: { 
    label: "Fecha de Examen", 
    color: "text-[#ff6b6b]", 
    bgColor: "bg-[#ff6b6b]/20",
    icon: FileText 
  },
  TRABAJO_PRACTICO: { 
    label: "Entrega de TP", 
    color: "text-[#4ecdc4]", 
    bgColor: "bg-[#4ecdc4]/20",
    icon: PenLine 
  },
  CLASE_ESPECIAL: { 
    label: "Clase Especial", 
    color: "text-[#ffe66d]", 
    bgColor: "bg-[#ffe66d]/20",
    icon: Presentation 
  },
};

// Mock courses for teacher
const MOCK_TEACHER_COURSES = [
  { id: "c1", name: "Matematica - 4to A" },
  { id: "c2", name: "Matematica - 4to B" },
  { id: "c3", name: "Matematica - 5to A" },
  { id: "c4", name: "Algebra - 6to A" },
];

// ============================================
// CONSTANTS
// ============================================

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_TYPE_CONFIG: Record<Exclude<DayType, null>, { label: string; color: string; bgColor: string; icon: typeof Flag }> = {
  FERIADO: { 
    label: "Feriado Nacional", 
    color: "text-[#ffb4ab]", 
    bgColor: "bg-[#ffb4ab]/20",
    icon: Flag 
  },
  JORNADA_DOCENTE: { 
    label: "Jornada Docente", 
    color: "text-[#63a4ff]", 
    bgColor: "bg-[#63a4ff]/20",
    icon: Users 
  },
  SUSPENDIDO: { 
    label: "Suspendido (Inclemencias)", 
    color: "text-[#f9e2af]", 
    bgColor: "bg-[#f9e2af]/20",
    icon: CloudRain 
  },
};

// Argentine national holidays 2025
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

// Default academic periods (trimestral)
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
// HELPER FUNCTIONS
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

// ============================================
// COMPONENTS
// ============================================

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-xl font-bold", color || "text-[#e4e1ea]")}>{value}</p>
    </div>
  );
}

function ReadOnlyBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
      <Eye className="size-3.5 text-white/50" />
      <span className="text-xs text-white/50">Solo lectura</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  
  // Permission check
  const isAdmin = activeContext?.role === "ADMIN";
  const isDocente = activeContext?.role === "DOCENTE";
  const canEditGlobal = isAdmin;
  const canAddTeacherEvents = isDocente;
  
  // Mock teacher ID (would come from activeContext in real implementation)
  const currentTeacherId = activeContext?.id || "teacher-001";
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [markedDays, setMarkedDays] = useState<MarkedDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Teacher events state (scoped by teacherId)
  const [teacherEvents, setTeacherEvents] = useState<TeacherEvent[]>([]);
  const [teacherEventDialogOpen, setTeacherEventDialogOpen] = useState(false);
  const [newTeacherEvent, setNewTeacherEvent] = useState<Partial<TeacherEvent>>({
    type: "EXAMEN",
    title: "",
    course: "",
    notes: "",
  });
  
  // Academic configuration
  const [academicYear, setAcademicYear] = useState({
    startDate: "2025-03-03",
    endDate: "2025-12-15",
  });
  
  const [periodSystem, setPeriodSystem] = useState<PeriodSystem>("TRIMESTRAL");
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>(DEFAULT_TRIMESTRES);
  const [specialWindows, setSpecialWindows] = useState<SpecialWindow[]>(DEFAULT_SPECIAL_WINDOWS);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update periods when system changes
  useEffect(() => {
    if (periodSystem === "TRIMESTRAL") {
      setAcademicPeriods(DEFAULT_TRIMESTRES);
    } else {
      setAcademicPeriods(DEFAULT_CUATRIMESTRES);
    }
  }, [periodSystem]);

  // Get days for current month view
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Create maps for quick lookups
  const markedDaysMap = useMemo(() => {
    const map = new Map<string, MarkedDay>();
    markedDays.forEach(day => map.set(day.date, day));
    return map;
  }, [markedDays]);

  // Filter teacher events to only show current teacher's events (blindaje entre colegas)
  const myTeacherEvents = useMemo(() => {
    return teacherEvents.filter(e => e.teacherId === currentTeacherId);
  }, [teacherEvents, currentTeacherId]);

  // Create map for teacher events by date
  const teacherEventsMap = useMemo(() => {
    const map = new Map<string, TeacherEvent[]>();
    myTeacherEvents.forEach(event => {
      const existing = map.get(event.date) || [];
      map.set(event.date, [...existing, event]);
    });
    return map;
  }, [myTeacherEvents]);

  // Check if a date is in any special window
  const getSpecialWindowType = useCallback((dateKey: string): "RECESO" | "ACREDITACION" | null => {
    for (const window of specialWindows) {
      if (isDateInRange(dateKey, window.startDate, window.endDate)) {
        return window.type;
      }
    }
    return null;
  }, [specialWindows]);

  // Get period for a date
  const getPeriodForDate = useCallback((dateKey: string): AcademicPeriod | null => {
    for (const period of academicPeriods) {
      if (isDateInRange(dateKey, period.startDate, period.endDate)) {
        return period;
      }
    }
    return null;
  }, [academicPeriods]);

  // Stats
  const stats = useMemo(() => {
    const feriados = markedDays.filter(d => d.type === "FERIADO").length;
    const jornadas = markedDays.filter(d => d.type === "JORNADA_DOCENTE").length;
    const suspendidos = markedDays.filter(d => d.type === "SUSPENDIDO").length;
    
    // Count receso days
    const recesoWindow = specialWindows.find(w => w.type === "RECESO");
    let recesoDays = 0;
    if (recesoWindow) {
      const start = new Date(recesoWindow.startDate);
      const end = new Date(recesoWindow.endDate);
      recesoDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    return { feriados, jornadas, suspendidos, recesoDays, total: feriados + jornadas + suspendidos };
  }, [markedDays, specialWindows]);

  // Handlers
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
      // Admin can mark global days
      setSelectedDate(date);
      setPopoverOpen(true);
    } else if (canAddTeacherEvents) {
      // Docente can add their own events
      setSelectedDate(date);
      setNewTeacherEvent({
        type: "EXAMEN",
        title: "",
        course: "",
        notes: "",
      });
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
    setAcademicPeriods(prev => prev.map(p => 
      p.id === periodId ? { ...p, [field]: value } : p
    ));
  }, [canEditGlobal]);

  const handleSpecialWindowChange = useCallback((windowId: string, field: "startDate" | "endDate", value: string) => {
    if (!canEditGlobal) return;
    setSpecialWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, [field]: value } : w
    ));
  }, [canEditGlobal]);

  // Teacher event handlers
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

  if (!mounted) return null;

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
              {canEdit 
                ? "Configuracion del ciclo lectivo y dias inhabiles" 
                : "Vista del ciclo lectivo institucional"
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!canEditGlobal && !canAddTeacherEvents && <ReadOnlyBadge />}
          {canAddTeacherEvents && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20">
              <Plus className="size-3.5 text-[#d0bcff]" />
              <span className="text-xs text-[#d0bcff]">Clic en un dia para agregar evento</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner - System Impact */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#63a4ff]/10 border border-[#63a4ff]/20">
        <Shield className="size-5 text-[#63a4ff] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#63a4ff]">Bloqueo Automatico de Alertas</p>
          <p className="text-xs text-white/60 mt-1">
            Durante el <span className="text-[#ffb93d] font-medium">Receso de Invierno</span>, 
            <span className="text-[#ffb4ab] font-medium"> Feriados</span> y 
            <span className="text-[#d0bcff] font-medium"> Semanas de Acreditacion</span>, 
            el sistema congela automaticamente el envio de notificaciones por inasistencia y bloquea la toma de lista.
          </p>
        </div>
      </div>

      {/* Main Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        
        {/* Left Column - Calendar Grid */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="size-5" />
            </Button>
            
            <h2 className="text-lg font-semibold text-[#e4e1ea]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <div 
                key={day} 
                className={cn(
                  "text-center text-xs font-medium py-2",
                  i === 0 || i === 6 ? "text-white/30" : "text-white/50"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
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
              const currentPeriod = getPeriodForDate(dateKey);
              const dayTeacherEvents = teacherEventsMap.get(dateKey) || [];
              const hasTeacherEvents = dayTeacherEvents.length > 0;
              
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
                        // Special windows styling
                        specialType === "RECESO" && !marked && "bg-[#ffb93d]/15 text-[#ffb93d]",
                        specialType === "ACREDITACION" && !marked && "bg-[#d0bcff]/15 text-[#d0bcff]",
                        // Period background
                        inAcademicYear && !marked && !weekend && !specialType && "bg-white/[0.02]",
                        // Teacher events indicator
                        hasTeacherEvents && "ring-1 ring-[#4ecdc4]/50"
                      )}
                    >
                      <span className="relative z-10">{date.getDate()}</span>
                      
                      {/* Indicator dots */}
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {marked && (
                          <div className={cn(
                            "size-1.5 rounded-full",
                            marked.type === "FERIADO" && "bg-[#ffb4ab]",
                            marked.type === "JORNADA_DOCENTE" && "bg-[#63a4ff]",
                            marked.type === "SUSPENDIDO" && "bg-[#f9e2af]"
                          )} />
                        )}
                        {specialType === "RECESO" && !marked && (
                          <div className="size-1.5 rounded-full bg-[#ffb93d]" />
                        )}
                        {specialType === "ACREDITACION" && !marked && (
                          <div className="size-1.5 rounded-full bg-[#d0bcff]" />
                        )}
                        {/* Teacher event dots */}
                        {dayTeacherEvents.slice(0, 3).map((evt, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "size-1.5 rounded-full",
                              TEACHER_EVENT_CONFIG[evt.type].bgColor.replace('/20', '')
                            )} 
                          />
                        ))}
                      </div>
                    </button>
                  </PopoverTrigger>
                  
                  {canEditGlobal && (
                    <PopoverContent 
                      className="w-64 p-0 bg-[#1a1a2e] border-white/10"
                      align="start"
                    >
                      <div className="p-3 border-b border-white/5">
                        <p className="text-sm font-medium text-[#e4e1ea]">
                          {date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        {marked && (
                          <p className={cn("text-xs mt-1", DAY_TYPE_CONFIG[marked.type!].color)}>
                            {marked.label}
                          </p>
                        )}
                        {specialType && !marked && (
                          <p className={cn(
                            "text-xs mt-1",
                            specialType === "RECESO" && "text-[#ffb93d]",
                            specialType === "ACREDITACION" && "text-[#d0bcff]"
                          )}>
                            {specialType === "RECESO" ? "Receso de Invierno" : "Semana de Acreditacion"}
                          </p>
                        )}
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider px-2 py-1">
                          Marcar como:
                        </p>
                        
                        {(Object.keys(DAY_TYPE_CONFIG) as Array<Exclude<DayType, null>>).map((type) => {
                          const config = DAY_TYPE_CONFIG[type];
                          const Icon = config.icon;
                          const isActive = marked?.type === type;
                          
                          return (
                            <button
                              key={type}
                              onClick={() => handleMarkDay(type)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors",
                                isActive 
                                  ? `${config.bgColor} ${config.color}` 
                                  : "text-white/60 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              <Icon className="size-4" />
                              <span>{config.label}</span>
                              {isActive && <Check className="size-4 ml-auto" />}
                            </button>
                          );
                        })}
                        
                        {marked && (
                          <>
                            <div className="border-t border-white/5 my-2" />
                            <button
                              onClick={() => handleMarkDay(null)}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                            >
                              <X className="size-4" />
                              <span>Quitar marca</span>
                            </button>
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
            {/* Teacher event legend items */}
            {canAddTeacherEvents && (
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

        {/* Right Column - Control Panel */}
        <div className="space-y-4">
          
          {/* Admin-Only Configuration */}
          {canEditGlobal ? (
            <>
              {/* Period System Selector */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="size-4 text-[#d0bcff]" />
                  <h3 className="text-sm font-semibold text-[#e4e1ea]">Sistema de Periodos</h3>
                </div>
                
                <Select value={periodSystem} onValueChange={(v: PeriodSystem) => setPeriodSystem(v)}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIMESTRAL">Trimestral (3 periodos)</SelectItem>
                    <SelectItem value="CUATRIMESTRAL">Cuatrimestral (2 periodos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Periods Config */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="size-4 text-[#63a4ff]" />
                  <h3 className="text-sm font-semibold text-[#e4e1ea]">Periodos Escolares</h3>
                </div>
                
                <div className="space-y-4">
                  {academicPeriods.map((period) => (
                    <div key={period.id} className="space-y-2">
                      <p className="text-xs text-white/60 font-medium">{period.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Inicio</label>
                          <Input
                            type="date"
                            value={period.startDate}
                            onChange={(e) => handlePeriodDateChange(period.id, "startDate", e.target.value)}
                            className="bg-white/[0.02] border-white/10 text-xs h-8"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Fin</label>
                          <Input
                            type="date"
                            value={period.endDate}
                            onChange={(e) => handlePeriodDateChange(period.id, "endDate", e.target.value)}
                            className="bg-white/[0.02] border-white/10 text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receso de Invierno */}
              <div className="p-4 rounded-2xl bg-[#ffb93d]/5 border border-[#ffb93d]/20 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <Snowflake className="size-4 text-[#ffb93d]" />
                  <h3 className="text-sm font-semibold text-[#ffb93d]">Receso de Invierno</h3>
                </div>
                
                {specialWindows.filter(w => w.type === "RECESO").map((window) => (
                  <div key={window.id} className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-white/40 mb-1 block">Inicio</label>
                      <Input
                        type="date"
                        value={window.startDate}
                        onChange={(e) => handleSpecialWindowChange(window.id, "startDate", e.target.value)}
                        className="bg-white/[0.02] border-[#ffb93d]/20 text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 mb-1 block">Fin</label>
                      <Input
                        type="date"
                        value={window.endDate}
                        onChange={(e) => handleSpecialWindowChange(window.id, "endDate", e.target.value)}
                        className="bg-white/[0.02] border-[#ffb93d]/20 text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Semanas de Acreditacion */}
              <div className="p-4 rounded-2xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="size-4 text-[#d0bcff]" />
                  <h3 className="text-sm font-semibold text-[#d0bcff]">Semanas de Acreditacion</h3>
                </div>
                
                <div className="space-y-4">
                  {specialWindows.filter(w => w.type === "ACREDITACION").map((window) => (
                    <div key={window.id} className="space-y-2">
                      <p className="text-xs text-white/60">{window.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Inicio</label>
                          <Input
                            type="date"
                            value={window.startDate}
                            onChange={(e) => handleSpecialWindowChange(window.id, "startDate", e.target.value)}
                            className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-8"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Fin</label>
                          <Input
                            type="date"
                            value={window.endDate}
                            onChange={(e) => handleSpecialWindowChange(window.id, "endDate", e.target.value)}
                            className="bg-white/[0.02] border-[#d0bcff]/20 text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-fill Feriados */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="size-4 text-[#ffb4ab]" />
                  <h3 className="text-sm font-semibold text-[#e4e1ea]">Feriados Nacionales</h3>
                </div>
                
                <p className="text-xs text-white/40 mb-3">
                  Carga automaticamente los feriados nacionales de Argentina 2025.
                </p>
                
                <Button
                  onClick={handleAutoFillFeriados}
                  className="w-full bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 text-sm"
                >
                  <Sparkles className="size-4 mr-2" />
                  Autocompletar Feriados
                </Button>
              </div>
            </>
          ) : (
            /* Read-Only View for Non-Admins */
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="size-4 text-white/40" />
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Informacion del Ciclo</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Sistema</span>
                  <span className="text-[#e4e1ea]">{periodSystem === "TRIMESTRAL" ? "Trimestral" : "Cuatrimestral"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Inicio de Clases</span>
                  <span className="text-[#e4e1ea]">{new Date(academicYear.startDate).toLocaleDateString("es-AR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Fin de Clases</span>
                  <span className="text-[#e4e1ea]">{new Date(academicYear.endDate).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-white/40">
                  Los periodos y fechas especiales son configurados por Secretaria/Direccion.
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Info className="size-4 text-white/40" />
              <h3 className="text-sm font-semibold text-[#e4e1ea]">Resumen Anual</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Feriados" value={stats.feriados} color="text-[#ffb4ab]" />
              <StatCard label="Jornadas Doc." value={stats.jornadas} color="text-[#63a4ff]" />
              <StatCard label="Dias Receso" value={stats.recesoDays} color="text-[#ffb93d]" />
              <StatCard label="Total Inhabiles" value={stats.total + stats.recesoDays} />
            </div>
          </div>
        </div>
      </div>

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
            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Tipo de Evento</label>
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

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Titulo de la Evaluacion *</label>
              <Input
                placeholder="Ej: Parcial Unidad 3"
                value={newTeacherEvent.title}
                onChange={(e) => setNewTeacherEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            {/* Course */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 font-medium">Curso / Division *</label>
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

            {/* Notes */}
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
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              <Check className="size-4 mr-2" />
              Programar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Events List Panel (for teachers) */}
      {canAddTeacherEvents && myTeacherEvents.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-4 text-[#4ecdc4]" />
            <h3 className="text-sm font-semibold text-[#e4e1ea]">Mis Eventos Programados</h3>
            <span className="ml-auto text-xs text-white/40">{myTeacherEvents.length} eventos</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {myTeacherEvents
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((event) => {
                const config = TEACHER_EVENT_CONFIG[event.type];
                const Icon = config.icon;
                const eventDate = new Date(event.date + "T00:00:00");
                
                return (
                  <div 
                    key={event.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      config.bgColor,
                      "border-white/5 hover:border-white/10"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e4e1ea] truncate">{event.title}</p>
                      <p className="text-xs text-white/50">
                        {event.course} &middot; {eventDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
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
    </div>
  );
}
