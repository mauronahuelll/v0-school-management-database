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
  Upload, FileSpreadsheet, Megaphone, ShieldCheck,
  ChevronRight, Mail, BellRing, UserCheck, UserX as UserXIcon,
  PenLine, CheckCheck, MapPin,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  unitLabel,
  NIVEL_METRICS,
  type NivelEducativo,
} from "@/lib/level-config";

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

// ── Multi-child data para vista de FAMILIA ──
const MULTI_CHILDREN_DATA = [
  {
    id: "child-1",
    firstName: "Tomas",
    lastName: "Perez",
    initials: "TP",
    grade: "3er Grado",
    division: "A",
    level: "Primaria",
    gradientFrom: "from-violet-500/30",
    gradientTo: "to-purple-600/30",
    accentColor: "text-violet-300",
    ringColor: "ring-violet-500/20",
    borderActive: "border-violet-500/20",
    attendance: "PRESENTE" as const,
    notifications: [
      { type: "unread_msg" as const, text: "Tiene 1 comunicado sin leer", icon: Mail },
    ],
    stats: { promedio: 8.7, inasistencias: 2, limiteInasistencias: 15 },
  },
  {
    id: "child-2",
    firstName: "Sofia",
    lastName: "Perez",
    initials: "SP",
    grade: "2do Año",
    division: "B",
    level: "Secundaria",
    gradientFrom: "from-rose-500/25",
    gradientTo: "to-pink-600/25",
    accentColor: "text-rose-300",
    ringColor: "ring-rose-500/20",
    borderActive: "border-rose-500/20",
    attendance: "AUSENTE" as const,
    notifications: [
      { type: "exam_alert" as const, text: "Examen de Matematica manana", icon: BellRing },
    ],
    stats: { promedio: 7.9, inasistencias: 5, limiteInasistencias: 15 },
  },
] as const;

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
          "group w-full text-left p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 space-y-3",
          "transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-0.5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d0bcff]/40",
          hoverBorder[metric.status]
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
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
    <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#8A2BE2]/25 hover:bg-white/[0.03] hover:shadow-[0_0_20px_rgba(138,43,226,0.08)] transition-all duration-300">
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
          className="p-2.5 rounded-xl bg-[#8A2BE2]/15 border border-[#8A2BE2]/25 transition-colors group-hover:bg-[#8A2BE2]/25 group-hover:border-[#8A2BE2]/40"
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
  // ── Level Isolation ────────────────────────────────────────────────────────
  const nivel = (activeContext?.level ?? "SECUNDARIO") as NivelEducativo
  const levelMetrics = NIVEL_METRICS[nivel]
  const nivelUnitLabel = unitLabel(nivel)
  // Titular del módulo DOCENTE según nivel
  const docenteViewTitle =
    nivel === "INICIAL"   ? "Panel de Maestra Jardinera" :
    nivel === "PRIMARIO"  ? "Panel Docente — Primaria" :
                            "Panel Docente — Secundaria"
  // ──────────────────────────────────────────────────────────────────────────

  // Drill-down Sheet state
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<CriticalMetric["drillDown"] | null>(null)

  // Firma digital — estado del modal y del inbox de tramites
  const [signatureModal, setSignatureModal] = useState(false)
  const [signatureChecked, setSignatureChecked] = useState(false)
  const [pendingDocSigned, setPendingDocSigned] = useState(false)

  const handleFirmarDocumento = useCallback(() => {
    setPendingDocSigned(true)
    setSignatureModal(false)
    setSignatureChecked(false)
    toast.success("Documento firmado exitosamente. El colegio ha sido notificado.")
  }, [])

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
                className="w-[380px] sm:w-[420px] bg-[#0A0A0F]/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden"
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
      {/* DASHBOARD DOCENTE — Level Isolated          */}
      {/* ============================================ */}
      {role === "DOCENTE" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Nivel badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nivel</span>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg",
                nivel === "INICIAL"    ? "bg-pink-500/10 text-pink-400"   :
                nivel === "PRIMARIO"   ? "bg-cyan-500/10 text-cyan-400"   :
                                         "bg-purple-500/10 text-purple-400"
              )}>
                {nivel}
              </span>
              <span className="text-xs text-white/50">{docenteViewTitle}</span>
            </div>
            <span className="text-xs text-white/25">{nivelUnitLabel} activos</span>
          </div>

          {/* Métricas aisladas por nivel — sin cruce de datos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levelMetrics.map((metric, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md space-y-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  {metric.label}
                </p>
                <p className={cn(
                  "text-3xl font-bold tabular-nums",
                  metric.status === "critical" ? "text-red-400"   :
                  metric.status === "warning"  ? "text-amber-400" : "text-[#e4e1ea]"
                )}>
                  {metric.value}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">{metric.subtext}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                    metric.status === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20"     :
                    metric.status === "warning"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {metric.status === "critical" ? "Critico" : metric.status === "warning" ? "Atencion" : "Normal"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Inbox — INICIAL oculta métricas de TED/TEP (no aplica a jardín) */}
          {nivel !== "INICIAL" && hasDocenteActions ? (
            <ActionSection
              title="Tareas Pendientes"
              items={DOCENTE_ACTIONS}
              icon={BookOpen}
            />
          ) : nivel !== "INICIAL" ? (
            <ZeroInboxState />
          ) : null}

          {/* INICIAL: acciones específicas de maestra jardinera */}
          {nivel === "INICIAL" && (
            <div className="p-5 rounded-2xl bg-pink-500/[0.04] border border-pink-500/[0.12] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <Stethoscope className="size-4 text-pink-400" />
                </div>
                <p className="text-sm font-semibold text-[#e4e1ea]">Recordatorios del Jardin</p>
              </div>
              {[
                { label: "Alumnos con restriccion alimentaria", value: "2", href: "/students" },
                { label: "Autorizaciones de retiro pendientes", value: "3", href: "/attendance" },
                { label: "Informes cualitativos sin redactar",  value: "5", href: "/grades"     },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                >
                  <span className="text-sm text-white/70">{item.label}</span>
                  <span className="text-sm font-bold text-pink-400">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DASHBOARD FAMILIA — Multi-Child Overview */}
      {/* ============================================ */}
      {role === "FAMILIA" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#e4e1ea]">Resumen del dia</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {escuelaActiva.name} — {today}
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">
              {MULTI_CHILDREN_DATA.length} alumnos vinculados
            </span>
          </div>

          {/* ── Widget Tramites Pendientes ── */}
          {!pendingDocSigned ? (
            <div className={cn(
              "relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border",
              "bg-[#8A2BE2]/10 border-[#8A2BE2]/50",
              "shadow-[0_0_24px_rgba(138,43,226,0.12)]",
              "transition-all duration-300"
            )}>
              {/* Pulso de alerta */}
              <span className="absolute top-4 right-4 flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D0BCFF] opacity-60" />
                <span className="relative inline-flex rounded-full size-2.5 bg-[#8A2BE2]" />
              </span>

              {/* Icono */}
              <div className="shrink-0 size-12 rounded-xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 flex items-center justify-center">
                <PenLine className="size-6 text-[#D0BCFF]" />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#D0BCFF]/70 mb-0.5">
                  1 documento pendiente de firma
                </p>
                <h3 className="text-base font-bold text-[#E4E1EA] leading-snug">
                  Autorizacion: Viaje de Estudios a Cordoba
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin className="size-3 text-white/30" />
                  <p className="text-xs text-white/40">
                    Requiere tu firma digital para ser procesado
                  </p>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={() => { setSignatureModal(true); setSignatureChecked(false); }}
                className="shrink-0 bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black font-bold hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(208,188,255,0.35)] transition-all border-0 gap-2"
              >
                <PenLine className="size-4" />
                Revisar y Firmar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] transition-all duration-500">
              <div className="shrink-0 size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCheck className="size-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Estas al dia con tus tramites</p>
                <p className="text-xs text-white/35 mt-0.5">No hay documentos pendientes de firma.</p>
              </div>
            </div>
          )}

          {/* Modal de Firma Digital — DocuSign Pattern */}
          <Dialog open={signatureModal} onOpenChange={(open) => {
            setSignatureModal(open);
            if (!open) setSignatureChecked(false);
          }}>
            <DialogContent className="max-w-3xl w-full bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(138,43,226,0.15)] p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 flex items-center justify-center shrink-0">
                    <PenLine className="size-4 text-[#D0BCFF]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[#E4E1EA] text-base font-bold leading-tight">
                      Autorizacion: Viaje de Estudios a Cordoba
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/40 mt-0.5">
                      Documento oficial — Requiere firma digital legalmente vinculante
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-col md:flex-row h-[480px]">
                {/* ── Lado izquierdo: simulacion del PDF ── */}
                <ScrollArea className="flex-1 border-b md:border-b-0 md:border-r border-white/[0.07]">
                  <div className="p-6 space-y-5 text-xs text-white/50 leading-relaxed font-mono">
                    {/* Header del documento */}
                    <div className="text-center space-y-1 pb-4 border-b border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/25">Instituto Educativo Sequency</p>
                      <h4 className="text-sm font-bold text-[#E4E1EA]">AUTORIZACION PARA VIAJE EDUCATIVO</h4>
                      <p className="text-[10px] text-white/30">Resolucion N° 2024/VEC/087 — Ciclo Lectivo 2025</p>
                    </div>

                    <p>Por medio de la presente, el/la padre/madre/tutor/a del/la alumno/a que firma el presente instrumento, AUTORIZA expresamente a su hijo/a a participar del viaje educativo organizado por el establecimiento escolar hacia la ciudad de Cordoba, Provincia de Cordoba, Republica Argentina.</p>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-[#D0BCFF]/50 font-semibold">Datos del viaje</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          ["Destino", "Ciudad de Cordoba"],
                          ["Fecha de partida", "15 de agosto de 2025"],
                          ["Fecha de regreso", "18 de agosto de 2025"],
                          ["Medio de transporte", "Omnibus de larga distancia"],
                          ["Empresa", "Crucero del Norte S.A."],
                          ["Docentes acompanantes", "Prof. Ramirez / Prof. Diaz"],
                          ["Costo total", "$ 85.000 (ya abonado)"],
                          ["Seguro de viajero", "Incluido — Poliza N° 4421-B"],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] text-white/30">{k}</p>
                            <p className="text-white/60 font-medium">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p>El/la firmante declara conocer el itinerario completo, las normas de convivencia aplicables durante el viaje y las condiciones de la poliza de seguro contratada por la institucion. Asimismo, declara que el/la menor no presenta contraindicaciones medicas para la realizacion del viaje, o que en caso de existir, ha informado fehacientemente al establecimiento.</p>

                    <p>La presente autorizacion se otorga libre y voluntariamente, sin que medie vicio alguno del consentimiento, y tiene plena validez legal en los terminos del Articulo 1320 del Codigo Civil y Comercial de la Nacion.</p>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-[#D0BCFF]/50 font-semibold">Datos del responsable</p>
                      <p>Nombre: <span className="text-white/70">___________________________</span></p>
                      <p>DNI: <span className="text-white/70">___________________________</span></p>
                      <p>Vinculo con el alumno: <span className="text-white/70">Padre / Madre / Tutor</span></p>
                    </div>

                    <p className="text-[10px] text-white/25 pt-2 border-t border-white/[0.06]">
                      Documento generado electronicamente por el sistema Sequency ERP. Firma digital con validez juridica segun Ley 25.506 de Firma Digital (Argentina).
                    </p>
                  </div>
                </ScrollArea>

                {/* ── Lado derecho: Action Panel ── */}
                <div className="w-full md:w-72 shrink-0 flex flex-col gap-5 p-6 bg-white/[0.015]">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-3">
                      Panel de firma
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Emisor", value: "Instituto Sequency" },
                        { label: "Destinatario", value: "Familia vinculada" },
                        { label: "Estado", value: "Pendiente de firma" },
                        { label: "Vencimiento", value: "30 Jul 2025" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center text-xs">
                          <span className="text-white/35">{label}</span>
                          <span className={cn(
                            "font-medium",
                            label === "Estado" ? "text-amber-400" : "text-white/60"
                          )}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-white/[0.07]" />

                  {/* Checkbox de consentimiento */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    signatureChecked
                      ? "border-[#8A2BE2]/40 bg-[#8A2BE2]/[0.07]"
                      : "border-white/10 bg-white/[0.02]"
                  )}>
                    <Checkbox
                      id="firma-consent"
                      checked={signatureChecked}
                      onCheckedChange={(v) => setSignatureChecked(!!v)}
                      className="mt-0.5 border-white/20 data-[state=checked]:bg-[#8A2BE2] data-[state=checked]:border-[#8A2BE2]"
                    />
                    <Label
                      htmlFor="firma-consent"
                      className="text-xs text-white/50 leading-relaxed cursor-pointer select-none"
                    >
                      Declaro haber leido el documento y autorizo mediante firma digital legalmente vinculante.
                    </Label>
                  </div>

                  <div className="mt-auto space-y-3">
                    <Button
                      disabled={!signatureChecked}
                      onClick={handleFirmarDocumento}
                      className={cn(
                        "w-full gap-2 font-bold border-0 transition-all",
                        signatureChecked
                          ? "bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(208,188,255,0.35)]"
                          : "bg-white/[0.04] text-white/25 cursor-not-allowed"
                      )}
                    >
                      <PenLine className="size-4" />
                      Firmar Documento
                    </Button>
                    <button
                      onClick={() => setSignatureModal(false)}
                      className="w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MULTI_CHILDREN_DATA.map((child) => {
              const isPresent = child.attendance === "PRESENTE";
              const absPercent = Math.round(
                (child.stats.inasistencias / child.stats.limiteInasistencias) * 100
              );

              return (
                <div
                  key={child.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border overflow-hidden",
                    "bg-white/[0.025] backdrop-blur-sm",
                    "transition-all duration-300 hover:bg-white/[0.04]",
                    child.borderActive
                  )}
                >
                  {/* Top accent strip */}
                  <div className={cn(
                    "h-0.5 w-full bg-gradient-to-r",
                    child.gradientFrom, child.gradientTo
                  )} />

                  <div className="flex flex-col gap-5 p-5">
                    {/* ── Cabecera ── */}
                    <div className="flex items-start gap-4">
                      <Avatar className={cn(
                        "size-14 rounded-xl ring-2 shrink-0",
                        child.ringColor
                      )}>
                        <AvatarFallback className={cn(
                          "rounded-xl text-base font-bold bg-gradient-to-br text-white/90",
                          child.gradientFrom, child.gradientTo
                        )}>
                          {child.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-[#e4e1ea] leading-tight">
                              {child.firstName} {child.lastName}
                            </h3>
                            <p className="text-xs text-white/50 mt-0.5">
                              {child.grade} {child.division} — {child.level}
                            </p>
                          </div>
                          {/* Badge de asistencia */}
                          <span className={cn(
                            "shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border",
                            isPresent
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            {isPresent
                              ? <UserCheck className="size-3" />
                              : <UserXIcon className="size-3" />
                            }
                            {isPresent ? "Presente hoy" : "Ausente hoy"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Stats mini ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-white/35 uppercase tracking-wider">Promedio</p>
                        <p className="text-xl font-bold text-[#4de082]">
                          {child.stats.promedio}
                        </p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="size-3 text-[#4de082]" />
                          <span className="text-[10px] text-[#4de082]/70">Al dia</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-white/35 uppercase tracking-wider">Inasistencias</p>
                        <p className="text-xl font-bold">
                          <span className={absPercent > 40 ? "text-amber-400" : "text-[#e4e1ea]"}>
                            {child.stats.inasistencias}
                          </span>
                          <span className="text-white/30 text-sm"> / {child.stats.limiteInasistencias}</span>
                        </p>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              absPercent > 40 ? "bg-amber-400" : "bg-[#4de082]"
                            )}
                            style={{ width: `${absPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Notificaciones ── */}
                    {child.notifications.length > 0 && (
                      <div className="space-y-2">
                        {child.notifications.map((notif, i) => {
                          const Icon = notif.icon;
                          const isExam = notif.type === "exam_alert";
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs",
                                isExam
                                  ? "bg-amber-500/[0.06] border-amber-500/20 text-amber-300"
                                  : "bg-[#d0bcff]/[0.06] border-[#d0bcff]/20 text-[#d0bcff]"
                              )}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              {notif.text}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── CTA ── */}
                    <Button
                      onClick={() => {
                        toast.info(`Abriendo Legajo 360° de ${child.firstName} ${child.lastName}...`);
                        router.push(`/student/${child.id}`);
                      }}
                      className={cn(
                        "w-full gap-2 font-semibold justify-between group",
                        "bg-white/[0.04] hover:bg-white/[0.08] border border-white/10",
                        "text-[#e4e1ea] hover:text-white",
                        `hover:${child.borderActive}`
                      )}
                      variant="outline"
                    >
                      <span>Entrar al Legajo 360°</span>
                      <ChevronRight className="size-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DRILL-DOWN SHEET — KPI Detail               */}
      {/* ============================================ */}
      <Sheet open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[480px] bg-[#0A0A0F]/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden flex flex-col"
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
