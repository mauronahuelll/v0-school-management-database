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
  X,
  Check,
  Edit2,
  PhoneCall,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface FamilyContact {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  email?: string;
  roles: ("TUTOR_LEGAL" | "AUTORIZADO_RETIRO" | "EMERGENCIA" | "RESTRINGIDO")[];
  restrictionDetails?: string;
  restrictionDate?: string;
  photoUrl?: string;
}

interface StudentFamilyNetworkProps {
  studentName: string;
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
    roles: ["TUTOR_LEGAL", "AUTORIZADO_RETIRO", "EMERGENCIA"],
  },
  {
    id: "c2",
    fullName: "Carlos Alberto Martinez",
    relationship: "Padre",
    phone: "+54 11 5678-9012",
    email: "carlos.martinez@email.com",
    roles: ["RESTRINGIDO"],
    restrictionDetails: "Restriccion perimetral por Juzgado de Familia N°5 - Expediente 2024-1234",
    restrictionDate: "15/03/2024",
  },
  {
    id: "c3",
    fullName: "Rosa Beatriz Gomez",
    relationship: "Abuela Materna",
    phone: "+54 11 6789-0123",
    roles: ["AUTORIZADO_RETIRO", "EMERGENCIA"],
  },
  {
    id: "c4",
    fullName: "Juan Pablo Rodriguez",
    relationship: "Tio",
    phone: "+54 11 7890-1234",
    email: "jp.rodriguez@email.com",
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

export function StudentFamilyNetwork({ studentName, canEdit = false }: StudentFamilyNetworkProps) {
  const [contacts, setContacts] = useState<FamilyContact[]>(MOCK_CONTACTS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<FamilyContact | null>(null);
  
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
        roles,
        restrictionDetails: formData.isRestringido ? formData.restrictionDetails : undefined,
        restrictionDate: formData.isRestringido ? new Date().toLocaleDateString("es-AR") : undefined,
      };
      setContacts(prev => [...prev, newContact]);
      toast.success("Contacto agregado a la red familiar");
    }
    
    setIsSheetOpen(false);
  };

  // Separate restricted contacts
  const restrictedContacts = contacts.filter(c => c.roles.includes("RESTRINGIDO"));
  const safeContacts = contacts.filter(c => !c.roles.includes("RESTRINGIDO"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Red Familiar y Contactos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de tutores, autorizados y restricciones de {studentName}
          </p>
        </div>
        
        {canEdit && (
          <Button 
            onClick={() => handleOpenSheet()}
            className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Contacto
          </Button>
        )}
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

      {/* Safe Contacts Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tutores y Contactos Autorizados
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {safeContacts.map((contact) => (
            <ContactCard 
              key={contact.id} 
              contact={contact} 
              onEdit={canEdit ? () => handleOpenSheet(contact) : undefined}
            />
          ))}
        </div>
      </div>

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
                {editingContact ? "Guardar Cambios" : "Añadir Contacto"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Contact Card Component
function ContactCard({ 
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
      className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {contact.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{contact.fullName}</p>
            <p className="text-xs text-muted-foreground">{contact.relationship}</p>
          </div>
        </div>
        
        {onEdit && (
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{contact.phone}</span>
        </div>
        {contact.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{contact.email}</span>
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
