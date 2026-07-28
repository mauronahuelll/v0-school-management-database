"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, ChevronDown, ChevronRight, MessageSquare,
  AlertCircle, CheckCircle2, TrendingDown, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Role } from "@/lib/context/auth-context";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryStudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  t1: number | null;   // Trimestre 1
  t2: number | null;   // Trimestre 2
  t3: number | null;   // Trimestre 3
  average: number | null;
  observations: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — 3er Grado B
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PRIMARY_STUDENTS: PrimaryStudentRecord[] = [
  { id: "ps-1", firstName: "Agustina", lastName: "Bernal",   t1: 8, t2: 9,    t3: null, average: 8.5, observations: "" },
  { id: "ps-2", firstName: "Bruno",    lastName: "Castro",   t1: 6, t2: 5,    t3: null, average: 5.5, observations: "" },
  { id: "ps-3", firstName: "Camila",   lastName: "Flores",   t1: 10, t2: 9,   t3: null, average: 9.5, observations: "" },
  { id: "ps-4", firstName: "Diego",    lastName: "Gutierrez",t1: 7, t2: 7,    t3: null, average: 7.0, observations: "" },
  { id: "ps-5", firstName: "Elena",    lastName: "Herrera",  t1: 4, t2: 5,    t3: null, average: 4.5, observations: "" },
  { id: "ps-6", firstName: "Franco",   lastName: "Lopez",    t1: 9, t2: 10,   t3: null, average: 9.5, observations: "" },
  { id: "ps-7", firstName: "Giuliana", lastName: "Medina",   t1: 6, t2: 7,    t3: null, average: 6.5, observations: "" },
  { id: "ps-8", firstName: "Hernán",   lastName: "Nuñez",    t1: 8, t2: 8,    t3: null, average: 8.0, observations: "" },
];

