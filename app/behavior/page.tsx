"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileCheck,
  Fingerprint,
  Loader2,
  Clock,
  User,
  Plus,
  Search,
  MoreVertical,
  FileText,
  Send,
  Bell,
  PenLine,
  ShieldCheck,
  Hash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { getTodayLocalISO } from "@/lib/utils/date-utils";

// ============================================
// TYPES
// ============================================

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  course: string;
  division: string;
}

interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  category: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  sanctionType: string;
  status: "PENDING" | "ACKNOWLEDGED" | "DISPUTED";
  emittedBy: string;
  documentHash?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_STUDENTS: Student[] = [
  { id: "s1", firstName: "Martin", lastName: "Alvarez", course: "4to", division: "B" },
  { id: "s2", firstName: "Luciana", lastName: "Benitez", course: "4to", division: "B" },
  { id: "s3", firstName: "Santiago", lastName: "Cabrera", course: "4to", division: "B" },
  { id: "s4", firstName: "Valentina", lastName: "Dominguez", course: "4to", division: "B" },
  { id: "s5", firstName: "Tomas", lastName: "Fernandez", course: "4to", division: "B" },
];

const MOCK_RECORDS: BehaviorRecord[] = [
  {
    id: "br1",
    studentId: "s1",
    studentName: "Martin Alvarez",
    date: "2026-05-20",
    category: "Disciplina",
    description: "Uso indebido del celular durante la evaluacion de Matematica.",
    severity: 2,
    sanctionType: "Amonestacion Escrita",
    status: "PENDING",
    emittedBy: "Prof. Rodriguez",
  },
  {
    id: "br2",
    studentId: "s3",
    studentName: "Santiago Cabrera",
    date: "2026-05-18",
    category: "Convivencia",
    description: "Altercado verbal con companero durante el recreo.",
    severity: 3,
    sanctionType: "Llamado de Atencion",
    status: "ACKNOWLEDGED",
    emittedBy: "Preceptor Gomez",
    documentHash: "a3f2c1d8e9b0f4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
  },
];

const SANCTION_TYPES = [
  "Llamado de Atencion",
  "Amonestacion Escrita",
  "Apercibimiento",
  "Suspension Parcial",
  "Suspension Total",
];

const CATEGORIES = [
  "Disciplina",
  "Convivencia",
  "Conducta Academica",
  "Faltas de Respeto",
  "Incumplimiento Normativo",
];

