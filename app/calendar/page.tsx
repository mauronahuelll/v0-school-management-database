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
  Info
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

// ============================================
// TYPES
// ============================================

type DayType = "FERIADO" | "JORNADA_DOCENTE" | "SUSPENDIDO" | null;

interface MarkedDay {
  date: string; // YYYY-MM-DD
  type: DayType;
  label: string;
}

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
    color: "text-[#89b4fa]", 
    bgColor: "bg-[#89b4fa]/20",
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
  
  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Add days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  
  // Add padding days from next month to complete 6 rows
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [markedDays, setMarkedDays] = useState<MarkedDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Academic year config
  const [academicYear, setAcademicYear] = useState({
    startDate: "2025-03-03",
    endDate: "2025-12-15",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get days for current month view
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Create a map for quick lookup of marked days
  const markedDaysMap = useMemo(() => {
    const map = new Map<string, MarkedDay>();
    markedDays.forEach(day => map.set(day.date, day));
    return map;
  }, [markedDays]);

  // Stats
  const stats = useMemo(() => {
    const feriados = markedDays.filter(d => d.type === "FERIADO").length;
    const jornadas = markedDays.filter(d => d.type === "JORNADA_DOCENTE").length;
    const suspendidos = markedDays.filter(d => d.type === "SUSPENDIDO").length;
    return { feriados, jornadas, suspendidos, total: feriados + jornadas + suspendidos };
  }, [markedDays]);

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
    setSelectedDate(date);
    setPopoverOpen(true);
  }, []);

  const handleMarkDay = useCallback((type: DayType) => {
    if (!selectedDate) return;
    
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
  }, [selectedDate]);

  const handleAutoFillFeriados = useCallback(() => {
    const existingDates = new Set(markedDays.filter(d => d.type === "FERIADO").map(d => d.date));
    const newFeriados = FERIADOS_NACIONALES_2025.filter(f => !existingDates.has(f.date));
    
    if (newFeriados.length === 0) {
      toast.info("Todos los feriados nacionales ya estan cargados");
      return;
    }
    
    setMarkedDays(prev => [...prev, ...newFeriados]);
    toast.success(`${newFeriados.length} feriados nacionales agregados al calendario`);
  }, [markedDays]);

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
            <p className="text-xs text-white/40">Configuracion del ciclo lectivo y dias inhabiles</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20">
        <AlertTriangle className="size-5 text-[#ffb4ab] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#ffb4ab]">Impacto en el Sistema</p>
          <p className="text-xs text-white/60 mt-1">
            Los dias marcados como Inhabiles pausaran automaticamente el envio de notificaciones por inasistencia 
            y bloquearan la toma de lista en esas fechas.
          </p>
        </div>
      </div>

      {/* Main Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* Left Column - Calendar Grid */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
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
              
              return (
                <Popover 
                  key={idx} 
                  open={isSelected && popoverOpen}
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
                      className={cn(
                        "relative aspect-square p-1 rounded-lg text-sm font-medium transition-all",
                        "hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/50",
                        !isCurrentMonth && "opacity-30",
                        isCurrentMonth && !marked && !weekend && "text-[#e4e1ea]",
                        isCurrentMonth && !marked && weekend && "text-white/40",
                        isToday && "ring-1 ring-[#d0bcff]/50",
                        marked && DAY_TYPE_CONFIG[marked.type!].bgColor,
                        marked && DAY_TYPE_CONFIG[marked.type!].color,
                        isSelected && "ring-2 ring-[#d0bcff]",
                        inAcademicYear && !marked && !weekend && "bg-white/[0.02]"
                      )}
                    >
                      <span className="relative z-10">{date.getDate()}</span>
                      {marked && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                          <div className={cn(
                            "size-1.5 rounded-full",
                            marked.type === "FERIADO" && "bg-[#ffb4ab]",
                            marked.type === "JORNADA_DOCENTE" && "bg-[#89b4fa]",
                            marked.type === "SUSPENDIDO" && "bg-[#f9e2af]"
                          )} />
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  
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
          </div>
        </div>

        {/* Right Column - Control Panel */}
        <div className="space-y-4">
          {/* Academic Year Config */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="size-4 text-[#d0bcff]" />
              <h3 className="text-sm font-semibold text-[#e4e1ea]">Ciclo Lectivo</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Inicio de Clases</label>
                <Input
                  type="date"
                  value={academicYear.startDate}
                  onChange={(e) => setAcademicYear(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white/[0.02] border-white/10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Fin de Clases</label>
                <Input
                  type="date"
                  value={academicYear.endDate}
                  onChange={(e) => setAcademicYear(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white/[0.02] border-white/10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Auto-fill Feriados */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
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

          {/* Stats */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Info className="size-4 text-white/40" />
              <h3 className="text-sm font-semibold text-[#e4e1ea]">Resumen</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Feriados" value={stats.feriados} color="text-[#ffb4ab]" />
              <StatCard label="Jornadas" value={stats.jornadas} color="text-[#89b4fa]" />
              <StatCard label="Suspendidos" value={stats.suspendidos} color="text-[#f9e2af]" />
              <StatCard label="Total Inhabiles" value={stats.total} />
            </div>
          </div>

          {/* Upcoming Marked Days */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-[#e4e1ea] mb-3">Proximos Dias Inhabiles</h3>
            
            {markedDays.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-4">
                No hay dias marcados aun
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {markedDays
                  .filter(d => d.date >= formatDateKey(new Date()))
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 8)
                  .map((day) => {
                    const config = DAY_TYPE_CONFIG[day.type!];
                    const Icon = config.icon;
                    const date = new Date(day.date + "T12:00:00");
                    
                    return (
                      <div 
                        key={day.date}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium truncate", config.color)}>
                            {day.label}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
