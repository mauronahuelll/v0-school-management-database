"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, Users, Clock, ShieldAlert, 
  BookOpen, Calendar, TrendingUp,
  Bell, FileText, RefreshCw, AlertTriangle,
  CheckCircle2, UserX, ClipboardCheck, Phone,
  MessageSquare, Inbox, Sparkles, ArrowRight,
  Stethoscope, FileWarning, GraduationCap,
  Upload, FileSpreadsheet, Megaphone, ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { OperationalAlerts, getAlertsCount } from "@/components/dashboard/operational-alerts"
import { cn } from "@/lib/utils";
import { printAsPdf } from "@/lib/utils/export-engine";

// ============================================
// TYPES
// ============================================

interface ActionItem {
  id: string;
  type: "URGENTE" | "PENDIENTE" | "INFO";
  category: string;
  title: string;
  description: string;
  count?: number;
  action?: string;
  href?: string;
}

interface DrillDownRow {
  name: string;
  detail: string;
  badge?: string;
}

interface CriticalMetric {
  label: string;
  value: string | number;
  subtext: string;
  icon: typeof Users;
  status: "critical" | "warning" | "ok";
  drillDown?: {
    title: string;
    description: string;
    rows: DrillDownRow[];
  };
}

// ============================================
// MOCK DATA - ADMIN
// ============================================

const ADMIN_METRICS: CriticalMetric[] = [
  {
    label: "Ausentismo Docente Hoy",
    value: "2",
    subtext: "de 14 docentes (14.3%)",
    icon: UserX,
    status: "warning",
    drillDown: {
      title: "Docentes Ausentes Hoy",
      description: "Registro de inasistencias del personal al 16/06/2026",
      rows: [
        { name: "Prof. Carlos Perez", detail: "Matematica — 4to A y 5to B", badge: "Sin Cobertura" },
        { name: "Prof. Ana Gomez", detail: "Historia — 3er A y 4to B", badge: "Cobertura Gestionada" },
      ],
    },
  },
  {
    label: "Alumnos en Riesgo",
    value: "8",
    subtext: "Desercion / Academico",
    icon: AlertTriangle,
    status: "critical",
    drillDown: {
      title: "Alumnos en Situacion de Riesgo",
      description: "Casos activos por desercion y rendimiento academico critico",
      rows: [
        { name: "Lautaro Sanchez", detail: "4to A — 8 inasistencias este mes", badge: "Desercion" },
        { name: "Valentina Torres", detail: "5to B — Promedio 3.2 en 4 materias", badge: "Academico" },
        { name: "Ignacio Romero", detail: "3er A — Sin presentarse 3 dias seguidos", badge: "Desercion" },
        { name: "Sofia Mendez", detail: "6to A — TED en Matematica y Fisica", badge: "Academico" },
        { name: "Bruno Herrera", detail: "4to B — Contacto familiar sin respuesta", badge: "Desercion" },
        { name: "Camila Rios", detail: "5to A — 5 aplazos primer trimestre", badge: "Academico" },
        { name: "Tomas Vega", detail: "3er B — Conducta reiterada + ausentismo", badge: "Mixto" },
        { name: "Julieta Blanco", detail: "6to B — En proceso de cambio de escuela", badge: "Desercion" },
      ],
    },
  },
  {
    label: "Compliance RRHH",
    value: "71%",
    subtext: "DD.JJ. y documentacion al dia",
    icon: FileText,
    status: "warning",
    drillDown: {
      title: "Incumplimientos de Documentacion",
      description: "Personal con documentacion vencida o pendiente de presentacion",
      rows: [
        { name: "Prof. Roberto Diaz", detail: "Apto Medico vencido — Feb 2026", badge: "Apto Medico" },
        { name: "Prof. Laura Suarez", detail: "Apto Medico vencido — Ene 2026", badge: "Apto Medico" },
        { name: "Lic. Martin Campos", detail: "Sin DD.JJ. de Cargos 2026", badge: "DD.JJ." },
        { name: "Prof. Elena Vargas", detail: "Sin DD.JJ. de Cargos 2026", badge: "DD.JJ." },
        { name: "Prof. Diego Castro", detail: "Constancia CUIL desactualizada", badge: "CUIL" },
      ],
    },
  },
];

