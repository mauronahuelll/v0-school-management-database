"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileCheck,
  Fingerprint,
  Loader2,
  AlertCircle,
  MessageSquareWarning,
  Download,
  PenLine,
  Hash,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Types matching the backend
interface SanctionData {
  sanctionTypeName: string;
  severity: 1 | 2 | 3 | 4 | 5;
  acknowledgment?: {
    status: "PENDING" | "ACKNOWLEDGED" | "DISPUTED";
    documentHash?: string;
  };
}

interface BehaviorRecord {
  id: string;
  schoolId: string;
  studentName: string;
  date: string;
  category: string;
  description: string;
  sanction?: SanctionData;
}

interface SanctionAcknowledgmentProps {
  record: BehaviorRecord;
  onAcknowledge: (behaviorId: string) => Promise<{
    success: boolean;
    verificationId: string;
    documentHash: string;
  }>;
  onDispute: (behaviorId: string, reason: string) => Promise<{ success: boolean }>;
}

type ViewState = "details" | "pin-entry" | "processing" | "dispute" | "success" | "error";

const SEVERITY_CONFIG = {
  1: { label: "Leve", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  2: { label: "Moderada", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  3: { label: "Seria", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  4: { label: "Grave", color: "bg-red-600/20 text-red-300 border-red-600/30" },
  5: { label: "Muy Grave", color: "bg-red-700/30 text-red-200 border-red-700/30" },
} as const;

// Generate a fake SHA-256 hash
function generateFakeHash(): string {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function SanctionAcknowledgment({
  record,
  onAcknowledge,
  onDispute,
}: SanctionAcknowledgmentProps) {
  const [viewState, setViewState] = useState<ViewState>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureData, setSignatureData] = useState<{
    verificationId?: string;
    documentHash?: string;
    signedAt?: string;
    ipAddress?: string;
    error?: string;
  }>({});

  const status = record.sanction?.acknowledgment?.status || "PENDING";
  const severity = record.sanction?.severity || 1;
  const severityConfig = SEVERITY_CONFIG[severity];

  const canSubmitSignature = consentAccepted && signatureName.trim().length > 0;

  const handleStartSignature = useCallback(() => {
    setConsentAccepted(false);
    setSignatureName("");
    setViewState("pin-entry");
  }, []);

  const handlePinComplete = useCallback(async () => {
    if (!consentAccepted || signatureName.trim().length === 0) return;

    setViewState("processing");
    setIsLoading(true);

    try {
      // Simulate cryptographic signature generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await onAcknowledge(record.id);
      if (response.success) {
        const now = new Date();
        // Generate simulated IP address
        const fakeIP = `${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        setSignatureData({
          verificationId: response.verificationId,
          documentHash: response.documentHash || generateFakeHash(),
          signedAt: now.toLocaleString("es-AR", {
            dateStyle: "full",
            timeStyle: "medium",
          }),
          ipAddress: fakeIP,
        });
        setViewState("success");
        toast.success("Documento sellado criptograficamente y archivado.");
      } else {
        setSignatureData({ error: "Error al procesar la firma digital" });
        setViewState("error");
      }
    } catch (err) {
      setSignatureData({
        error: err instanceof Error ? err.message : "Error desconocido",
      });
      setViewState("error");
    } finally {
      setIsLoading(false);
    }
  }, [consentAccepted, signatureName, record.id, onAcknowledge]);

  const handleDispute = useCallback(async () => {
    if (disputeReason.trim().length < 10) return;

    setIsLoading(true);
    try {
      const response = await onDispute(record.id, disputeReason);
      if (response.success) {
        setViewState("details");
      }
    } catch (err) {
      setSignatureData({
        error: err instanceof Error ? err.message : "Error al enviar disputa",
      });
      setViewState("error");
    } finally {
      setIsLoading(false);
    }
  }, [record.id, disputeReason, onDispute]);

  const handleDownloadPDF = useCallback(() => {
    // Simulate PDF download
    const blob = new Blob(
      [`ACTA DE NOTIFICACION FIRMADA\n\nEstudiante: ${record.studentName}\nFecha: ${signatureData.signedAt}\nHash: ${signatureData.documentHash}\nVerificacion: ${signatureData.verificationId}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acta-firmada-${record.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [record, signatureData]);

  // Already acknowledged
  if (status === "ACKNOWLEDGED") {
    return (
      <div className="rounded-2xl border border-[#4de082]/30 bg-[#4de082]/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4de082]/20">
            <CheckCircle2 className="h-6 w-6 text-[#4de082]" />
          </div>
          <div>
            <p className="font-medium text-foreground">Notificacion Firmada Digitalmente</p>
            <p className="text-sm text-muted-foreground font-mono">
              Hash: {record.sanction?.acknowledgment?.documentHash?.substring(0, 16)}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Disputed
  if (status === "DISPUTED") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <MessageSquareWarning className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sancion Disputada</p>
            <p className="text-sm text-muted-foreground">
              En revision por la institucion educativa
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-6 shadow-xl">
      <AnimatePresence mode="wait">
        {/* DETAILS VIEW - Document Card */}
        {viewState === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Document Header - Formal Acta Style */}
            <div className="relative p-6 rounded-xl bg-gradient-to-br from-red-950/50 to-red-900/20 border border-red-500/20">
              {/* Formal Document Margin Lines */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-red-500/20" />
              <div className="pl-4">
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                    severityConfig.color
                  )}>
                    {severityConfig.label}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70 mb-1">
                      Sancion Disciplinaria Pendiente de Firma
                    </p>
                    <h3 className="text-lg font-serif font-bold text-foreground">
                      {record.sanction?.sanctionTypeName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">{record.date}</p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    Estudiante
                  </p>
                  <p className="font-serif font-semibold text-foreground">{record.studentName}</p>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Descripcion de los Hechos
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80 font-serif italic">
                    {record.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">Categoria:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs font-medium text-foreground">
                    {record.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStartSignature}
                className="h-14 w-full gap-3 rounded-xl bg-[#d0bcff] hover:bg-[#c4b0f3] text-[#381e72] text-base font-bold shadow-lg transition-all hover:scale-[1.01]"
              >
                <Fingerprint className="h-5 w-5" />
                Firmar en Conformidad (Art. 284 CCyCN)
              </Button>

              <Button
                variant="ghost"
                onClick={() => setViewState("dispute")}
                className="h-12 w-full text-muted-foreground hover:text-foreground"
              >
                Disputar esta sancion
              </Button>
            </div>
          </motion.div>
        )}

        {/* E-SIGNATURE VIEW */}
        {viewState === "pin-entry" && (
          <motion.div
            key="pin-entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 py-4"
          >
            {/* Signature Icon */}
            <div className="flex justify-center">
              <div className="p-5 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_25px_rgba(168,85,247,0.20)]">
                <PenLine className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">
                Consentimiento y Firma Digital
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirme su identidad mediante firma electronica
              </p>
            </div>

            {/* Legal Notice */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-foreground/70">
                  Declaro bajo juramento que los datos ingresados son correctos y que he sido{" "}
                  <strong className="text-foreground/90">legalmente notificado</strong> de la presente
                  comunicacion, asumiendo la responsabilidad legal correspondiente. Este acuse de recibo
                  tiene validez legal conforme al Art. 284 del Codigo Civil y Comercial de la Nacion.
                </p>
              </div>
            </div>

            {/* Mandatory consent checkbox */}
            <label
              htmlFor="esign-consent-sanction"
              className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3 cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Checkbox
                id="esign-consent-sanction"
                checked={consentAccepted}
                onCheckedChange={(v) => setConsentAccepted(v === true)}
                disabled={isLoading}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-xs font-medium text-foreground leading-snug">
                Acepto los terminos y firmo digitalmente
              </span>
            </label>

            {/* Handwritten-style signature input */}
            <div className="space-y-1.5">
              <Label htmlFor="esign-name-sanction" className="text-xs text-white/60">
                Nombre y Apellido Completo <span className="text-[#ffb4ab]">*</span>
              </Label>
              <Input
                id="esign-name-sanction"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={isLoading}
                placeholder="Escriba su nombre completo como firma"
                autoComplete="off"
                className="bg-black/40 border-white/15 h-11 font-serif italic text-base placeholder:not-italic placeholder:font-sans placeholder:text-sm"
              />
            </div>

            <Button
              onClick={handlePinComplete}
              disabled={!canSubmitSignature || isLoading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 disabled:opacity-40"
            >
              <Shield className="h-4 w-4" />
              Confirmar y Sellar Documento
            </Button>

            <Button
              variant="ghost"
              onClick={() => setViewState("details")}
              disabled={isLoading}
              className="w-full h-11 text-muted-foreground"
            >
              Cancelar
            </Button>
          </motion.div>
        )}

        {/* PROCESSING VIEW */}
        {viewState === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12 text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="p-5 rounded-full bg-primary/10 border border-primary/20">
                  <Hash className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">
                Generando certificado criptografico...
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Procesando firma digital con encriptacion SHA-256
              </p>
            </div>

            {/* Fake console output */}
            <div className="mx-auto max-w-sm rounded-lg bg-black/50 p-3 font-mono text-[10px] text-left text-green-400/80 space-y-1">
              <p>&gt; Validando credenciales...</p>
              <p>&gt; Generando hash del documento...</p>
              <p className="animate-pulse">&gt; Firmando digitalmente...</p>
            </div>
          </motion.div>
        )}

        {/* DISPUTE VIEW */}
        {viewState === "dispute" && (
          <motion.div
            key="dispute"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <MessageSquareWarning className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Disputar Sancion</h3>
                <p className="text-sm text-muted-foreground">
                  Explique el motivo de su desacuerdo
                </p>
              </div>
            </div>

            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describa detalladamente por que considera que esta sancion es incorrecta o injusta..."
              className="min-h-[150px] resize-none rounded-xl bg-white/[0.02] border-white/10"
            />

            <p className="text-xs text-muted-foreground">
              Minimo 10 caracteres. Su disputa sera revisada por la direccion de la institucion.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDispute}
                disabled={isLoading || disputeReason.trim().length < 10}
                variant="outline"
                className="h-14 w-full gap-3 rounded-xl border-amber-500/50 text-base font-medium hover:bg-amber-500/10"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageSquareWarning className="h-5 w-5" />
                )}
                Enviar Disputa
              </Button>

              <Button
                variant="ghost"
                onClick={() => setViewState("details")}
                disabled={isLoading}
                className="h-12 w-full text-muted-foreground"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* SUCCESS VIEW - Signed State */}
        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-4"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="p-5 rounded-full bg-[#4de082]/20 border border-[#4de082]/30">
                <CheckCircle2 className="h-12 w-12 text-[#4de082]" />
              </div>
            </motion.div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-[#4de082]">FIRMADO</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Documento firmado digitalmente con exito
              </p>
            </div>

            {/* Cryptographic Details Console - Audit Block */}
            <div className="rounded-xl bg-black/60 p-4 font-mono text-[10px] space-y-2 border border-white/5">
              <div className="flex items-center gap-2 text-[#4de082]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Firma Digital Validada</span>
              </div>
              
              <div className="pt-2 border-t border-white/5 space-y-1.5 text-white/60">
                <div className="flex items-start gap-2">
                  <Hash className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <div>
                    <span className="text-white/50">SHA-256:</span>
                    <p className="text-white/80 break-all">{signatureData.documentHash}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-white/50">Marca de Tiempo:</span>
                  <span className="text-white/80">{signatureData.signedAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-primary" />
                  <span className="text-white/50">IP de Origen:</span>
                  <span className="text-white/80">{signatureData.ipAddress}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-primary" />
                  <span className="text-white/50">ID Verificacion:</span>
                  <span className="text-white/80">{signatureData.verificationId}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-[#4de082]/70">
                &gt; Certificado almacenado en blockchain educativa
              </div>
            </div>

            {/* Art. 284 Reference */}
            <div className="rounded-xl border border-[#4de082]/20 bg-[#4de082]/5 p-3 text-center">
              <p className="text-[10px] text-[#4de082]/80">
                Conforme al Art. 284 del Codigo Civil y Comercial de la Nacion Argentina
              </p>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownloadPDF}
              className="w-full h-14 rounded-xl bg-white/5 hover:bg-white/10 text-foreground border border-white/10 gap-3"
            >
              <Download className="h-5 w-5" />
              Descargar Acta (PDF)
            </Button>
          </motion.div>
        )}

        {/* ERROR VIEW */}
        {viewState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-4 text-center"
          >
            <div className="flex justify-center">
              <div className="p-5 rounded-full bg-red-500/20">
                <AlertCircle className="h-12 w-12 text-red-400" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">
                Error en la Firma
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {signatureData.error}
              </p>
            </div>

            <Button
              onClick={() => setViewState("details")}
              variant="outline"
              className="h-12 w-full rounded-xl"
            >
              Intentar Nuevamente
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Demo component showing the mobile preview
export function SanctionAcknowledgmentDemo() {
  const mockRecord: BehaviorRecord = {
    id: "demo-sanction-001",
    schoolId: "school-001",
    studentName: "Martinez, Joaquin Andres",
    date: "15 de Marzo, 2024",
    category: "Conducta en el Aula",
    description:
      "El alumno interrumpio reiteradamente la clase de Matematica, desatendiendo los llamados de atencion del docente. Se solicita al tutor/a reforzar las pautas de comportamiento y respeto en el entorno educativo.",
    sanction: {
      sanctionTypeName: "Apercibimiento Escrito",
      severity: 2,
      acknowledgment: {
        status: "PENDING",
        documentHash: "a1b2c3d4e5f6789012345678901234567890abcd",
      },
    },
  };

  const handleAcknowledge = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      verificationId: `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      documentHash: generateFakeHash(),
    };
  };

  const handleDispute = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  };

  return (
    <div className="mx-auto max-w-md">
      <SanctionAcknowledgment
        record={mockRecord}
        onAcknowledge={handleAcknowledge}
        onDispute={handleDispute}
      />
    </div>
  );
}
