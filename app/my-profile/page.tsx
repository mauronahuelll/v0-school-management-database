"use client";

import { useState, useCallback, useRef } from "react";
import {
  UserCircle,
  Mail,
  Shield,
  BookOpen,
  GraduationCap,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Pencil,
  X,
  FileCheck,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadSimplePdf } from "@/lib/utils/download";
import { useAuth, Role } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// ============================================
// TYPES & MOCK DATA
// ============================================

type DocStatus = "FALTANTE" | "EN_REVISION" | "APROBADO" | "RECHAZADO";

interface ComplianceDoc {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  dueDate?: string;
}

interface TeachingScope {
  id: string;
  subject: string;
  course: string;
  hours: number;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Director / Administrador",
  DOCENTE: "Docente",
  PRECEPTOR: "Preceptor",
  FAMILIA: "Familia",
};

const INITIAL_DOCS: ComplianceDoc[] = [
  {
    id: "ddjj-2026",
    name: "DD.JJ. 2026",
    description: "Declaracion Jurada de cargos y horas",
    status: "FALTANTE",
    dueDate: "31 Mar 2026",
  },
  {
    id: "cert-medico",
    name: "Certificado Medico",
    description: "Apto fisico anual obligatorio",
    status: "EN_REVISION",
    dueDate: "15 Mar 2026",
  },
  {
    id: "dni",
    name: "DNI (Frente y Dorso)",
    description: "Documento Nacional de Identidad vigente",
    status: "APROBADO",
  },
  {
    id: "titulo",
    name: "Titulo Habilitante",
    description: "Titulo docente o profesional legalizado",
    status: "RECHAZADO",
    dueDate: "10 Abr 2026",
  },
  {
    id: "antecedentes",
    name: "Cert. Antecedentes Penales",
    description: "Registro Nacional de Reincidencia",
    status: "FALTANTE",
    dueDate: "30 Abr 2026",
  },
  {
    id: "domicilio",
    name: "Constancia de Domicilio",
    description: "Servicio a nombre del titular",
    status: "APROBADO",
  },
];

const TEACHING_SCOPE: TeachingScope[] = [
  { id: "1", subject: "Matematica", course: "3er Ano A", hours: 6 },
  { id: "2", subject: "Matematica", course: "3er Ano B", hours: 6 },
  { id: "3", subject: "Fisica", course: "5to Ano A", hours: 4 },
  { id: "4", subject: "Taller de Programacion", course: "4to Ano C", hours: 3 },
];

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<
  DocStatus,
  { label: string; className: string; icon: typeof CheckCircle2; dot: string }
> = {
  FALTANTE: {
    label: "Faltante",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: AlertCircle,
    dot: "bg-red-400",
  },
  EN_REVISION: {
    label: "En Revision",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Clock,
    dot: "bg-amber-400",
  },
  APROBADO: {
    label: "Aprobado",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
    dot: "bg-emerald-400",
  },
  RECHAZADO: {
    label: "Rechazado",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: X,
    dot: "bg-red-400",
  },
};

// ============================================
// MAIN PAGE
// ============================================

