"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  UserPlus,
  PenLine,
  CheckCircle2,
  Bus,
  Car,
  Users,
  PersonStanding,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/context/auth-context";

// ============================================================================
// TYPES
// ============================================================================

// Campos delegados que el Admin definio en Configuracion (Datos Complementarios).
// En produccion provendrian del SchoolSettings / config de institucion.
type DelegatedFieldType = "TEXTO" | "NUMERO" | "FECHA" | "TELEFONO" | "EMAIL" | "SELECCION";

interface DelegatedField {
  id: string;
  label: string;
  type: DelegatedFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface AuthorizedPerson {
  id: string;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  relationship: string;
  phone: string;
}

type PickupResponsible = "AUTORIZADOS" | "TRANSPORTE" | "REMIS" | "SOLO";

interface SignatureRecord {
  signed: boolean;
  signedAt?: string;
}

interface StudentComplementaryDataProps {
  studentName: string;
  // Si el rol es FAMILIA puede editar; el resto solo lectura.
  userRole?: string;
}

// Campos definidos por el Admin (mock — espejo de INITIAL_CUSTOM_FIELDS + ejemplos)
const DELEGATED_FIELDS: DelegatedField[] = [
  { id: "cf_obra_social", label: "Obra Social", type: "TEXTO", required: true, placeholder: "Ej: OSDE, Swiss Medical..." },
  { id: "cf_nro_afiliado", label: "Numero de Afiliado", type: "TEXTO", required: false, placeholder: "Ej: 123456/01" },
  {
    id: "cf_grupo_sanguineo",
    label: "Grupo Sanguineo",
    type: "SELECCION",
    required: false,
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
  },
  { id: "cf_alergias", label: "Alergias / Condiciones Medicas", type: "TEXTO", required: false, placeholder: "Ej: Penicilina, alimentarias..." },
  { id: "cf_medico_cabecera", label: "Medico de Cabecera", type: "TELEFONO", required: false, placeholder: "Ej: +54 11 ..." },
  { id: "cf_contacto_emergencia", label: "Contacto de Emergencia", type: "TELEFONO", required: true, placeholder: "Nombre y telefono ante urgencias" },
];

const PICKUP_OPTIONS: { value: PickupResponsible; label: string; description: string; icon: typeof Bus }[] = [
  { value: "AUTORIZADOS", label: "Padres / Autorizados", description: "Retiran las personas registradas en este legajo", icon: Users },
  { value: "TRANSPORTE", label: "Transporte Escolar", description: "Servicio de transporte contratado por la familia", icon: Bus },
  { value: "REMIS", label: "Remis", description: "Servicio de remis autorizado por la familia", icon: Car },
  { value: "SOLO", label: "Se retira solo", description: "El alumno tiene autorizacion para retirarse sin acompanante", icon: PersonStanding },
];

const DOC_TYPES = ["DNI", "LC", "LE", "CI", "Pasaporte"];

// ============================================================================
// COMPONENT
// ============================================================================

export function StudentComplementaryData({ studentName, userRole }: StudentComplementaryDataProps) {
  // Fuente de verdad única: activeContext.role (no la prop userRole que puede estar desactualizada)
  const { activeContext } = useAuth();
  const liveRole = activeContext?.role;

  // RBAC invertido: FAMILIA edita (responsabilidad legal); Staff institucional solo lectura
  const isFamily = liveRole === "FAMILIA";
  const isStaff  = liveRole === "ADMIN" || liveRole === "DOCENTE" || liveRole === "PRECEPTOR";

  // Firma digital (E-Signature estilo DocuSign)
  const [signature, setSignature] = useState<SignatureRecord>({ signed: false });
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const canSubmitSignature = consentAccepted && signatureName.trim().length > 0;

  // canEdit: true solo para FAMILIA mientras el documento no esté firmado.
  // Staff siempre tiene canEdit=false (solo lectura, permisos invertidos).
  const canEdit = isFamily && !signature.signed;

  // Estado de campos delegados
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    cf_obra_social: "",
    cf_grupo_sanguineo: "",
  });

  // Autorizacion de retiro
  const [pickupResponsible, setPickupResponsible] = useState<PickupResponsible>("AUTORIZADOS");
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([]);
  const [draftPerson, setDraftPerson] = useState<Omit<AuthorizedPerson, "id">>({
    firstName: "",
    lastName: "",
    docType: "DNI",
    docNumber: "",
    relationship: "",
    phone: "",
  });

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleAddPerson = useCallback(() => {
    if (!draftPerson.firstName.trim() || !draftPerson.lastName.trim() || !draftPerson.docNumber.trim()) {
      toast.error("Completa al menos Nombre, Apellido y Nro de documento.");
      return;
    }
    setAuthorizedPersons((prev) => [...prev, { ...draftPerson, id: `ap_${Date.now()}` }]);
    setDraftPerson({ firstName: "", lastName: "", docType: "DNI", docNumber: "", relationship: "", phone: "" });
    toast.success("Persona autorizada agregada.");
  }, [draftPerson]);

  const handleRemovePerson = useCallback((id: string) => {
    setAuthorizedPersons((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Boton principal: obliga a abrir el dialog de firma
  const handleOpenSignature = useCallback(() => {
    setConsentAccepted(false);
    setSignatureName("");
    setIsSignDialogOpen(true);
  }, []);

  const handleValidateSignature = useCallback(() => {
    if (!canSubmitSignature) return;
    setIsValidating(true);
    // Sella el documento con la firma electronica del responsable
    setTimeout(() => {
      const now = new Date();
      const formatted = now.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      setSignature({ signed: true, signedAt: formatted });
      setIsValidating(false);
      setIsSignDialogOpen(false);
      toast.success("Documento sellado criptograficamente y archivado.");
    }, 700);
  }, [canSubmitSignature]);

  return (
    <div className="space-y-6">
      {/* ===================== Datos Complementarios ===================== */}
      <section className="rounded-2xl bg-[#131319] border border-white/5 overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.015]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center">
              <ClipboardList className="size-4 text-[#d0bcff]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Datos Complementarios</h3>
              <p className="text-[11px] text-muted-foreground">
                Informacion adicional requerida por la institucion
              </p>
            </div>
          </div>
          {/* Badge de modo según rol — tres estados posibles */}
          {isStaff && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Lock className="size-3 mr-1" />
              Solo lectura · Datos familiares
            </Badge>
          )}
          {isFamily && signature.signed && (
            <Badge variant="outline" className="text-[10px] bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20">
              <Lock className="size-3 mr-1" />
              Bloqueado · Firmado digitalmente
            </Badge>
          )}
          {isFamily && !signature.signed && (
            <Badge variant="outline" className="text-[10px] bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20">
              <PenLine className="size-3 mr-1" />
              Edicion habilitada
            </Badge>
          )}
        </header>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {DELEGATED_FIELDS.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="text-xs text-white/60">
                {field.label}
                {field.required && <span className="text-[#ffb4ab] ml-1">*</span>}
              </Label>
              {field.type === "SELECCION" ? (
                <Select
                  value={fieldValues[field.id] ?? ""}
                  onValueChange={(v) => handleFieldChange(field.id, v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger id={field.id} className="bg-black/40 border-white/10 h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131319] border-white/10">
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type === "NUMERO" ? "number" : field.type === "FECHA" ? "date" : "text"}
                  value={fieldValues[field.id] ?? ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={!canEdit}
                  className="bg-black/40 border-white/10 h-10 disabled:opacity-60"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===================== Autorizacion de Retiro ===================== */}
      <section className="rounded-2xl bg-[#131319] border border-white/5 overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.015]">
          <div className="size-9 rounded-lg bg-[#4de082]/10 border border-[#4de082]/20 flex items-center justify-center">
            <ShieldCheck className="size-4 text-[#4de082]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Autorizacion de Retiro</h3>
            <p className="text-[11px] text-muted-foreground">
              Define quien esta autorizado a retirar al alumno de la institucion
            </p>
          </div>
        </header>

        <div className="p-5 space-y-6">
          {/* Responsable del retiro */}
          <div className="space-y-3">
            <Label className="text-xs text-white/60">Responsable del retiro</Label>
            <RadioGroup
              value={pickupResponsible}
              onValueChange={(v) => setPickupResponsible(v as PickupResponsible)}
              disabled={!canEdit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {PICKUP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = pickupResponsible === opt.value;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`pickup_${opt.value}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#4de082]/5 border-[#4de082]/30"
                        : "bg-black/30 border-white/10 hover:border-white/20"
                    } ${!canEdit ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <RadioGroupItem value={opt.value} id={`pickup_${opt.value}`} className="mt-0.5" />
                    <div className="flex items-start gap-2.5">
                      <Icon className={`size-4 mt-0.5 ${isSelected ? "text-[#4de082]" : "text-white/40"}`} />
                      <div>
                        <p className="text-xs font-medium text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.description}</p>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Personas autorizadas (solo si AUTORIZADOS) */}
          {pickupResponsible === "AUTORIZADOS" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div className="h-px bg-white/5" />
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-[#d0bcff]" />
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Personas Autorizadas
                </h4>
              </div>

              {/* Lista de personas */}
              {authorizedPersons.length > 0 && (
                <div className="space-y-2">
                  {authorizedPersons.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {p.firstName} {p.lastName}
                          <span className="text-muted-foreground font-normal"> · {p.relationship || "Sin vinculo"}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.docType} {p.docNumber}
                          {p.phone && ` · ${p.phone}`}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePerson(p.id)}
                          className="size-7 text-muted-foreground hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mini-formulario (solo FAMILIA) */}
              {canEdit && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Nombre</Label>
                      <Input
                        value={draftPerson.firstName}
                        onChange={(e) => setDraftPerson((d) => ({ ...d, firstName: e.target.value }))}
                        placeholder="Nombre"
                        className="bg-black/40 border-white/10 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Apellido</Label>
                      <Input
                        value={draftPerson.lastName}
                        onChange={(e) => setDraftPerson((d) => ({ ...d, lastName: e.target.value }))}
                        placeholder="Apellido"
                        className="bg-black/40 border-white/10 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Tipo de documento</Label>
                      <Select
                        value={draftPerson.docType}
                        onValueChange={(v) => setDraftPerson((d) => ({ ...d, docType: v }))}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#131319] border-white/10">
                          {DOC_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Nro de documento</Label>
                      <Input
                        value={draftPerson.docNumber}
                        onChange={(e) => setDraftPerson((d) => ({ ...d, docNumber: e.target.value }))}
                        placeholder="Ej: 30.123.456"
                        className="bg-black/40 border-white/10 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Vinculo</Label>
                      <Input
                        value={draftPerson.relationship}
                        onChange={(e) => setDraftPerson((d) => ({ ...d, relationship: e.target.value }))}
                        placeholder="Ej: Abuela, Tio..."
                        className="bg-black/40 border-white/10 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-white/50">Telefono</Label>
                      <Input
                        value={draftPerson.phone}
                        onChange={(e) => setDraftPerson((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="+54 11 ..."
                        className="bg-black/40 border-white/10 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPerson}
                    className="w-full h-9 border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 hover:text-[#d0bcff]"
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    Agregar persona autorizada
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ===================== Firma Digital ===================== */}
      <section className="rounded-2xl bg-[#131319] border border-white/5 overflow-hidden">
        <div className="p-5">
          {signature.signed ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#4de082]/15 border border-[#4de082]/30 flex items-center justify-center">
                  <CheckCircle2 className="size-5 text-[#4de082]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Autorizacion de Retiro</p>
                  <p className="text-[11px] text-muted-foreground">
                    Documento legal vinculante para {studentName}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-[#4de082]/15 text-[#4de082] border-[#4de082]/30 h-auto py-2 px-3 text-xs font-medium gap-1.5"
              >
                <ShieldCheck className="size-3.5" />
                Autorizacion firmada digitalmente el {signature.signedAt}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Firma de Responsabilidad</p>
                <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
                  {isStaff
                    ? "Este documento es de responsabilidad exclusiva de la familia. El personal institucional puede consultarlo pero no puede firmarlo ni modificarlo."
                    : "Al firmar, declaras que la informacion es correcta y autorizas el regimen de retiro seleccionado. Requiere consentimiento legal y firma electronica."
                  }
                </p>
              </div>

              {/* Boton de firma — SOLO visible para FAMILIA, OCULTO para Staff */}
              {isFamily && !signature.signed && (
                <Button
                  onClick={handleOpenSignature}
                  className="bg-[#4de082] text-[#0a1f0d] hover:bg-[#4de082]/90 gap-2 shrink-0"
                >
                  <PenLine className="size-4" />
                  Guardar y Firmar Autorizacion
                </Button>
              )}

              {/* Aviso para Staff en lugar del boton */}
              {isStaff && (
                <Badge
                  variant="outline"
                  className="shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 py-2 px-3 text-[11px]"
                >
                  <Lock className="size-3" />
                  Firma exclusiva de la familia
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===================== Dialog de Firma Electronica (E-Signature) ===================== */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-xl border-white/10 sm:max-w-md shadow-[0_0_40px_rgba(168,85,247,0.18)]">
          <DialogHeader>
            <div className="size-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-2">
              <PenLine className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-center">Consentimiento y Firma Digital</DialogTitle>
            <DialogDescription className="text-center">
              Firma electronicamente la autorizacion de retiro de {studentName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Advertencia legal */}
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Declaro bajo juramento que los datos ingresados son correctos y completos, y asumo la
                responsabilidad legal correspondiente sobre el regimen de retiro y las personas
                autorizadas declaradas. Comprendo que esta firma electronica tiene plena validez legal
                conforme a la normativa vigente.
              </p>
            </div>

            {/* Checkbox de consentimiento obligatorio */}
            <label
              htmlFor="esign-consent"
              className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3 cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Checkbox
                id="esign-consent"
                checked={consentAccepted}
                onCheckedChange={(v) => setConsentAccepted(v === true)}
                disabled={isValidating}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-xs font-medium text-foreground leading-snug">
                Acepto los terminos y firmo digitalmente
              </span>
            </label>

            {/* Firma manuscrita (texto) */}
            <div className="space-y-1.5">
              <Label htmlFor="esign-name" className="text-xs text-white/60">
                Nombre y Apellido Completo <span className="text-[#ffb4ab]">*</span>
              </Label>
              <Input
                id="esign-name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={isValidating}
                placeholder="Escriba su nombre completo como firma"
                className="bg-black/40 border-white/15 h-11 font-serif italic text-base placeholder:not-italic placeholder:font-sans placeholder:text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={handleValidateSignature}
              disabled={!canSubmitSignature || isValidating}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 disabled:opacity-40"
            >
              <ShieldCheck className="size-4" />
              {isValidating ? "Sellando documento..." : "Confirmar y Sellar Documento"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Esta accion queda registrada como firma digital con valor legal.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
