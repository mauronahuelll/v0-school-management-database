"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Plus,
  Check,
  Edit2,
  PhoneCall,
  UserMinus,
  UserPlus,
  Loader2,
  Send,
  Key,
  CreditCard,
  Clock,
  MoreVertical,
  ShieldX,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// User role type
type UserRole = "ADMIN" | "SECRETARIA" | "DOCENTE" | "PRECEPTOR" | "FAMILIA";

// Types
interface FamilyContact {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  email?: string;
  dni?: string;
  hasAccount: boolean;
  // Estado de acceso al portal familiar
  inviteStatus?: "ACTIVE" | "PENDING";
  isPrimaryTutor: boolean;
  roles: ("TUTOR_LEGAL" | "AUTORIZADO_RETIRO" | "EMERGENCIA" | "RESTRINGIDO")[];
  restrictionDetails?: string;
  restrictionDate?: string;
  photoUrl?: string;
}

interface StudentFamilyNetworkProps {
  studentId?: string;
  studentName: string;
  userRole?: UserRole;
  canEdit?: boolean;
}

// Mock data
const MOCK_CONTACTS: FamilyContact[] = [
  {
    id: "c1",
    fullName: "Maria Eugenia Rodriguez",
    relationship: "Madre",
    phone: "+54 11 4567-8901",
    email: "maria.rodriguez@email.com",
    dni: "28.456.789",
    hasAccount: true,
    inviteStatus: "ACTIVE",
    isPrimaryTutor: true,
    roles: ["TUTOR_LEGAL", "AUTORIZADO_RETIRO", "EMERGENCIA"],
  },
  {
    id: "c5",
    fullName: "Diego Hernan Fernandez",
    relationship: "Padre",
    phone: "+54 11 4321-7654",
    email: "diego.fernandez@email.com",
    dni: "27.987.123",
    hasAccount: false,
    inviteStatus: "PENDING",
    isPrimaryTutor: true,
    roles: ["TUTOR_LEGAL", "AUTORIZADO_RETIRO"],
  },
  {
    id: "c2",
    fullName: "Carlos Alberto Martinez",
    relationship: "Padre",
    phone: "+54 11 5678-9012",
    email: "carlos.martinez@email.com",
    dni: "27.123.456",
    hasAccount: false,
    isPrimaryTutor: false,
    roles: ["RESTRINGIDO"],
    restrictionDetails: "Restriccion perimetral por Juzgado de Familia N5 - Expediente 2024-1234",
    restrictionDate: "15/03/2024",
  },
  {
    id: "c3",
    fullName: "Rosa Beatriz Gomez",
    relationship: "Abuela Materna",
    phone: "+54 11 6789-0123",
    hasAccount: false,
    isPrimaryTutor: false,
    roles: ["AUTORIZADO_RETIRO", "EMERGENCIA"],
  },
  {
    id: "c4",
    fullName: "Juan Pablo Rodriguez",
    relationship: "Tio",
    phone: "+54 11 7890-1234",
    email: "jp.rodriguez@email.com",
    hasAccount: false,
    isPrimaryTutor: false,
    roles: ["EMERGENCIA"],
  },
];

const ROLE_CONFIG = {
  TUTOR_LEGAL: {
    label: "Tutor Legal",
    color: "bg-[#d0bcff]/20 text-[#d0bcff] border-[#d0bcff]/30",
    icon: ShieldCheck,
  },
  AUTORIZADO_RETIRO: {
    label: "Autorizado Retiro",
    color: "bg-[#4de082]/20 text-[#4de082] border-[#4de082]/30",
    icon: UserCheck,
  },
  EMERGENCIA: {
    label: "Contacto Emergencia",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: PhoneCall,
  },
  RESTRINGIDO: {
    label: "Restriccion Legal",
    color: "bg-red-500/20 text-red-400 border-red-500/50",
    icon: ShieldAlert,
  },
};