export default function MyProfilePage() {
  const { user, role, userName, schoolName } = useAuth();

  const [docs, setDocs] = useState<ComplianceDoc[]>(INITIAL_DOCS);

  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ComplianceDoc | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = userName || user?.name || "Usuario";
  const displayEmail = user?.email || "sin-email@sequency.edu";
  const roleLabel = role ? ROLE_LABELS[role] : "Sin rol";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const pendingCount = docs.filter(
    (d) => d.status === "FALTANTE" || d.status === "RECHAZADO"
  ).length;

  // Open upload modal
  const handleOpenUpload = useCallback((doc: ComplianceDoc) => {
    setActiveDoc(doc);
    setSelectedFile(null);
    setIsDragging(false);
    setIsUploadOpen(true);
  }, []);

  // Fuerza la descarga real del documento cargado (Aprobado / En Revision)
  const handleDownloadDoc = useCallback((doc: ComplianceDoc) => {
    const slug = doc.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const filename = `${slug}.pdf`;
    downloadSimplePdf(filename, `${doc.name.toUpperCase()} - SEQUENCY`, [
      `Titular: ${displayName}`,
      `Rol: ${roleLabel}`,
      `Estado: ${STATUS_CONFIG[doc.status].label}`,
      `Descripcion: ${doc.description}`,
      "",
      "Documento de cumplimiento institucional.",
      `Descargado: ${new Date().toLocaleDateString("es-AR")}`,
    ]);
    toast.success("Documento descargado en su dispositivo", {
      description: filename,
    });
  }, [displayName, roleLabel]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato no valido. Solo se aceptan PDF, JPG o PNG.");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files?.[0]);
    },
    [handleFileSelect]
  );

  // Confirm upload -> status becomes EN_REVISION
  const handleConfirmUpload = useCallback(async () => {
    if (!activeDoc || !selectedFile) return;

    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, status: "EN_REVISION" as DocStatus } : d
      )
    );

    setIsUploading(false);
    setIsUploadOpen(false);
    setActiveDoc(null);
    setSelectedFile(null);

    toast.success("Documento enviado a Secretaria para su validacion.", {
      description: `${activeDoc.name} esta ahora en revision.`,
      duration: 5000,
    });
  }, [activeDoc, selectedFile]);

  const handleRequestCorrection = useCallback(() => {
    toast.success("Solicitud de correccion enviada a Secretaria.", {
      description: "Recibiras una respuesta en tu buzon institucional.",
    });
  }, []);

  return (
    <div className="min-h-full bg-[#131319] text-[#e4e1ea]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <UserCircle className="size-4" />
            <span>Portal de Autogestion</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl text-balance">
            Mi Perfil
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona tus datos y mantene tu documentacion institucional al dia.
          </p>
        </header>

        <div className="space-y-6">
          {/* ===== SECCION 1: TARJETA DE IDENTIDAD ===== */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-[#d0bcff]/30">
                  <AvatarImage src={user?.avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-[#d0bcff]/10 text-lg font-semibold text-[#d0bcff]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold leading-none">{displayName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Shield className="size-3.5 text-[#d0bcff]" />
                      {roleLabel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {displayEmail}
                    </span>
                  </div>
                  {schoolName && (
                    <p className="text-xs text-white/30">{schoolName}</p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleRequestCorrection}
                className="shrink-0 border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/5 hover:text-white"
              >
                <Pencil className="mr-2 size-4" />
                Solicitar Correccion de Datos
              </Button>
            </div>
          </section>

          {/* ===== SECCION 2: ALCANCE ACADEMICO ===== */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <BookOpen className="size-4 text-[#d0bcff]" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Alcance Academico</h3>
                <p className="text-xs text-white/40">
                  Materias y cursos que dictas actualmente (solo lectura)
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TEACHING_SCOPE.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#d0bcff]/10">
                      <GraduationCap className="size-4 text-[#d0bcff]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{scope.subject}</p>
                      <p className="text-xs text-white/40">{scope.course}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/[0.02] text-white/60"
                  >
                    {scope.hours} hs
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* ===== SECCION 3: BUZON DE CUMPLIMIENTO ===== */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                  <FileCheck className="size-4 text-[#d0bcff]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Buzon de Cumplimiento</h3>
                  <p className="text-xs text-white/40">
                    Documentacion requerida por la institucion
                  </p>
                </div>
              </div>
              {pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="w-fit border-red-500/30 bg-red-500/10 text-red-400"
                >
                  <AlertCircle className="mr-1.5 size-3.5" />
                  {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => {
                const config = STATUS_CONFIG[doc.status];
                const StatusIcon = config.icon;
                const needsAction =
                  doc.status === "FALTANTE" || doc.status === "RECHAZADO";

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.01] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.03]">
                        <FileText className="size-5 text-white/50" />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("border gap-1", config.className)}
                      >
                        <StatusIcon className="size-3" />
                        {config.label}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-medium leading-tight">{doc.name}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">
                      {doc.description}
                    </p>

                    {doc.dueDate && needsAction && (
                      <p className="mt-2 text-[11px] text-red-400/70">
                        Vence: {doc.dueDate}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      {needsAction ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenUpload(doc)}
                          className="w-full bg-[#d0bcff]/10 text-[#d0bcff] hover:bg-[#d0bcff]/20 border border-[#d0bcff]/20"
                        >
                          <UploadCloud className="mr-1.5 size-3.5" />
                          Subir Archivo
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="flex items-center justify-center gap-1.5 text-xs text-white/30">
                            {doc.status === "EN_REVISION" ? (
                              <>
                                <Clock className="size-3.5" />
                                Esperando validacion
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-3.5 text-emerald-400/60" />
                                Documentacion completa
                              </>
                            )}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDoc(doc)}
                            className="w-full border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                          >
                            <Download className="mr-1.5 size-3.5" />
                            Descargar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ===== UPLOAD DIALOG (Drag & Drop) ===== */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-[#131319] border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <UploadCloud className="size-5 text-[#d0bcff]" />
              Subir Documento
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {activeDoc
                ? `Adjunta el archivo para: ${activeDoc.name}`
                : "Adjunta tu documento"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all",
                  isDragging
                    ? "border-[#d0bcff]/60 bg-[#d0bcff]/10"
                    : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-[#d0bcff]/10">
                  <UploadCloud className="size-6 text-[#d0bcff]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e4e1ea]">
                    Arrastra tu archivo aqui
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    o hace clic para buscar (PDF, JPG, PNG)
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-[#d0bcff]/20 bg-[#d0bcff]/[0.06] p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#d0bcff]/10">
                  <FileText className="size-5 text-[#d0bcff]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#e4e1ea]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="size-8 shrink-0 text-white/50 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!selectedFile || isUploading}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 size-4" />
                  Enviar a Secretaria
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