const SEVERITY_CONFIG = {
  1: { label: "Leve", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  2: { label: "Moderada", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  3: { label: "Seria", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  4: { label: "Grave", color: "bg-red-600/20 text-red-300 border-red-600/30" },
  5: { label: "Muy Grave", color: "bg-red-700/30 text-red-200 border-red-700/30" },
} as const;

// ============================================
// ADMIN/PRECEPTOR VIEW - EMISSION PANEL
// ============================================

function AdminView() {
  const [students] = useState<Student[]>(MOCK_STUDENTS);
  const [records, setRecords] = useState<BehaviorRecord[]>(MOCK_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEmitDialogOpen, setIsEmitDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    sanctionType: "",
    severity: "2" as string,
    description: "",
  });

  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmitSanction = async () => {
    if (!selectedStudent || !formData.category || !formData.sanctionType || !formData.description) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const newRecord: BehaviorRecord = {
      id: `br-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        date: getTodayLocalISO(),
      category: formData.category,
      description: formData.description,
      severity: parseInt(formData.severity) as 1 | 2 | 3 | 4 | 5,
      sanctionType: formData.sanctionType,
      status: "PENDING",
      emittedBy: "Secretaria",
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsSubmitting(false);
    setIsEmitDialogOpen(false);
    setSelectedStudent(null);
    setFormData({ category: "", sanctionType: "", severity: "2", description: "" });

    toast.success("Acta emitida exitosamente. La familia recibira la notificacion.");
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <Input
            placeholder="Buscar alumno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.02] border-white/10"
          />
        </div>
        <Button
          onClick={() => setIsEmitDialogOpen(true)}
          className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-semibold"
        >
          <Plus className="size-4 mr-2" />
          Emitir Acta / Sancion
        </Button>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Alumno</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Curso</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">Actas Pendientes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredStudents.map((student) => {
              const pendingCount = records.filter(
                (r) => r.studentId === student.id && r.status === "PENDING"
              ).length;

              return (
                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-[#d0bcff]/10 flex items-center justify-center text-xs font-bold text-[#d0bcff]">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <span className="font-medium text-[#e4e1ea]">
                        {student.lastName}, {student.firstName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {student.course} "{student.division}"
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        <Clock className="size-3" />
                        {pendingCount}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsEmitDialogOpen(true);
                          }}
                          className="text-[#e4e1ea] focus:bg-white/5"
                        >
                          <FileText className="size-4 mr-2" />
                          Emitir Acta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Records */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Actas Recientes</h3>
        <div className="grid gap-3">
          {records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[#e4e1ea]">{record.studentName}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      SEVERITY_CONFIG[record.severity].color
                    )}>
                      {SEVERITY_CONFIG[record.severity].label}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">{record.sanctionType}</p>
                  <p className="text-xs text-white/40 mt-1">{record.date} - {record.emittedBy}</p>
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  record.status === "ACKNOWLEDGED" && "bg-[#4de082]/20 text-[#4de082]",
                  record.status === "PENDING" && "bg-amber-500/20 text-amber-400",
                  record.status === "DISPUTED" && "bg-red-500/20 text-red-400"
                )}>
                  {record.status === "ACKNOWLEDGED" && "Firmada"}
                  {record.status === "PENDING" && "Pendiente"}
                  {record.status === "DISPUTED" && "Disputada"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emit Dialog - NO PIN required for Admin/Preceptor */}
      <Dialog open={isEmitDialogOpen} onOpenChange={setIsEmitDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea]">Emitir Acta Disciplinaria</DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedStudent
                ? `Registrar sancion para ${selectedStudent.firstName} ${selectedStudent.lastName}`
                : "Complete los datos de la sancion"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedStudent && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Alumno</label>
                <Select onValueChange={(val) => setSelectedStudent(students.find((s) => s.id === val) || null)}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar alumno" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.lastName}, {s.firstName} - {s.course} "{s.division}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Categoria</label>
                <Select value={formData.category} onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Tipo de Sancion</label>
                <Select value={formData.sanctionType} onValueChange={(val) => setFormData((p) => ({ ...p, sanctionType: val }))}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {SANCTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Gravedad</label>
              <Select value={formData.severity} onValueChange={(val) => setFormData((p) => ({ ...p, severity: val }))}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {([1, 2, 3, 4, 5] as const).map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      <span className={cn("px-2 py-0.5 rounded text-xs border", SEVERITY_CONFIG[s].color)}>
                        {SEVERITY_CONFIG[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Descripcion de los Hechos</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describa detalladamente la situacion..."
                className="min-h-[100px] bg-white/[0.02] border-white/10 resize-none"
              />
            </div>

            {/* Info: No PIN required for staff */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
              <Shield className="size-4 text-[#d0bcff] mt-0.5 shrink-0" />
              <p className="text-xs text-white/60">
                Su sesion autenticada actua como firma emisora. No se requiere PIN adicional.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEmitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEmitSanction}
              disabled={isSubmitting || !selectedStudent}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Emitiendo...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Emitir Acta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// FAMILY VIEW - SIGNATURE PANEL
// ============================================

function FamilyView() {
  const [records] = useState<BehaviorRecord[]>(MOCK_RECORDS.filter((r) => r.status === "PENDING"));
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewState, setViewState] = useState<"list" | "pin" | "success">("list");

  const canSubmitSignature = consentAccepted && signatureName.trim().length > 0;

  const handleStartSignature = (record: BehaviorRecord) => {
    setSelectedRecord(record);
    setConsentAccepted(false);
    setSignatureName("");
    setViewState("pin");
  };

  const handleSignature = async () => {
    if (!canSubmitSignature) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setViewState("success");

    toast.success("Documento sellado criptograficamente y archivado.");
  };

  return (
    <div className="space-y-6">
      {/* Pending Notifications Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Bell className="size-5 text-amber-400" />
        <div>
          <p className="font-medium text-[#e4e1ea]">Notificaciones Pendientes</p>
          <p className="text-xs text-white/50">
            {records.length} documento(s) requieren su firma digital
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {records.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <CheckCircle2 className="size-12 mx-auto mb-4 text-[#4de082]" />
                <p>No tiene notificaciones pendientes</p>
              </div>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="size-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          SEVERITY_CONFIG[record.severity].color
                        )}>
                          {SEVERITY_CONFIG[record.severity].label}
                        </span>
                        <span className="text-xs text-white/40">{record.date}</span>
                      </div>
                      <h4 className="font-semibold text-[#e4e1ea]">{record.sanctionType}</h4>
                      <p className="text-sm text-white/60 mt-1">{record.studentName}</p>
                      <p className="text-sm text-white/50 mt-2 italic">{record.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <Button
                      onClick={() => handleStartSignature(record)}
                      className="w-full h-12 bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-semibold"
                    >
                      <Fingerprint className="size-5 mr-2" />
                      Firmar en Conformidad
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {viewState === "pin" && selectedRecord && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md space-y-5 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-[#d0bcff]/10 border border-[#d0bcff]/20 shadow-[0_0_25px_rgba(168,85,247,0.20)]">
                <PenLine className="size-10 text-[#d0bcff]" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-[#e4e1ea]">Consentimiento y Firma Digital</h3>
              <p className="text-sm text-white/50 mt-1">
                Confirme su identidad mediante firma electronica
              </p>
            </div>

            {/* Advertencia legal */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <div className="flex items-start gap-2">
                <FileCheck className="size-4 text-[#d0bcff] mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Declaro bajo juramento que los datos ingresados son correctos y que he sido{" "}
                  <strong className="text-white/80">legalmente notificado</strong> de la presente
                  comunicacion, asumiendo la responsabilidad legal correspondiente. Este acuse tiene
                  validez legal conforme al Art. 284 del Codigo Civil y Comercial.
                </p>
              </div>
            </div>

            {/* Checkbox de consentimiento obligatorio */}
            <label
              htmlFor="esign-consent-behavior"
              className="flex items-start gap-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 p-3 cursor-pointer hover:bg-[#d0bcff]/10 transition-colors"
            >
              <Checkbox
                id="esign-consent-behavior"
                checked={consentAccepted}
                onCheckedChange={(v) => setConsentAccepted(v === true)}
                disabled={isProcessing}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[#d0bcff] data-[state=checked]:border-[#d0bcff] data-[state=checked]:text-[#1a1a2e]"
              />
              <span className="text-xs font-medium text-[#e4e1ea] leading-snug">
                Acepto los terminos y firmo digitalmente
              </span>
            </label>

            {/* Firma manuscrita */}
            <div className="space-y-1.5">
              <Label htmlFor="esign-name-behavior" className="text-xs text-white/50">
                Nombre y Apellido Completo <span className="text-red-400">*</span>
              </Label>
              <Input
                id="esign-name-behavior"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={isProcessing}
                placeholder="Escriba su nombre completo como firma"
                autoComplete="off"
                className="h-11 bg-white/[0.02] border-white/10 font-serif italic text-base text-[#e4e1ea] placeholder:not-italic placeholder:font-sans placeholder:text-sm"
              />
            </div>

            {isProcessing && (
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="size-12 rounded-full border-2 border-[#d0bcff]/20" />
                    <div className="absolute inset-0 size-12 rounded-full border-2 border-transparent border-t-[#d0bcff] animate-spin" />
                    <Hash className="absolute inset-0 m-auto size-5 text-[#d0bcff]" />
                  </div>
                </div>
                <p className="text-sm text-white/60">Sellando documento...</p>
              </div>
            )}

            <Button
              onClick={handleSignature}
              disabled={!canSubmitSignature || isProcessing}
              className="w-full h-12 bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 font-semibold gap-2 disabled:opacity-40"
            >
              <ShieldCheck className="size-5" />
              Confirmar y Sellar Documento
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setViewState("list");
                setConsentAccepted(false);
                setSignatureName("");
              }}
              disabled={isProcessing}
              className="w-full text-white/50"
            >
              Cancelar
            </Button>
          </motion.div>
        )}

        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl border border-[#4de082]/20 bg-[#4de082]/5 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="p-5 rounded-full bg-[#4de082]/20 border border-[#4de082]/30">
                <CheckCircle2 className="size-12 text-[#4de082]" />
              </div>
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-[#4de082]">FIRMADO</h3>
              <p className="text-sm text-white/60 mt-1">
                Documento firmado digitalmente con exito
              </p>
            </div>

            <Button
              onClick={() => {
                setViewState("list");
                setSelectedRecord(null);
              }}
              variant="outline"
              className="border-[#4de082]/30 text-[#4de082] hover:bg-[#4de082]/10"
            >
              Volver a Notificaciones
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Info */}
      <div className="rounded-xl border border-[#d0bcff]/20 bg-[#d0bcff]/5 p-4">
        <h3 className="mb-2 font-medium text-[#d0bcff]">Sistema de Firma Digital Unificada</h3>
        <ul className="space-y-1 text-xs text-[#d0bcff]/70 font-mono">
          <li>&gt; Hash SHA-256 del contenido para integridad</li>
          <li>&gt; Validacion bajo el Art. 284 del CCyCN</li>
          <li>&gt; Captura de IP, User-Agent y dispositivo</li>
          <li>&gt; Timestamp generado en servidor</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function BehaviorPage() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || "ADMIN";
    setCurrentRole(role);
  }, [activeContext]);

  if (!mounted || !currentRole) return null;

  const isAdmin = currentRole === "ADMIN";
  const isPreceptor = currentRole === "PRECEPTOR";
  const isFamilia = currentRole === "FAMILIA";
  const showAdminView = isAdmin || isPreceptor;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            {showAdminView ? "Gabinete y Convivencia" : "Notificaciones Disciplinarias"}
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {showAdminView
              ? "Emision y seguimiento de actas disciplinarias"
              : "Notificaciones pendientes de firma digital"}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          showAdminView
            ? "bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-[#d0bcff]"
            : "bg-[#4de082]/10 border border-[#4de082]/20 text-[#4de082]"
        )}>
          <Shield className="size-3.5" />
          Vista: {currentRole}
        </div>
      </header>

      <main className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
        {showAdminView ? <AdminView /> : <FamilyView />}
      </main>

      <Toaster theme="dark" />
    </div>
  );
}