export function StudentFamilyNetwork({ studentId, studentName, userRole = "DOCENTE", canEdit = false }: StudentFamilyNetworkProps) {
  const [contacts, setContacts] = useState<FamilyContact[]>(MOCK_CONTACTS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<FamilyContact | null>(null);

  // "Vincular Nuevo Contacto" ghost card dialog
  const [isLinkContactOpen, setIsLinkContactOpen] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ name: "", relationship: "", phone: "", dni: "" });

  const handleLinkContact = async () => {
    if (!linkForm.name || !linkForm.relationship || !linkForm.phone) return;
    setIsSavingLink(true);
    await new Promise((r) => setTimeout(r, 900));
    const newContact: FamilyContact = {
      id: `lc-${Date.now()}`,
      fullName: linkForm.name,
      relationship: linkForm.relationship,
      phone: linkForm.phone,
      dni: linkForm.dni || undefined,
      hasAccount: false,
      isPrimaryTutor: false,
      roles: ["AUTORIZADO_RETIRO"],
    };
    setContacts((prev) => [...prev, newContact]);
    setIsSavingLink(false);
    setIsLinkContactOpen(false);
    setLinkForm({ name: "", relationship: "", phone: "", dni: "" });
    toast.success("Contacto vinculado correctamente", {
      description: `${linkForm.name} fue agregado a la red familiar.`,
    });
  };
  
  // Account creation dialog state
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    relationship: "",
    email: "",
    isPrimaryTutor: false,
  });
  
  // Check if user can create accounts (ADMIN or SECRETARIA)
  const canCreateAccounts = userRole === "ADMIN" || userRole === "SECRETARIA";
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    relationship: "",
    phone: "",
    email: "",
    isTutorLegal: false,
    isAutorizadoRetiro: false,
    isEmergencia: false,
    isRestringido: false,
    restrictionDetails: "",
  });

  const handleOpenSheet = (contact?: FamilyContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        fullName: contact.fullName,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email || "",
        isTutorLegal: contact.roles.includes("TUTOR_LEGAL"),
        isAutorizadoRetiro: contact.roles.includes("AUTORIZADO_RETIRO"),
        isEmergencia: contact.roles.includes("EMERGENCIA"),
        isRestringido: contact.roles.includes("RESTRINGIDO"),
        restrictionDetails: contact.restrictionDetails || "",
      });
    } else {
      setEditingContact(null);
      setFormData({
        fullName: "",
        relationship: "",
        phone: "",
        email: "",
        isTutorLegal: false,
        isAutorizadoRetiro: false,
        isEmergencia: false,
        isRestringido: false,
        restrictionDetails: "",
      });
    }
    setIsSheetOpen(true);
  };

  const handleSaveContact = () => {
    const roles: FamilyContact["roles"] = [];
    if (formData.isTutorLegal) roles.push("TUTOR_LEGAL");
    if (formData.isAutorizadoRetiro) roles.push("AUTORIZADO_RETIRO");
    if (formData.isEmergencia) roles.push("EMERGENCIA");
    if (formData.isRestringido) roles.push("RESTRINGIDO");

    if (editingContact) {
      setContacts(prev => prev.map(c => 
        c.id === editingContact.id 
          ? { 
              ...c, 
              ...formData, 
              roles,
              restrictionDetails: formData.isRestringido ? formData.restrictionDetails : undefined,
              restrictionDate: formData.isRestringido ? new Date().toLocaleDateString("es-AR") : undefined,
            }
          : c
      ));
      toast.success("Contacto actualizado correctamente");
    } else {
      const newContact: FamilyContact = {
        id: `c${Date.now()}`,
        fullName: formData.fullName,
        relationship: formData.relationship,
        phone: formData.phone,
        email: formData.email || undefined,
        hasAccount: false,
        isPrimaryTutor: false,
        roles,
        restrictionDetails: formData.isRestringido ? formData.restrictionDetails : undefined,
        restrictionDate: formData.isRestringido ? new Date().toLocaleDateString("es-AR") : undefined,
      };
      setContacts(prev => [...prev, newContact]);
      toast.success("Contacto agregado a la red familiar");
    }
    
    setIsSheetOpen(false);
  };

  // Handle account creation
  const handleCreateFamilyAccount = async () => {
    if (!accountFormData.firstName || !accountFormData.lastName || !accountFormData.dni || !accountFormData.relationship || !accountFormData.email) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setIsCreatingAccount(true);
    
    // Simulate API call / webhook
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create new contact with account
    const newContact: FamilyContact = {
      id: `family-${Date.now()}`,
      fullName: `${accountFormData.firstName} ${accountFormData.lastName}`,
      relationship: accountFormData.relationship,
      phone: "",
      email: accountFormData.email,
      dni: accountFormData.dni,
      hasAccount: true,
      inviteStatus: "PENDING",
      isPrimaryTutor: accountFormData.isPrimaryTutor,
      roles: accountFormData.isPrimaryTutor ? ["TUTOR_LEGAL", "AUTORIZADO_RETIRO"] : ["AUTORIZADO_RETIRO"],
    };
    
    setContacts(prev => [...prev, newContact]);
    setIsCreatingAccount(false);
    setIsAccountDialogOpen(false);
    
    // Reset form
    setAccountFormData({
      firstName: "",
      lastName: "",
      dni: "",
      relationship: "",
      email: "",
      isPrimaryTutor: false,
    });
    
    toast.success("Cuenta familiar creada. Se ha enviado el enlace de vinculacion al estudiante.", {
      description: `Credenciales enviadas a ${accountFormData.email}`,
      duration: 5000,
    });
  };

  // Reenviar invitacion de acceso al portal familiar
  const handleResendInvite = (contact: FamilyContact) => {
    toast.success("Invitacion reenviada", {
      description: `Se ha vuelto a enviar el enlace de acceso a ${contact.email ?? contact.fullName}.`,
    });
  };

  // Revocar acceso al portal familiar (cambio de responsable legal)
  const handleRevokeAccess = (contact: FamilyContact) => {
    setContacts(prev =>
      prev.map(c =>
        c.id === contact.id
          ? { ...c, hasAccount: false, inviteStatus: undefined }
          : c
      )
    );
    toast.success("Acceso revocado", {
      description: `${contact.fullName} ya no tiene acceso al portal familiar.`,
    });
  };

  // Separate restricted contacts
  const restrictedContacts = contacts.filter(c => c.roles.includes("RESTRINGIDO"));
  const safeContacts = contacts.filter(c => !c.roles.includes("RESTRINGIDO"));

  // Tutores principales destacados (maximo 2)
  const primaryTutors = safeContacts.filter(c => c.isPrimaryTutor);
  const otherContacts = safeContacts.filter(c => !c.isPrimaryTutor);
  const PRIMARY_TUTOR_LIMIT = 2;
  const hasReachedTutorLimit = primaryTutors.length >= PRIMARY_TUTOR_LIMIT;

  return (
    <div className="space-y-6">
      {/* Banner de seguridad institucional */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="h-4 w-4 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-400 leading-relaxed">
          <span className="font-semibold">Informacion:</span> Para desvincular o eliminar a un contacto autorizado existente, debe comunicarse con la Secretaria de la institucion por protocolos de seguridad infantil.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Red Familiar y Contactos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion de tutores, autorizados y restricciones de {studentName}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Account Creation Button - Only for ADMIN/SECRETARIA */}
          {canCreateAccounts && (
            <Button 
              onClick={() => setIsAccountDialogOpen(true)}
              disabled={hasReachedTutorLimit}
              className="bg-[#4de082] text-[#0a1f0d] hover:bg-[#4de082]/90 gap-2 disabled:opacity-40"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Vincular Nuevo Familiar / Tutor</span>
              <span className="sm:hidden">Vincular</span>
            </Button>
          )}
          
          {canEdit && (
            <Button 
              onClick={() => handleOpenSheet()}
              variant="outline"
              className="border-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Anadir Contacto
            </Button>
          )}
        </div>
      </div>

      {/* Alert for restrictions */}
      {restrictedContacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/50 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h4 className="font-semibold text-red-400 text-sm">
                Alerta de Restricciones Activas
              </h4>
              <p className="text-xs text-red-300/80 mt-1">
                Este alumno tiene {restrictedContacts.length} persona(s) con restricción legal vigente. 
                Verificar identidad antes de cualquier entrega o comunicación.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Restricted Contacts Section */}
      {restrictedContacts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Personas con Restricción Legal
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            {restrictedContacts.map((contact) => (
              <RestrictedContactCard 
                key={contact.id} 
                contact={contact} 
                onEdit={canEdit ? () => handleOpenSheet(contact) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Primary Tutors Grid - Highlighted (max 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#d0bcff]" />
            Tutores Principales
          </h4>
          <span className="text-[10px] font-mono text-white/40">
            {primaryTutors.length}/{PRIMARY_TUTOR_LIMIT} vinculados
          </span>
        </div>

        {primaryTutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {primaryTutors.map((contact) => (
              <ActiveTutorCard
                key={contact.id}
                contact={contact}
                canManage={canCreateAccounts}
                onEdit={canEdit ? () => handleOpenSheet(contact) : undefined}
                onResend={() => handleResendInvite(contact)}
                onRevoke={() => handleRevokeAccess(contact)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground p-4 rounded-xl bg-white/[0.02]">
            No hay tutores principales vinculados todavia.
          </p>
        )}

        {/* Limit reached notice */}
        {canCreateAccounts && hasReachedTutorLimit && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Se alcanzo el limite de {PRIMARY_TUTOR_LIMIT} tutores principales. Para vincular un nuevo
              responsable legal, primero debes revocar el acceso de uno de los tutores existentes.
            </p>
          </div>
        )}
      </div>

      {/* Other Authorized Contacts */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Otros Contactos Autorizados
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={canEdit ? () => handleOpenSheet(contact) : undefined}
              isFamilia={userRole === "FAMILIA"}
            />
          ))}

          {/* Ghost card — Vincular Nuevo Contacto (visible para todos, también para FAMILIA) */}
          <motion.button
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsLinkContactOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 min-h-[100px] rounded-xl",
              "border border-dashed border-white/20 hover:border-[#8A2BE2]/50",
              "bg-transparent hover:bg-white/5 cursor-pointer transition-all duration-200",
              "text-white/30 hover:text-[#D0BCFF]/80"
            )}
          >
            <div className="p-2 rounded-full border border-dashed border-current transition-colors">
              <UserPlus className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold">+ Vincular Nuevo Contacto</span>
          </motion.button>
        </div>
      </div>

      {/* Dialog — Vincular Nuevo Contacto (Dark Glassmorphism) */}
      <Dialog open={isLinkContactOpen} onOpenChange={setIsLinkContactOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#131319] border border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea] text-base">
              <div className="p-1.5 rounded-lg bg-[#8A2BE2]/15 border border-[#8A2BE2]/25">
                <UserPlus className="h-4 w-4 text-[#D0BCFF]" />
              </div>
              Vincular Nuevo Contacto
            </DialogTitle>
            <DialogDescription className="text-white/40 text-sm">
              Completa los datos para agregar un contacto autorizado a la red familiar.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-[#e4e1ea]">Nombre Completo <span className="text-[#D0BCFF]">*</span></Label>
              <Input
                value={linkForm.name}
                onChange={(e) => setLinkForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre y Apellido"
                className="bg-white/[0.02] border-white/10 text-[#e4e1ea] placeholder:text-white/25"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#e4e1ea]">Vinculo / Parentesco <span className="text-[#D0BCFF]">*</span></Label>
              <Select value={linkForm.relationship} onValueChange={(v) => setLinkForm((p) => ({ ...p, relationship: v }))}>
                <SelectTrigger className="bg-white/[0.02] border-white/10 text-[#e4e1ea]">
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="Madre">Madre</SelectItem>
                  <SelectItem value="Padre">Padre</SelectItem>
                  <SelectItem value="Abuela Materna">Abuela Materna</SelectItem>
                  <SelectItem value="Abuelo Materno">Abuelo Materno</SelectItem>
                  <SelectItem value="Abuela Paterna">Abuela Paterna</SelectItem>
                  <SelectItem value="Abuelo Paterno">Abuelo Paterno</SelectItem>
                  <SelectItem value="Tio/a">Tio/a</SelectItem>
                  <SelectItem value="Hermano/a Mayor">Hermano/a Mayor</SelectItem>
                  <SelectItem value="Tutor Legal">Tutor Legal</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#e4e1ea]">Telefono <span className="text-[#D0BCFF]">*</span></Label>
              <Input
                value={linkForm.phone}
                onChange={(e) => setLinkForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+54 11 1234-5678"
                className="bg-white/[0.02] border-white/10 text-[#e4e1ea] placeholder:text-white/25"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#e4e1ea]">DNI <span className="text-white/30">(opcional)</span></Label>
              <Input
                value={linkForm.dni}
                onChange={(e) => setLinkForm((p) => ({ ...p, dni: e.target.value }))}
                placeholder="Ej: 30.456.789"
                className="bg-white/[0.02] border-white/10 text-[#e4e1ea] placeholder:text-white/25"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01] gap-2">
            <Button
              variant="outline"
              onClick={() => setIsLinkContactOpen(false)}
              className="border-white/10 text-white/60 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLinkContact}
              disabled={isSavingLink || !linkForm.name || !linkForm.relationship || !linkForm.phone}
              className="bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black font-bold hover:opacity-90 gap-2 disabled:opacity-40"
            >
              {isSavingLink ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Vincular Contacto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Leyenda de Roles
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <Badge 
              key={key} 
              variant="outline" 
              className={cn("text-[10px]", config.color)}
            >
              <config.icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Edit/Add Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-[#131319] border-white/10 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {editingContact ? "Editar Contacto" : "Añadir Contacto"}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {editingContact 
                ? "Modifica los datos y permisos del contacto" 
                : "Agrega un nuevo contacto a la red familiar"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Nombre Completo</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nombre y Apellido"
                  className="bg-white/[0.02] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Parentesco</Label>
                <Select 
                  value={formData.relationship}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, relationship: v }))}
                >
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Madre">Madre</SelectItem>
                    <SelectItem value="Padre">Padre</SelectItem>
                    <SelectItem value="Abuela Materna">Abuela Materna</SelectItem>
                    <SelectItem value="Abuelo Materno">Abuelo Materno</SelectItem>
                    <SelectItem value="Abuela Paterna">Abuela Paterna</SelectItem>
                    <SelectItem value="Abuelo Paterno">Abuelo Paterno</SelectItem>
                    <SelectItem value="Tio/a">Tío/a</SelectItem>
                    <SelectItem value="Hermano/a Mayor">Hermano/a Mayor</SelectItem>
                    <SelectItem value="Tutor Legal">Tutor Legal</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+54 11 1234-5678"
                  className="bg-white/[0.02] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Email (Opcional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  className="bg-white/[0.02] border-white/10"
                />
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-foreground">Permisos y Roles</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#d0bcff]/5 border border-[#d0bcff]/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#d0bcff]" />
                    <span className="text-sm text-foreground">Tutor Legal / Responsable</span>
                  </div>
                  <Switch
                    checked={formData.isTutorLegal}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isTutorLegal: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#4de082]/5 border border-[#4de082]/20">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#4de082]" />
                    <span className="text-sm text-foreground">Autorizado para Retiro</span>
                  </div>
                  <Switch
                    checked={formData.isAutorizadoRetiro}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isAutorizadoRetiro: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-foreground">Contacto de Emergencia</span>
                  </div>
                  <Switch
                    checked={formData.isEmergencia}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isEmergencia: v }))}
                  />
                </div>
              </div>
            </div>

            {/* Restriction Section - Critical */}
            <div className="space-y-4 pt-4 border-t border-red-500/30">
              <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Restricción Legal (Crítico)
              </h4>
              
              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                formData.isRestringido 
                  ? "bg-red-500/10 border-red-500/50" 
                  : "bg-white/[0.02] border-white/10"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserMinus className={cn(
                      "h-4 w-4",
                      formData.isRestringido ? "text-red-400" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      formData.isRestringido ? "text-red-400" : "text-foreground"
                    )}>
                      Marcar como Restringido
                    </span>
                  </div>
                  <Switch
                    checked={formData.isRestringido}
                    onCheckedChange={(v) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        isRestringido: v,
                        isAutorizadoRetiro: v ? false : prev.isAutorizadoRetiro,
                      }));
                    }}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                <AnimatePresence>
                  {formData.isRestringido && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-xs text-red-300">
                        Detalle de la Restricción (Juzgado, Expediente)
                      </Label>
                      <Input
                        value={formData.restrictionDetails}
                        onChange={(e) => setFormData(prev => ({ ...prev, restrictionDetails: e.target.value }))}
                        placeholder="Ej: Restricción perimetral - Juzgado Familia N°5"
                        className="bg-red-500/5 border-red-500/30 text-red-200 placeholder:text-red-400/50"
                      />
                      <p className="text-[10px] text-red-400/70">
                        Esta información será visible para todo el personal autorizado.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                className="flex-1 border-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveContact}
                disabled={!formData.fullName || !formData.relationship || !formData.phone}
                className="flex-1 bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
              >
                <Check className="h-4 w-4 mr-2" />
                {editingContact ? "Guardar Cambios" : "Anadir Contacto"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Family Account Creation Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Key className="size-5 text-[#4de082]" />
              Generar Cuenta Familiar
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Crea una cuenta vinculada al legajo del estudiante {studentName}. El tutor recibira credenciales por correo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Datos Filiatorios */}
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Datos Filiatorios
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-[#e4e1ea]">Nombre</Label>
                  <Input
                    value={accountFormData.firstName}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Nombre"
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-[#e4e1ea]">Apellido</Label>
                  <Input
                    value={accountFormData.lastName}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Apellido"
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-[#e4e1ea] flex items-center gap-2">
                  <CreditCard className="size-4 text-white/40" />
                  DNI / Documento
                </Label>
                <Input
                  value={accountFormData.dni}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, dni: e.target.value }))}
                  placeholder="Ej: 28.456.789"
                  className="bg-white/[0.02] border-white/10"
                />
              </div>
            </div>
            
            {/* Parentesco */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Parentesco
              </Label>
              <Select 
                value={accountFormData.relationship}
                onValueChange={(v) => setAccountFormData(prev => ({ ...prev, relationship: v }))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="Madre">Madre</SelectItem>
                  <SelectItem value="Padre">Padre</SelectItem>
                  <SelectItem value="Tutor Legal">Tutor Legal</SelectItem>
                  <SelectItem value="Otro">Otro Familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Credenciales */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Credenciales de Acceso
              </Label>
              <div className="space-y-2">
                <Label className="text-sm text-[#e4e1ea] flex items-center gap-2">
                  <Mail className="size-4 text-white/40" />
                  Correo Electronico
                </Label>
                <Input
                  type="email"
                  value={accountFormData.email}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tutor@email.com"
                  className="bg-white/[0.02] border-white/10"
                />
                <p className="text-[10px] text-white/40">
                  Se enviara un enlace de activacion seguro a este correo.
                </p>
              </div>
            </div>
            
            {/* Tutor Principal Switch */}
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              accountFormData.isPrimaryTutor 
                ? "bg-[#4de082]/10 border-[#4de082]/50" 
                : "bg-white/[0.02] border-white/10"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn(
                    "size-5",
                    accountFormData.isPrimaryTutor ? "text-[#4de082]" : "text-white/40"
                  )} />
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      accountFormData.isPrimaryTutor ? "text-[#4de082]" : "text-[#e4e1ea]"
                    )}>
                      Tutor Principal / Responsable Legal
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Tendra acceso completo a notas, comunicados y autorizaciones
                    </p>
                  </div>
                </div>
                <Switch
                  checked={accountFormData.isPrimaryTutor}
                  onCheckedChange={(v) => setAccountFormData(prev => ({ ...prev, isPrimaryTutor: v }))}
                  className="data-[state=checked]:bg-[#4de082]"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button 
              variant="outline" 
              onClick={() => setIsAccountDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateFamilyAccount}
              disabled={isCreatingAccount || !accountFormData.firstName || !accountFormData.lastName || !accountFormData.dni || !accountFormData.relationship || !accountFormData.email}
              className="bg-[#4de082] text-[#0a1f0d] hover:bg-[#4de082]/90 gap-2"
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Generar Acceso y Notificar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Active/Primary Tutor Card - highlights access status and individual actions
function ActiveTutorCard({
  contact,
  canManage,
  onEdit,
  onResend,
  onRevoke,
}: {
  contact: FamilyContact;
  canManage?: boolean;
  onEdit?: () => void;
  onResend?: () => void;
  onRevoke?: () => void;
}) {
  const isPending = contact.inviteStatus === "PENDING";
  const isActive = contact.inviteStatus === "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-all"
    >
      {/* Header: avatar + name + relationship + status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-full flex items-center justify-center text-sm font-bold bg-[#d0bcff]/15 text-[#d0bcff] shrink-0">
            {contact.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{contact.fullName}</p>
            <p className="text-xs text-muted-foreground">{contact.relationship}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Invitation status badge */}
          {isActive && (
            <Badge variant="outline" className="text-[10px] bg-[#4de082]/15 text-[#4de082] border-[#4de082]/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          )}
          {isPending && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">
              <Clock className="h-3 w-3 mr-1" />
              Invitacion Pendiente
            </Badge>
          )}

          {/* Admin actions dropdown */}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#131319] border-white/10">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="text-foreground focus:bg-white/5">
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Editar datos
                  </DropdownMenuItem>
                )}
                {(isActive || isPending) && onRevoke && (
                  <DropdownMenuItem
                    onClick={onRevoke}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                  >
                    <ShieldX className="h-3.5 w-3.5 mr-2" />
                    Revocar Acceso
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Email */}
      {contact.email && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}

      {/* Resend invitation action for pending tutors */}
      {canManage && isPending && onResend && (
        <Button
          onClick={onResend}
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
        >
          <Send className="h-3 w-3 mr-1.5" />
          Reenviar Invitacion
        </Button>
      )}
    </motion.div>
  );
}