const ADMIN_ACTIONS_DOCUMENTACION: ActionItem[] = [
  { 
    id: "1", 
    type: "URGENTE", 
    category: "Documentacion", 
    title: "5 Docentes con Apto Medico vencido", 
    description: "Requiere accion inmediata para cumplimiento legal",
    count: 5,
    action: "Gestionar",
    href: "/users"
  },
  { 
    id: "2", 
    type: "PENDIENTE", 
    category: "Documentacion", 
    title: "12 Alumnos sin ficha de salud", 
    description: "Pendiente de entrega por parte de las familias",
    count: 12,
    action: "Ver listado",
    href: "/students"
  },
  { 
    id: "3", 
    type: "PENDIENTE", 
    category: "Documentacion", 
    title: "3 Docentes sin DD.JJ. de Cargos", 
    description: "Declaracion Jurada anual pendiente",
    count: 3,
    action: "Notificar",
    href: "/users"
  },
];

const ADMIN_ACTIONS_CONVIVENCIA: ActionItem[] = [
  { 
    id: "4", 
    type: "URGENTE", 
    category: "Convivencia", 
    title: "3 Actas graves sin firma de familia", 
    description: "Actas de convivencia pendientes de notificacion",
    count: 3,
    action: "Gestionar",
    href: "/behavior"
  },
  { 
    id: "5", 
    type: "PENDIENTE", 
    category: "Convivencia", 
    title: "2 Derivaciones a Gabinete pendientes", 
    description: "Casos que requieren seguimiento psicopedagogico",
    count: 2,
    action: "Ver casos",
    href: "/behavior"
  },
];

// ============================================
// MOCK DATA - PRECEPTOR
// ============================================

const PRECEPTOR_METRICS: CriticalMetric[] = [
  {
    label: "Toma de Lista Diaria",
    value: "2/4",
    subtext: "Cursos completados hoy",
    icon: ClipboardCheck,
    status: "warning",
    drillDown: {
      title: "Estado de Listas por Curso",
      description: "Registro de toma de asistencia del dia de hoy",
      rows: [
        { name: "3er Ano A", detail: "Lista tomada a las 08:05", badge: "Completo" },
        { name: "4to Ano A", detail: "Lista tomada a las 08:10", badge: "Completo" },
        { name: "4to Ano B", detail: "Sin registrar asistencia", badge: "Pendiente" },
        { name: "5to Ano B", detail: "Sin registrar asistencia", badge: "Pendiente" },
      ],
    },
  },
  {
    label: "Justificaciones Pendientes",
    value: "6",
    subtext: "Ausencias sin justificar",
    icon: FileWarning,
    status: "warning",
    drillDown: {
      title: "Ausencias sin Justificar",
      description: "Alumnos con inasistencias que requieren justificativo",
      rows: [
        { name: "Lautaro Sanchez (4to A)", detail: "3er dia consecutivo sin justificacion", badge: "Critico" },
        { name: "Valentina Castro (4to B)", detail: "Ausencia del 13/06 sin justificar", badge: "Pendiente" },
        { name: "Marcos Diaz (5to A)", detail: "Justificativo medico en revision", badge: "En Proceso" },
        { name: "Lucia Fernandez (3er A)", detail: "Ausencia del 12/06 sin justificar", badge: "Pendiente" },
        { name: "Tomas Vega (5to B)", detail: "2 ausencias esta semana", badge: "Pendiente" },
        { name: "Camila Lopez (4to A)", detail: "Ausencia del 11/06 sin justificar", badge: "Pendiente" },
      ],
    },
  },
  {
    label: "Comunicaciones sin Acuse",
    value: "4",
    subtext: "Enviadas hace +48hs",
    icon: MessageSquare,
    status: "ok",
    drillDown: {
      title: "Comunicaciones sin Acuse de Recibo",
      description: "Notificaciones enviadas hace mas de 48 hs sin confirmacion de lectura",
      rows: [
        { name: "Familia Sanchez (Lautaro)", detail: "Notif. de ausentismo reiterado — 13/06", badge: "+48hs" },
        { name: "Familia Castro (Valentina)", detail: "Circular de acto escolar — 12/06", badge: "+48hs" },
        { name: "Familia Vega (Tomas)", detail: "Citacion a reunion de padres — 11/06", badge: "+72hs" },
        { name: "Familia Mendez (Sofia)", detail: "Informe de rendimiento academico — 10/06", badge: "+96hs" },
      ],
    },
  },
];

