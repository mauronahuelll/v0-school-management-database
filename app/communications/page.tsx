"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/lib/context/auth-context";
import {
  Mail, Send, Check, CheckCheck, Clock, AlertTriangle, FileText, Calendar,
  Building2, BookOpen, ChevronLeft, PenSquare, Shield, User, Loader2, X,
  Paperclip, Megaphone, PenLine, ShieldCheck, Sparkles, Download, Eye,
  UploadCloud, FileCheck2, Search, Users, UserPlus, Plus, GraduationCap,
  ClipboardList, BriefcaseBusiness, UserCheck, Home, PartyPopper, FilePlus2,
  MessageSquare, Inbox, FolderOpen, FileSignature, BarChart3, ChevronDown,
  Info, BadgeCheck, XCircle, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  unitLabel, unitLabelSingular, AUDIENCE_OPTIONS_BY_NIVEL,
  canSendDirectToStudents, type NivelEducativo,
} from "@/lib/level-config";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type MainTab = "comunicaciones" | "matriculacion" | "documentacion";
type CommunicationType = "INSTITUCIONAL" | "ALERTA" | "EVENTO" | "ACADEMICO" | "MATRICULACION";
type CommunicationStatus = "ENVIADO" | "LEIDO" | "FIRMADO" | "PENDIENTE";
type AudienceTarget = "COMUNIDAD" | "PERSONAL";
type AudienceMode = "ESCUELA" | "CURSO" | "ALUMNOS";
type StaffRole = "TODOS" | "DOCENTES" | "PRECEPTORES" | "ADMINISTRATIVOS";

interface Communication {
  id: string;
  type: CommunicationType;
  title: string;
  body: string;
  senderName: string;
  senderRole: string;
  sentAt: string;
  priority: "ALTA" | "MEDIA" | "BAJA";
  isStaffOnly?: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  status?: CommunicationStatus;
  signedAt?: string;
  totalRecipients?: number;
  signedCount?: number;
  pendingRecipients?: { id: string; name: string; course: string }[];
  requiresReturn?: boolean;
  returnTemplateName?: string;
  returnStatus?: "PENDIENTE" | "ENTREGADO";
  tracking?: { id: string; name: string; status: "PENDIENTE" | "ENTREGADO"; fileName?: string }[];
  isEnrollmentCampaign?: boolean;
  enrollStats?: { total: number; confirmed: number; rejected: number };
}

interface DocumentRequest {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  requiredBy: string;
  status: "PENDIENTE" | "FIRMADO_DIGITAL" | "FIRMADO_FISICO";
  hasTemplate: boolean;
  templateName?: string;
  tracking?: { id: string; name: string; course: string; status: "PENDIENTE" | "FIRMADO_DIGITAL" | "FIRMADO_FISICO"; signedAt?: string; file?: string }[];
}

