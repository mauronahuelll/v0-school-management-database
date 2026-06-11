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
  Lock,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  { value: "all", label: "Toda la escuela" },
  { value: "1-year", label: "1er Ano" },
  { value: "2-year", label: "2do Ano" },
  { value: "3-year", label: "3er Ano" },
  { value: "4-year", label: "4to Ano" },
  { value: "5-year", label: "5to Ano" },
  { value: "6-year", label: "6to Ano" },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sign dialog state
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signPin, setSignPin] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const currentRole = activeContext?.role || null;
  const isReceiver = currentRole === "FAMILIA";
  const isSender = currentRole === "ADMIN" || currentRole === "DOCENTE" || currentRole === "PRECEPTOR";

  const communications = useMemo(() => {
    return isReceiver ? MOCK_FAMILIA_COMMUNICATIONS : MOCK_SENDER_COMMUNICATIONS;
  }, [isReceiver]);

  const selectedCommunication = useMemo(() => {
    return communications.find(c => c.id === selectedId) || null;
  }, [communications, selectedId]);

  useEffect(() => {
    setMounted(true);
    if (communications.length > 0) {
      setSelectedId(communications[0].id);
    }
  }, [communications]);

  const handleSelectCommunication = useCallback((id: string) => {
    setSelectedId(id);
    setShowMobileDetail(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileDetail(false);
  }, []);

  const handleSign = useCallback(async () => {
    if (signPin.length !== 4) {
      toast.error("El PIN debe tener 4 digitos");
      return;
    }
    
    setIsSigning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSigning(false);
    setIsSignDialogOpen(false);
    setSignPin("");
    
    toast.success("Notificacion firmada correctamente", {
      description: "El comunicado ha sido notificado legalmente.",
    });
  }, [signPin]);

  const handleCompose = useCallback(async () => {
    if (!composeTitle.trim() || !composeBody.trim() || !composeType || !composeAudience) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsComposeOpen(false);
    setComposeTitle("");
    setComposeBody("");
    setComposeType("");
    setComposeAudience("");
    
    toast.success("Circular enviada exitosamente", {
      description: `El comunicado fue enviado a ${AUDIENCE_OPTIONS.find(a => a.value === composeAudience)?.label || "los destinatarios"}.`,
    });
  }, [composeTitle, composeBody, composeType, composeAudience]);

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
        
        {isSender && (
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
          >
            <PenSquare className="size-4" />
            Redactar Circular
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
                {/* FAMILIA View - Sign Button */}
                {isReceiver && selectedCommunication.status !== "FIRMADO" && (
                  <Button
                    onClick={() => setIsSignDialogOpen(true)}
                    className="w-full h-12 bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2 font-bold"
                  >
                    <Shield className="size-5" />
                    Firmar Notificacion
                  </Button>
                )}
                
                {isReceiver && selectedCommunication.status === "FIRMADO" && (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20">
                    <CheckCheck className="size-5 text-[#4de082]" />
                    <span className="text-sm font-medium text-[#4de082]">
                      Firmado el {selectedCommunication.signedAt}
                    </span>
                  </div>
                )}

                {/* ADMIN/DOCENTE/PRECEPTOR View - Signature Status */}
                {isSender && selectedCommunication.totalRecipients && (
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

      {/* Sign Dialog (FAMILIA) */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#131319] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Lock className="size-5 text-[#d0bcff]" />
              Firma Digital
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Ingresa tu PIN de 4 digitos para confirmar la recepcion del comunicado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Label className="text-xs uppercase tracking-wider text-white/50 mb-3 block">
              PIN de Firma
            </Label>
            <Input
              type="password"
              maxLength={4}
              value={signPin}
              onChange={(e) => setSignPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
              className="h-14 text-center text-2xl tracking-[0.5em] bg-white/[0.02] border-white/10 font-mono"
            />
            <p className="text-[10px] text-white/30 text-center mt-2">
              Este PIN actua como firma digital con validez legal
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSignDialogOpen(false);
                setSignPin("");
              }}
              className="border-white/10 text-white/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSign}
              disabled={signPin.length !== 4 || isSigning}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isSigning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <CheckCheck className="size-4" />
                  Firmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog (ADMIN/DOCENTE/PRECEPTOR) */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[560px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Megaphone className="size-5 text-[#d0bcff]" />
              Redactar Circular
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Crea un nuevo comunicado para enviar a las familias
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">Titulo</Label>
              <Input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="Ej: Suspension de clases por jornada docente"
                className="bg-white/[0.02] border-white/10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
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
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-white/50">Audiencia</Label>
                <Select value={composeAudience} onValueChange={setComposeAudience}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">Mensaje</Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Escribe el contenido del comunicado..."
                className="min-h-[150px] bg-white/[0.02] border-white/10 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button
              variant="outline"
              onClick={() => setIsComposeOpen(false)}
              className="border-white/10 text-white/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompose}
              disabled={isSubmitting || !composeTitle.trim() || !composeBody.trim() || !composeType || !composeAudience}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Enviar Circular
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