const PRECEPTOR_ACTIONS_LISTA: ActionItem[] = [
  { 
    id: "p1", 
    type: "URGENTE", 
    category: "Pase de Lista", 
    title: "4to Ano B - Sin toma de lista", 
    description: "Curso pendiente de registro de asistencia",
    action: "Tomar lista",
    href: "/attendance"
  },
  { 
    id: "p2", 
    type: "URGENTE", 
    category: "Pase de Lista", 
    title: "5to Ano B - Sin toma de lista", 
    description: "Curso pendiente de registro de asistencia",
    action: "Tomar lista",
    href: "/attendance"
  },
];

const PRECEPTOR_ACTIONS_AUSENTES: ActionItem[] = [
  { 
    id: "p3", 
    type: "PENDIENTE", 
    category: "Contactar Familia", 
    title: "Lautaro Sanchez (4to A) - 3er dia ausente", 
    description: "Sin justificativo. Requiere contacto con tutor.",
    action: "Llamar",
    href: "/students"
  },
  { 
    id: "p4", 
    type: "PENDIENTE", 
    category: "Contactar Familia", 
    title: "Valentina Castro (4to B) - Ausente hoy", 
    description: "Primera ausencia de la semana",
    action: "Registrar",
    href: "/students"
  },
  { 
    id: "p5", 
    type: "INFO", 
    category: "Contactar Familia", 
    title: "Marcos Diaz (5to A) - Justificativo recibido", 
    description: "Certificado medico adjuntado por la familia",
    action: "Validar",
    href: "/attendance"
  },
];

// ============================================
// MOCK DATA - DOCENTE
// ============================================

const DOCENTE_METRICS: CriticalMetric[] = [
  {
    label: "Calificaciones Pendientes",
    value: "38",
    subtext: "de 74 alumnos totales",
    icon: BookOpen,
    status: "warning",
    drillDown: {
      title: "Calificaciones Pendientes por Materia",
      description: "Alumnos sin nota registrada para el 1er Trimestre 2026",
      rows: [
        { name: "Matematica IV — 4to B", detail: "18 alumnos sin nota", badge: "18 pendientes" },
        { name: "Algebra Lineal — 5to A", detail: "12 alumnos sin nota", badge: "12 pendientes" },
        { name: "Calculo — 6to A", detail: "8 alumnos sin nota", badge: "8 pendientes" },
      ],
    },
  },
  {
    label: "Dias al Cierre",
    value: "12",
    subtext: "1er Trimestre 2026",
    icon: Calendar,
    status: "ok",
    drillDown: {
      title: "Cronograma de Cierre Trimestral",
      description: "Fechas clave del 1er Trimestre 2026",
      rows: [
        { name: "Cierre de notas", detail: "28 de junio de 2026", badge: "12 dias" },
        { name: "Actas de TED", detail: "30 de junio de 2026", badge: "14 dias" },
        { name: "Entrega de boletin", detail: "5 de julio de 2026", badge: "19 dias" },
      ],
    },
  },
  {
    label: "Recuperatorios Pendientes",
    value: "5",
    subtext: "Alumnos con TED",
    icon: AlertTriangle,
    status: "warning",
    drillDown: {
      title: "Alumnos con Trabajo de Elaboracion Domiciliaria",
      description: "Requieren instancia de recuperatorio antes del cierre",
      rows: [
        { name: "Bruno Herrera (5to A)", detail: "TED en Matematica IV — sin entregar", badge: "Critico" },
        { name: "Lucia Fernandez (4to B)", detail: "TED en Matematica IV — entregado parcial", badge: "En Revision" },
        { name: "Franco Morales (5to A)", detail: "TED en Algebra Lineal — sin entregar", badge: "Critico" },
        { name: "Julieta Blanco (6to A)", detail: "TED en Calculo — sin entregar", badge: "Critico" },
        { name: "Agustina Paz (4to B)", detail: "TED en Matematica IV — entregado", badge: "Para Corregir" },
      ],
    },
  },
];