type StudentRecord = { id: string; name: string; course: string };

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & MOCKS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CommunicationType, { label: string; color: string; icon: typeof Building2 }> = {
  INSTITUCIONAL: { label: "Institucional", color: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20",   icon: Building2     },
  ALERTA:        { label: "Alerta",        color: "bg-red-500/10 text-red-400 border-red-500/20",          icon: AlertTriangle },
  EVENTO:        { label: "Evento",        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",       icon: Calendar      },
  ACADEMICO:     { label: "Academico",     color: "bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20",   icon: BookOpen      },
  MATRICULACION: { label: "Matriculacion", color: "bg-amber-500/10 text-amber-400 border-amber-500/20",   icon: GraduationCap },
};

const AUDIENCE_OPTIONS = [
  { value: "all",  label: "Toda la escuela",   group: "General" },
  { value: "1-A",  label: "1er Ano A",          group: "Cursos" },
  { value: "1-B",  label: "1er Ano B",          group: "Cursos" },
  { value: "2-A",  label: "2do Ano A",          group: "Cursos" },
  { value: "2-B",  label: "2do Ano B",          group: "Cursos" },
  { value: "3-A",  label: "3er Ano A",          group: "Cursos" },
  { value: "3-B",  label: "3er Ano B",          group: "Cursos" },
  { value: "4-A",  label: "4to Ano A",          group: "Cursos" },
  { value: "4-B",  label: "4to Ano B",          group: "Cursos" },
  { value: "5-A",  label: "5to Ano A",          group: "Cursos" },
  { value: "5-B",  label: "5to Ano B",          group: "Cursos" },
];

const MOCK_STUDENT_DIRECTORY: StudentRecord[] = [
  { id: "a1",  name: "Acosta, Martina",      course: "1A" },
  { id: "a2",  name: "Benitez, Lucas",       course: "1A" },
  { id: "a3",  name: "Cardozo, Tomas",       course: "1B" },
  { id: "a4",  name: "Dominguez, Valentina", course: "2A" },
  { id: "a5",  name: "Espinoza, Mateo",      course: "2C" },
  { id: "a6",  name: "Figueroa, Camila",     course: "2C" },
  { id: "a7",  name: "Gimenez, Bautista",    course: "3B" },
  { id: "a8",  name: "Herrera, Julieta",     course: "3B" },
  { id: "a9",  name: "Ibarra, Santiago",     course: "4A" },
  { id: "a10", name: "Juarez, Delfina",      course: "4B" },
  { id: "a11", name: "Krause, Thiago",       course: "5A" },
  { id: "a12", name: "Ledesma, Renata",      course: "5B" },
];

const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string; description: string; icon: typeof Users; count: number }[] = [
  { value: "TODOS",           label: "Todos",           description: "Todo el personal",        icon: Users,            count: 42 },
  { value: "DOCENTES",        label: "Docentes",        description: "Cuerpo docente",          icon: GraduationCap,    count: 28 },
  { value: "PRECEPTORES",     label: "Preceptores",     description: "Preceptores y tutores",   icon: ClipboardList,    count: 8  },
  { value: "ADMINISTRATIVOS", label: "Administrativos", description: "Personal administrativo", icon: BriefcaseBusiness,count: 6  },
];

// ── Mocks COMUNICACIONES ──────────────────────────────────────────────────────

const MOCK_FAMILIA_MESSAGES: Communication[] = [
  {
    id: "cf-1", type: "ALERTA",
    title: "Suspension de Clases — Jornada Docente",
    body: `Estimadas familias,\n\nLes comunicamos que el dia viernes 14 de junio NO habra clases debido a la realizacion de una jornada de capacitacion docente obligatoria.\n\nLas actividades se retomaran con normalidad el lunes 17 de junio.\n\nAtentamente,\nEquipo Directivo`,
    senderName: "Direccion General", senderRole: "Administracion",
    sentAt: "Hoy, 09:30", priority: "ALTA", status: "PENDIENTE",
  },
  {
    id: "cf-2", type: "EVENTO",
    title: "Invitacion — Feria de Ciencias 2026",
    body: `Estimadas familias,\n\nTenemos el agrado de invitarlos a la Feria de Ciencias y Tecnologia 2026 que se realizara el sabado 22 de junio de 10:00 a 16:00 hs en el gimnasio.\n\nCordialmente,\nDepartamento de Ciencias`,
    senderName: "Prof. Garcia, Roberto", senderRole: "Jefe de Departamento",
    sentAt: "Ayer, 14:15", priority: "MEDIA", status: "LEIDO",
    hasAttachment: true, attachmentName: "programa_feria_2026.pdf",
  },
  {
    id: "cf-3", type: "ACADEMICO",
    title: "Cuaderno de Comunicaciones — Matematica",
    body: `Estimada familia,\n\nLes informamos que el alumno ha demostrado mejoras en el area de Algebra durante el primer trimestre. Se recomienda reforzar la practica de ejercicios de factorizacion en casa.\n\nProf. Gomez`,
    senderName: "Prof. Gomez, Ana", senderRole: "Docente",
    sentAt: "Hace 2 dias", priority: "BAJA", status: "FIRMADO", signedAt: "Hace 1 dia",
    isStaffOnly: false,
  },
  {
    id: "cf-4", type: "INSTITUCIONAL",
    title: "Actualizacion del Reglamento de Convivencia",
    body: `Estimadas familias,\n\nEl Consejo Escolar ha aprobado modificaciones al Reglamento de Convivencia Institucional que entraran en vigencia el 1 de julio.\n\nDireccion`,
    senderName: "Secretaria Academica", senderRole: "Administracion",
    sentAt: "12 Jun, 08:00", priority: "ALTA", status: "FIRMADO", signedAt: "12 Jun, 18:45",
    hasAttachment: true, attachmentName: "reglamento_actualizado.pdf",
  },
];

const MOCK_FAMILIA_CHAT: { id: string; from: "me" | "them"; text: string; time: string; senderName?: string }[] = [
  { id: "msg-1", from: "them", senderName: "Preceptoria 4to A", text: "Buenas tardes. Le informamos que Santiago tuvo una llegada tarde hoy a las 08:45 hs. Quedo registrado en el sistema.", time: "Hoy, 08:50" },
  { id: "msg-2", from: "me",   text: "Muchas gracias por avisarme. Fue una situacion puntual por el transporte.", time: "Hoy, 09:10" },
  { id: "msg-3", from: "them", senderName: "Preceptoria 4to A", text: "Perfecto, queda registrado el descargo. Recuerde que la proxima llegada tarde generara una sancion.", time: "Hoy, 09:12" },
];

const MOCK_SENDER_MESSAGES: Communication[] = [
  {
    id: "cs-1", type: "ALERTA",
    title: "Suspension de Clases — Jornada Docente",
    body: `Estimadas familias,\n\nLes comunicamos que el dia viernes 14 de junio NO habra clases.`,
    senderName: "Yo", senderRole: "Direccion General",
    sentAt: "Hoy, 09:30", priority: "ALTA",
    totalRecipients: 156, signedCount: 89,
    pendingRecipients: [
      { id: "p1", name: "Rodriguez, Maria",  course: "4to A" },
      { id: "p2", name: "Gonzalez, Carlos",  course: "4to A" },
      { id: "p3", name: "Fernandez, Ana",    course: "4to B" },
    ],
  },
  {
    id: "cs-2", type: "EVENTO",
    title: "Invitacion — Feria de Ciencias 2026",
    body: `Estimadas familias,\n\nTenemos el agrado de invitarlos a la Feria de Ciencias y Tecnologia 2026.`,
    senderName: "Yo", senderRole: "Direccion General",
    sentAt: "Ayer, 14:15", priority: "MEDIA",
    totalRecipients: 156, signedCount: 142,
    hasAttachment: true, attachmentName: "programa_feria_2026.pdf",
    pendingRecipients: [
      { id: "p4", name: "Sanchez, Pedro", course: "3er A" },
      { id: "p5", name: "Diaz, Sofia",    course: "3er B" },
    ],
  },
  {
    id: "cs-3", type: "INSTITUCIONAL",
    title: "Actualizacion del Reglamento de Convivencia",
    body: `Estimadas familias,\n\nEl Consejo Escolar ha aprobado modificaciones al Reglamento.`,
    senderName: "Yo", senderRole: "Direccion General",
    sentAt: "12 Jun, 08:00", priority: "ALTA",
    totalRecipients: 156, signedCount: 156,
    hasAttachment: true, attachmentName: "reglamento_actualizado.pdf",
    pendingRecipients: [],
  },
];

// Cuaderno de comunicaciones para DOCENTE → Familias
const MOCK_DOCENTE_AVISOS: Communication[] = [
  {
    id: "da-1", type: "ACADEMICO",
    title: "Aviso: Entrega de Trabajo Practico N3",
    body: `Estimada familia,\n\nLes recuerdo que el proximo lunes 17 de junio vence la entrega del Trabajo Practico Numero 3 de Biologia. Quien no entregue en fecha recibira calificacion 0 segun el reglamento.\n\nProf. Alvarez`,
    senderName: "Prof. Alvarez, M.", senderRole: "Docente",
    sentAt: "Hoy, 08:00", priority: "ALTA",
    totalRecipients: 28, signedCount: 19,
  },
  {
    id: "da-2", type: "ACADEMICO",
    title: "Comunicado: Modificacion de Horario de Clases",
    body: `Estimada familia,\n\nLes informo que durante la semana del 17 al 21 de junio, mis clases del miercoles se dictan en el Laboratorio de Informatica (piso 2) por refaccion del aula habitual.\n\nProf. Alvarez`,
    senderName: "Prof. Alvarez, M.", senderRole: "Docente",
    sentAt: "Ayer, 16:30", priority: "MEDIA",
    totalRecipients: 28, signedCount: 28,
  },
];

// Contactos de chat familias para ADMIN/PRECEPTOR
interface FamiliaContact {
  id: string;
  name: string;       // "Familia Martínez"
  student: string;    // "Lucía — Sala de 5 Ositos"
  nivel: "SECUNDARIO" | "PRIMARIO" | "INICIAL";
  lastMessage: string;
  time: string;
  unread: number;
}

const MOCK_ADMIN_CHAT_CONTACTS: FamiliaContact[] = [
  { id: "fc-mar", name: "Familia Martinez",  student: "Lucia — Sala de 5 Ositos",    nivel: "INICIAL",    lastMessage: "Muchas gracias por la info!",      time: "10:32",  unread: 2 },
  { id: "fc-per", name: "Familia Perez",     student: "Tomas — 3er Grado",           nivel: "PRIMARIO",   lastMessage: "Consulta sobre el viaje",          time: "09:15",  unread: 1 },
  { id: "fc-gon", name: "Familia Gonzalez",  student: "Santiago — 4to Ano A",        nivel: "SECUNDARIO", lastMessage: "Confirmo la asistencia",           time: "Ayer",   unread: 0 },
  { id: "fc-rod", name: "Familia Rodriguez", student: "Valentina — 2do Grado",       nivel: "PRIMARIO",   lastMessage: "Quedamos pendiente de la fecha",  time: "Ayer",   unread: 0 },
  { id: "fc-lop", name: "Familia Lopez",     student: "Ignacio — 5to Ano B",         nivel: "SECUNDARIO", lastMessage: "OK, entendido",                    time: "Lun",    unread: 0 },
];

const MOCK_ADMIN_CHATS: Record<string, { id: string; from: "me" | "them"; text: string; time: string; senderName?: string }[]> = {
  "fc-mar": [
    { id: "1", from: "them", senderName: "Familia Martinez", text: "Buenos dias, queria consultar sobre el acto del jueves.",            time: "10:15" },
    { id: "2", from: "me",   text: "Buen dia! El acto es a las 9hs en el patio central. Los padres pueden asistir desde las 8:45.",      time: "10:20" },
    { id: "3", from: "them", senderName: "Familia Martinez", text: "Muchas gracias por la info!",                                        time: "10:32" },
  ],
  "fc-per": [
    { id: "1", from: "them", senderName: "Familia Perez", text: "Hola, queria preguntar sobre los detalles del viaje educativo.",        time: "09:10" },
    { id: "2", from: "me",   text: "Claro, el viaje es el 15 de agosto. Ya enviamos el formulario de autorizacion por comunicado.",       time: "09:15" },
  ],
  "fc-gon": [
    { id: "1", from: "me",   text: "Estimada familia, les recordamos la reunion de padres del proximo martes a las 18hs.",                time: "Ayer" },
    { id: "2", from: "them", senderName: "Familia Gonzalez", text: "Confirmo la asistencia, gracias.",                                   time: "Ayer" },
  ],
  "fc-rod": [],
  "fc-lop": [
    { id: "1", from: "me",   text: "Les informamos que el turno de entrevista con la preceptora es el viernes a las 10hs.",              time: "Lun" },
    { id: "2", from: "them", senderName: "Familia Lopez", text: "OK, entendido",                                                         time: "Lun" },
  ],
};

// Chat interno para DOCENTE → Staff
const MOCK_STAFF_CHAT: { id: string; from: "me" | "them"; text: string; time: string; senderName?: string }[] = [
  { id: "sc-1", from: "them", senderName: "Preceptoria 4to A", text: "Buen dia. Recordamos que manana hay acto por el Dia de la Bandera. Los estudiantes deben llegar a las 07:45.", time: "Hoy, 07:30" },
  { id: "sc-2", from: "me",   text: "Anotado, gracias. Confirmo asistencia con mi curso.", time: "Hoy, 07:45" },
  { id: "sc-3", from: "them", senderName: "Secretaria", text: "Los docentes sin bandera asignada, coordinar con Preceptoria antes de las 17hs.", time: "Hoy, 09:00" },
];

// ── Mocks MATRICULACION ───────────────────────────────────────────────────────

const MOCK_ENROLLMENT_SENDER: Communication = {
  id: "enroll-adm-1", type: "MATRICULACION", isEnrollmentCampaign: true,
  title: "Campana — Reserva de Vacante Ciclo 2027",
  body: `Campana de matriculacion enviada a todas las familias del nivel.`,
  senderName: "Yo", senderRole: "Secretaria Academica",
  sentAt: "Hoy, 10:00", priority: "ALTA",
  totalRecipients: 150, signedCount: 85, pendingRecipients: [],
  enrollStats: { total: 150, confirmed: 85, rejected: 5 },
};

const MOCK_ENROLLMENT_FAMILIA: Communication = {
  id: "enroll-fam-1", type: "MATRICULACION", isEnrollmentCampaign: true,
  title: "Reserva de Vacante — Ciclo Lectivo 2027",
  body: `Estimada familia,\n\nLes informamos que se encuentra abierto el periodo de inscripcion para el ciclo lectivo 2027.\n\nPara garantizar la continuidad educativa de su hijo/a en nuestra institucion, les solicitamos que confirmen su intencion de reservar la vacante antes del 31 de agosto de 2026.\n\nUna vez confirmada la reserva, podran descargar y completar la Planilla de Inscripcion Oficial.\n\nAtentamente,\nSecretaria de Inscripciones\nPadre Marquez`,
  senderName: "Secretaria Academica", senderRole: "Administracion",
  sentAt: "Hoy, 10:00", priority: "ALTA", status: "PENDIENTE", hasAttachment: false,
};

// ── Mocks DOCUMENTACION ───────────────────────────────────────────────────────

const MOCK_DOCUMENTS_SENDER: DocumentRequest[] = [
  {
    id: "doc-1",
    title: "Autorizacion — Salida Didactica Museo de Ciencias",
    description: "Los alumnos de 4to Ano necesitan autorizacion firmada para participar de la salida al Museo de Ciencias Naturales el 20 de junio.",
    dueDate: "18 Jun 2026",
    requiredBy: "Preceptoria 4to A",
    status: "PENDIENTE",
    hasTemplate: true,
    templateName: "Autorizacion_Museo.pdf",
    tracking: [
      { id: "t1", name: "Benitez, Lucas",       course: "4A", status: "FIRMADO_DIGITAL",  signedAt: "Hoy, 09:12" },
      { id: "t2", name: "Acosta, Martina",      course: "4A", status: "FIRMADO_FISICO",   signedAt: "Hoy, 08:45", file: "Autorizacion_Acosta.pdf" },
      { id: "t3", name: "Cardozo, Tomas",       course: "4A", status: "PENDIENTE" },
      { id: "t4", name: "Dominguez, Valentina", course: "4A", status: "FIRMADO_DIGITAL",  signedAt: "Ayer, 18:30" },
      { id: "t5", name: "Espinoza, Mateo",      course: "4B", status: "PENDIENTE" },
      { id: "t6", name: "Figueroa, Camila",     course: "4B", status: "FIRMADO_FISICO",   signedAt: "Hoy, 11:00", file: "Autorizacion_Figueroa.pdf" },
      { id: "t7", name: "Gimenez, Bautista",    course: "4B", status: "PENDIENTE" },
      { id: "t8", name: "Herrera, Julieta",     course: "4B", status: "FIRMADO_DIGITAL",  signedAt: "Ayer, 20:15" },
    ],
  },
  {
    id: "doc-2",
    title: "Autorizacion de Imagen — Acto de Egresados",
    description: "Autorizacion de uso de imagen para el registro fotografico y videofilmacion del Acto de Egresados 2026.",
    dueDate: "30 Jun 2026",
    requiredBy: "Direccion General",
    status: "PENDIENTE",
    hasTemplate: true,
    templateName: "Autorizacion_Imagen_Egresados.pdf",
    tracking: [
      { id: "t9",  name: "Ibarra, Santiago", course: "5A", status: "PENDIENTE" },
      { id: "t10", name: "Juarez, Delfina",  course: "5A", status: "FIRMADO_DIGITAL", signedAt: "Hoy, 10:30" },
      { id: "t11", name: "Krause, Thiago",   course: "5B", status: "PENDIENTE" },
    ],
  },
];

const MOCK_DOCUMENTS_FAMILIA: DocumentRequest[] = [
  {
    id: "fdoc-1",
    title: "Autorizacion — Salida Didactica Museo de Ciencias",
    description: "Para que su hijo/a pueda participar de la salida al Museo de Ciencias Naturales el 20 de junio, es necesario que firme la autorizacion antes del 18 de junio.",
    dueDate: "18 Jun 2026",
    requiredBy: "Preceptoria 4to A",
    status: "PENDIENTE",
    hasTemplate: true,
    templateName: "Autorizacion_Museo.pdf",
  },
  {
    id: "fdoc-2",
    title: "Autorizacion de Imagen — Acto de Egresados",
    description: "Autorizacion de uso de imagen para el registro fotografico del Acto de Egresados 2026. Requerida por Direccion General.",
    dueDate: "30 Jun 2026",
    requiredBy: "Direccion General",
    status: "FIRMADO_DIGITAL",
    hasTemplate: true,
    templateName: "Autorizacion_Imagen.pdf",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function NeonBadge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
      className
    )}>
      {children}
    </span>
  );
}

