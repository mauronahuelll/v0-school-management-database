"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Upload, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Image as ImageIcon,
  FileCheck,
  XCircle,
  User,
  Calendar,
  Loader2,
  Shield,
  ChevronRight,
  AlertTriangle,
  Check,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ============================================
// TYPES
// ============================================

type DocumentStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  fileType: "PDF" | "IMAGE";
  fileName?: string;
  uploadedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

interface SubmittedDocument {
  id: string;
  documentId: string;
  documentName: string;
  studentName: string;
  studentLegajo: string;
  fileName: string;
  fileType: "PDF" | "IMAGE";
  uploadedAt: Date;
  status: DocumentStatus;
  reviewedAt?: Date;
  rejectionReason?: string;
}

// ============================================
// MOCK DATA - FAMILY VIEW
// ============================================

const INITIAL_REQUIRED_DOCS: RequiredDocument[] = [
  {
    id: "doc-1",
    name: "DNI Frente",
    description: "Imagen clara del frente del DNI del alumno",
    status: "APPROVED",
    fileType: "IMAGE",
    fileName: "dni_frente_martinez.jpg",
    uploadedAt: new Date("2025-02-15"),
    reviewedAt: new Date("2025-02-16"),
  },
  {
    id: "doc-2",
    name: "DNI Dorso",
    description: "Imagen clara del dorso del DNI del alumno",
    status: "APPROVED",
    fileType: "IMAGE",
    fileName: "dni_dorso_martinez.jpg",
    uploadedAt: new Date("2025-02-15"),
    reviewedAt: new Date("2025-02-16"),
  },
  {
    id: "doc-3",
    name: "Ficha Medica / Apto Fisico",
    description: "Certificado medico vigente (menos de 1 ano)",
    status: "SUBMITTED",
    fileType: "PDF",
    fileName: "apto_fisico_2025.pdf",
    uploadedAt: new Date("2025-03-10"),
  },
  {
    id: "doc-4",
    name: "Autorizacion de Retiro",
    description: "Formulario firmado con personas autorizadas",
    status: "REJECTED",
    fileType: "PDF",
    fileName: "autorizacion_retiro.pdf",
    uploadedAt: new Date("2025-03-08"),
    reviewedAt: new Date("2025-03-09"),
    rejectionReason: "Falta firma del tutor en la segunda pagina",
  },
  {
    id: "doc-5",
    name: "Constancia CUIL",
    description: "Constancia de CUIL del alumno",
    status: "PENDING",
    fileType: "PDF",
  },
  {
    id: "doc-6",
    name: "Certificado de Vacunacion",
    description: "Carnet de vacunacion actualizado",
    status: "PENDING",
    fileType: "IMAGE",
  },
];

// ============================================
// MOCK DATA - SECRETARY VIEW
// ============================================

