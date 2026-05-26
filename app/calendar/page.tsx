"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, type Role } from "@/lib/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  ShieldAlert, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Download,
  Loader2,
  Sparkles,
  Flag,
  Check,
  GraduationCap,
  FileText,
  PenLine,
  Presentation
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// ============================================
// TYPES
// ============================================

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
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [markedDays, setMarkedDays] = useState<MarkedDay[]>([]);
  
  // Admin config state
  const [periodSystem, setPeriodSystem] = useState("trimestre");
  const [startDate, setStartDate] = useState("2026-03-02");
  const [endDate, setEndDate] = useState("2026-12-11");
  const [recesoStart, setRecesoStart] = useState("2026-07-20");
  const [recesoEnd, setRecesoEnd] = useState("2026-07-31");
  const [acredStart, setAcredStart] = useState("2026-12-14");
  const [acredEnd, setAcredEnd] = useState("2026-12-18");
  
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
    // Fallback estrategico: si el contexto tarda, lee el rol del sandbox inmediato
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

  // ========================================
  // Handlers
  // ========================================
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
    toast.success("Calendario global guardado y publicado");
  }, []);

  const handleCreateTeacherEvent = useCallback(() => {
    if (!selectedDate || !newTeacherEvent.title || !newTeacherEvent.course) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    const dateKey = selectedDate.toISOString().split("T")[0];
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
    toast.success("Sincronizando con Google Calendar / Descargando PDF del ciclo lectivo...");
  }, []);

  // ========================================
  // Render Guard
  // ========================================
  if (!mounted || !currentRole) return null;

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-6 text-[#e4e1ea]">
      {/* HEADER DE LA PAGINA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.01] border border-white/[0.05] rounded-2xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">Cronograma General</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Calendario Institucional</h1>
          <p className="text-xs text-white/40">Planificacion de ciclos, recesos y fechas de evaluacion.</p>
        </div>
        <div className="mt-2 md:mt-0 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs rounded-xl">
          Vista Operativa: {currentRole}
        </div>
      </header>

      {/* RENDER CONDICIONAL MAESTRO */}
      {currentRole === "ADMIN" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CONFIGURACION DEL ADMIN (COLUMNA IZQUIERDA - 1 PARTE) */}
          <div className="lg:col-span-1 space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">Parametros de Ciclo Lectivo</h2>
            
            <div className="space-y-2">
              <label className="text-xs text-white/50">Regimen Academico</label>
              <Select value={periodSystem} onValueChange={setPeriodSystem}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestre">Trimestres (Clasico)</SelectItem>
                  <SelectItem value="cuatrimestre">Cuatrimestres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase">Inicio Clases</label>
                <Input 
                  type="date" 
                  className="bg-black/40 border-white/10 text-xs" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase">Fin Clases</label>
                <Input 
                  type="date" 
                  className="bg-black/40 border-white/10 text-xs" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-bold text-white/70">Receso de Invierno</h3>
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

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-bold text-white/70">Semanas de Acreditacion</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  type="date" 
                  className="bg-black/40 border-white/10 text-xs" 
                  value={acredStart}
                  onChange={(e) => setAcredStart(e.target.value)}
                />
                <Input 
                  type="date" 
                  className="bg-black/40 border-white/10 text-xs" 
                  value={acredEnd}
                  onChange={(e) => setAcredEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-bold text-white/70">Feriados Nacionales</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-white/10 text-xs"
                onClick={handleAutoFillFeriados}
              >
                <Sparkles className="size-3.5 mr-2" />
                Cargar Feriados 2026
              </Button>
              <p className="text-[10px] text-white/30 text-center">
                {markedDays.filter(d => d.type === "FERIADO").length} feriados cargados
              </p>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold mt-4 py-5 rounded-xl transition-all shadow-lg" 
              onClick={handlePublishCalendar}
            >
              Publicar Calendario Maestro
            </Button>
          </div>

          {/* CALENDARIO VISUAL (COLUMNA DERECHA - 2 PARTES) */}
          <div className="lg:col-span-2 space-y-4">
            <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200 rounded-2xl p-4">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wide">Regla de Negocio de Presentismo</AlertTitle>
              <AlertDescription className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                Durante el <strong>Receso de Invierno</strong> y <strong>Feriados oficiales</strong>, el sistema pausara automaticamente el envio de alertas por inasistencia y bloqueara la toma de lista. Las <strong>Semanas de Acreditacion de Saberes</strong> mantienen el control de presentismo y la toma de lista completamente activos por corresponder a dias escolares de asistencia obligatoria.
              </AlertDescription>
            </Alert>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-center backdrop-blur-md">
              <Calendar 
                mode="single" 
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-none scale-110 font-sans" 
              />
            </div>
            
            {/* Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Feriados</p>
                <p className="text-lg font-bold text-[#ffb4ab]">{markedDays.filter(d => d.type === "FERIADO").length}</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Dias Receso</p>
                <p className="text-lg font-bold text-[#ffb93d]">12</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Acreditacion</p>
                <p className="text-lg font-bold text-[#d0bcff]">5</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Dias Lectivos</p>
                <p className="text-lg font-bold text-[#4de082]">180</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PARA OTROS ROLES (DOCENTE, PRECEPTOR, FAMILIA) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center backdrop-blur-md">
            <Calendar 
              mode="single" 
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                if (currentRole === "DOCENTE" && date) {
                  setNewTeacherEvent({ type: "EXAMEN", title: "", course: "", notes: "" });
                  setTeacherEventDialogOpen(true);
                }
              }}
              className="border-none" 
            />
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 backdrop-blur-md">
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
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agendar Examen
                </Button>
              )}
              {currentRole === "FAMILIA" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-white/10 text-xs h-8" 
                  onClick={handleExportCalendar}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Hitos Institucionales */}
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-white">Inicio de Clases - Ciclo 2026</p>
                <p className="text-white/40 font-mono text-[10px]">02 de Marzo - Hito Institucional</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-300">Receso de Invierno</p>
                <p className="text-amber-400/50 font-mono text-[10px]">20 Jul - 31 Jul - Sin asistencia</p>
              </div>
              
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
                        className={cn("p-3 border rounded-xl text-xs space-y-1", config.bgColor, "border-white/5")}
                      >
                        <div className="flex items-center justify-between">
                          <p className={cn("font-bold flex items-center gap-1.5", config.color)}>
                            <Icon className="size-3" />
                            {event.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-white/40 hover:text-[#ffb4ab]"
                            onClick={() => handleDeleteTeacherEvent(event.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                        <p className="text-white/50 font-mono text-[10px]">{event.course} - {event.date}</p>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Child Events (Familia) */}
              {currentRole === "FAMILIA" && childEvents.length > 0 && (
                <>
                  <div className="h-px bg-white/5 my-2" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Evaluaciones de {childName.split(' ')[0]}</p>
                  {childEvents.map((event) => {
                    const config = TEACHER_EVENT_CONFIG[event.type];
                    const Icon = config.icon;
                    return (
                      <div 
                        key={event.id} 
                        className={cn("p-3 border rounded-xl text-xs space-y-1", config.bgColor, "border-white/5")}
                      >
                        <p className={cn("font-bold flex items-center gap-1.5", config.color)}>
                          <Icon className="size-3" />
                          {event.title}
                        </p>
                        <p className="text-white/50 font-mono text-[10px]">{event.course} - {event.date}</p>
                        {event.notes && <p className="text-white/30 text-[10px] italic">{event.notes}</p>}
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Placeholder for Preceptor */}
              {currentRole === "PRECEPTOR" && (
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-purple-300">Mesa de Examen Diciembre</p>
                  <p className="text-purple-400/50 font-mono text-[10px]">14 Dic - 18 Dic - Acreditacion activa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog para Docente - Agendar Evaluacion */}
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
    </div>
  );
}
