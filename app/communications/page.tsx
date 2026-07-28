"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { 
  Mail, 
  Send, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Building2,
  BookOpen,
  ChevronLeft,
  PenSquare,
  Shield,
  User,
  Loader2,
  X,
  Paperclip,
  Megaphone,
  PenLine,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Download,
  Eye,
  UploadCloud,
  FolderArchive,
  FileCheck2,
  Search,
  Users,
  UserPlus,
  Plus,
  GraduationCap,
  ClipboardList,
  BriefcaseBusiness,
  UserCheck,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  unitLabel,
  unitLabelSingular,
  AUDIENCE_OPTIONS_BY_NIVEL,
  canSendDirectToStudents,
  type NivelEducativo,
} from "@/lib/level-config";

// ============================================
// TYPES
// ============================================

type CommunicationType = "INSTITUCIONAL" | "ALERTA" | "EVENTO" | "ACADEMICO";
type CommunicationStatus = "ENVIADO" | "LEIDO" | "FIRMADO" | "PENDIENTE";

interface Communication {
  id: string;
  type: CommunicationType;
  title: string;
  body: string;
  senderName: string;
  senderRole: string;
  sentAt: string;
  priority: "ALTA" | "MEDIA" | "BAJA";
  hasAttachment?: boolean;
  attachmentName?: string;
  // For receivers (FAMILIA)
  status?: CommunicationStatus;
  signedAt?: string;
  // For senders (ADMIN/DOCENTE/PRECEPTOR)
  totalRecipients?: number;
  signedCount?: number;
  pendingRecipients?: { id: string; name: string; course: string }[];
  // Actionable circulars (require document return)
  requiresReturn?: boolean;
  returnTemplateName?: string; // Blank template attached by the preceptor
  returnStatus?: "PENDIENTE" | "ENTREGADO"; // FAMILIA return state
  // Sender-side tracking grid (one row per student of target course)
  tracking?: {
    id: string;
    name: string;
    status: "PENDIENTE" | "ENTREGADO";
    fileName?: string;
  }[];
}

// ============================================
// MOCK DATA
// ============================================