function GlassCard({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-md",
        onClick && "cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{children}</p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMUNICACIONES — Familia view
// ─────────────────────────────────────────────────────────────────────────────

function FamiliaMessageDetail({ comm, onSign, onDownload, onUploadReturn, uploadedReturns, uploadingId }: {
  comm: Communication;
  onSign: () => void;
  onDownload: (name: string) => void;
  onUploadReturn: (id: string) => void;
  uploadedReturns: Set<string>;
  uploadingId: string | null;
}) {
  const typeConf = TYPE_CONFIG[comm.type];
  const TypeIcon = typeConf.icon;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <NeonBadge className={typeConf.color}>
              <TypeIcon className="size-3" />{typeConf.label}
            </NeonBadge>
            {comm.priority === "ALTA" && (
              <NeonBadge className="bg-red-500/10 text-red-400 border-red-500/20">
                <AlertTriangle className="size-3" />Urgente
              </NeonBadge>
            )}
            {comm.isStaffOnly && (
              <NeonBadge className="bg-white/5 text-white/40 border-white/10">
                Solo lectura
              </NeonBadge>
            )}
          </div>
          <span className="text-xs text-white/30 shrink-0">{comm.sentAt}</span>
        </div>
        <h2 className="text-base font-bold text-[#e4e1ea] leading-snug">{comm.title}</h2>
        <p className="text-xs text-white/40 mt-1">
          De: <span className="text-white/60">{comm.senderName}</span>
          <span className="text-white/25"> · {comm.senderRole}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{comm.body}</p>

        {comm.hasAttachment && comm.attachmentName && !comm.requiresReturn && (
          <GlassCard className="flex items-center gap-3 px-4 py-3 w-fit">
            <FileText className="size-4 text-[#d0bcff]" />
            <div>
              <p className="text-sm font-medium text-[#e4e1ea]">{comm.attachmentName}</p>
              <p className="text-xs text-white/40">Adjunto</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDownload(comm.attachmentName!)}
              className="text-xs text-[#d0bcff] hover:bg-[#d0bcff]/10 ml-2">
              <Download className="size-3.5 mr-1" />Descargar
            </Button>
          </GlassCard>
        )}

        {/* Aviso de docente: solo lectura */}
        {comm.type === "ACADEMICO" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <Info className="size-4 text-white/30 shrink-0" />
            <p className="text-xs text-white/40">Este es un aviso del docente. No requiere accion.</p>
          </div>
        )}

        {/* Requiere firma */}
        {(comm.type === "INSTITUCIONAL" || comm.type === "EVENTO" || comm.type === "ALERTA") &&
          comm.status !== "FIRMADO" && !comm.requiresReturn && (
          <Button onClick={onSign}
            className="gap-2 bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/30 text-[#d0bcff] shadow-none">
            <FileSignature className="size-4" />
            Firmar acuse de recibo
          </Button>
        )}
        {comm.status === "FIRMADO" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 w-fit">
            <BadgeCheck className="size-4 text-emerald-400" />
            <p className="text-xs text-emerald-400 font-medium">Firmado el {comm.signedAt}</p>
          </div>
        )}

        {/* Requiere devolución */}
        {comm.requiresReturn && (
          <div className="space-y-3">
            <GlassCard className="p-4 space-y-3">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Devolucion requerida</p>
              <p className="text-sm text-white/60">
                Descarga la planilla, completala, firmala y subila aqui para confirmar la autorizacion.
              </p>
              {comm.returnTemplateName && (
                <Button variant="outline" size="sm" onClick={() => onDownload(comm.returnTemplateName!)}
                  className="gap-2 border-white/10 text-white/70 hover:bg-white/5">
                  <Download className="size-3.5" />Descargar {comm.returnTemplateName}
                </Button>
              )}
              {uploadedReturns.has(comm.id) ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                  <CheckCheck className="size-4 text-emerald-400" />
                  <p className="text-xs text-emerald-400 font-medium">Documento entregado</p>
                </div>
              ) : (
                <Button onClick={() => onUploadReturn(comm.id)}
                  disabled={uploadingId === comm.id}
                  className="gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 shadow-none">
                  {uploadingId === comm.id
                    ? <><Loader2 className="size-4 animate-spin" />Subiendo...</>
                    : <><UploadCloud className="size-4" />Subir documento firmado</>}
                </Button>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMUNICACIONES — Chat bidireccional (ADMIN/PRECEPTOR/DOCENTE↔Staff)
// ─────────────────────────────────────────────────────────────────────────────

function ChatPane({ messages, onSend, title, subtitle }: {
  messages: { id: string; from: "me" | "them"; text: string; time: string; senderName?: string }[];
  onSend: (text: string) => void;
  title: string;
  subtitle?: string;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (draft.trim()) { onSend(draft.trim()); setDraft(""); }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/5 shrink-0">
        <p className="text-sm font-bold text-[#e4e1ea]">{title}</p>
        {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
              msg.from === "me"
                ? "bg-[#8A2BE2]/25 border border-[#8A2BE2]/30 text-[#e4e1ea] rounded-br-sm"
                : "bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-bl-sm"
            )}>
              {msg.from === "them" && msg.senderName && (
                <p className="text-[10px] font-bold text-[#d0bcff]/70 mb-1 uppercase tracking-wider">{msg.senderName}</p>
              )}
              <p>{msg.text}</p>
              <p className="text-[10px] text-white/25 mt-1.5 text-right">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            rows={2}
            className="flex-1 resize-none bg-white/[0.02] border-white/[0.08] text-sm text-[#e4e1ea] placeholder:text-white/25 rounded-xl focus-visible:ring-[#8A2BE2]/40 min-h-0"
          />
          <Button
            size="icon"
            disabled={!draft.trim()}
            onClick={() => { if (draft.trim()) { onSend(draft.trim()); setDraft(""); } }}
            className="shrink-0 size-10 bg-[#8A2BE2]/25 hover:bg-[#8A2BE2]/40 border border-[#8A2BE2]/30 shadow-none"
          >
            <Send className="size-4 text-[#d0bcff]" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMUNICACIONES — Sender message detail (ADMIN/PRECEPTOR)
// ─────────────────────────────────────────────────────────────────────────────

function SenderMessageDetail({ comm }: { comm: Communication }) {
  const typeConf = TYPE_CONFIG[comm.type];
  const TypeIcon = typeConf.icon;
  const signedPct = comm.totalRecipients && comm.signedCount !== undefined
    ? Math.round((comm.signedCount / comm.totalRecipients) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <NeonBadge className={typeConf.color}>
            <TypeIcon className="size-3" />{typeConf.label}
          </NeonBadge>
          <span className="text-xs text-white/30">{comm.sentAt}</span>
        </div>
        <h2 className="text-base font-bold text-[#e4e1ea]">{comm.title}</h2>
        <p className="text-xs text-white/40 mt-1">Enviado a {comm.totalRecipients ?? "—"} destinatarios</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{comm.body}</p>

        {comm.totalRecipients !== undefined && comm.signedCount !== undefined && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <GlassCard className="p-4 text-center">
                <p className="text-2xl font-bold text-[#d0bcff]">{comm.totalRecipients}</p>
                <p className="text-[10px] text-white/35 uppercase tracking-wider mt-1">Enviados</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{comm.signedCount}</p>
                <p className="text-[10px] text-white/35 uppercase tracking-wider mt-1">Leidos</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{(comm.totalRecipients ?? 0) - (comm.signedCount ?? 0)}</p>
                <p className="text-[10px] text-white/35 uppercase tracking-wider mt-1">Pendientes</p>
              </GlassCard>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-white/40">
                <span>Tasa de lectura</span><span>{signedPct}%</span>
              </div>
              <Progress value={signedPct} className="h-1.5 bg-white/5" />
            </div>
          </div>
        )}

        {comm.pendingRecipients && comm.pendingRecipients.length > 0 && (
          <div>
            <SectionLabel>Sin leer ({comm.pendingRecipients.length})</SectionLabel>
            <div className="space-y-1.5">
              {comm.pendingRecipients.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-sm text-white/70">{r.name}</span>
                  <span className="text-xs text-white/30">{r.course}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {comm.tracking && comm.tracking.length > 0 && (
          <div>
            <SectionLabel>Estado de devoluciones</SectionLabel>
            <div className="space-y-1.5">
              {comm.tracking.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-sm text-white/70">{t.name}</span>
                  <NeonBadge className={t.status === "ENTREGADO"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"}>
                    {t.status === "ENTREGADO" ? <CheckCheck className="size-3" /> : <Clock className="size-3" />}
                    {t.status}
                  </NeonBadge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ComposeDialog({ open, onClose, onSend, role, nivel }: {
  open: boolean;
  onClose: () => void;
  onSend: (data: { title: string; body: string; type: string; audience: string; requireReturn: boolean; templateName: string | null; isGlobal: boolean }) => Promise<void>;
  role: string;
  nivel: NivelEducativo;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const [audienceTarget, setAudienceTarget] = useState<AudienceTarget>("COMUNIDAD");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("ESCUELA");
  const [requireReturn, setRequireReturn] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<StudentRecord[]>([]);

  const levelAudienceOptions = AUDIENCE_OPTIONS_BY_NIVEL[nivel];
  const showStudentToggle = canSendDirectToStudents(nivel);

  const toggleStudent = (s: StudentRecord) => setSelectedStudents(prev =>
    prev.some(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
  );

  const filteredStudents = useMemo(() =>
    MOCK_STUDENT_DIRECTORY.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.course.toLowerCase().includes(studentSearch.toLowerCase())
    ), [studentSearch]);

  const handleSubmit = async () => {
    const hasAudience = audienceTarget === "PERSONAL" || audienceMode === "ESCUELA" ||
      (audienceMode === "CURSO" && !!audience) || (audienceMode === "ALUMNOS" && selectedStudents.length > 0);
    if (!title.trim() || !body.trim() || !type || !hasAudience) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setIsSubmitting(true);
    await onSend({ title, body, type, audience, requireReturn, templateName, isGlobal });
    setIsSubmitting(false);
    // Reset
    setTitle(""); setBody(""); setType(""); setAudience("");
    setAudienceMode("ESCUELA"); setRequireReturn(false);
    setTemplateName(null); setIsGlobal(false);
    setSelectedStudents([]); setStudentSearch("");
  };

  const TAG_OPTIONS = [
    { value: "INSTITUCIONAL", label: "Institucional", icon: Building2 },
    { value: "ALERTA",        label: "Alerta",        icon: AlertTriangle },
    { value: "EVENTO",        label: "Evento",        icon: Calendar },
    { value: "ACADEMICO",     label: "Academico",     icon: BookOpen },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] bg-[#0e0e14] border-white/10 p-0 flex flex-col max-h-[92vh] shadow-[0_0_60px_rgba(138,43,226,0.12)]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
            <PenSquare className="size-4 text-[#d0bcff]" />
            Redactar Comunicado
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Redacta y envia un comunicado formal a familias o al personal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Audiencia: Comunidad vs Personal */}
          <div className="grid grid-cols-2 gap-2">
            {(["COMUNIDAD", "PERSONAL"] as AudienceTarget[]).map(t => (
              <button key={t} onClick={() => setAudienceTarget(t)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                  audienceTarget === t
                    ? "bg-[#8A2BE2]/20 border-[#8A2BE2]/40 text-[#d0bcff]"
                    : "bg-white/[0.02] border-white/[0.07] text-white/40 hover:text-white/60"
                )}>
                {t === "COMUNIDAD" ? <Home className="size-3.5" /> : <Shield className="size-3.5" />}
                {t === "COMUNIDAD" ? "Familias / Comunidad" : "Personal interno"}
              </button>
            ))}
          </div>

          {/* Selector de audiencia comunitaria */}
          {audienceTarget === "COMUNIDAD" && (
            <div className="space-y-2">
              <SectionLabel>Destinatarios</SectionLabel>
              <RadioGroup value={audienceMode} onValueChange={v => setAudienceMode(v as AudienceMode)} className="space-y-2">
                {[
                  { value: "ESCUELA", label: "Toda la escuela", icon: Users },
                  { value: "CURSO",   label: "Por curso / sala", icon: LayoutGrid },
                  { value: "ALUMNOS", label: "Alumnos especificos", icon: UserPlus },
                ].map(opt => (
                  <label key={opt.value} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                    audienceMode === opt.value
                      ? "bg-[#8A2BE2]/10 border-[#8A2BE2]/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]"
                  )}>
                    <RadioGroupItem value={opt.value} className="shrink-0 text-[#d0bcff]" />
                    <opt.icon className="size-4 text-white/40 shrink-0" />
                    <span className="text-sm text-[#e4e1ea]">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>

              {audienceMode === "CURSO" && (
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-2 bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar curso..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {levelAudienceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {audienceMode === "ALUMNOS" && (
                <div className="space-y-2 mt-2">
                  <Input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Buscar alumno..."
                    className="bg-white/[0.02] border-white/10 text-sm"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {filteredStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04]">
                        <Checkbox checked={selectedStudents.some(x => x.id === s.id)} onCheckedChange={() => toggleStudent(s)} />
                        <span className="text-sm text-[#e4e1ea] flex-1">{s.name}</span>
                        <span className="text-xs text-white/30">{s.course}</span>
                      </label>
                    ))}
                  </div>
                  {selectedStudents.length > 0 && (
                    <p className="text-xs text-[#d0bcff]">{selectedStudents.length} alumno(s) seleccionados</p>
                  )}
                </div>
              )}

              {showStudentToggle && audienceMode !== "ALUMNOS" && (
                <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#8A2BE2]/[0.05] border border-[#8A2BE2]/20 cursor-pointer mt-1">
                  <div>
                    <p className="text-xs font-medium text-[#e4e1ea]">Enviar tambien a los alumnos</p>
                    <p className="text-[11px] text-white/35">Los propios alumnos recibirán el comunicado</p>
                  </div>
                  <Switch className="shrink-0 data-[state=checked]:bg-[#8A2BE2]" />
                </label>
              )}
            </div>
          )}

          {/* Tipo de comunicado */}
          <div className="space-y-2">
            <SectionLabel>Tipo</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {TAG_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setType(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                    type === opt.value
                      ? cn("border-[#d0bcff]/30 text-[#d0bcff]", TYPE_CONFIG[opt.value as CommunicationType]?.color.replace("border-", "bg-").split(" ")[0])
                      : "bg-white/[0.02] border-white/[0.07] text-white/40 hover:text-white/60"
                  )}>
                  <opt.icon className="size-3.5" />{opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asunto */}
          <div className="space-y-2">
            <SectionLabel>Asunto</SectionLabel>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Asunto del comunicado..."
              className="bg-white/[0.02] border-white/10 text-sm"
            />
          </div>

          {/* Cuerpo */}
          <div className="space-y-2">
            <SectionLabel>Contenido</SectionLabel>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Redacta el comunicado..."
              rows={5}
              className="bg-white/[0.02] border-white/10 text-sm resize-none"
            />
          </div>

          {/* Requiere devolución */}
          {(role === "ADMIN" || role === "PRECEPTOR") && (
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.07] cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-[#e4e1ea]">Requiere devolucion firmada</p>
                  <p className="text-[11px] text-white/35">Las familias deben subir un documento firmado</p>
                </div>
                <Switch checked={requireReturn} onCheckedChange={setRequireReturn} className="shrink-0 data-[state=checked]:bg-emerald-500" />
              </label>
              {requireReturn && (
                <button onClick={() => setTemplateName(templateName ? null : "plantilla_autorizacion.pdf")}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-xs transition-all",
                    templateName
                      ? "bg-[#d0bcff]/[0.06] border-[#d0bcff]/20 text-[#d0bcff]"
                      : "border-dashed border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"
                  )}>
                  <Paperclip className="size-4 shrink-0" />
                  {templateName ?? "Adjuntar plantilla en blanco (opcional)"}
                </button>
              )}
            </div>
          )}

          {/* Alerta global */}
          {role === "ADMIN" && (
            <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/[0.05] border border-red-500/20 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-red-400">Emitir como Alerta Global</p>
                <p className="text-[11px] text-white/35">Banner visible para todos los usuarios activos</p>
              </div>
              <Switch checked={isGlobal} onCheckedChange={setIsGlobal} className="shrink-0 data-[state=checked]:bg-red-500" />
            </label>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01] shrink-0">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/60">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}
            className="gap-2 bg-[#8A2BE2]/80 hover:bg-[#8A2BE2] text-white font-bold">
            {isSubmitting ? <><Loader2 className="size-4 animate-spin" />Enviando...</> : <><Send className="size-4" />Enviar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────────────────────────────────────────────────────────���─
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────������─────────

export default function CommunicationsPage() {
  const { activeContext } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("comunicaciones");
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Roles
  const currentRole = activeContext?.role || "ADMIN";
  const isAdmin     = currentRole === "ADMIN";
  const isPreceptor = currentRole === "PRECEPTOR";
  const isDocente   = currentRole === "DOCENTE";
  const isFamilia   = currentRole === "FAMILIA";
  const canCompose  = isAdmin || isPreceptor;
  const nivel       = (activeContext?.level ?? "SECUNDARIO") as NivelEducativo;

  // ── Comunicaciones: listas ─────────────────────────────────────────────────
  const [messages, setMessages] = useState<Communication[]>(MOCK_SENDER_MESSAGES);
  const selectedComm = useMemo(() => messages.find(c => c.id === selectedCommId) ?? null, [messages, selectedCommId]);

  // ── Sub-tab para DOCENTE ───────────────────────────────────────────────────
  type DocenteSubTab = "avisos" | "chat-staff";
  const [docenteSubTab, setDocenteSubTab] = useState<DocenteSubTab>("avisos");

  // ── Sub-tab y chats para ADMIN/PRECEPTOR ──────────────────────────────────
  type AdminSubTab = "comunicados" | "chat";
  const [adminSubTab, setAdminSubTab]         = useState<AdminSubTab>("comunicados");
  const [adminChatContacts, setAdminChatContacts] = useState<FamiliaContact[]>(MOCK_ADMIN_CHAT_CONTACTS);
  const [adminChats, setAdminChats]           = useState<Record<string, { id: string; from: "me" | "them"; text: string; time: string; senderName?: string }[]>>(MOCK_ADMIN_CHATS);
  const [activeAdminChatId, setActiveAdminChatId] = useState<string | null>(null);

  // ── Familia: chat con Secretaría ───────────────────────────────────────────
  const [familiaChat, setFamiliaChat] = useState(MOCK_FAMILIA_CHAT);
  const [staffChat, setStaffChat] = useState(MOCK_STAFF_CHAT);

  // ── Firma ─────────────────────────────────────────────────────────────────
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signConsent, setSignConsent] = useState(false);
  const [signName, setSignName] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);

  // ── Devolución ────────────────────────────────────────────────────────────
  const [uploadedReturns, setUploadedReturns] = useState<Set<string>>(new Set());
  const [uploadingReturnId, setUploadingReturnId] = useState<string | null>(null);

  // ── Drag & Drop Upload (Documentación) ───────────────────────────────────
  const [docUploadStates, setDocUploadStates] = useState<Record<string, "idle" | "uploading" | "done">>({});
  const [isDraggingDoc, setIsDraggingDoc] = useState<string | null>(null);

  // ── Compose ───────────────────────────────────────────────────────────────
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // ── Matriculación ─────────────────────────────────────────────────────────
  const [enrollChoices, setEnrollChoices] = useState<Record<string, "SI" | "NO">>({});
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [campaignAudienceMode, setCampaignAudienceMode] = useState<AudienceMode>("ESCUELA");
  const [campaignCourse, setCampaignCourse] = useState("");
  const [campaignFile, setCampaignFile] = useState<string | null>(null);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [selectedCampaignStudents, setSelectedCampaignStudents] = useState<StudentRecord[]>([]);

  // ── Documentación: docentes seleccionan doc ───────────────────────────────
  const [documents, setDocuments] = useState<DocumentRequest[]>(MOCK_DOCUMENTS_SENDER);
  const [familiaDocuments, setFamiliaDocuments] = useState<DocumentRequest[]>(MOCK_DOCUMENTS_FAMILIA);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploadDocDialogOpen, setIsUploadDocDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [newDocDueDate, setNewDocDueDate] = useState("");
  const [isUploadingNewDoc, setIsUploadingNewDoc] = useState(false);

  useEffect(() => {
    const list = isFamilia ? MOCK_FAMILIA_MESSAGES : MOCK_SENDER_MESSAGES;
    setMessages(list);
    if (list.length) setSelectedCommId(list[0].id);
    if (isFamilia && MOCK_DOCUMENTS_FAMILIA.length) setSelectedDocId(MOCK_DOCUMENTS_FAMILIA[0].id);
    if (!isFamilia && MOCK_DOCUMENTS_SENDER.length) setSelectedDocId(MOCK_DOCUMENTS_SENDER[0].id);
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "compose" && canCompose) setIsComposeOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFamilia]);

  const handleComposeSend = useCallback(async (data: { title: string; body: string; type: string; audience: string; requireReturn: boolean; templateName: string | null; isGlobal: boolean }) => {
    await new Promise(r => setTimeout(r, 1200));
    const newMsg: Communication = {
      id: `sent-${Date.now()}`,
      type: (data.type || "INSTITUCIONAL") as CommunicationType,
      title: data.title,
      body: data.body,
      senderName: "Yo",
      senderRole: isPreceptor ? "Preceptoria" : "Direccion General",
      sentAt: `Hoy, ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
      priority: "MEDIA",
      totalRecipients: 0, signedCount: 0, pendingRecipients: [],
      ...(data.requireReturn && data.templateName ? { requiresReturn: true, returnTemplateName: data.templateName, tracking: [] } : {}),
    };
    setMessages(prev => [newMsg, ...prev]);
    setSelectedCommId(newMsg.id);
    setIsComposeOpen(false);
    toast.success(data.isGlobal ? "Alerta Global emitida" : "Comunicado enviado", {
      description: data.isGlobal ? "El banner es visible para todos los usuarios activos." : "Tu comunicado fue enviado exitosamente.",
    });
  }, [isPreceptor]);

  const handleSign = useCallback(async () => {
    if (!signConsent || !signName.trim()) {
      toast.error("Acepta los terminos y escribe tu nombre completo");
      return;
    }
    setIsSigning(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSigning(false);
    setIsSignDialogOpen(false);
    setSignConsent(false);
    setSignName("");
    if (signingDocId) {
      setFamiliaDocuments(prev => prev.map(d =>
        d.id === signingDocId ? { ...d, status: "FIRMADO_DIGITAL" as const } : d
      ));
      setSigningDocId(null);
    }
    toast.success("Documento firmado digitalmente y archivado.");
  }, [signConsent, signName, signingDocId]);

  const handleUploadReturn = useCallback(async (commId: string) => {
    setUploadingReturnId(commId);
    await new Promise(r => setTimeout(r, 1500));
    setUploadedReturns(prev => new Set(prev).add(commId));
    setUploadingReturnId(null);
    toast.success("Documento entregado correctamente.");
  }, []);

  const handleEnrollChoice = useCallback((commId: string, choice: "SI" | "NO") => {
    setEnrollChoices(prev => ({ ...prev, [commId]: choice }));
    if (choice === "SI") toast.success("Reserva confirmada. Descarga la planilla.");
    else toast.info("Vacante liberada. Gracias por avisar.");
  }, []);

  const handleSendCampaign = useCallback(async () => {
    if (campaignAudienceMode === "CURSO" && !campaignCourse) {
      toast.error("Selecciona el curso destinatario");
      return;
    }
    if (campaignAudienceMode === "ALUMNOS" && selectedCampaignStudents.length === 0) {
      toast.error("Selecciona al menos un alumno");
      return;
    }
    setIsSendingCampaign(true);
    await new Promise(r => setTimeout(r, 1400));
    setIsSendingCampaign(false);
    setIsCampaignDialogOpen(false);
    setCampaignCourse(""); setCampaignFile(null); setSelectedCampaignStudents([]);
    toast.success("Campana de matriculacion enviada exitosamente.");
  }, [campaignAudienceMode, campaignCourse, selectedCampaignStudents]);

  const handleUploadNewDoc = useCallback(async () => {
    if (!newDocTitle.trim() || !newDocDueDate.trim()) {
      toast.error("Completa el titulo y la fecha limite");
      return;
    }
    setIsUploadingNewDoc(true);
    await new Promise(r => setTimeout(r, 1200));
    const newDoc: DocumentRequest = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      description: newDocDescription,
      dueDate: newDocDueDate,
      requiredBy: isPreceptor ? "Preceptoria" : "Direccion General",
      status: "PENDIENTE",
      hasTemplate: false,
      tracking: MOCK_STUDENT_DIRECTORY.slice(0, 8).map(s => ({
        id: s.id, name: s.name, course: s.course, status: "PENDIENTE" as const,
      })),
    };
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    setIsUploadingNewDoc(false);
    setIsUploadDocDialogOpen(false);
    setNewDocTitle(""); setNewDocDescription(""); setNewDocDueDate("");
    toast.success("Solicitud de firma enviada a las familias.");
  }, [newDocTitle, newDocDescription, newDocDueDate, isPreceptor]);

  const handleDocUpload = useCallback(async (docId: string) => {
    setDocUploadStates(prev => ({ ...prev, [docId]: "uploading" }));
    await new Promise(r => setTimeout(r, 1500));
    setDocUploadStates(prev => ({ ...prev, [docId]: "done" }));
    setFamiliaDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: "FIRMADO_FISICO" as const } : d));
    toast.success("Documento fisico subido correctamente.");
  }, []);

  if (!mounted) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const mainTabs: { id: MainTab; label: string; icon: typeof Mail }[] = [
    { id: "comunicaciones", label: "Comunicaciones",  icon: MessageSquare },
    { id: "matriculacion",  label: "Matriculacion",   icon: GraduationCap },
    { id: "documentacion",  label: "Documentacion",   icon: FolderOpen    },
  ];

  const tabAccent: Record<MainTab, string> = {
    comunicaciones: "border-[#d0bcff] text-[#d0bcff]",
    matriculacion:  "border-amber-400 text-amber-400",
    documentacion:  "border-emerald-400 text-emerald-400",
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: COMUNICACIONES
  // ─────────────────────────────────────────────────────────────────────────

  function renderComunicacionesTab() {
    // ── FAMILIA ────────────────────────────────────────────────────────────
    if (isFamilia) {
      return (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[340px_1fr] h-full">
          {/* Columna izquierda: Avisos (solo lectura de docentes) + Chat con Secretaría */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Bandeja de comunicados */}
            <GlassCard className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="px-4 pt-4 pb-2 shrink-0">
                <SectionLabel>Comunicados recibidos</SectionLabel>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {messages.map(msg => {
                  const tconf = TYPE_CONFIG[msg.type];
                  const TIcon = tconf.icon;
                  return (
                    <button key={msg.id} onClick={() => { setSelectedCommId(msg.id); setShowMobileDetail(true); }}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-xl transition-all",
                        selectedCommId === msg.id
                          ? "bg-[#8A2BE2]/15 border border-[#8A2BE2]/30"
                          : "hover:bg-white/[0.03] border border-transparent"
                      )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <NeonBadge className={cn(tconf.color, "text-[9px]")}>
                          <TIcon className="size-2.5" />{tconf.label}
                        </NeonBadge>
                        <span className="text-[10px] text-white/30 shrink-0">{msg.sentAt}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#e4e1ea] line-clamp-1">{msg.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{msg.senderName}</p>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {/* Chat con Secretaría/Preceptoría */}
            <GlassCard className="flex flex-col h-72 overflow-hidden">
              <ChatPane
                messages={familiaChat}
                title="Chat con Preceptoria"
                subtitle="Secretaria — Turno Manana"
                onSend={text => setFamiliaChat(prev => [...prev, {
                  id: `fc-${Date.now()}`, from: "me", text,
                  time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                }])}
              />
            </GlassCard>
          </div>

          {/* Columna derecha: detalle del comunicado */}
          <GlassCard className="flex flex-col overflow-hidden min-h-0">
            {selectedComm ? (
              <FamiliaMessageDetail
                comm={selectedComm}
                onSign={() => setIsSignDialogOpen(true)}
                onDownload={name => toast.success(`Descargando ${name}`)}
                onUploadReturn={handleUploadReturn}
                uploadedReturns={uploadedReturns}
                uploadingId={uploadingReturnId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
                <Inbox className="size-10" />
                <p className="text-sm">Selecciona un comunicado</p>
              </div>
            )}
          </GlassCard>
        </div>
      );
    }

    // ── DOCENTE ─────────────────────────────────────────────────────────────
    if (isDocente) {
      const avisos = MOCK_DOCENTE_AVISOS;
      return (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[300px_1fr] h-full">
          <div className="flex flex-col gap-3 overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {[
                { id: "avisos" as DocenteSubTab,    label: "Cuaderno",    icon: BookOpen },
                { id: "chat-staff" as DocenteSubTab, label: "Chat Interno", icon: MessageSquare },
              ].map(st => (
                <button key={st.id} onClick={() => setDocenteSubTab(st.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                    docenteSubTab === st.id ? "bg-[#8A2BE2]/25 text-[#d0bcff]" : "text-white/40 hover:text-white/60"
                  )}>
                  <st.icon className="size-3.5" />{st.label}
                </button>
              ))}
            </div>

            {docenteSubTab === "avisos" && (
              <GlassCard className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                  <SectionLabel>Avisos enviados</SectionLabel>
                  <Button size="sm" onClick={() => setIsComposeOpen(true)}
                    className="h-7 gap-1 text-xs bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/30 text-[#d0bcff] shadow-none">
                    <Plus className="size-3" />Nuevo
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                  {avisos.map(msg => (
                    <button key={msg.id} onClick={() => setSelectedCommId(msg.id)}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-xl border transition-all",
                        selectedCommId === msg.id ? "bg-[#8A2BE2]/15 border-[#8A2BE2]/30" : "border-transparent hover:bg-white/[0.03]"
                      )}>
                      <p className="text-xs font-semibold text-[#e4e1ea] line-clamp-1">{msg.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-white/35">{msg.sentAt}</span>
                        <span className="text-[10px] text-emerald-400">{msg.signedCount}/{msg.totalRecipients}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {docenteSubTab === "chat-staff" && (
              <GlassCard className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
                <ChatPane
                  messages={staffChat}
                  title="Chat Interno"
                  subtitle="Preceptoria · Secretaria · Admin"
                  onSend={text => setStaffChat(prev => [...prev, {
                    id: `sc-${Date.now()}`, from: "me", text,
                    time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                  }])}
                />
              </GlassCard>
            )}
          </div>

          {/* Detalle del aviso */}
          <GlassCard className="flex flex-col overflow-hidden min-h-0">
            {selectedComm && docenteSubTab === "avisos" ? (
              <SenderMessageDetail comm={selectedComm} />
            ) : docenteSubTab === "avisos" ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
                <BookOpen className="size-10" />
                <p className="text-sm">Selecciona un aviso</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
                <MessageSquare className="size-10" />
                <p className="text-sm">Selecciona el chat de la izquierda</p>
              </div>
            )}
          </GlassCard>
        </div>
      );
    }

    // ── ADMIN / PRECEPTOR ───────────────────────────────────────────────────
    return (
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[300px_1fr] h-full">
        {/* Columna izquierda: sub-tabs Comunicados / Chat */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Sub-tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06] shrink-0">
            {[
              { id: "comunicados" as AdminSubTab, label: "Comunicados", icon: Mail },
              { id: "chat"        as AdminSubTab, label: "Chat Familias", icon: MessageSquare },
            ].map(st => (
              <button key={st.id} onClick={() => setAdminSubTab(st.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  adminSubTab === st.id ? "bg-[#8A2BE2]/25 text-[#d0bcff]" : "text-white/40 hover:text-white/60"
                )}>
                <st.icon className="size-3.5" />{st.label}
                {st.id === "chat" && adminChatContacts.some(c => c.unread > 0) && (
                  <span className="ml-0.5 size-1.5 rounded-full bg-[#d0bcff] animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Sub-tab: Comunicados enviados */}
          {adminSubTab === "comunicados" && (
            <GlassCard className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                <SectionLabel>Enviados ({messages.length})</SectionLabel>
                <Button size="sm" onClick={() => setIsComposeOpen(true)}
                  className="h-7 gap-1 text-xs bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/30 text-[#d0bcff] shadow-none">
                  <Plus className="size-3" />Nuevo
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {messages.map(msg => {
                  const tconf = TYPE_CONFIG[msg.type];
                  const TIcon = tconf.icon;
                  return (
                    <button key={msg.id} onClick={() => setSelectedCommId(msg.id)}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-xl border transition-all",
                        selectedCommId === msg.id ? "bg-[#8A2BE2]/15 border-[#8A2BE2]/30" : "border-transparent hover:bg-white/[0.03]"
                      )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <NeonBadge className={cn(tconf.color, "text-[9px]")}>
                          <TIcon className="size-2.5" />{tconf.label}
                        </NeonBadge>
                        <span className="text-[10px] text-white/30 shrink-0">{msg.sentAt}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#e4e1ea] line-clamp-1">{msg.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-white/35">{msg.totalRecipients ?? 0} dest.</span>
                        {msg.signedCount !== undefined && msg.totalRecipients !== undefined && (
                          <span className="text-[11px] text-emerald-400">{msg.signedCount}/{msg.totalRecipients} leidos</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Sub-tab: Lista de chats con familias */}
          {adminSubTab === "chat" && (
            <GlassCard className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="px-4 pt-3 pb-2 shrink-0">
                <SectionLabel>Conversaciones</SectionLabel>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {adminChatContacts.map(contact => (
                  <button key={contact.id}
                    onClick={() => setActiveAdminChatId(contact.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-xl border transition-all",
                      activeAdminChatId === contact.id
                        ? "bg-[#8A2BE2]/15 border-[#8A2BE2]/30"
                        : "border-transparent hover:bg-white/[0.03]"
                    )}>
                    <div className="flex items-start gap-3">
                      {/* Avatar inicial */}
                      <div className="size-9 rounded-full bg-gradient-to-br from-[#8A2BE2]/30 to-[#d0bcff]/20 border border-[#d0bcff]/15 flex items-center justify-center shrink-0 text-xs font-bold text-[#d0bcff]">
                        {contact.name.split(" ").slice(-1)[0]?.charAt(0) ?? "F"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[#e4e1ea] line-clamp-1">{contact.name}</p>
                          {contact.unread > 0 && (
                            <span className="shrink-0 flex items-center justify-center size-4 rounded-full bg-[#8A2BE2] text-[9px] font-bold text-white">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{contact.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <NeonBadge className={cn(
                            "text-[9px]",
                            contact.nivel === "SECUNDARIO" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            contact.nivel === "PRIMARIO"   ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                                                             "bg-pink-500/10 text-pink-400 border-pink-500/20"
                          )}>
                            {contact.nivel}
                          </NeonBadge>
                          <span className="text-[10px] text-white/25">{contact.time}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Columna derecha: Detalle del comunicado o panel de chat */}
        <GlassCard className="flex flex-col overflow-hidden min-h-0">
          {adminSubTab === "comunicados" ? (
            selectedComm ? (
              <SenderMessageDetail comm={selectedComm} />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
                <Mail className="size-10" />
                <p className="text-sm">Selecciona un comunicado</p>
              </div>
            )
          ) : (
            activeAdminChatId ? (
              <ChatPane
                key={activeAdminChatId}
                messages={adminChats[activeAdminChatId] ?? []}
                title={adminChatContacts.find(c => c.id === activeAdminChatId)?.name ?? "Chat"}
                subtitle={adminChatContacts.find(c => c.id === activeAdminChatId)?.student}
                onSend={text => {
                  setAdminChats(prev => ({
                    ...prev,
                    [activeAdminChatId]: [
                      ...(prev[activeAdminChatId] ?? []),
                      {
                        id: `ac-${Date.now()}`, from: "me", text,
                        time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                      },
                    ],
                  }));
                  // Limpiar unread al responder
                  setAdminChatContacts(prev =>
                    prev.map(c => c.id === activeAdminChatId ? { ...c, unread: 0, lastMessage: text, time: "Ahora" } : c)
                  );
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
                <MessageSquare className="size-10" />
                <p className="text-sm">Selecciona una conversacion</p>
              </div>
            )
          )}
        </GlassCard>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: MATRICULACION
  // ─────────────────────────────────────────────────────────────────────────

  function renderMatriculacionTab() {
    // ── FAMILIA ─────────────────────────────────────────────────────────────
    if (isFamilia) {
      const comm = MOCK_ENROLLMENT_FAMILIA;
      const choice = enrollChoices[comm.id];
      return (
        <div className="max-w-xl mx-auto w-full space-y-5">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <GraduationCap className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#e4e1ea]">{comm.title}</p>
                <p className="text-xs text-white/40">De: {comm.senderName} · {comm.sentAt}</p>
              </div>
              <NeonBadge className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20">
                <AlertTriangle className="size-3" />Urgente
              </NeonBadge>
            </div>
            <p className="text-sm text-white/65 leading-relaxed whitespace-pre-line">{comm.body}</p>
          </GlassCard>

          {/* Bloque interactivo */}
          <GlassCard className="overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/15 bg-amber-500/[0.04]">
              <GraduationCap className="size-4 text-amber-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Accion requerida</p>
            </div>
            <div className="p-5">
              {!choice && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#e4e1ea]">
                    ¿Desea reservar la vacante para el ciclo lectivo 2027?
                  </p>
                  <p className="text-sm text-white/55 leading-relaxed">
                    Confirme su intencion para acceder a la planilla de inscripcion oficial.
                    Las vacantes son limitadas y se asignan por orden de confirmacion.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleEnrollChoice(comm.id, "SI")}
                      className="group flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(74,222,128,0.12)] transition-all">
                      <div className="size-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="size-5 text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-emerald-400">SI, CONTINUAR</span>
                      <span className="text-[11px] text-white/35 text-center px-2">Reservar vacante</span>
                    </button>
                    <button onClick={() => handleEnrollChoice(comm.id, "NO")}
                      className="group flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-white/10 bg-white/[0.02] hover:bg-red-500/[0.06] hover:border-red-500/30 transition-all">
                      <div className="size-10 rounded-full bg-white/5 border border-white/15 flex items-center justify-center group-hover:border-red-500/25">
                        <X className="size-5 text-white/35 group-hover:text-red-400 transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-white/45 group-hover:text-red-400 transition-colors">NO, LIBERAR</span>
                      <span className="text-[11px] text-white/25 text-center px-2">Liberar la vacante</span>
                    </button>
                  </div>
                </div>
              )}
              {choice === "SI" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Reserva confirmada</p>
                      <p className="text-xs text-white/45 mt-1 leading-relaxed">
                        Descarga la planilla, completala y entregalela en Secretaria con la documentacion requerida.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toast.success("Descargando Planilla_Inscripcion_2027.pdf")}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#d0bcff] hover:bg-[#d0bcff]/90 font-bold text-[#1b1b1f] shadow-[0_0_20px_rgba(208,188,255,0.20)] transition-colors">
                    <Download className="size-5" />
                    Descargar Planilla de Inscripcion 2027
                  </button>
                </div>
              )}
              {choice === "NO" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <PartyPopper className="size-5 text-white/35 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#e4e1ea]">Vacante liberada. Gracias por avisar.</p>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed">
                      Lamentamos que no continuen con nosotros. Fue un placer acompanar su camino educativo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      );
    }

    // ── ADMIN / PRECEPTOR ───────────────────────────────────────────────────
    const enrollment = MOCK_ENROLLMENT_SENDER;
    const stats = enrollment.enrollStats!;
    const pct = Math.round((stats.confirmed / stats.total) * 100);
    const pending = stats.total - stats.confirmed - stats.rejected;

    return (
      <div className="space-y-6">
        {/* Mini-dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Enviadas",    value: stats.total,     sub: "Familias notificadas",     color: "text-[#d0bcff]",  bg: "bg-[#d0bcff]/[0.04] border-[#d0bcff]/15" },
            { label: "Confirmaron SI",    value: stats.confirmed, sub: "Faltan entregar planilla",  color: "text-emerald-400", bg: "bg-emerald-500/[0.05] border-emerald-500/20" },
            { label: "Rechazaron NO",     value: stats.rejected,  sub: "Vacantes liberadas",        color: "text-red-400",     bg: "bg-red-500/[0.05] border-red-500/20" },
          ].map(card => (
            <div key={card.label} className={cn("p-5 rounded-2xl border space-y-2", card.bg)}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/35">{card.label}</p>
              <p className={cn("text-4xl font-bold tabular-nums", card.color)}>{card.value}</p>
              <p className="text-xs text-white/30">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Barra de progreso */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">Progreso de confirmaciones</p>
            <span className="text-sm font-bold text-[#d0bcff]">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 bg-white/[0.04]" />
          <div className="flex items-center gap-4 text-xs text-white/35">
            <span>{stats.confirmed} confirmados</span>
            <span className="text-amber-400">{pending} pendientes</span>
            <span className="text-red-400">{stats.rejected} rechazados</span>
          </div>
        </GlassCard>

        {/* Botón nueva campaña */}
        <Button onClick={() => setIsCampaignDialogOpen(true)}
          className="w-full h-12 gap-2.5 font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 shadow-none"
          variant="outline">
          <FilePlus2 className="size-5" />
          Nueva Campana de Matriculacion
        </Button>
      </div>
    );
  }

  // ────────────────────────────────��────────────────────────────────────────
  // TAB: DOCUMENTACION
  // ─────────────────────────────────────────────────────────────────────────

  function renderDocumentacionTab() {
    // ── FAMILIA ─────────────────────────────────────────────────────────────
    if (isFamilia) {
      const pendingCount = familiaDocuments.filter(d => d.status === "PENDIENTE").length;
      return (
        <div className="space-y-4">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/25">
              <AlertTriangle className="size-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-400 font-medium">
                Tenes {pendingCount} solicitud{pendingCount > 1 ? "es" : ""} de firma pendiente{pendingCount > 1 ? "s" : ""}
              </p>
            </div>
          )}
          <div className="grid gap-4">
            {familiaDocuments.map(doc => {
              const uploadState = docUploadStates[doc.id] ?? "idle";
              const isDone = doc.status !== "PENDIENTE";
              return (
                <GlassCard key={doc.id} className={cn(
                  "p-5 space-y-4",
                  !isDone && "border-amber-500/20"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#e4e1ea] leading-snug">{doc.title}</p>
                      <p className="text-xs text-white/40 mt-1">{doc.requiredBy} · Vence: {doc.dueDate}</p>
                    </div>
                    <NeonBadge className={
                      doc.status === "PENDIENTE"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }>
                      {doc.status === "PENDIENTE"
                        ? <><Clock className="size-3" />Pendiente</>
                        : <><BadgeCheck className="size-3" />Firmado</>}
                    </NeonBadge>
                  </div>

                  <p className="text-sm text-white/55 leading-relaxed">{doc.description}</p>

                  {!isDone && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Firma digital */}
                      <button
                        onClick={() => { setSigningDocId(doc.id); setIsSignDialogOpen(true); }}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[#8A2BE2]/30 bg-[#8A2BE2]/[0.06] hover:bg-[#8A2BE2]/[0.12] hover:border-[#8A2BE2]/50 hover:shadow-[0_0_20px_rgba(138,43,226,0.10)] text-sm font-bold text-[#d0bcff] transition-all">
                        <FileSignature className="size-4" />
                        Firmar Digitalmente
                      </button>

                      {/* Subir PDF físico */}
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDraggingDoc(doc.id); }}
                        onDragLeave={() => setIsDraggingDoc(null)}
                        onDrop={e => { e.preventDefault(); setIsDraggingDoc(null); handleDocUpload(doc.id); }}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed text-sm font-medium transition-all cursor-pointer",
                          isDraggingDoc === doc.id
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                            : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/65"
                        )}
                        onClick={() => handleDocUpload(doc.id)}
                      >
                        {uploadState === "uploading"
                          ? <><Loader2 className="size-4 animate-spin text-emerald-400" /><span className="text-emerald-400">Subiendo...</span></>
                          : <><UploadCloud className="size-4" />Descargar y Subir Firmado</>}
                      </div>
                    </div>
                  )}

                  {isDone && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                      <BadgeCheck className="size-4 text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-400 font-medium">
                        {doc.status === "FIRMADO_DIGITAL" ? "Firmado digitalmente" : "Documento fisico entregado"}
                      </p>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      );
    }

    // ── ADMIN / PRECEPTOR ───────────────────────────────────────────────────
    const selectedDoc = documents.find(d => d.id === selectedDocId) ?? null;

    return (
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[300px_1fr] h-full">
        {/* Lista de solicitudes */}
        <GlassCard className="flex flex-col overflow-hidden min-h-0">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
            <SectionLabel>Solicitudes ({documents.length})</SectionLabel>
            <Button size="sm" onClick={() => setIsUploadDocDialogOpen(true)}
              className="h-8 gap-1.5 text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 shadow-none hover:shadow-[0_0_16px_rgba(74,222,128,0.15)] transition-all">
              <FilePlus2 className="size-3.5" />Solicitar Nueva Firma
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {documents.map(doc => {
              const pending = doc.tracking?.filter(t => t.status === "PENDIENTE").length ?? 0;
              const signed  = doc.tracking?.filter(t => t.status !== "PENDIENTE").length ?? 0;
              const total   = doc.tracking?.length ?? 0;
              return (
                <button key={doc.id} onClick={() => setSelectedDocId(doc.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-xl border transition-all",
                    selectedDocId === doc.id ? "bg-emerald-500/10 border-emerald-500/25" : "border-transparent hover:bg-white/[0.03]"
                  )}>
                  <p className="text-xs font-semibold text-[#e4e1ea] line-clamp-2 leading-snug">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-white/35">Vence: {doc.dueDate}</span>
                    {total > 0 && (
                      <span className={cn("text-[11px]", pending > 0 ? "text-amber-400" : "text-emerald-400")}>
                        {signed}/{total} firmados
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Detalle + grilla de firmas */}
        <GlassCard className="flex flex-col overflow-hidden min-h-0">
          {selectedDoc ? (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-white/5 shrink-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#e4e1ea] leading-snug">{selectedDoc.title}</h3>
                  <NeonBadge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                    <FileCheck2 className="size-3" />Activo
                  </NeonBadge>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">{selectedDoc.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] text-white/35">Vence: {selectedDoc.dueDate}</span>
                  {selectedDoc.tracking && (
                    <>
                      <span className="text-[11px] text-emerald-400">
                        {selectedDoc.tracking.filter(t => t.status !== "PENDIENTE").length} firmados
                      </span>
                      <span className="text-[11px] text-amber-400">
                        {selectedDoc.tracking.filter(t => t.status === "PENDIENTE").length} pendientes
                      </span>
                    </>
                  )}
                </div>
                {selectedDoc.tracking && selectedDoc.tracking.length > 0 && (
                  <Progress
                    value={(selectedDoc.tracking.filter(t => t.status !== "PENDIENTE").length / selectedDoc.tracking.length) * 100}
                    className="h-1.5 bg-white/[0.04]"
                  />
                )}
              </div>

              {selectedDoc.tracking && (
                <div className="flex-1 overflow-y-auto p-4">
                  <SectionLabel>Estado por alumno ({selectedDoc.tracking.length})</SectionLabel>
                  <div className="space-y-1.5">
                    {selectedDoc.tracking.map(t => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div>
                          <p className="text-sm text-[#e4e1ea]">{t.name}</p>
                          <p className="text-xs text-white/35">{t.course}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.status !== "PENDIENTE" && t.signedAt && (
                            <span className="text-[10px] text-white/25">{t.signedAt}</span>
                          )}
                          <NeonBadge className={
                            t.status === "PENDIENTE"       ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            t.status === "FIRMADO_DIGITAL" ? "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20" :
                                                             "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }>
                            {t.status === "PENDIENTE"       ? <><Clock className="size-3" />Pendiente</> :
                             t.status === "FIRMADO_DIGITAL" ? <><BadgeCheck className="size-3" />Digital</> :
                                                              <><FileText className="size-3" />Fisico</>}
                          </NeonBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/25">
              <FolderOpen className="size-10" />
              <p className="text-sm">Selecciona una solicitud</p>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 flex items-center justify-center">
            <MessageSquare className="size-4 text-[#d0bcff]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#e4e1ea]">Comunicaciones</h1>
            <p className="text-xs text-white/35">{currentRole} · {activeContext?.schoolName ?? "Institucion"}</p>
          </div>
        </div>
        {canCompose && (
          <Button onClick={() => setIsComposeOpen(true)} size="sm"
            className="gap-2 bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/35 border border-[#8A2BE2]/40 text-[#d0bcff] shadow-none">
            <PenSquare className="size-4" />Redactar
          </Button>
        )}
      </div>

      {/* Tab bar — FAMILIA solo ve Comunicaciones + Documentación (+ Matriculación si hay campaña activa) */}
      <div className="flex gap-0 px-6 border-b border-white/[0.06] shrink-0">
        {mainTabs
          .filter(tab => {
            if (!isFamilia) return true;
            if (tab.id === "matriculacion") {
              // Solo mostrar si hay una campaña de matriculación pendiente
              return messages.some(m => m.isEnrollmentCampaign);
            }
            return true;
          })
          .map(tab => (
          <button key={tab.id} onClick={() => setMainTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
              mainTab === tab.id
                ? cn("-mb-px", tabAccent[tab.id])
                : "border-transparent text-white/30 hover:text-white/55"
            )}>
            <tab.icon className="size-3.5" />
            {tab.label}
            {/* Badge para FAMILIA cuando la tab de matriculación tiene campaña activa */}
            {isFamilia && tab.id === "matriculacion" && (
              <span className="ml-0.5 size-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {mainTab === "comunicaciones" && renderComunicacionesTab()}
            {mainTab === "matriculacion"  && renderMatriculacionTab()}
            {mainTab === "documentacion"  && renderDocumentacionTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}

      {/* Compose */}
      <ComposeDialog
        open={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleComposeSend}
        role={currentRole}
        nivel={nivel}
      />

      {/* Firma digital — FAMILIA */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#0A0A0F]/95 backdrop-blur-3xl border-white/10 text-white max-h-[85vh] flex flex-col p-0 shadow-[0_0_40px_rgba(138,43,226,0.15)]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.07] shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <FileSignature className="size-5 text-[#d0bcff]" />
              Firma Digital
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Al firmar, confirma que leyo y acepta el contenido de este documento.
            </DialogDescription>
          </DialogHeader>
          {/* Área scrolleable */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div className="px-4 py-4 rounded-xl bg-[#8A2BE2]/[0.06] border border-[#8A2BE2]/20 space-y-3">
              <p className="text-xs font-bold text-[#d0bcff] uppercase tracking-wider">Declaracion de consentimiento</p>
              <p className="text-xs text-white/55 leading-relaxed">
                Declaro haber leido en su totalidad el documento adjunto y presto mi consentimiento
                expreso sobre su contenido. Esta firma tiene validez legal equivalente a una firma manuscrita.
                La presente firma tiene plena validez juridica segun Ley 25.506 de Firma Digital (Argentina),
                y no podra ser repudiada una vez emitida. El sistema registrara la fecha, hora, y direccion IP
                desde donde se realizó la firma.
              </p>
            </div>
            <Input
              value={signName}
              onChange={e => setSignName(e.target.value)}
              placeholder="Nombre completo del firmante..."
              className="bg-white/[0.02] border-white/10 text-sm"
            />
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={signConsent} onCheckedChange={v => setSignConsent(v === true)} className="mt-0.5" />
              <span className="text-xs text-white/55 leading-relaxed">
                Acepto los terminos, confirmo mi identidad y autorizo la firma digital de este documento.
              </span>
            </label>
          </div>
          {/* Footer siempre visible — sticky al fondo */}
          <div className="sticky bottom-0 bg-[#0A0A0F] px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => { setIsSignDialogOpen(false); setSignConsent(false); setSignName(""); }}
              className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={handleSign} disabled={!signConsent || !signName.trim() || isSigning}
              className="gap-2 bg-[#8A2BE2]/80 hover:bg-[#8A2BE2] text-white font-bold">
              {isSigning ? <><Loader2 className="size-4 animate-spin" />Firmando...</> : <><BadgeCheck className="size-4" />Firmar</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nueva Campaña de Matriculación */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0e0e14] border-amber-500/20 p-0 flex flex-col max-h-[90vh] shadow-[0_0_40px_rgba(245,158,11,0.10)]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <GraduationCap className="size-5 text-amber-400" />
              Nueva Campana de Matriculacion
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Envia la solicitud de reserva de vacante para el ciclo lectivo 2027.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
            <SectionLabel>Destinatarios</SectionLabel>
            <RadioGroup value={campaignAudienceMode} onValueChange={v => setCampaignAudienceMode(v as AudienceMode)} className="space-y-2">
              {[
                { value: "ESCUELA", label: "Toda la escuela",     icon: Users },
                { value: "CURSO",   label: "Por curso / sala",    icon: LayoutGrid },
                { value: "ALUMNOS", label: "Alumnos especificos", icon: UserPlus },
              ].map(opt => (
                <label key={opt.value} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                  campaignAudienceMode === opt.value ? "bg-amber-500/10 border-amber-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]"
                )}>
                  <RadioGroupItem value={opt.value} className="shrink-0 text-amber-400" />
                  <opt.icon className="size-4 text-white/40 shrink-0" />
                  <span className="text-sm text-[#e4e1ea]">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>

            {campaignAudienceMode === "CURSO" && (
              <Select value={campaignCourse} onValueChange={setCampaignCourse}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar curso..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {AUDIENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {campaignAudienceMode === "ALUMNOS" && (
              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {MOCK_STUDENT_DIRECTORY.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04]">
                    <Checkbox
                      checked={selectedCampaignStudents.some(x => x.id === s.id)}
                      onCheckedChange={() => setSelectedCampaignStudents(prev =>
                        prev.some(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
                      )}
                    />
                    <span className="text-sm text-[#e4e1ea] flex-1">{s.name}</span>
                    <span className="text-xs text-white/30">{s.course}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <SectionLabel>Planilla de Inscripcion (PDF)</SectionLabel>
              {campaignFile ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                  <FileText className="size-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-[#e4e1ea] flex-1 truncate">{campaignFile}</span>
                  <Button variant="ghost" size="sm" onClick={() => setCampaignFile(null)}
                    className="text-white/40 hover:text-white shrink-0">
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button onClick={() => setCampaignFile("Planilla_Inscripcion_2027.pdf")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-amber-500/20 text-amber-400/60 hover:border-amber-500/40 hover:text-amber-400 text-sm transition-all">
                  <Paperclip className="size-4" />Adjuntar Planilla PDF
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-white/5 shrink-0">
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={handleSendCampaign} disabled={isSendingCampaign}
              className="gap-2 bg-amber-500 hover:bg-amber-400 text-[#1b1b1f] font-bold disabled:opacity-40">
              {isSendingCampaign ? <><Loader2 className="size-4 animate-spin" />Enviando...</> : <><Send className="size-4" />Enviar Campana</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva solicitud de firma — ADMIN/PRECEPTOR */}
      <Dialog open={isUploadDocDialogOpen} onOpenChange={setIsUploadDocDialogOpen}>
        <DialogContent className="sm:max-w-[460px] bg-[#0e0e14] border-emerald-500/20 shadow-[0_0_40px_rgba(74,222,128,0.08)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <FileCheck2 className="size-5 text-emerald-400" />
              Nueva Solicitud de Firma
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Crea una solicitud de firma que se enviara a las familias seleccionadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <SectionLabel>Titulo del documento</SectionLabel>
              <Input value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)}
                placeholder="Ej: Autorizacion Salida Educativa al Planetario"
                className="bg-white/[0.02] border-white/10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <SectionLabel>Descripcion</SectionLabel>
              <Textarea value={newDocDescription} onChange={e => setNewDocDescription(e.target.value)}
                placeholder="Descripcion del documento..."
                rows={3} className="bg-white/[0.02] border-white/10 text-sm resize-none" />
            </div>
            <div className="space-y-1.5">
              <SectionLabel>Fecha limite</SectionLabel>
              <Input type="text" value={newDocDueDate} onChange={e => setNewDocDueDate(e.target.value)}
                placeholder="Ej: 30 Jun 2026"
                className="bg-white/[0.02] border-white/10 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDocDialogOpen(false)} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={handleUploadNewDoc} disabled={isUploadingNewDoc}
              className="gap-2 bg-emerald-500/80 hover:bg-emerald-500 text-[#0b1e12] font-bold">
              {isUploadingNewDoc ? <><Loader2 className="size-4 animate-spin" />Enviando...</> : <><Send className="size-4" />Crear Solicitud</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster theme="dark" />
    </div>
  );
}