const DOCENTE_ACTIONS: ActionItem[] = [
  { 
    id: "d1", 
    type: "URGENTE", 
    category: "Calificaciones", 
    title: "Matematica IV (4to B) - 18 notas pendientes", 
    description: "Cierre de trimestre en 12 dias",
    count: 18,
    action: "Cargar notas",
    href: "/grades"
  },
  { 
    id: "d2", 
    type: "PENDIENTE", 
    category: "Calificaciones", 
    title: "Algebra Lineal (5to A) - 12 notas pendientes", 
    description: "Evaluacion del 28/05 sin cargar",
    count: 12,
    action: "Cargar notas",
    href: "/grades"
  },
  { 
    id: "d3", 
    type: "PENDIENTE", 
    category: "Recuperatorios", 
    title: "5 alumnos con TED requieren instancia", 
    description: "Fecha limite: 15/06/2026",
    count: 5,
    action: "Programar",
    href: "/grades"
  },
];

// ============================================
// MOCK DATA - FAMILIA
// ============================================

const ALUMNO_DATA = {
  nombre: "Valentina Castro",
  curso: "4to Ano Secundaria",
  division: "B",
  inasistencias: 3.5,
  limiteInasistencias: 15,
  promedio: 8.45,
  materias: [
    { nombre: "Matematica", nota: 8, estado: "TEA" },
    { nombre: "Lengua", nota: 9, estado: "TEP" },
    { nombre: "Historia", nota: 7, estado: "TED" },
    { nombre: "Fisica", nota: 8, estado: "TEA" },
  ]
}

// ============================================
// SCHOOL DATA
// ============================================

const DATA_POR_ESCUELA: Record<string, {
  name: string
  periodo: string
}> = {
  "inst-1": { name: "Instituto Padre Marquez", periodo: "1er Trimestre 2026" },
  "inst-2": { name: "Colegio Secundario San Martin", periodo: "1er Cuatrimestre 2026" },
  "inst-3": { name: "Escuela Tecnica N3", periodo: "1er Trimestre 2026" }
}

// ============================================
// COMPONENTS
// ============================================