const INITIAL_SUBMITTED_DOCS: SubmittedDocument[] = [
  {
    id: "sub-1",
    documentId: "doc-3",
    documentName: "Ficha Medica / Apto Fisico",
    studentName: "Luciana Martinez",
    studentLegajo: "2025-001",
    fileName: "apto_fisico_2025.pdf",
    fileType: "PDF",
    uploadedAt: new Date("2025-03-10"),
    status: "SUBMITTED",
  },
  {
    id: "sub-2",
    documentId: "doc-7",
    documentName: "DNI Frente",
    studentName: "Tomas Fernandez",
    studentLegajo: "2025-015",
    fileName: "dni_frente_fernandez.jpg",
    fileType: "IMAGE",
    uploadedAt: new Date("2025-03-12"),
    status: "SUBMITTED",
  },
  {
    id: "sub-3",
    documentId: "doc-8",
    documentName: "Autorizacion de Retiro",
    studentName: "Valentina Castro",
    studentLegajo: "2025-003",
    fileName: "autorizacion_retiro_castro.pdf",
    fileType: "PDF",
    uploadedAt: new Date("2025-03-11"),
    status: "SUBMITTED",
  },
  {
    id: "sub-4",
    documentId: "doc-9",
    documentName: "Certificado de Vacunacion",
    studentName: "Lucas Diaz",
    studentLegajo: "2025-004",
    fileName: "vacunas_diaz.jpg",
    fileType: "IMAGE",
    uploadedAt: new Date("2025-03-09"),
    status: "SUBMITTED",
  },
];

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = {
    PENDING: { label: "Pendiente", color: "bg-[#ffb4ab]/20 text-[#ffb4ab]", icon: Clock },
    SUBMITTED: { label: "Enviado", color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
    APPROVED: { label: "Aprobado", color: "bg-[#4de082]/20 text-[#4de082]", icon: CheckCircle2 },
    REJECTED: { label: "Rechazado", color: "bg-red-500/20 text-red-400", icon: XCircle },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase", color)}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}

// ============================================
// FAMILY VIEW COMPONENT
// ============================================

function FamilyView() {
  const [documents, setDocuments] = useState<RequiredDocument[]>(INITIAL_REQUIRED_DOCS);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (docId: string, file?: File) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    setUploadingId(docId);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setDocuments(prev => prev.map(d => 
      d.id === docId 
        ? { 
            ...d, 
            status: "SUBMITTED" as const, 
            fileName: file?.name || `documento_${docId}.pdf`,
            uploadedAt: new Date(),
            rejectionReason: undefined,
          }
        : d
    ));
    
    setUploadingId(null);
    toast.success(`"${doc.name}" enviado a revision`, {
      description: "Secretaria revisara el documento en las proximas 48hs",
    });
  }, [documents]);

  const handleDrop = useCallback((e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(docId, file);
    }
  }, [handleFileUpload]);

  // Stats
  const stats = {
    total: documents.length,
    approved: documents.filter(d => d.status === "APPROVED").length,
    pending: documents.filter(d => d.status === "PENDING" || d.status === "REJECTED").length,
    submitted: documents.filter(d => d.status === "SUBMITTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#e4e1ea]">Progreso de Documentacion</h3>
          <span className="text-xs text-white/40">
            {stats.approved}/{stats.total} completados
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4de082] transition-all duration-500"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#4de082]" />
            <span className="text-white/60">{stats.approved} aprobados</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-yellow-400" />
            <span className="text-white/60">{stats.submitted} en revision</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#ffb4ab]" />
            <span className="text-white/60">{stats.pending} pendientes</span>
          </span>
        </div>
      </div>

      {/* Alert Info */}
      <div className="p-3 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-start gap-3">
        <Shield className="size-4 text-[#d0bcff] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-[#d0bcff] font-medium">Documentacion Obligatoria</p>
          <p className="text-[11px] text-[#d0bcff]/70 mt-0.5">
            Toda la documentacion es requerida para completar la matricula. Los documentos rechazados deben ser reenviados.
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const isUploading = uploadingId === doc.id;
          const isDragOver = dragOverId === doc.id;
          const canUpload = doc.status === "PENDING" || doc.status === "REJECTED";
          
          return (
            <div 
              key={doc.id}
              className={cn(
                "rounded-xl border transition-all",
                doc.status === "APPROVED" && "bg-[#4de082]/5 border-[#4de082]/20",
                doc.status === "SUBMITTED" && "bg-yellow-500/5 border-yellow-500/20",
                doc.status === "REJECTED" && "bg-red-500/5 border-red-500/20",
                doc.status === "PENDING" && "bg-white/[0.02] border-white/5",
                isDragOver && "border-[#d0bcff] bg-[#d0bcff]/10"
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      doc.fileType === "PDF" ? "bg-red-500/10" : "bg-blue-500/10"
                    )}>
                      {doc.fileType === "PDF" ? (
                        <FileText className="size-4 text-red-400" />
                      ) : (
                        <ImageIcon className="size-4 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e4e1ea]">{doc.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{doc.description}</p>
                      {doc.fileName && (
                        <p className="text-[10px] text-white/30 mt-1 font-mono">{doc.fileName}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>

                {/* Rejection Reason */}
                {doc.status === "REJECTED" && doc.rejectionReason && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-red-400 uppercase">Motivo del Rechazo</p>
                        <p className="text-xs text-red-300/80 mt-0.5">{doc.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Zone */}
                {canUpload && (
                  <div 
                    className={cn(
                      "mt-3 p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer",
                      isDragOver 
                        ? "border-[#d0bcff] bg-[#d0bcff]/10" 
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(doc.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleDrop(e, doc.id)}
                    onClick={() => !isUploading && handleFileUpload(doc.id)}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="size-4 animate-spin text-[#d0bcff]" />
                        <span className="text-xs text-[#d0bcff]">Subiendo documento...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Upload className="size-5 text-white/40" />
                        <p className="text-xs text-white/60">
                          Arrastra el archivo aqui o <span className="text-[#d0bcff]">haz clic para seleccionar</span>
                        </p>
                        <p className="text-[10px] text-white/30">
                          {doc.fileType === "PDF" ? "PDF hasta 5MB" : "JPG, PNG hasta 5MB"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved/Submitted Info */}
                {(doc.status === "APPROVED" || doc.status === "SUBMITTED") && doc.uploadedAt && (
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      Subido: {doc.uploadedAt.toLocaleDateString("es-AR")}
                    </span>
                    {doc.reviewedAt && (
                      <span className="flex items-center gap-1">
                        <FileCheck className="size-3" />
                        Revisado: {doc.reviewedAt.toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SECRETARY VIEW COMPONENT
// ============================================

function SecretaryView() {
  const [submissions, setSubmissions] = useState<SubmittedDocument[]>(INITIAL_SUBMITTED_DOCS);
  const [previewDoc, setPreviewDoc] = useState<SubmittedDocument | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<SubmittedDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = useCallback(async (docId: string) => {
    const doc = submissions.find(d => d.id === docId);
    if (!doc) return;

    setProcessingId(docId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmissions(prev => prev.map(d => 
      d.id === docId 
        ? { ...d, status: "APPROVED" as const, reviewedAt: new Date() }
        : d
    ));

    setProcessingId(null);
    toast.success(`Documento aprobado`, {
      description: `Se notifico a la familia de ${doc.studentName}`,
    });
  }, [submissions]);

  const handleReject = useCallback(async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;

    setProcessingId(rejectingDoc.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmissions(prev => prev.map(d => 
      d.id === rejectingDoc.id 
        ? { ...d, status: "REJECTED" as const, reviewedAt: new Date(), rejectionReason }
        : d
    ));

    toast.error(`Documento rechazado`, {
      description: `Se solicito reenvio a la familia de ${rejectingDoc.studentName}`,
    });

    setProcessingId(null);
    setRejectingDoc(null);
    setRejectionReason("");
  }, [rejectingDoc, rejectionReason]);

  // Stats
  const pendingCount = submissions.filter(d => d.status === "SUBMITTED").length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-2xl font-bold text-[#e4e1ea]">{submissions.length}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Recibidos</p>
        </div>
        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          <p className="text-[10px] text-yellow-400/60 uppercase tracking-wider">Por Revisar</p>
        </div>
        <div className="p-3 rounded-xl bg-[#4de082]/5 border border-[#4de082]/20">
          <p className="text-2xl font-bold text-[#4de082]">
            {submissions.filter(d => d.status === "APPROVED").length}
          </p>
          <p className="text-[10px] text-[#4de082]/60 uppercase tracking-wider">Aprobados</p>
        </div>
      </div>

      {/* Alert */}
      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
        <AlertTriangle className="size-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-300/80">
          <span className="font-medium text-yellow-400">{pendingCount} documentos</span> requieren revision. 
          Las familias seran notificadas automaticamente de cada decision.
        </p>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Alumno</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Documento</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Fecha</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Estado</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.map((doc) => {
                const isProcessing = processingId === doc.id;
                const isReviewed = doc.status !== "SUBMITTED";

                return (
                  <tr 
                    key={doc.id}
                    className={cn(
                      "transition-colors",
                      isReviewed ? "opacity-60" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#d0bcff]/10 flex items-center justify-center">
                          <User className="size-4 text-[#d0bcff]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e4e1ea]">{doc.studentName}</p>
                          <p className="text-[10px] text-white/40">{doc.studentLegajo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {doc.fileType === "PDF" ? (
                          <FileText className="size-4 text-red-400" />
                        ) : (
                          <ImageIcon className="size-4 text-blue-400" />
                        )}
                        <div>
                          <p className="text-sm text-[#e4e1ea]">{doc.documentName}</p>
                          <p className="text-[10px] text-white/30 font-mono">{doc.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-white/60">
                        {doc.uploadedAt.toLocaleDateString("es-AR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="size-4" />
                        </Button>
                        
                        {!isReviewed && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(doc.id)}
                              disabled={isProcessing}
                              className="h-8 bg-[#4de082]/20 text-[#4de082] hover:bg-[#4de082]/30 border-0"
                            >
                              {isProcessing ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setRejectingDoc(doc)}
                              disabled={isProcessing}
                              className="h-8 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                            >
                              <X className="size-3" />
                            </Button>
                          </>
                        )}

                        {isReviewed && doc.reviewedAt && (
                          <span className="text-[10px] text-white/40">
                            {doc.reviewedAt.toLocaleDateString("es-AR")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea]">Previsualizacion de Documento</DialogTitle>
            <DialogDescription className="text-white/60">
              {previewDoc?.documentName} - {previewDoc?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[4/3] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {previewDoc?.fileType === "PDF" ? (
              <div className="text-center">
                <FileText className="size-16 text-red-400/40 mx-auto mb-3" />
                <p className="text-sm text-white/40">Vista previa de PDF</p>
                <p className="text-xs text-white/30 font-mono mt-1">{previewDoc.fileName}</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="size-16 text-blue-400/40 mx-auto mb-3" />
                <p className="text-sm text-white/40">Vista previa de imagen</p>
                <p className="text-xs text-white/30 font-mono mt-1">{previewDoc?.fileName}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectingDoc} onOpenChange={() => { setRejectingDoc(null); setRejectionReason(""); }}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea]">Rechazar Documento</DialogTitle>
            <DialogDescription className="text-white/60">
              Indica el motivo del rechazo para que la familia pueda corregirlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-sm text-[#e4e1ea]">{rejectingDoc?.documentName}</p>
              <p className="text-xs text-white/40">{rejectingDoc?.studentName}</p>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1.5 block">Motivo del Rechazo *</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: Foto borrosa, falta firma, documento vencido..."
                className="bg-white/[0.02] border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setRejectingDoc(null); setRejectionReason(""); }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId === rejectingDoc?.id}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {processingId === rejectingDoc?.id ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Rechazando...
                </>
              ) : (
                "Rechazar Documento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ProceduresPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Gestor Documental
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Documentacion obligatoria y auditoria de legajos
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Building2 className="size-4" />
          <span>Instituto Padre Marquez</span>
          <ChevronRight className="size-3" />
          <span>Ciclo 2025</span>
        </div>
      </header>

      {/* View Selector Tabs */}
      <Tabs defaultValue="family" className="w-full">
        <TabsList className="w-full md:w-auto bg-white/[0.02] border border-white/5 p-1">
          <TabsTrigger 
            value="family" 
            className="flex-1 md:flex-none data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff]"
          >
            <User className="size-4 mr-2" />
            Vista Familia
          </TabsTrigger>
          <TabsTrigger 
            value="secretary"
            className="flex-1 md:flex-none data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff]"
          >
            <Shield className="size-4 mr-2" />
            Vista Secretaria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="mt-6">
          <FamilyView />
        </TabsContent>

        <TabsContent value="secretary" className="mt-6">
          <SecretaryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
