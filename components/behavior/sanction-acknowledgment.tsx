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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

type ViewState = "details" | "confirm" | "dispute" | "success" | "error";

const SEVERITY_CONFIG = {
  1: { label: "Leve", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  2: { label: "Moderada", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  3: { label: "Seria", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  4: { label: "Grave", color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200" },
  5: { label: "Muy Grave", color: "bg-red-300 text-red-950 dark:bg-red-900/70 dark:text-red-100" },
} as const;

export function SanctionAcknowledgment({
  record,
  onAcknowledge,
  onDispute,
}: SanctionAcknowledgmentProps) {
  const [viewState, setViewState] = useState<ViewState>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [result, setResult] = useState<{
    verificationId?: string;
    documentHash?: string;
    error?: string;
  }>({});

  const status = record.sanction?.acknowledgment?.status || "PENDING";
  const severity = record.sanction?.severity || 1;
  const severityConfig = SEVERITY_CONFIG[severity];

  const handleAcknowledge = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await onAcknowledge(record.id);
      if (response.success) {
        setResult({
          verificationId: response.verificationId,
          documentHash: response.documentHash,
        });
        setViewState("success");
      } else {
        setResult({ error: "Error al procesar la firma" });
        setViewState("error");
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Error desconocido",
      });
      setViewState("error");
    } finally {
      setIsLoading(false);
    }
  }, [record.id, onAcknowledge]);

  const handleDispute = useCallback(async () => {
    if (disputeReason.trim().length < 10) return;

    setIsLoading(true);
    try {
      const response = await onDispute(record.id, disputeReason);
      if (response.success) {
        setViewState("details");
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Error al enviar disputa",
      });
      setViewState("error");
    } finally {
      setIsLoading(false);
    }
  }, [record.id, disputeReason, onDispute]);

  // Already acknowledged
  if (status === "ACKNOWLEDGED") {
    return (
      <div className="rounded-2xl border border-status-present/30 bg-status-present/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-present/20">
            <CheckCircle2 className="h-6 w-6 text-status-present" />
          </div>
          <div>
            <p className="font-medium text-foreground">Notificacion Firmada</p>
            <p className="text-sm text-muted-foreground">
              Hash: {record.sanction?.acknowledgment?.documentHash?.substring(0, 12)}...
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
            <MessageSquareWarning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sancion Disputada</p>
            <p className="text-sm text-muted-foreground">
              En revision por la institucion
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <AnimatePresence mode="wait">
        {/* DETAILS VIEW */}
        {viewState === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-absent/10">
                  <AlertTriangle className="h-6 w-6 text-status-absent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {record.sanction?.sanctionTypeName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{record.date}</p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  severityConfig.color
                )}
              >
                {severityConfig.label}
              </span>
            </div>

            {/* Student */}
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Estudiante</p>
              <p className="font-medium text-foreground">{record.studentName}</p>
            </div>

            {/* Description */}
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Descripcion
              </p>
              <p className="leading-relaxed text-foreground">
                {record.description}
              </p>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Categoria:</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                {record.category}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => setViewState("confirm")}
                className="h-14 w-full gap-3 rounded-xl bg-primary text-lg font-medium text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                <Fingerprint className="h-6 w-6" />
                Confirmar Notificacion
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

        {/* CONFIRM VIEW */}
        {viewState === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Security Icon */}
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>

            {/* Legal Notice */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Aviso Legal
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                Al confirmar, declaro haber sido{" "}
                <strong>legalmente notificado</strong> de la presente
                comunicacion escolar. Este acuse de recibo tiene validez legal
                segun la normativa vigente.
              </p>
            </div>

            {/* Verification Hash Preview */}
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                ID de Verificacion
              </p>
              <p className="font-mono text-sm text-foreground">
                {record.sanction?.acknowledgment?.documentHash?.substring(0, 16) ||
                  "Generando..."}
                ...
              </p>
            </div>

            {/* Metadata captured notice */}
            <p className="text-center text-xs text-muted-foreground">
              Se registrara: fecha/hora del servidor, direccion IP y dispositivo
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleAcknowledge}
                disabled={isLoading}
                className="h-14 w-full gap-3 rounded-xl bg-status-present text-lg font-medium text-status-present-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
                {isLoading ? "Firmando..." : "Firmar y Confirmar"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setViewState("details")}
                disabled={isLoading}
                className="h-12 w-full text-muted-foreground"
              >
                Volver
              </Button>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <MessageSquareWarning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Disputar Sancion
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explique el motivo de su desacuerdo
                </p>
              </div>
            </div>

            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describa detalladamente por que considera que esta sancion es incorrecta o injusta..."
              className="min-h-[150px] resize-none rounded-xl"
            />

            <p className="text-xs text-muted-foreground">
              Minimo 10 caracteres. Su disputa sera revisada por la direccion de
              la institucion.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleDispute}
                disabled={isLoading || disputeReason.trim().length < 10}
                variant="outline"
                className="h-14 w-full gap-3 rounded-xl border-amber-500/50 text-lg font-medium hover:bg-amber-500/10"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <MessageSquareWarning className="h-6 w-6" />
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

        {/* SUCCESS VIEW */}
        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-status-present/20"
            >
              <CheckCircle2 className="h-12 w-12 text-status-present" />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Firma Registrada
              </h3>
              <p className="mt-2 text-muted-foreground">
                Su acuse de recibo ha sido procesado exitosamente
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4 text-left">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Comprobante de Verificacion
              </p>
              <p className="font-mono text-xs text-foreground break-all">
                {result.verificationId}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                Hash: {result.documentHash}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Guarde este comprobante para sus registros
            </p>
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
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-status-absent/20">
              <AlertCircle className="h-12 w-12 text-status-absent" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Error en la Firma
              </h3>
              <p className="mt-2 text-muted-foreground">{result.error}</p>
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
    category: "Conducta",
    description:
      "El alumno interrumpio reiteradamente la clase de Matematica, desatendiendo los llamados de atencion del docente. Se le solicita al tutor reforzar las pautas de comportamiento en el aula.",
    sanction: {
      sanctionTypeName: "Apercibimiento",
      severity: 2,
      acknowledgment: {
        status: "PENDING",
        documentHash: "a1b2c3d4e5f6789012345678901234567890abcd",
      },
    },
  };

  const handleAcknowledge = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      verificationId: `SIG-${Date.now()}-a1b2c3d4`,
      documentHash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    };
  };

  const handleDispute = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Vista Previa - App Padres
        </h2>
        <p className="text-sm text-muted-foreground">
          Componente de firma digital
        </p>
      </div>
      <SanctionAcknowledgment
        record={mockRecord}
        onAcknowledge={handleAcknowledge}
        onDispute={handleDispute}
      />
    </div>
  );
}