function CriticalMetricCard({
  metric,
  onClick,
}: {
  metric: CriticalMetric;
  onClick?: () => void;
}) {
  const Icon = metric.icon;
  const statusColors = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    ok: "text-[#4de082] bg-[#4de082]/10 border-[#4de082]/20",
  };
  const valueColors = {
    critical: "text-red-400",
    warning: "text-amber-400",
    ok: "text-[#4de082]",
  };
  const hoverBorder = {
    critical: "hover:border-red-500/30",
    warning: "hover:border-amber-500/30",
    ok: "hover:border-[#4de082]/30",
  };

  const isClickable = !!onClick && !!metric.drillDown;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">
          {metric.label}
        </span>
        <div className="flex items-center gap-2">
          {isClickable && (
            <span className="text-[9px] text-white/30 uppercase tracking-widest hidden group-hover:block transition-all">
              Ver detalle
            </span>
          )}
          <div className={cn("p-2 rounded-lg border transition-colors", statusColors[metric.status])}>
            <Icon className="size-4" />
          </div>
        </div>
      </div>
      <p className={cn("text-3xl font-bold tracking-tight", valueColors[metric.status])}>
        {metric.value}
      </p>
      <p className="text-[11px] text-white/40">{metric.subtext}</p>
      {isClickable && (
        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="size-3 text-white/30" />
          <span className="text-[10px] text-white/30">Ver detalle completo</span>
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full text-left p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3",
          "transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d0bcff]/40",
          hoverBorder[metric.status]
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
      {content}
    </div>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const typeConfig = {
    URGENTE: { color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
    PENDIENTE: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
    INFO: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  };
  const config = typeConfig[item.type];

  return (
    <div className="group p-4 rounded-xl bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.025] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn("size-2 rounded-full mt-2 shrink-0", config.dot)} />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                config.color
              )}>
                {item.type}
              </span>
              {item.count && (
                <span className="text-[10px] text-white/30 font-mono">
                  ({item.count})
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-[#e4e1ea]">{item.title}</p>
            <p className="text-xs text-white/40">{item.description}</p>
          </div>
        </div>
        {item.action && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-3 text-xs text-[#d0bcff] hover:bg-[#d0bcff]/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            {item.action}
            <ArrowRight className="size-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ActionSection({ 
  title, 
  items, 
  icon: Icon 
}: { 
  title: string; 
  items: ActionItem[]; 
  icon: typeof FileText;
}) {
  if (items.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className="size-4 text-white/30" />
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] text-white/30 font-mono">({items.length})</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ActionItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ZeroInboxState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl bg-white/[0.01] border border-white/5"
    >
      <div className="size-20 rounded-full bg-[#4de082]/10 flex items-center justify-center mb-6 border border-[#4de082]/20">
        <Sparkles className="size-10 text-[#4de082]" />
      </div>
      <h3 className="text-xl font-bold text-[#e4e1ea] mb-2">Todo bajo control</h3>
      <p className="text-sm text-white/40 text-center max-w-sm">
        No hay tareas pendientes criticas. La institucion esta operando con normalidad.
      </p>
      <div className="flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-[#4de082]/5 border border-[#4de082]/10">
        <CheckCircle2 className="size-4 text-[#4de082]" />
        <span className="text-xs text-[#4de082] font-medium">Zero Inbox</span>
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: typeof Upload;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]",
        "transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d0bcff]/40",
        accent
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-colors group-hover:bg-white/[0.06]"
          style={{ color: "var(--qa-color)" }}
        >
          <Icon className="size-5" />
        </div>
        <ArrowRight className="size-4 text-white/20 transition-all group-hover:text-white/50 group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 space-y-1">
        <h4 className="text-sm font-semibold text-[#e4e1ea]">{title}</h4>
        <p className="text-xs text-white/40 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const { activeContext } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [today, setToday] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)

  const role = activeContext?.role || null
  const schoolId = activeContext?.schoolId || "inst-1"

  // Drill-down Sheet state
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<CriticalMetric["drillDown"] | null>(null)

  const openDrillDown = useCallback((metric: CriticalMetric) => {
    if (!metric.drillDown) return
    setDrillDownData(metric.drillDown)
    setDrillDownOpen(true)
  }, [])

  const alertsCount = getAlertsCount(role)
  const showAlertsButton = role !== "FAMILIA"

  useEffect(() => {
    setMounted(true)
    setToday(
      new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  // Calculate if there are pending actions
  const hasAdminActions = ADMIN_ACTIONS_DOCUMENTACION.length > 0 || ADMIN_ACTIONS_CONVIVENCIA.length > 0;
  const hasPreceptorActions = PRECEPTOR_ACTIONS_LISTA.length > 0 || PRECEPTOR_ACTIONS_AUSENTES.length > 0;
  const hasDocenteActions = DOCENTE_ACTIONS.length > 0;

  // ============================================
  // CENTRO DE COMANDO - Quick Actions (ADMIN)
  // ============================================
  const handleImportPadron = useCallback(() => {
    // Deep-link a la pestaña de matricula con el modal de importacion abierto
    router.push("/students?action=import");
  }, [router]);

  const handleOpenReportBuilder = useCallback(() => {
    // Deep-link a la pestaña del Generador de Reportes (Report Builder)
    router.push("/students?tab=reportes");
  }, [router]);

  const handleComposeCircular = useCallback(() => {
    // Deep-link al modulo de comunicaciones con el modal de redaccion abierto
    router.push("/communications?action=compose");
  }, [router]);

  const handleAuditDownload = useCallback(() => {
    setIsAuditing(true);
    const run = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        const generado = new Date().toLocaleString("es-AR");
        const htmlContent = `
          <h1>SEQUENCY — Auditoria de Compliance RRHH</h1>
          <p><strong>Generado:</strong> ${generado}</p>
          <hr style="margin:12pt 0"/>
          <h2>Documentacion Faltante del Personal</h2>
          <ul>
            <li>5 docentes con Apto Medico vencido</li>
            <li>3 docentes sin DD.JJ. de Cargos</li>
            <li>2 docentes sin constancia de CUIL actualizada</li>
          </ul>
          <p style="margin-top:16pt">
            <strong>Nivel de cumplimiento institucional: 71%</strong>
          </p>
          <p><em>Documento generado automaticamente por el Centro de Comando.</em></p>
        `;
        printAsPdf(htmlContent, "Auditoria RRHH — Sequency");
        resolve();
      }, 1000);
    }).finally(() => setIsAuditing(false));

    toast.promise(run, {
      loading: "Auditando documentacion del personal... Compilando reporte...",
      success: "Dialogo de impresion abierto — guarda como PDF.",
      error: "No se pudo generar la auditoria.",
    });
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#d0bcff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const escuelaActiva = DATA_POR_ESCUELA[schoolId || "inst-1"] || DATA_POR_ESCUELA["inst-1"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
              <Inbox className="w-5 h-5 text-[#d0bcff]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#d0bcff] font-bold">
                Bandeja de Accion
              </p>
              <h1 className="text-xl font-bold tracking-tight text-[#e4e1ea]">
                {role === "FAMILIA" ? "Portal Familiar" : escuelaActiva.name}
              </h1>
            </div>
          </div>
          <p className="text-xs text-white/40 capitalize pl-14">
            {today} | {escuelaActiva.periodo}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-xs font-mono text-[#d0bcff] font-bold">
            {role}
          </span>
          {showAlertsButton && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-xs relative border-white/10 hover:bg-white/5"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Alertas</span>
                  {alertsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {alertsCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[380px] sm:w-[420px] bg-[#131319] border-white/10 p-0 overflow-hidden"
              >
                <SheetHeader className="px-6 py-4 border-b border-white/5">
                  <SheetTitle className="text-[#e4e1ea] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    Centro de Alertas
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                  <OperationalAlerts role={role} className="border-0 rounded-none" />
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Button variant="outline" size="sm" className="gap-2 text-xs border-white/10 hover:bg-white/5">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
        </div>
      </motion.header>

      {/* ============================================ */}
      {/* DASHBOARD ADMIN / SECRETARIA */}
      {/* ============================================ */}
      {role === "ADMIN" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Critical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ADMIN_METRICS.map((metric, i) => (
              <CriticalMetricCard key={i} metric={metric} onClick={() => openDrillDown(metric)} />
            ))}
          </div>

          {/* ============================================ */}
          {/* CENTRO DE COMANDO - Acciones Rapidas (ADMIN) */}
          {/* ============================================ */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20">
                <Sparkles className="size-4 text-[#d0bcff]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e4e1ea]">Acciones Rapidas Institucionales</h3>
                <p className="text-[11px] text-white/40">Centro de comando operativo</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div style={{ ["--qa-color" as string]: "#4de082" }}>
                <QuickActionCard
                  icon={Upload}
                  title="Importacion Masiva"
                  description="Cargar padron de alumnos (Excel/CSV)"
                  accent="hover:border-[#4de082]/30"
                  onClick={handleImportPadron}
                />
              </div>
              <div style={{ ["--qa-color" as string]: "#d0bcff" }}>
                <QuickActionCard
                  icon={FileSpreadsheet}
                  title="Generador de Reportes"
                  description="Exportar matriculas, notas y ausentismo por lotes"
                  accent="hover:border-[#d0bcff]/30"
                  onClick={handleOpenReportBuilder}
                />
              </div>
              <div style={{ ["--qa-color" as string]: "#54c7ec" }}>
                <QuickActionCard
                  icon={Megaphone}
                  title="Comunicacion Institucional"
                  description="Redactar circular o aviso para la comunidad"
                  accent="hover:border-[#54c7ec]/30"
                  onClick={handleComposeCircular}
                />
              </div>
              <div style={{ ["--qa-color" as string]: "#fbbf24" }}>
                <QuickActionCard
                  icon={isAuditing ? RefreshCw : ShieldCheck}
                  title="Auditoria de Compliance"
                  description="Descargar reporte de documentacion faltante del personal"
                  accent="hover:border-amber-400/30"
                  onClick={isAuditing ? () => {} : handleAuditDownload}
                />
              </div>
            </div>
          </div>

          {/* Action Inbox */}
          {hasAdminActions ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ActionSection 
                title="Documentacion Pendiente" 
                items={ADMIN_ACTIONS_DOCUMENTACION} 
                icon={FileText} 
              />
              <ActionSection 
                title="Convivencia y Derivaciones" 
                items={ADMIN_ACTIONS_CONVIVENCIA} 
                icon={ShieldAlert} 
              />
            </div>
          ) : (
            <ZeroInboxState />
          )}
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DASHBOARD PRECEPTOR */}
      {/* ============================================ */}
      {role === "PRECEPTOR" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Critical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRECEPTOR_METRICS.map((metric, i) => (
              <CriticalMetricCard key={i} metric={metric} onClick={() => openDrillDown(metric)} />
            ))}
          </div>

          {/* Action Inbox */}
          {hasPreceptorActions ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ActionSection 
                title="Cursos Pendientes de Lista" 
                items={PRECEPTOR_ACTIONS_LISTA} 
                icon={ClipboardCheck} 
              />
              <ActionSection 
                title="Alumnos Ausentes - Contactar Familia" 
                items={PRECEPTOR_ACTIONS_AUSENTES} 
                icon={Phone} 
              />
            </div>
          ) : (
            <ZeroInboxState />
          )}
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DASHBOARD DOCENTE */}
      {/* ============================================ */}
      {role === "DOCENTE" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Critical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOCENTE_METRICS.map((metric, i) => (
              <CriticalMetricCard key={i} metric={metric} onClick={() => openDrillDown(metric)} />
            ))}
          </div>

          {/* Action Inbox */}
          {hasDocenteActions ? (
            <ActionSection 
              title="Tareas Pendientes" 
              items={DOCENTE_ACTIONS} 
              icon={BookOpen} 
            />
          ) : (
            <ZeroInboxState />
          )}
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DASHBOARD FAMILIA */}
      {/* ============================================ */}
      {role === "FAMILIA" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Student Card */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#d0bcff]/30 to-[#4de082]/30 flex items-center justify-center border border-white/10">
                <span className="text-lg font-bold text-[#e4e1ea]">VC</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#e4e1ea]">{ALUMNO_DATA.nombre}</h2>
                <p className="text-sm text-white/50">{ALUMNO_DATA.curso} - Division {ALUMNO_DATA.division}</p>
                <p className="text-xs text-[#d0bcff] mt-1">{escuelaActiva.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Inasistencias</p>
                <p className="text-2xl font-bold">
                  <span className="text-amber-400">{ALUMNO_DATA.inasistencias}</span>
                  <span className="text-white/30 text-lg"> / {ALUMNO_DATA.limiteInasistencias}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(ALUMNO_DATA.inasistencias / ALUMNO_DATA.limiteInasistencias) * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Promedio General</p>
                <p className="text-2xl font-bold text-[#4de082]">{ALUMNO_DATA.promedio}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-[#4de082]" />
                  <span className="text-[10px] text-[#4de082]">+0.3 este mes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-[#e4e1ea] uppercase tracking-wider">Calificaciones Recientes</h3>
            <div className="space-y-2">
              {ALUMNO_DATA.materias.map((materia, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-[#e4e1ea]">{materia.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      materia.estado === "TEA" ? "bg-[#4de082]/10 text-[#4de082]" :
                      materia.estado === "TEP" ? "bg-[#d0bcff]/10 text-[#d0bcff]" :
                      "bg-red-500/10 text-red-400"
                    )}>
                      {materia.estado}
                    </span>
                    <span className="text-lg font-bold text-[#e4e1ea] w-8 text-right">{materia.nota}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DRILL-DOWN SHEET — KPI Detail               */}
      {/* ============================================ */}
      <Sheet open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[480px] bg-[#131319] border-white/10 p-0 overflow-hidden flex flex-col"
        >
          {drillDownData && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-white/5 shrink-0">
                <SheetTitle className="text-[#e4e1ea] text-base font-bold">
                  {drillDownData.title}
                </SheetTitle>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  {drillDownData.description}
                </p>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {drillDownData.rows.map((row, idx) => {
                  const badgeStatus =
                    /critico|urgente|sin cobertura|sin entregar/i.test(row.badge ?? "")
                      ? "critical"
                      : /pendiente|sin registrar|sin justific/i.test(row.badge ?? "")
                      ? "warning"
                      : "neutral";

                  const badgeColors = {
                    critical: "bg-red-500/10 text-red-400 border-red-500/20",
                    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    neutral: "bg-white/[0.04] text-white/50 border-white/10",
                  };

                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="size-2 rounded-full bg-white/20 mt-2 shrink-0" />
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium text-[#e4e1ea] truncate">
                            {row.name}
                          </p>
                          <p className="text-xs text-white/40 leading-relaxed">
                            {row.detail}
                          </p>
                        </div>
                      </div>
                      {row.badge && (
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border whitespace-nowrap",
                            badgeColors[badgeStatus]
                          )}
                        >
                          {row.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-white/5 shrink-0">
                <p className="text-[10px] text-white/25 text-center font-mono">
                  {drillDownData.rows.length} registro{drillDownData.rows.length !== 1 ? "s" : ""} encontrado{drillDownData.rows.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