const PERIODS = [
  { id: "t1", label: "1er Trimestre" },
  { id: "t2", label: "2do Trimestre" },
  { id: "t3", label: "3er Trimestre" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function gradeStatus(grade: number | null): "passing" | "risk" | "pending" {
  if (grade === null) return "pending";
  if (grade >= 6) return "passing";
  return "risk";
}

function GradeCell({ value }: { value: number | null }) {
  const status = gradeStatus(value);
  return (
    <span className={cn(
      "inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-bold tabular-nums",
      status === "passing" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      status === "risk"    && "bg-red-500/10 text-red-400 border border-red-500/20",
      status === "pending" && "bg-white/[0.03] text-white/25 border border-white/[0.06]",
    )}>
      {value !== null ? value.toFixed(1) : "—"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROW — expandible con campo de Observaciones Trimestrales
// ─────────────────────────────────────────────────────────────────────────────

function PrimaryStudentRow({
  record,
  index,
  isReadOnly,
  onObservationChange,
}: {
  record: PrimaryStudentRecord;
  index: number;
  isReadOnly: boolean;
  onObservationChange: (id: string, text: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localObs, setLocalObs] = useState(record.observations);
  const [isSaving, setIsSaving] = useState(false);
  const avgStatus = gradeStatus(record.average);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onObservationChange(record.id, localObs);
    setIsSaving(false);
    toast.success("Observaciones guardadas", {
      description: `${record.firstName} ${record.lastName}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "rounded-xl border overflow-hidden transition-colors duration-200",
        isExpanded
          ? "bg-white/[0.04] border-white/15"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/10",
      )}
    >
      {/* Main row */}
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3"
      >
        {/* Index */}
        <span className="text-[11px] text-white/20 w-5 shrink-0 text-right tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Name */}
        <span className="flex-1 text-left text-sm font-semibold text-[#e4e1ea] truncate">
          {record.lastName}, {record.firstName}
        </span>

        {/* Grades */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {PERIODS.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] uppercase tracking-widest text-white/20">{p.label.split(" ")[0]}</span>
              <GradeCell value={record[p.id as "t1" | "t2" | "t3"]} />
            </div>
          ))}
          <div className="w-px h-8 bg-white/[0.06] mx-1" />
          {/* Average */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-white/20">Prom.</span>
            <GradeCell value={record.average} />
          </div>
        </div>

        {/* Risk badge */}
        {avgStatus === "risk" && (
          <Badge className="hidden md:inline-flex items-center gap-1 bg-red-500/10 text-red-400 border-red-500/20 text-[10px] shrink-0">
            <TrendingDown className="size-2.5" />
            Riesgo
          </Badge>
        )}

        {/* Observation indicator */}
        {record.observations && (
          <MessageSquare className="size-3.5 text-[#d0bcff]/50 shrink-0 hidden sm:block" />
        )}

        <ChevronRight className={cn(
          "size-4 text-white/20 shrink-0 transition-transform duration-200",
          isExpanded && "rotate-90",
        )} />
      </button>

      {/* Expanded: observations textarea */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="px-4 pb-4"
        >
          <Separator className="mb-4 bg-white/[0.06]" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20">
                <MessageSquare className="size-3.5 text-[#d0bcff]" />
              </div>
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                Observaciones Trimestrales
              </span>
            </div>
            <Textarea
              value={localObs}
              onChange={e => setLocalObs(e.target.value)}
              disabled={isReadOnly}
              placeholder="Redacta observaciones sobre el progreso académico, conductual y socioemocional del alumno/a durante el trimestre activo..."
              className="min-h-[100px] bg-white/[0.02] border-white/10 text-white/80 placeholder:text-white/20 text-sm resize-none focus:border-[#8a2be2]/50 focus:ring-0"
            />
            {!isReadOnly && (
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || localObs === record.observations}
                  className="gap-1.5 bg-gradient-to-r from-[#8A2BE2] to-[#5B6CF4] hover:from-[#9B3CF3] hover:to-[#6B7CF4] text-white text-xs shadow-[0_0_14px_rgba(138,43,226,0.3)] hover:shadow-[0_0_22px_rgba(138,43,226,0.5)] disabled:opacity-40 border-0"
                >
                  {isSaving ? "Guardando..." : "Guardar Observaciones"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — PrimaryGradesView
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryGradesViewProps {
  currentRole: Role | null;
}

export function PrimaryGradesView({ currentRole }: PrimaryGradesViewProps) {
  const isReadOnly = currentRole === "PRECEPTOR" || currentRole === "FAMILIA";
  const [students, setStudents] = useState<PrimaryStudentRecord[]>(MOCK_PRIMARY_STUDENTS);
  const [selectedPeriod, setSelectedPeriod] = useState("t2");

  const atRisk = students.filter(s => gradeStatus(s.average) === "risk").length;
  const passing = students.filter(s => gradeStatus(s.average) === "passing").length;

  const handleObservationChange = (id: string, text: string) => {
    setStudents(prev =>
      prev.map(s => s.id === id ? { ...s, observations: text } : s)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <BookOpen className="size-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
              Calificaciones — Nivel Primario
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              3er Grado B · Matematica · {PERIODS.find(p => p.id === selectedPeriod)?.label}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
                selectedPeriod === p.id
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stats chips */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{passing} aprobados</span>
        </div>
        {atRisk > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/[0.06] border border-red-500/15">
            <AlertCircle className="size-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">{atRisk} en riesgo</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#d0bcff]/[0.06] border border-[#d0bcff]/15">
          <Sparkles className="size-4 text-[#d0bcff]/70" />
          <span className="text-xs text-[#d0bcff]/70 font-medium">
            Observaciones trimestrales habilitadas — click en cada alumno
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="w-5 shrink-0" />
        <span className="flex-1 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Alumno</span>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {PERIODS.map(p => (
            <span key={p.id} className="w-16 text-center text-[10px] uppercase tracking-widest text-white/25 font-semibold">
              {p.label.split(" ")[0]}
            </span>
          ))}
          <span className="w-4 shrink-0" />
          <span className="w-16 text-center text-[10px] uppercase tracking-widest text-white/25 font-semibold">Prom.</span>
        </div>
        <span className="w-4 shrink-0" />
      </div>

      {/* Students list */}
      <div className="space-y-2">
        {students.map((student, i) => (
          <PrimaryStudentRow
            key={student.id}
            record={student}
            index={i}
            isReadOnly={isReadOnly}
            onObservationChange={handleObservationChange}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/10">
        <MessageSquare className="size-4 text-blue-400/50 shrink-0 mt-0.5" />
        <p className="text-xs text-white/35 leading-relaxed">
          Nivel Primario: Las calificaciones numericas conviven con el campo de Observaciones
          Trimestrales para un seguimiento integral. Haz clic en cualquier fila para desplegar
          el area de redaccion. Los registros se guardan individualmente por alumno.
        </p>
      </div>
    </div>
  );
}