// Contact Card Component
function ContactCard({
  contact,
  onEdit,
  isFamilia = false,
}: {
  contact: FamilyContact;
  onEdit?: () => void;
  isFamilia?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "size-10 rounded-full flex items-center justify-center text-sm font-bold",
            contact.hasAccount 
              ? "bg-[#4de082]/10 text-[#4de082] ring-2 ring-[#4de082]/30" 
              : "bg-primary/10 text-primary"
          )}>
            {contact.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{contact.fullName}</p>
              {contact.hasAccount && (
                <Badge variant="outline" className="text-[9px] bg-[#4de082]/10 text-[#4de082] border-[#4de082]/30">
                  <Key className="h-2.5 w-2.5 mr-1" />
                  Cuenta Activa
                </Badge>
              )}
              {contact.isPrimaryTutor && (
                <Badge variant="outline" className="text-[9px] bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/30">
                  Principal
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{contact.relationship}</p>
          </div>
        </div>
        
        {/* RBAC: FAMILIA no puede editar/eliminar contactos */}
        {onEdit && !isFamilia && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Roles Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {contact.roles.map(role => {
          const config = ROLE_CONFIG[role];
          return (
            <Badge 
              key={role} 
              variant="outline" 
              className={cn("text-[10px]", config.color)}
            >
              <config.icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        })}
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 text-xs">
        {contact.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.dni && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            <span>DNI: {contact.dni}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Restricted Contact Card - High Alert Design
function RestrictedContactCard({ 
  contact, 
  onEdit 
}: { 
  contact: FamilyContact; 
  onEdit?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative p-4 rounded-xl",
        "bg-red-500/10 border-2 border-red-500/50",
        "before:absolute before:inset-0 before:rounded-xl before:bg-red-500/5 before:animate-pulse"
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">{contact.fullName}</p>
              <p className="text-xs text-red-300/70">{contact.relationship}</p>
            </div>
          </div>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Restriction Badge */}
        <Badge 
          variant="outline" 
          className="bg-red-500/20 text-red-400 border-red-500/50 text-[10px] mb-3"
        >
          <ShieldAlert className="h-3 w-3 mr-1" />
          RESTRICCIÓN LEGAL ACTIVA
        </Badge>

        {/* Restriction Details */}
        {contact.restrictionDetails && (
          <div className="p-2 rounded-lg bg-red-950/50 border border-red-500/30 mb-3">
            <p className="text-[10px] text-red-300/90 leading-relaxed">
              {contact.restrictionDetails}
            </p>
            {contact.restrictionDate && (
              <p className="text-[10px] text-red-400/60 mt-1">
                Registrado: {contact.restrictionDate}
              </p>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300/80 leading-relaxed">
            NO ENTREGAR AL ALUMNO. Contactar a Dirección ante cualquier intento de contacto.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