const TYPE_CONFIG: Record<CommunicationType, { label: string; color: string; icon: typeof Building2 }> = {
  INSTITUCIONAL: { label: "Institucional", color: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20", icon: Building2 },
  ALERTA: { label: "Alerta", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  EVENTO: { label: "Evento", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Calendar },
  ACADEMICO: { label: "Academico", color: "bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20", icon: BookOpen },
};

// Communications for FAMILIA (receiver view)
const MOCK_FAMILIA_COMMUNICATIONS: Communication[] = [
  {
    id: "c0",
    type: "EVENTO",
    title: "Autorizacion - Salida Didactica al Museo de Ciencias",
    body: `Estimadas familias,

Informamos que el dia jueves 20 de junio el curso realizara una salida didactica al Museo de Ciencias Naturales en el marco del proyecto anual de Biologia.

La salida se realizara en colectivo contratado, con partida a las 08:30 hs desde la institucion y regreso estimado a las 14:00 hs.

Para que su hijo/a pueda participar, es OBLIGATORIO descargar la autorizacion adjunta, completarla, firmarla y devolverla a traves de este mismo comunicado antes del martes 18 de junio.

Quedamos a disposicion ante cualquier consulta.

Preceptoria 4to Ano A`,
    senderName: "Preceptoria 4to A",
    senderRole: "Preceptor",
    sentAt: "Hoy, 08:00",
    priority: "ALTA",
    status: "PENDIENTE",
    hasAttachment: true,
    attachmentName: "Autorizacion_Museo.pdf",
    requiresReturn: true,
    returnTemplateName: "Autorizacion_Museo.pdf",
    returnStatus: "PENDIENTE",
  },
  {
    id: "c1",
    type: "ALERTA",
    title: "Suspension de Clases - Jornada Docente",
    body: `Estimadas familias,

Por medio de la presente, les comunicamos que el dia viernes 14 de junio NO habra clases debido a la realizacion de una jornada de capacitacion docente obligatoria.

Las actividades se retomaran con normalidad el lunes 17 de junio.

Agradecemos su comprension y quedamos a disposicion ante cualquier consulta.

Atentamente,
Equipo Directivo`,
    senderName: "Direccion General",
    senderRole: "Administracion",
    sentAt: "Hoy, 09:30",
    priority: "ALTA",
    status: "PENDIENTE",
  },
  {
    id: "c2",
    type: "EVENTO",
    title: "Invitacion a la Feria de Ciencias 2026",
    body: `Estimadas familias,

Tenemos el agrado de invitarlos a la Feria de Ciencias y Tecnologia 2026 que se llevara a cabo el sabado 22 de junio de 10:00 a 16:00 hs en el gimnasio de la institucion.

Los estudiantes presentaran sus proyectos de investigacion y desarrollo tecnologico. Habra stands interactivos, demostraciones en vivo y premios para los mejores trabajos.

Los esperamos para compartir este momento especial de nuestros alumnos.

Cordialmente,
Departamento de Ciencias`,
    senderName: "Prof. Garcia, Roberto",
    senderRole: "Jefe de Departamento",
    sentAt: "Ayer, 14:15",
    priority: "MEDIA",
    status: "LEIDO",
    hasAttachment: true,
    attachmentName: "programa_feria_2026.pdf",
  },
  {
    id: "c3",
    type: "INSTITUCIONAL",
    title: "Actualizacion del Reglamento de Convivencia",
    body: `Estimadas familias,

Les informamos que el Consejo Escolar ha aprobado modificaciones al Reglamento de Convivencia Institucional que entraran en vigencia a partir del 1 de julio.

Los principales cambios incluyen:
- Nuevos protocolos de uso de dispositivos electronicos
- Actualizacion de los procedimientos de justificacion de inasistencias
- Incorporacion de nuevas normas de vestimenta

Solicitamos firmar esta notificacion como constancia de recepcion del comunicado.

Direccion`,
    senderName: "Secretaria Academica",
    senderRole: "Administracion",
    sentAt: "12 Jun, 08:00",
    priority: "ALTA",
    status: "FIRMADO",
    signedAt: "12 Jun, 18:45",
    hasAttachment: true,
    attachmentName: "reglamento_actualizado.pdf",
  },
  {
    id: "c4",
    type: "ACADEMICO",
    title: "Cierre de Notas del Primer Trimestre",
    body: `Estimadas familias,

Les comunicamos que el cierre de notas del primer trimestre sera el viernes 21 de junio. Los boletines estaran disponibles a partir del lunes 24 de junio a traves del portal de familias.

Para consultas sobre calificaciones, pueden comunicarse con los docentes a cargo en los horarios de atencion establecidos.

Saludos cordiales,
Secretaria Academica`,
    senderName: "Secretaria Academica",
    senderRole: "Administracion",
    sentAt: "10 Jun, 11:20",
    priority: "MEDIA",
    status: "FIRMADO",
    signedAt: "10 Jun, 19:30",
  },
];

// Communications for ADMIN/DOCENTE/PRECEPTOR (sender view)
const MOCK_SENDER_COMMUNICATIONS: Communication[] = [
  {
    id: "s0",
    type: "EVENTO",
    title: "Autorizacion - Salida Didactica al Museo de Ciencias",
    body: `Estimadas familias,

Informamos que el dia jueves 20 de junio el curso realizara una salida didactica al Museo de Ciencias Naturales en el marco del proyecto anual de Biologia.

Para que su hijo/a pueda participar, es OBLIGATORIO descargar la autorizacion adjunta, completarla, firmarla y devolverla a traves de este mismo comunicado antes del martes 18 de junio.

Preceptoria 4to Ano A`,
    senderName: "Yo",
    senderRole: "Preceptor 4to A",
    sentAt: "Hoy, 08:00",
    priority: "ALTA",
    hasAttachment: true,
    attachmentName: "Autorizacion_Museo.pdf",
    requiresReturn: true,
    returnTemplateName: "Autorizacion_Museo.pdf",
    tracking: [
      { id: "t1", name: "Benitez, Lucas", status: "ENTREGADO", fileName: "Autorizacion_Benitez.pdf" },
      { id: "t2", name: "Acosta, Martina", status: "ENTREGADO", fileName: "Autorizacion_Acosta.pdf" },
      { id: "t3", name: "Cardozo, Tomas", status: "PENDIENTE" },
      { id: "t4", name: "Dominguez, Valentina", status: "ENTREGADO", fileName: "Autorizacion_Dominguez.pdf" },
      { id: "t5", name: "Espinoza, Mateo", status: "PENDIENTE" },
      { id: "t6", name: "Figueroa, Camila", status: "PENDIENTE" },
      { id: "t7", name: "Gimenez, Bautista", status: "ENTREGADO", fileName: "Autorizacion_Gimenez.pdf" },
      { id: "t8", name: "Herrera, Julieta", status: "PENDIENTE" },
    ],
  },
  {
    id: "s1",
    type: "ALERTA",
    title: "Suspension de Clases - Jornada Docente",
    body: `Estimadas familias,

Por medio de la presente, les comunicamos que el dia viernes 14 de junio NO habra clases debido a la realizacion de una jornada de capacitacion docente obligatoria.

Las actividades se retomaran con normalidad el lunes 17 de junio.

Agradecemos su comprension y quedamos a disposicion ante cualquier consulta.

Atentamente,
Equipo Directivo`,
    senderName: "Yo",
    senderRole: "Direccion General",
    sentAt: "Hoy, 09:30",
    priority: "ALTA",
    totalRecipients: 156,
    signedCount: 89,
    pendingRecipients: [
      { id: "p1", name: "Rodriguez, Maria", course: "4to A" },
      { id: "p2", name: "Gonzalez, Carlos", course: "4to A" },
      { id: "p3", name: "Fernandez, Ana", course: "4to B" },
      { id: "p4", name: "Lopez, Juan", course: "5to A" },
      { id: "p5", name: "Martinez, Laura", course: "5to B" },
    ],
  },
  {
    id: "s2",
    type: "EVENTO",
    title: "Invitacion a la Feria de Ciencias 2026",
    body: `Estimadas familias,

Tenemos el agrado de invitarlos a la Feria de Ciencias y Tecnologia 2026...`,
    senderName: "Yo",
    senderRole: "Direccion General",
    sentAt: "Ayer, 14:15",
    priority: "MEDIA",
    totalRecipients: 156,
    signedCount: 142,
    hasAttachment: true,
    attachmentName: "programa_feria_2026.pdf",
    pendingRecipients: [
      { id: "p6", name: "Sanchez, Pedro", course: "3er A" },
      { id: "p7", name: "Diaz, Sofia", course: "3er B" },
    ],
  },
  {
    id: "s3",
    type: "INSTITUCIONAL",
    title: "Actualizacion del Reglamento de Convivencia",
    body: `Estimadas familias,

Les informamos que el Consejo Escolar ha aprobado modificaciones...`,
    senderName: "Yo",
    senderRole: "Direccion General",
    sentAt: "12 Jun, 08:00",
    priority: "ALTA",
    totalRecipients: 156,
    signedCount: 156,
    hasAttachment: true,
    attachmentName: "reglamento_actualizado.pdf",
    pendingRecipients: [],
  },
];

const TAG_OPTIONS = [
  { value: "INSTITUCIONAL", label: "Institucional", icon: Building2 },
  { value: "ALERTA", label: "Alerta", icon: AlertTriangle },
  { value: "EVENTO", label: "Evento", icon: Calendar },
  { value: "ACADEMICO", label: "Academico", icon: BookOpen },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Toda la escuela", group: "General" },
  { value: "1-A", label: "1er Ano A", group: "Cursos especificos" },
  { value: "1-B", label: "1er Ano B", group: "Cursos especificos" },
  { value: "2-A", label: "2do Ano A", group: "Cursos especificos" },
  { value: "2-B", label: "2do Ano B", group: "Cursos especificos" },
  { value: "3-A", label: "3er Ano A", group: "Cursos especificos" },
  { value: "3-B", label: "3er Ano B", group: "Cursos especificos" },
  { value: "4-A", label: "4to Ano A", group: "Cursos especificos" },
  { value: "4-B", label: "4to Ano B", group: "Cursos especificos" },
  { value: "5-A", label: "5to Ano A", group: "Cursos especificos" },
  { value: "5-B", label: "5to Ano B", group: "Cursos especificos" },
  { value: "6-A", label: "6to Ano A", group: "Cursos especificos" },
  { value: "6-B", label: "6to Ano B", group: "Cursos especificos" },
];

// Padron de alumnos para "Seleccion Personalizada" (cross-course)
type StudentRecord = { id: string; name: string; course: string };
const MOCK_STUDENT_DIRECTORY: StudentRecord[] = [
  { id: "a1", name: "Acosta, Martina", course: "1A" },
  { id: "a2", name: "Benitez, Lucas", course: "1A" },
  { id: "a3", name: "Cardozo, Tomas", course: "1B" },
  { id: "a4", name: "Dominguez, Valentina", course: "2A" },
  { id: "a5", name: "Espinoza, Mateo", course: "2C" },
  { id: "a6", name: "Figueroa, Camila", course: "2C" },
  { id: "a7", name: "Gimenez, Bautista", course: "3B" },
  { id: "a8", name: "Herrera, Julieta", course: "3B" },
  { id: "a9", name: "Ibarra, Santiago", course: "4A" },
  { id: "a10", name: "Juarez, Delfina", course: "4B" },
  { id: "a11", name: "Krause, Thiago", course: "5A" },
  { id: "a12", name: "Ledesma, Renata", course: "5B" },
  { id: "a13", name: "Molina, Joaquin", course: "6A" },
  { id: "a14", name: "Nunez, Abril", course: "6B" },
];

// Tipo de audiencia destino del comunicado
type AudienceTarget = "COMUNIDAD" | "PERSONAL";

// Roles seleccionables para audiencia interna de staff
type StaffRole = "TODOS" | "DOCENTES" | "PRECEPTORES" | "ADMINISTRATIVOS";

const STAFF_ROLE_OPTIONS: {
  value: StaffRole;
  label: string;
  description: string;
  icon: typeof Users;
  count: number;
}[] = [
  { value: "TODOS",           label: "Todos",           description: "Todo el personal",       icon: Users,           count: 42 },
  { value: "DOCENTES",        label: "Docentes",        description: "Cuerpo docente",         icon: GraduationCap,   count: 28 },
  { value: "PRECEPTORES",     label: "Preceptores",     description: "Preceptores y tutores",  icon: ClipboardList,   count: 8  },
  { value: "ADMINISTRATIVOS", label: "Administrativos", description: "Personal administrativo",icon: BriefcaseBusiness,count: 6 },
];

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function CommunicationsPage() {
  const { activeContext } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  
  // Compose dialog state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeType, setComposeType] = useState("");
  const [composeAudience, setComposeAudience] = useState("");
  const [composeTemplateName, setComposeTemplateName] = useState<string | null>(null);
  const [requireSignedReturn, setRequireSignedReturn] = useState(false);
  const [isGlobalAlert, setIsGlobalAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tipo de audiencia: familias/comunidad vs. personal interno
  const [audienceTarget, setAudienceTarget] = useState<AudienceTarget>("COMUNIDAD");
  // Motor de Audiencia: "full" (curso completo) | "custom" (seleccion cross-course)
  const [audienceMode, setAudienceMode] = useState<"full" | "custom">("full");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<StudentRecord[]>([]);
  // Roles del staff seleccionados para mensajeria interna
  const [selectedStaffRoles, setSelectedStaffRoles] = useState<StaffRole[]>([]);
  
  // Sign dialog state
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signConsent, setSignConsent] = useState(false);
  const [signName, setSignName] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // Actionable circulars - return upload state (FAMILIA)
  const [uploadedReturns, setUploadedReturns] = useState<Set<string>>(new Set());
  const [isDraggingReturn, setIsDraggingReturn] = useState(false);
  const [uploadingReturnId, setUploadingReturnId] = useState<string | null>(null);

  // Blindaje de estado: fallback seguro a ADMIN para que la Action Bar del emisor
  // no desaparezca durante la hidratacion del cliente.
  const currentRole = activeContext?.role || "ADMIN";
  const isReceiver = currentRole === "FAMILIA";
  const isSender = currentRole === "ADMIN" || currentRole === "DOCENTE" || currentRole === "PRECEPTOR";
  // Visibilidad asimetrica: solo ADMIN y PRECEPTOR pueden redactar tramites/circulares.
  const canCompose = currentRole === "ADMIN" || currentRole === "PRECEPTOR";

  // ── Level Isolation ────────────────────────────────────────────────────────
  const nivel = (activeContext?.level ?? "SECUNDARIO") as NivelEducativo;
  // Opciones de audiencia aisladas — sin cruce entre niveles
  const levelAudienceOptions = AUDIENCE_OPTIONS_BY_NIVEL[nivel];
  const levelUnitLabel       = unitLabel(nivel);
  const levelUnitSingular    = unitLabelSingular(nivel);
  const showStudentToggle    = canSendDirectToStudents(nivel);
  // Toggle exclusivo SECUNDARIO: habilita enviar mensaje directo a los alumnos
  const [sendDirectToStudents, setSendDirectToStudents] = useState(false);
  // ──────────────────────────────────────────────────────────────────────────

  const [communications, setCommunications] = useState<Communication[]>(
    // La fuente inicial depende del rol: la asignacion real ocurre despues de montar (ver useEffect)
    MOCK_SENDER_COMMUNICATIONS
  );

  const selectedCommunication = useMemo(() => {
    return communications.find(c => c.id === selectedId) || null;
  }, [communications, selectedId]);

  useEffect(() => {
    // Asignar la lista correcta segun el rol (solo la primera vez que monta)
    const initialList = isReceiver ? MOCK_FAMILIA_COMMUNICATIONS : MOCK_SENDER_COMMUNICATIONS;
    setCommunications(initialList);
    setMounted(true);
    if (initialList.length > 0) {
      setSelectedId(initialList[0].id);
    }

    // Deep-linking desde el Centro de Comando del Dashboard
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "compose" && canCompose) {
      setIsComposeOpen(true);
    }
  // Solo re-ejecutar si cambia el rol (cambio de cuenta) — no en cada render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReceiver]);

  const handleSelectCommunication = useCallback((id: string) => {
    setSelectedId(id);
    setShowMobileDetail(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileDetail(false);
  }, []);

  const handleSign = useCallback(async () => {
    if (!signConsent || signName.trim().length === 0) {
      toast.error("Debes aceptar los terminos y firmar con tu nombre completo");
      return;
    }
    
    setIsSigning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSigning(false);
    setIsSignDialogOpen(false);
    setSignConsent(false);
    setSignName("");
    
    toast.success("Documento sellado criptograficamente y archivado.");
  }, [signConsent, signName]);

  const handleDownloadTemplate = useCallback((name: string) => {
    toast.success("Descargando plantilla", {
      description: `${name} - completala, firmala y subila por este mismo comunicado.`,
    });
  }, []);

  const handleUploadReturn = useCallback(async (commId: string) => {
    setUploadingReturnId(commId);
    setIsDraggingReturn(false);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUploadedReturns(prev => new Set(prev).add(commId));
    setUploadingReturnId(null);
    toast.success("Documento entregado", {
      description: "Tu autorizacion fue enviada. Esperando revision de la institucion.",
    });
  }, []);

  const handleViewReturnFile = useCallback((studentName: string) => {
    toast.info("Abriendo documento", {
      description: `Autorizacion subida por la familia de ${studentName}.`,
    });
  }, []);

  const handleDownloadAllZip = useCallback((count: number) => {
    toast.success("Generando archivo ZIP", {
      description: `Comprimiendo ${count} autorizaciones entregadas para su descarga.`,
    });
  }, []);

  const handleAttachTemplate = useCallback(() => {
    // Simulates the preceptor attaching a blank authorization template
    const mockTemplates = [
      "autorizacion_salida_didactica.pdf",
      "planilla_consentimiento.docx",
      "autorizacion_pileta.pdf",
    ];
    const picked = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
    setComposeTemplateName(picked);
    toast.success("Plantilla adjuntada", {
      description: `${picked} se enviara en blanco para que las familias la completen.`,
    });
  }, []);

  const toggleStudent = useCallback((student: StudentRecord) => {
    setSelectedStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  }, []);

  const toggleStaffRole = useCallback((role: StaffRole) => {
    if (role === "TODOS") {
      // "Todos" actua como toggle exclusivo: lo selecciona solo o lo deselecciona
      setSelectedStaffRoles((prev) =>
        prev.includes("TODOS") ? [] : ["TODOS"]
      );
      return;
    }
    setSelectedStaffRoles((prev) => {
      // Quitar "TODOS" si se selecciona un rol especifico
      const without = prev.filter((r) => r !== "TODOS");
      return without.includes(role)
        ? without.filter((r) => r !== role)
        : [...without, role];
    });
  }, []);

  const handleCompose = useCallback(async () => {
    // Validacion segun el tipo de audiencia seleccionado
    const hasCommunityAudience = audienceMode === "full" ? !!composeAudience : selectedStudents.length > 0;
    const hasStaffAudience = selectedStaffRoles.length > 0;
    const hasAudience = audienceTarget === "COMUNIDAD" ? hasCommunityAudience : hasStaffAudience;

    if (!composeTitle.trim() || !composeBody.trim() || !composeType || !hasAudience) {
      toast.error("Por favor completa todos los campos y define la audiencia");
      return;
    }

    // Resumen del destino segun el tipo y modo de audiencia
    let audienceLabel: string;
    if (audienceTarget === "PERSONAL") {
      const roles = selectedStaffRoles.includes("TODOS")
        ? "todo el personal"
        : selectedStaffRoles
            .map(r => STAFF_ROLE_OPTIONS.find(o => o.value === r)?.label)
            .filter(Boolean)
            .join(", ");
      audienceLabel = roles;
    } else {
      audienceLabel = audienceMode === "full"
        ? (AUDIENCE_OPTIONS.find(a => a.value === composeAudience)?.label || "los destinatarios")
        : `${selectedStudents.length} alumno(s) seleccionados`;
    }

    // Capturar valores antes del reset para construir el objeto
    const capturedTitle      = composeTitle.trim();
    const capturedBody       = composeBody.trim();
    const capturedType       = composeType as CommunicationType;
    const capturedAudience   = audienceTarget;
    const capturedActionable   = requireSignedReturn;
    const capturedTemplate     = composeTemplateName;
    const capturedGlobalAlert  = isGlobalAlert;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSubmitting(false);

    // Construir el nuevo comunicado y agregarlo AL PRINCIPIO del estado
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const newCommunication: Communication = {
      id: `sent-${Date.now()}`,
      type: capturedType || "INSTITUCIONAL",
      title: capturedTitle,
      body: capturedBody,
      senderName: "Yo",
      senderRole: activeContext?.role === "PRECEPTOR" ? "Preceptoria" : "Direccion General",
      sentAt: `Hoy, ${timeLabel}`,
      priority: "MEDIA",
      ...(capturedAudience === "PERSONAL"
        ? { totalRecipients: selectedStaffRoles.length || 1, signedCount: 0, pendingRecipients: [] }
        : { totalRecipients: audienceMode === "custom" ? selectedStudents.length : undefined, signedCount: 0, pendingRecipients: [] }
      ),
      ...(capturedActionable && capturedTemplate
        ? { requiresReturn: true, returnTemplateName: capturedTemplate, tracking: [] }
        : {}),
    };

    setCommunications(prev => [newCommunication, ...prev]);
    setSelectedId(newCommunication.id);

    setIsComposeOpen(false);
    setComposeTitle("");
    setComposeBody("");
    setComposeType("");
    setComposeAudience("");
    setComposeTemplateName(null);
    setAudienceMode("full");
    setStudentSearch("");
    setSelectedStudents([]);
    setSelectedStaffRoles([]);
    setAudienceTarget("COMUNIDAD");
    setRequireSignedReturn(false);
    setIsGlobalAlert(false);

    const isInternal = capturedAudience === "PERSONAL";
    toast.success(
      capturedGlobalAlert
        ? "Alerta Global emitida a toda la comunidad."
        : isInternal
          ? "Comunicado interno enviado"
          : capturedActionable
            ? "Circular accionable enviada"
            : "Circular enviada exitosamente",
      {
        description: capturedGlobalAlert
          ? "El banner de emergencia es visible para todos los usuarios activos del sistema."
          : isInternal
            ? `Enviado al personal: ${audienceLabel}.`
            : capturedActionable
              ? `Se habilito el buzon de devolucion para ${audienceLabel}.`
              : `El comunicado fue enviado a ${audienceLabel}.`,
      }
    );
  }, [composeTitle, composeBody, composeType, composeAudience, audienceMode, selectedStudents, selectedStaffRoles, audienceTarget, requireSignedReturn]);

  if (!mounted) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Cuaderno de Comunicaciones
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {isReceiver 
              ? "Comunicados recibidos de la institucion" 
              : "Bandeja de enviados y estado de firmas"
            }
          </p>
        </div>
        
        {canCompose && (
          <Button
            onClick={() => setIsComposeOpen(true)}
            size="lg"
            className="h-12 px-6 gap-2 text-base font-bold bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 shadow-lg shadow-[#d0bcff]/20"
          >
            <Plus className="size-5" />
            Redactar Nuevo Tramite / Circular
          </Button>
        )}
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left Column - Communications List (30%) */}
        <div className={cn(
          "w-full lg:w-[30%] flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden",
          showMobileDetail && "hidden lg:flex"
        )}>
          <div className="px-4 py-3 border-b border-white/5 shrink-0">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
              {isReceiver ? "Recibidos" : "Enviados"} ({communications.length})
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {communications.map((comm) => {
              const typeConfig = TYPE_CONFIG[comm.type];
              const Icon = typeConfig.icon;
              const isSelected = comm.id === selectedId;
              
              return (
                <button
                  key={comm.id}
                  onClick={() => handleSelectCommunication(comm.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-white/5 transition-all",
                    isSelected 
                      ? "bg-[#d0bcff]/10 border-l-2 border-l-[#d0bcff]" 
                      : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                      typeConfig.color
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-[#e4e1ea]" : "text-white/70"
                        )}>
                          {comm.title}
                        </p>
                        {comm.priority === "ALTA" && (
                          <span className="size-2 rounded-full bg-red-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{comm.sentAt}</p>
                      
                      {/* Status indicators */}
                      {isReceiver && comm.status && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {comm.status === "FIRMADO" ? (
                            <Badge variant="outline" className="text-[10px] bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20">
                              <CheckCheck className="size-3 mr-1" /> Firmado
                            </Badge>
                          ) : comm.status === "LEIDO" ? (
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                              <Check className="size-3 mr-1" /> Leido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                              <Clock className="size-3 mr-1" /> Pendiente
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {isSender && comm.totalRecipients && (
                        <div className="mt-1.5">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(comm.signedCount! / comm.totalRecipients) * 100} 
                              className="h-1 flex-1 bg-white/5"
                            />
                            <span className="text-[10px] text-white/40 shrink-0">
                              {comm.signedCount}/{comm.totalRecipients}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Communication Detail (70%) */}
        <div className={cn(
          "flex-1 lg:w-[70%] flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden",
          !showMobileDetail && "hidden lg:flex"
        )}>
          {selectedCommunication ? (
            <>
              {/* Mobile back button */}
              <div className="lg:hidden px-4 py-3 border-b border-white/5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="text-white/50 hover:text-white gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Volver
                </Button>
              </div>
              
              {/* Communication Header */}
              <div className="px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] uppercase tracking-wider font-bold", TYPE_CONFIG[selectedCommunication.type].color)}
                      >
                        {TYPE_CONFIG[selectedCommunication.type].label}
                      </Badge>
                      {selectedCommunication.priority === "ALTA" && (
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                          Prioridad Alta
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-[#e4e1ea]">{selectedCommunication.title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-sm text-white/50">
                      <User className="size-4" />
                      <span>{selectedCommunication.senderName}</span>
                      <span className="text-white/20">|</span>
                      <Clock className="size-4" />
                      <span>{selectedCommunication.sentAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Communication Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-white/70 leading-relaxed whitespace-pre-line">
                    {selectedCommunication.body}
                  </p>
                </div>
                
                {/* Attachment */}
                {selectedCommunication.hasAttachment && (
                  <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 w-fit">
                    <FileText className="size-5 text-[#d0bcff]" />
                    <div>
                      <p className="text-sm font-medium text-[#e4e1ea]">{selectedCommunication.attachmentName}</p>
                      <p className="text-xs text-white/40">Documento adjunto</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-[#d0bcff] hover:bg-[#d0bcff]/10">
                      Descargar
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer - Role-specific actions */}
              <div className="px-6 py-4 border-t border-white/5 shrink-0 bg-white/[0.01]">
                {/* FAMILIA - Actionable circular: download template + upload return */}
                {isReceiver && selectedCommunication.requiresReturn && (
                  <div className="space-y-3">
                    {/* Download original template from preceptor */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="size-5 text-[#d0bcff] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#e4e1ea] truncate">
                            {selectedCommunication.returnTemplateName}
                          </p>
                          <p className="text-xs text-white/40">Plantilla a completar y firmar</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTemplate(selectedCommunication.returnTemplateName!)}
                        className="gap-1.5 border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 hover:text-[#d0bcff] shrink-0"
                      >
                        <Download className="size-4" />
                        Descargar
                      </Button>
                    </div>

                    {/* Return mailbox: drag & drop / upload OR delivered badge */}
                    {uploadedReturns.has(selectedCommunication.id) ? (
                      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
                        <FileCheck2 className="size-5 text-[#4de082] shrink-0" />
                        <span className="text-sm font-medium text-[#4de082]">
                          Documento Entregado. Esperando revision.
                        </span>
                      </div>
                    ) : uploadingReturnId === selectedCommunication.id ? (
                      <div className="flex items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-[#d0bcff]/30 bg-[#d0bcff]/5">
                        <Loader2 className="size-5 text-[#d0bcff] animate-spin" />
                        <span className="text-sm text-white/60">Subiendo documento...</span>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleUploadReturn(selectedCommunication.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleUploadReturn(selectedCommunication.id); }}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingReturn(true); }}
                        onDragLeave={() => setIsDraggingReturn(false)}
                        onDrop={(e) => { e.preventDefault(); handleUploadReturn(selectedCommunication.id); }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center",
                          isDraggingReturn
                            ? "border-[#d0bcff] bg-[#d0bcff]/10"
                            : "border-white/15 bg-white/[0.02] hover:border-[#d0bcff]/40 hover:bg-[#d0bcff]/5"
                        )}
                      >
                        <UploadCloud className="size-6 text-[#d0bcff]" />
                        <span className="text-sm font-bold text-[#e4e1ea]">
                          Subir Documento Completado/Firmado
                        </span>
                        <span className="text-xs text-white/40">
                          Arrastra el archivo aqui o haz clic para seleccionarlo (PDF/DOCX)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* FAMILIA View - Sign Button (non-actionable) */}
                {isReceiver && !selectedCommunication.requiresReturn && selectedCommunication.status !== "FIRMADO" && (
                  <Button
                    onClick={() => setIsSignDialogOpen(true)}
                    className="w-full h-12 bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2 font-bold"
                  >
                    <Shield className="size-5" />
                    Firmar Notificacion
                  </Button>
                )}
                
                {isReceiver && !selectedCommunication.requiresReturn && selectedCommunication.status === "FIRMADO" && (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
                    <CheckCheck className="size-5 text-[#4de082]" />
                    <span className="text-sm font-medium text-[#4de082]">
                      Firmado el {selectedCommunication.signedAt}
                    </span>
                  </div>
                )}

                {/* ADMIN/DOCENTE/PRECEPTOR - Actionable circular: tracking grid */}
                {isSender && selectedCommunication.requiresReturn && selectedCommunication.tracking && (
                  <div className="space-y-3">
                    {(() => {
                      const delivered = selectedCommunication.tracking!.filter(t => t.status === "ENTREGADO").length;
                      const total = selectedCommunication.tracking!.length;
                      return (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                              Seguimiento de devoluciones ({delivered}/{total})
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadAllZip(delivered)}
                              disabled={delivered === 0}
                              className="gap-1.5 bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 disabled:opacity-40"
                            >
                              <FolderArchive className="size-4" />
                              Descargar todos los adjuntos (ZIP)
                            </Button>
                          </div>

                          {/* Tracking Grid (Data Table) */}
                          <div className="rounded-xl border border-white/5 overflow-hidden">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-white/[0.03] border-b border-white/5">
                              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Alumno</span>
                              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold text-center w-24">Estado</span>
                              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold text-right w-28">Accion</span>
                            </div>
                            <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                              {selectedCommunication.tracking!.map((row) => (
                                <div
                                  key={row.id}
                                  className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-2.5"
                                >
                                  <span className="text-sm text-[#e4e1ea] truncate">{row.name}</span>
                                  <div className="w-24 flex justify-center">
                                    {row.status === "ENTREGADO" ? (
                                      <Badge variant="outline" className="text-[10px] bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20">
                                        Entregado
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                                        Pendiente
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="w-28 flex justify-end">
                                    {row.status === "ENTREGADO" ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewReturnFile(row.name)}
                                        className="gap-1.5 text-xs text-[#d0bcff] hover:bg-[#d0bcff]/10 h-8"
                                      >
                                        <Eye className="size-3.5" />
                                        Ver archivo
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-white/25 pr-2">Sin entregar</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ADMIN/DOCENTE/PRECEPTOR View - Signature Status (non-actionable) */}
                {isSender && !selectedCommunication.requiresReturn && selectedCommunication.totalRecipients && (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-2xl font-bold text-[#e4e1ea]">{selectedCommunication.totalRecipients}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Enviados</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-[#4de082]/5 border border-[#4de082]/20">
                        <p className="text-2xl font-bold text-[#4de082]">{selectedCommunication.signedCount}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Firmados</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <p className="text-2xl font-bold text-amber-400">
                          {selectedCommunication.totalRecipients - selectedCommunication.signedCount!}
                        </p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Pendientes</p>
                      </div>
                    </div>
                    
                    {/* Pending Recipients List */}
                    {selectedCommunication.pendingRecipients && selectedCommunication.pendingRecipients.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                          Familias sin firmar ({selectedCommunication.pendingRecipients.length})
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {selectedCommunication.pendingRecipients.map((recipient) => (
                            <div 
                              key={recipient.id}
                              className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5"
                            >
                              <span className="text-sm text-[#e4e1ea]">{recipient.name}</span>
                              <span className="text-xs text-white/40">{recipient.course}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedCommunication.pendingRecipients?.length === 0 && (
                      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
                        <Sparkles className="size-5 text-[#4de082]" />
                        <span className="text-sm font-medium text-[#4de082]">
                          Todas las familias han firmado este comunicado
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/30">
                <Mail className="size-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona un comunicado para leer</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Dialog (FAMILIA) - E-Signature */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white/5 backdrop-blur-xl border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.18)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <PenLine className="size-5 text-[#d0bcff]" />
              Consentimiento y Firma Digital
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Firma electronicamente para confirmar la recepcion del comunicado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            {/* Advertencia legal */}
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <p className="text-[11px] leading-relaxed text-white/60">
                Declaro bajo juramento que los datos ingresados son correctos y que he sido legalmente
                notificado del presente comunicado, asumiendo la responsabilidad legal correspondiente.
                Comprendo que esta firma electronica tiene plena validez legal.
              </p>
            </div>

            {/* Checkbox de consentimiento obligatorio */}
            <label
              htmlFor="esign-consent-comm"
              className="flex items-start gap-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 p-3 cursor-pointer hover:bg-[#d0bcff]/10 transition-colors"
            >
              <Checkbox
                id="esign-consent-comm"
                checked={signConsent}
                onCheckedChange={(v) => setSignConsent(v === true)}
                disabled={isSigning}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[#d0bcff] data-[state=checked]:border-[#d0bcff] data-[state=checked]:text-[#1b1b1f]"
              />
              <span className="text-xs font-medium text-[#e4e1ea] leading-snug">
                Acepto los terminos y firmo digitalmente
              </span>
            </label>

            {/* Firma manuscrita */}
            <div className="space-y-1.5">
              <Label htmlFor="esign-name-comm" className="text-xs uppercase tracking-wider text-white/50">
                Nombre y Apellido Completo
              </Label>
              <Input
                id="esign-name-comm"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                disabled={isSigning}
                placeholder="Escriba su nombre completo como firma"
                autoComplete="off"
                className="h-11 bg-white/[0.02] border-white/10 font-serif italic text-base placeholder:not-italic placeholder:font-sans placeholder:text-sm"
              />
              <p className="text-[10px] text-white/30 text-center">
                Esta firma electronica tiene validez legal
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSignDialogOpen(false);
                setSignConsent(false);
                setSignName("");
              }}
              className="border-white/10 text-white/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSign}
              disabled={!signConsent || signName.trim().length === 0 || isSigning}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2 disabled:opacity-40"
            >
              {isSigning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sellando...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Confirmar y Sellar Documento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog (ADMIN/DOCENTE/PRECEPTOR) */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[560px] bg-[#131319] border-white/10 p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Megaphone className="size-5 text-[#d0bcff]" />
              Redactar Circular
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Crea un nuevo comunicado institucional o de comunicacion interna
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">

            {/* ── Selector de Tipo de Audiencia ─────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Dirigido a
              </Label>
              <RadioGroup
                value={audienceTarget}
                onValueChange={(v) => {
                  setAudienceTarget(v as AudienceTarget);
                  // Resetear sub-selecciones al cambiar de canal
                  setComposeAudience("");
                  setSelectedStudents([]);
                  setSelectedStaffRoles([]);
                  setAudienceMode("full");
                }}
                className="grid grid-cols-2 gap-3"
              >
                {/* Opcion: Comunidad Educativa */}
                <Label
                  htmlFor="target-comunidad"
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                    audienceTarget === "COMUNIDAD"
                      ? "border-[#d0bcff]/60 bg-[#d0bcff]/8"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                  )}
                >
                  <RadioGroupItem value="COMUNIDAD" id="target-comunidad" className="sr-only" />
                  <div className={cn(
                    "size-9 rounded-xl flex items-center justify-center border",
                    audienceTarget === "COMUNIDAD"
                      ? "bg-[#d0bcff]/15 border-[#d0bcff]/30"
                      : "bg-white/5 border-white/10"
                  )}>
                    <Home className={cn("size-5", audienceTarget === "COMUNIDAD" ? "text-[#d0bcff]" : "text-white/40")} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      audienceTarget === "COMUNIDAD" ? "text-[#e4e1ea]" : "text-white/60"
                    )}>
                      Comunidad Educativa
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                      Alumnos y familias
                    </p>
                  </div>
                  {audienceTarget === "COMUNIDAD" && (
                    <span className="absolute top-3 right-3 size-2 rounded-full bg-[#d0bcff]" />
                  )}
                </Label>

                {/* Opcion: Personal Interno */}
                <Label
                  htmlFor="target-personal"
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                    audienceTarget === "PERSONAL"
                      ? "border-emerald-500/60 bg-emerald-500/8"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                  )}
                >
                  <RadioGroupItem value="PERSONAL" id="target-personal" className="sr-only" />
                  <div className={cn(
                    "size-9 rounded-xl flex items-center justify-center border",
                    audienceTarget === "PERSONAL"
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  )}>
                    <UserCheck className={cn("size-5", audienceTarget === "PERSONAL" ? "text-emerald-400" : "text-white/40")} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      audienceTarget === "PERSONAL" ? "text-[#e4e1ea]" : "text-white/60"
                    )}>
                      Personal Interno
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                      Staff de la institucion
                    </p>
                  </div>
                  {audienceTarget === "PERSONAL" && (
                    <span className="absolute top-3 right-3 size-2 rounded-full bg-emerald-400" />
                  )}
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">Titulo</Label>
              <Input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="Ej: Suspension de clases por jornada docente"
                className="bg-white/[0.02] border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">Tipo</Label>
              <Select value={composeType} onValueChange={setComposeType}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {TAG_OPTIONS.map((tag) => (
                    <SelectItem key={tag.value} value={tag.value}>
                      <div className="flex items-center gap-2">
                        <tag.icon className="size-4" />
                        {tag.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Destinatarios: renderizado condicional segun audienceTarget ── */}

            {/* COMUNIDAD: Motor de Audiencia (Curso Completo / Seleccion Personalizada) */}
            {audienceTarget === "COMUNIDAD" && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <Label className="text-xs uppercase tracking-wider text-white/50">Motor de Audiencia</Label>
              <RadioGroup
                value={audienceMode}
                onValueChange={(v) => setAudienceMode(v as "full" | "custom")}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="audience-full"
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors",
                    audienceMode === "full"
                      ? "border-[#d0bcff]/50 bg-[#d0bcff]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <RadioGroupItem value="full" id="audience-full" className="border-white/30 text-[#d0bcff]" />
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="size-4 text-[#d0bcff] shrink-0" />
                    <span className="text-sm font-medium text-[#e4e1ea] truncate">Curso Completo</span>
                  </div>
                </Label>
                <Label
                  htmlFor="audience-custom"
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors",
                    audienceMode === "custom"
                      ? "border-[#d0bcff]/50 bg-[#d0bcff]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <RadioGroupItem value="custom" id="audience-custom" className="border-white/30 text-[#d0bcff]" />
                  <div className="flex items-center gap-2 min-w-0">
                    <UserPlus className="size-4 text-[#d0bcff] shrink-0" />
                    <span className="text-sm font-medium text-[#e4e1ea] truncate">Seleccion Personalizada</span>
                  </div>
                </Label>
              </RadioGroup>

              {/* Opcion A: Curso Completo — opciones aisladas por nivel */}
              {audienceMode === "full" && (
                <div className="space-y-2">
                  {/* Label dinámico según nivel */}
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                    {levelUnitLabel} disponibles
                  </p>
                  <Select value={composeAudience} onValueChange={setComposeAudience}>
                    <SelectTrigger className="bg-white/[0.02] border-white/10">
                      <SelectValue placeholder={`Seleccionar ${levelUnitSingular}...`} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {levelAudienceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Toggle exclusivo SECUNDARIO: mensaje directo a los alumnos */}
                  {showStudentToggle && (
                    <label className="flex items-center justify-between gap-3 mt-2 px-3 py-2.5 rounded-xl bg-purple-500/[0.05] border border-purple-500/20 cursor-pointer">
                      <div>
                        <p className="text-xs font-medium text-[#e4e1ea]">
                          Enviar mensaje directo a los alumnos
                        </p>
                        <p className="text-[11px] text-white/40">
                          Ademas de las familias, los propios alumnos recibirán el comunicado
                        </p>
                      </div>
                      <Switch
                        checked={sendDirectToStudents}
                        onCheckedChange={setSendDirectToStudents}
                        className="shrink-0 data-[state=checked]:bg-purple-500"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Opcion B: Seleccion Personalizada (cross-course) */}
              {audienceMode === "custom" && (
                <div className="space-y-3">
                  {/* Chips de alumnos seleccionados */}
                  {selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedStudents.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#d0bcff]/15 border border-[#d0bcff]/30 text-xs text-[#e4e1ea]"
                        >
                          {s.name}
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-white/15 text-white/50">
                            {s.course}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => toggleStudent(s)}
                            className="rounded-full p-0.5 text-white/50 hover:text-white hover:bg-white/10"
                            aria-label={`Quitar ${s.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Buscador de alumnos */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Buscar alumno..."
                      className="pl-9 bg-white/[0.02] border-white/10"
                    />
                  </div>

                  {/* Lista de resultados (multi-seleccion) */}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-white/5 divide-y divide-white/5">
                    {MOCK_STUDENT_DIRECTORY
                      .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                      .map((s) => {
                        const checked = selectedStudents.some((sel) => sel.id === s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(s)}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn(
                                "flex items-center justify-center size-4 rounded border shrink-0",
                                checked ? "bg-[#d0bcff] border-[#d0bcff]" : "border-white/20"
                              )}>
                                {checked && <Check className="size-3 text-[#1b1b1f]" />}
                              </span>
                              <span className="text-sm text-[#e4e1ea] truncate">{s.name}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 shrink-0">
                              {s.course}
                            </Badge>
                          </button>
                        );
                      })}
                    {MOCK_STUDENT_DIRECTORY.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-4 text-center text-xs text-white/30">Sin resultados para &quot;{studentSearch}&quot;</p>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    {selectedStudents.length} alumno(s) seleccionados (podes mezclar distintos cursos).
                  </p>
                </div>
              )}
            </div>
            )} {/* end COMUNIDAD */}

            {/* PERSONAL: Selector de roles del staff */}
            {audienceTarget === "PERSONAL" && (
              <div className="space-y-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-white/50">
                    Roles destinatarios
                  </Label>
                  {selectedStaffRoles.length > 0 && (
                    <span className="text-[11px] font-mono text-emerald-400">
                      {selectedStaffRoles.includes("TODOS")
                        ? `${STAFF_ROLE_OPTIONS.find(o => o.value === "TODOS")!.count} personas`
                        : `${STAFF_ROLE_OPTIONS
                            .filter(o => selectedStaffRoles.includes(o.value))
                            .reduce((sum, o) => sum + o.count, 0)} personas`
                      }
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STAFF_ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedStaffRoles.includes(opt.value);
                    const isDisabled = opt.value !== "TODOS" && selectedStaffRoles.includes("TODOS");
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleStaffRole(opt.value)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : isDisabled
                            ? "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
                            : "border-white/8 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        )}
                      >
                        {/* Checkbox visual */}
                        <span className={cn(
                          "shrink-0 size-4 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-transparent border-white/25"
                        )}>
                          {isSelected && <Check className="size-2.5 text-white" />}
                        </span>

                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-medium leading-tight",
                            isSelected ? "text-[#e4e1ea]" : "text-white/60"
                          )}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-white/35 mt-0.5">{opt.description}</p>
                        </div>

                        <div className={cn(
                          "ml-auto shrink-0 size-7 rounded-lg flex items-center justify-center border",
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/30"
                            : "bg-white/5 border-white/8"
                        )}>
                          <Icon className={cn("size-3.5", isSelected ? "text-emerald-400" : "text-white/35")} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedStaffRoles.length === 0 && (
                  <p className="text-[11px] text-white/35 text-center py-1">
                    Selecciona al menos un rol para continuar
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">Mensaje</Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Escribe el contenido del comunicado..."
                className="min-h-[150px] bg-white/[0.02] border-white/10 resize-none"
              />
            </div>

            {/* Adjuntar plantilla de salida (PDF/DOCX) */}
            <div className="space-y-2">
              {composeTemplateName ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
                  <FileText className="size-5 text-[#d0bcff] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e4e1ea] truncate">{composeTemplateName}</p>
                    <p className="text-xs text-white/40">Plantilla en blanco adjunta</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setComposeTemplateName(null)}
                    className="text-white/40 hover:text-white hover:bg-white/5 shrink-0"
                    aria-label="Quitar plantilla"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleAttachTemplate}
                  className="w-full justify-start gap-2 text-white/60 hover:text-[#d0bcff] hover:bg-[#d0bcff]/10 border border-dashed border-white/10"
                >
                  <Paperclip className="size-4" />
                  Adjuntar Plantilla (PDF/DOCX)
                </Button>
              )}
            </div>

            {/* Switch: requerir devolucion de documento firmado */}
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="require-signed-return"
                  className="text-sm font-medium text-[#e4e1ea] cursor-pointer"
                >
                  Requerir devolucion de documento firmado
                </Label>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Si se activa, se habilitara un buzon de subida temporal para que las familias
                  devuelvan autorizaciones o planillas completadas vinculadas a este comunicado.
                </p>
              </div>
              <Switch
                id="require-signed-return"
                checked={requireSignedReturn}
                onCheckedChange={setRequireSignedReturn}
                className="mt-0.5 data-[state=checked]:bg-[#d0bcff]"
              />
            </div>
          </div>

          {/* ── INTERRUPTOR DE EMERGENCIA ──────────────────────────────────── */}
          <div className="px-6 pb-2 space-y-2.5">
            {/* Separador con etiqueta de zona crítica */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-red-500/15" />
              <span className="text-[10px] font-semibold tracking-widest uppercase text-red-500/50">
                Zona Critica
              </span>
              <div className="h-px flex-1 bg-red-500/15" />
            </div>

            {/* Switch principal */}
            <div className={cn(
              "flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200",
              isGlobalAlert
                ? "bg-red-500/[0.06] border-red-500/30"
                : "bg-white/[0.02] border-white/5 hover:border-red-500/20"
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "size-4 shrink-0 transition-colors",
                    isGlobalAlert ? "text-red-400" : "text-amber-500/70"
                  )} />
                  <Label
                    htmlFor="global-alert-switch"
                    className={cn(
                      "text-sm font-semibold cursor-pointer transition-colors",
                      isGlobalAlert ? "text-red-300" : "text-[#e4e1ea]"
                    )}
                  >
                    Emitir como Alerta Global Urgente
                  </Label>
                </div>
                <p className="text-xs text-white/40 mt-1 leading-relaxed pl-6">
                  Activa el banner rojo en la pantalla de todos los usuarios del sistema.
                </p>
              </div>
              <Switch
                id="global-alert-switch"
                checked={isGlobalAlert}
                onCheckedChange={setIsGlobalAlert}
                className="mt-0.5 data-[state=checked]:bg-red-500"
              />
            </div>

            {/* Alert destructivo — solo visible cuando el switch está activo */}
            {isGlobalAlert && (
              <Alert className="border-red-500/30 bg-red-500/[0.06] text-red-300 py-3">
                <AlertTriangle className="size-4 text-red-400 shrink-0" />
                <AlertDescription className="text-xs text-red-300/90 leading-relaxed ml-1">
                  <span className="font-semibold text-red-300">Atencion:</span>{" "}
                  Esto mostrara un banner rojo persistente en la pantalla de todos los usuarios activos del sistema.
                  Uselo solo para emergencias.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01] shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsComposeOpen(false)}
              className="border-white/10 text-white/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompose}
              disabled={
                isSubmitting ||
                !composeTitle.trim() ||
                !composeBody.trim() ||
                !composeType ||
                (audienceTarget === "COMUNIDAD"
                  ? (audienceMode === "full" ? !composeAudience : selectedStudents.length === 0)
                  : selectedStaffRoles.length === 0)
              }
              className={cn(
                "gap-2",
                audienceTarget === "PERSONAL"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {audienceTarget === "PERSONAL" ? "Enviar al Personal" : "Enviar Circular"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster theme="dark" />
    </div>
  );
}
