"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, BarChart2, CalendarCheck, ShieldCheck, Users,
  ClipboardList, ShieldAlert, Stethoscope, Lock, Upload, FileText,
  CheckCircle2, Clock, AlertCircle, Plus, X, Paperclip, ChevronRight,
  Building2, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StudentProfileHeader } from "./student-profile-header";
import { StatsOverview } from "./stats-overview";
import { EventTimeline } from "./event-timeline";
import { MedicalContactCard } from "./medical-contact-card";
import { StudentTrayectoria } from "./student-trayectoria";
import { StudentFamilyNetwork } from "./student-family-network";
import { StudentComplementaryData } from "./student-complementary-data";
import type { Student360Data } from "@/lib/types/student";
import { useActiveRole, useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Gabinete Clínico
// ─────────────────────────────────────────────────────────────────────────────

type ReferralStatus = "completed" | "pending" | "urgent";

interface ClinicalReferral {
  id: string;
  title: string;
  professional: string;
  specialty: string;
  date: string;
  status: ReferralStatus;
  summary: string;
  hasAttachment: boolean;
}

const MOCK_REFERRALS: ClinicalReferral[] = [
  {
    id: "r1",
    title: "Evaluacion Fonoaudiologica",
    professional: "Lic. Maria Fernandez",
    specialty: "Fonoaudiologia",
    date: "Mayo 2025",
    status: "completed",
    summary: "Se detectaron dificultades leves en procesamiento fonologico. Se recomienda seguimiento bimestral y apoyo en lectoescritura.",
    hasAttachment: true,
  },
  {
    id: "r2",
    title: "Derivacion Psicopedagogica",
    professional: "Lic. Carlos Soto",
    specialty: "Psicopedagogia",
    date: "Marzo 2025",
    status: "completed",
    summary: "Evaluacion completa de perfil de aprendizaje. Sin indicadores de dificultad especifica del aprendizaje. Rendimiento adecuado a la edad.",
    hasAttachment: true,
  },
  {
    id: "r3",
    title: "Interconsulta Neurologica",
    professional: "Dr. Pedro Alvarez",
    specialty: "Neurologia Infantil",
    date: "Enero 2025",
    status: "pending",
    summary: "Solicitud pendiente de turno. Motivo: dificultades atencionales observadas en el aula durante el segundo trimestre.",
    hasAttachment: false,
  },
  {
    id: "r4",
    title: "Informe Psicologico Anual",
    professional: "Lic. Ana Gomez",
    specialty: "Psicologia",
    date: "Noviembre 2024",
    status: "completed",
    summary: "Evaluacion de desarrollo socio-emocional. Indicadores de ansiedad moderada ante examenes. Se acuerdan estrategias de regulacion.",
    hasAttachment: true,
  },
  {
    id: "r5",
    title: "Seguimiento Urgente - Ausentismo",
    professional: "Dir. Rosa Medina",
    specialty: "Orientacion Escolar",
    date: "Agosto 2024",
    status: "urgent",
    summary: "Protocolo de intervencion activado por ausentismo superior al 30%. Se coordinan acciones con referentes familiares.",
    hasAttachment: false,
  },
];

const STATUS_CONFIG: Record<ReferralStatus, { label: string; icon: React.ReactNode; badge: string; dot: string; timeline: string }> = {
  completed: {
    label: "Completado",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    timeline: "border-emerald-500/30",
  },
  pending: {
    label: "Pendiente",
    icon: <Clock className="h-3.5 w-3.5" />,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
    timeline: "border-amber-500/30",
  },
  urgent: {
    label: "Urgente",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)] animate-pulse",
    timeline: "border-red-500/40",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL CABINET TAB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ClinicalCabinetTab({ studentName }: { studentName: string }) {
  const [expandedId, setExpandedId] = useState<string | null>("r1");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [professional, setProfessional] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional || !diagnosis) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setProfessional("");
    setSpecialty("");
    setDiagnosis("");
    setFiles([]);
    toast.success("Informe cargado al gabinete clinico", {
      description: `El informe de ${studentName} fue registrado correctamente.`,
      duration: 4000,
    });
  };

  return (
    <div className="space-y-4">
      {/* Confidentiality banner */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/20"
      >
        <Lock className="h-4 w-4 text-red-400 shrink-0" />
        <p className="text-xs text-red-300/80">
          <span className="font-semibold text-red-300">Informacion altamente confidencial.</span>{" "}
          Este modulo es de acceso restringido. Su contenido esta protegido por las normativas de
          privacidad escolar y no es visible para docentes, preceptores ni familias.
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Timeline de derivaciones ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#E4E1EA] uppercase tracking-wider flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#D0BCFF]" />
              Historial de Derivaciones
            </h3>
            <span className="text-xs text-white/40">
              {MOCK_REFERRALS.length} registros
            </span>
          </div>

          <ScrollArea className="h-[560px] pr-3">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gradient-to-b from-[#8A2BE2]/40 via-white/10 to-transparent" />

              <div className="space-y-3">
                {MOCK_REFERRALS.map((referral, index) => {
                  const cfg = STATUS_CONFIG[referral.status];
                  const isExpanded = expandedId === referral.id;

                  return (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-10"
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-[13px] top-4 size-2.5 rounded-full border-2 border-[#0A0A0F] z-10",
                        cfg.dot
                      )} />

                      {/* Card */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : referral.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200",
                          "bg-white/[0.02] hover:bg-white/[0.04]",
                          isExpanded
                            ? cn("border-white/15 shadow-lg", cfg.timeline)
                            : "border-white/[0.06]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#E4E1EA] truncate">
                                {referral.title}
                              </span>
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0",
                                cfg.badge
                              )}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {referral.professional}
                              </span>
                              <span className="text-xs text-white/30">·</span>
                              <span className="text-xs text-white/30">{referral.specialty}</span>
                              <span className="text-xs text-white/30">·</span>
                              <span className="text-xs text-white/30">{referral.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {referral.hasAttachment && (
                              <Paperclip className="h-3.5 w-3.5 text-white/25" />
                            )}
                            <ChevronRight className={cn(
                              "h-4 w-4 text-white/30 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )} />
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <Separator className="my-3 bg-white/[0.06]" />
                              <p className="text-sm text-white/60 leading-relaxed">
                                {referral.summary}
                              </p>
                              {referral.hasAttachment && (
                                <button className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#D0BCFF] hover:text-white transition-colors">
                                  <FileText className="h-3.5 w-3.5" />
                                  Ver informe adjunto (PDF)
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* ── RIGHT: Panel de carga ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header card */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-sm font-bold text-[#E4E1EA] uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#D0BCFF]" />
                Cargar Nuevo Informe
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Los informes quedan registrados con fecha y usuario emisor.
              </p>
            </div>

            {/* Fields */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">

              {/* Profesional */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Profesional a cargo
                </Label>
                <Input
                  value={professional}
                  onChange={(e) => setProfessional(e.target.value)}
                  placeholder="Ej: Lic. Maria Fernandez"
                  required
                  className="bg-black/40 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50 transition-all"
                />
              </div>

              {/* Especialidad */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Especialidad
                </Label>
                <Input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Fonoaudiologia, Psicologia..."
                  className="bg-black/40 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50 transition-all"
                />
              </div>

              {/* Diagnóstico / Sugerencia */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Diagnostico Preliminar / Sugerencia
                </Label>
                <Textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Describe el diagnostico, las observaciones clinicas y las sugerencias de intervencion..."
                  rows={5}
                  required
                  className="resize-none bg-black/40 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50 transition-all leading-relaxed"
                />
                <p className="text-xs text-white/25 text-right">{diagnosis.length} caracteres</p>
              </div>

              {/* Drag & Drop zona */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Adjuntar documentos
                </Label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
                    isDragging
                      ? "border-[#8A2BE2]/60 bg-[#8A2BE2]/10"
                      : "border-white/[0.08] hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03]"
                  )}
                >
                  <Upload className={cn(
                    "h-7 w-7 transition-colors",
                    isDragging ? "text-[#D0BCFF]" : "text-white/25"
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium transition-colors",
                      isDragging ? "text-[#D0BCFF]" : "text-white/40"
                    )}>
                      {isDragging ? "Suelta los archivos aqui" : "Arrastra PDFs o imagenes"}
                    </p>
                    <p className="text-xs text-white/25 mt-0.5">
                      o{" "}
                      <span className="text-[#D0BCFF]/70 underline underline-offset-2">
                        selecciona desde tu dispositivo
                      </span>
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={handleFileInput}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#D0BCFF]/60 shrink-0" />
                        <span className="text-xs text-white/60 truncate flex-1">{file.name}</span>
                        <span className="text-[10px] text-white/30 shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-white/25 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSaving || !professional || !diagnosis}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm",
                "bg-gradient-to-r from-[#8A2BE2] to-[#6B1FA8]",
                "shadow-[0_0_24px_rgba(138,43,226,0.4)] hover:shadow-[0_0_36px_rgba(138,43,226,0.6)]",
                "text-white transition-all duration-300 hover:from-[#9B3CF5] hover:to-[#7B2BBB]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              )}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Stethoscope className="h-4 w-4" />
                  Registrar Informe Clinico
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface Student360ViewProps {
  data: Student360Data;
  backUrl?: string;
  onExportPDF?: () => void;
}

export function Student360View({ 
  data, 
  backUrl = "/attendance",
  onExportPDF,
}: Student360ViewProps) {
  const [activeTab, setActiveTab] = useState("resumen");
  const { role } = useActiveRole();
  const { activeContext } = useAuth();
  const router = useRouter();

  // RBAC: deriva si el usuario es familia para ocultarle acciones administrativas
  const isFamilia = activeContext?.role === "FAMILIA";

  // RBAC: Gabinete Clínico solo visible para ADMIN (máximo privilegio del sistema)
  const canViewClinical = activeContext?.role === "ADMIN";

  // RBAC: FAMILIA siempre vuelve a su dashboard multihijo; el personal vuelve
  // a la página anterior de la que vino (Secretaría, Notas, Parte Diario, etc.)
  const handleBack = useCallback(() => {
    if (isFamilia) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  }, [isFamilia, router]);

  // Count pending subjects for badge
  const pendingSubjectsCount = 2; // This would come from data in real implementation
  const hasRestrictions = true;   // Mock: would come from contacts data

  // Export complete historial handler — solo personal administrativo
  const handleExportHistorial = useCallback(() => {
    toast.success(
      "Legajo consolidado exportado en PDF. Incluye trayectoria desde Nivel Inicial a la fecha.",
      { duration: 5000 }
    );
  }, []);

  return (
    <div className="min-h-screen pb-8">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 md:p-6"
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6 max-w-6xl mx-auto">
        {/* Profile Header */}
        <StudentProfileHeader
          profile={data.profile}
          onExportPDF={isFamilia ? undefined : onExportPDF}
          onExportHistorial={isFamilia ? undefined : handleExportHistorial}
          isReadOnly={isFamilia}
        />

        {/* ── Tabs estandarizadas ── */}
        {/* Orden definitivo: Resumen · Calificaciones · Asistencia · Comportamiento · Red Familiar · Datos Complementarios/Médicos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-black/40 border border-white/10 rounded-xl p-1 gap-1 flex-wrap h-auto">

            {/* 1 — Resumen */}
            <TabsTrigger
              value="resumen"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <User className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>

            {/* 2 — Calificaciones */}
            <TabsTrigger
              value="calificaciones"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Calificaciones
              {pendingSubjectsCount > 0 && !isFamilia && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30 text-[10px] px-1.5"
                >
                  {pendingSubjectsCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* 3 — Asistencia */}
            <TabsTrigger
              value="asistencia"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Asistencia
            </TabsTrigger>

            {/* 4 — Comportamiento */}
            <TabsTrigger
              value="comportamiento"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Comportamiento
            </TabsTrigger>

            {/* 5 — Red Familiar */}
            <TabsTrigger
              value="red-familiar"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <Users className="h-4 w-4 mr-2" />
              Red Familiar
              {hasRestrictions && !isFamilia && (
                <ShieldAlert className="h-3.5 w-3.5 ml-1.5 text-red-400" />
              )}
            </TabsTrigger>

            {/* 6 — Datos Complementarios / Médicos */}
            <TabsTrigger
              value="datos-complementarios"
              className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-[#8A2BE2]/20 data-[state=active]:text-[#D0BCFF] data-[state=active]:shadow-[0_0_15px_rgba(138,43,226,0.2)]"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Datos Complementarios
            </TabsTrigger>

            {/* 7 — Gabinete Clínico (ADMIN only) */}
            {canViewClinical && (
              <TabsTrigger
                value="gabinete-clinico"
                className="text-white/50 hover:text-white transition-all rounded-lg data-[state=active]:bg-red-500/15 data-[state=active]:text-red-300 data-[state=active]:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Gabinete Clinico
                <Lock className="h-3 w-3 ml-1.5 opacity-60" />
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Tab 1: Resumen ── */}
          <TabsContent value="resumen" className="mt-6 space-y-6">
            <StatsOverview stats={data.stats} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <EventTimeline events={data.timeline} maxVisible={8} />
              </div>
              <div className="lg:col-span-2">
                <MedicalContactCard
                  medical={data.medical}
                  tutors={data.tutors}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Calificaciones ── */}
          {/* StudentTrayectoria deriva su propio canEdit desde activeContext.role internamente */}
          <TabsContent value="calificaciones" className="mt-6">
            <StudentTrayectoria
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
            />
          </TabsContent>

          {/* ── Tab 3: Asistencia ── */}
          <TabsContent value="asistencia" className="mt-6">
            <div className="p-6 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#E4E1EA] flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-[#8A2BE2]" />
                  Registro de Asistencia
                </h3>
                {/* Botón de nueva sanción — solo personal administrativo */}
                {!isFamilia && (
                  <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                    Solo lectura en demo
                  </Badge>
                )}
              </div>
              {/* Timeline reutilizado filtrando eventos de asistencia */}
              <EventTimeline
                events={data.timeline.filter(e =>
                  ["absence", "attendance", "tardy"].includes(e.type)
                )}
                maxVisible={20}
              />
            </div>
          </TabsContent>

          {/* ── Tab 4: Comportamiento ── */}
          <TabsContent value="comportamiento" className="mt-6">
            <div className="p-6 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#E4E1EA] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#8A2BE2]" />
                  Registro de Comportamiento
                </h3>
                {/* Botón "+ Nueva Sanción" — solo personal NO familia */}
                {!isFamilia && (
                  <button
                    onClick={() => toast.info("Modulo de sanciones proximamente.")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    + Nueva Sancion
                  </button>
                )}
              </div>
              <EventTimeline
                events={data.timeline.filter(e =>
                  ["sanction", "behavior", "note"].includes(e.type)
                )}
                maxVisible={20}
              />
            </div>
          </TabsContent>

          {/* ── Tab 5: Red Familiar ── */}
          {/* canEdit=false para FAMILIA → StudentFamilyNetwork oculta dropdown de admin actions */}
          <TabsContent value="red-familiar" className="mt-6">
            <StudentFamilyNetwork
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
              userRole={role ?? undefined}
              canEdit={!isFamilia}
            />
          </TabsContent>

          {/* ── Tab 6: Datos Complementarios / Médicos ── */}
          <TabsContent value="datos-complementarios" className="mt-6">
            <StudentComplementaryData
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
              userRole={role ?? undefined}
            />
          </TabsContent>

          {/* ── Tab 7: Gabinete Clínico (ADMIN only) ── */}
          {canViewClinical && (
            <TabsContent value="gabinete-clinico" className="mt-6">
              <ClinicalCabinetTab studentName={`${data.profile.firstName} ${data.profile.lastName}`} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
