"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  GraduationCap,
  AlertTriangle,
  FileUp,
  UserPlus,
  Trash2,
  CheckCircle2,
  Database,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Available courses for global assignment
const COURSES = [
  { id: "1A", label: "1° A" },
  { id: "1B", label: "1° B" },
  { id: "2A", label: "2° A" },
  { id: "2B", label: "2° B" },
  { id: "3A", label: "3° A" },
  { id: "3B", label: "3° B" },
  { id: "4A", label: "4° A" },
  { id: "5A", label: "5° A" },
  { id: "6A", label: "6° A" },
];

// Student row type
interface StudentRow {
  id: string;
  apellido: string;
  nombre: string;
  documento: string;
  fechaNacimiento: string;
  contacto: string;
  emailTutor1: string;
}

// Simulated parsed data from an uploaded CSV/Excel file
const SIMULATED_IMPORT: Omit<StudentRow, "id">[] = [
  { apellido: "Martinez", nombre: "Juan Pablo", documento: "45.678.901", fechaNacimiento: "2010-03-15", contacto: "11-4567-8901", emailTutor1: "padre.martinez@email.com" },
  { apellido: "Gomez", nombre: "Maria Sol", documento: "46.123.456", fechaNacimiento: "2011-07-22", contacto: "11-4567-8901", emailTutor1: "laura.gomez@email.com" },
  { apellido: "Rodriguez", nombre: "Lucas Martin", documento: "45.987.654", fechaNacimiento: "2010-11-03", contacto: "11-5678-9012", emailTutor1: "madre.rodriguez@email.com" },
  { apellido: "Fernandez", nombre: "Valentina", documento: "47.456.789", fechaNacimiento: "2011-01-30", contacto: "11-2345-6789", emailTutor1: "fernandez.flia@email.com" },
  { apellido: "Lopez", nombre: "Mateo", documento: "46.789.012", fechaNacimiento: "2010-09-18", contacto: "11-6789-0123", emailTutor1: "familia.lopez@email.com" },
  { apellido: "Diaz", nombre: "Catalina", documento: "47.234.567", fechaNacimiento: "2011-05-12", contacto: "11-9876-5432", emailTutor1: "diaz.tutor@email.com" },
  { apellido: "Sanchez", nombre: "Benjamin", documento: "45.345.678", fechaNacimiento: "2010-12-25", contacto: "11-3456-7891", emailTutor1: "tutor.sanchez@email.com" },
  { apellido: "Romero", nombre: "Isabella", documento: "46.567.890", fechaNacimiento: "2011-08-07", contacto: "11-3456-7890", emailTutor1: "romero.familia@email.com" },
];

let rowCounter = 0;
const makeId = () => `row-${Date.now()}-${rowCounter++}`;

const EDITABLE_FIELDS: (keyof Omit<StudentRow, "id">)[] = [
  "apellido",
  "nombre",
  "documento",
  "fechaNacimiento",
  "contacto",
  "emailTutor1",
];

export default function AdminImportPage() {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [targetCourse, setTargetCourse] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const lastRowRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate parsing an uploaded file
  const handleSimulateUpload = useCallback(() => {
    setFileName("nomina_alumnos_2024.csv");
    setHasFile(true);
    setRows(SIMULATED_IMPORT.map((r) => ({ ...r, id: makeId() })));
    toast.success("Archivo procesado. Revisa la vista previa antes de matricular.");
  }, []);

  // Add a blank editable row for manual fast entry
  const handleAddManualRow = useCallback(() => {
    const newRow: StudentRow = {
      id: makeId(),
      apellido: "",
      nombre: "",
      documento: "",
      fechaNacimiento: "",
      contacto: "",
      emailTutor1: "",
    };
    setRows((prev) => [...prev, newRow]);
    setHasFile(true);
    // Focus the new row's first input on next tick
    requestAnimationFrame(() => {
      lastRowRef.current?.focus();
    });
  }, []);

  // Update a cell value
  const handleCellChange = useCallback(
    (rowId: string, field: keyof Omit<StudentRow, "id">, value: string) => {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
      );
    },
    []
  );

  // Remove a row
  const handleRemoveRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }, []);

  // Tab on the last cell of the last row creates a new row (Excel-like flow)
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, fieldIndex: number) => {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = fieldIndex === EDITABLE_FIELDS.length - 1;
      if (e.key === "Tab" && !e.shiftKey && isLastRow && isLastField) {
        e.preventDefault();
        handleAddManualRow();
      }
    },
    [rows.length, handleAddManualRow]
  );

  // Process the mass enrollment
  const handleProcess = useCallback(() => {
    if (rows.length === 0) {
      toast.error("No hay alumnos para matricular.");
      return;
    }
    if (!targetCourse) {
      toast.error("Selecciona el curso de destino antes de procesar.");
      return;
    }
    const incomplete = rows.filter((r) => !r.apellido.trim() || !r.nombre.trim() || !r.documento.trim());
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} fila(s) sin Apellido, Nombre o DNI. Completa los datos obligatorios.`);
      return;
    }

    const count = rows.length;
    const withEmail = rows.filter((r) => r.emailTutor1.trim()).length;

    // Descriptive multi-step processing sequence (1s per step)
    const steps = [
      "Validando datos del alumnado...",
      `Registrando ${count} legajos en la base de datos...`,
      `Generando accesos y enviando ${withEmail} invitaciones a familias...`,
    ];

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep(steps[0]);

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep += 1;
      if (currentStep < steps.length) {
        setProcessingStep(steps[currentStep]);
      }
    }, 1000);

    // Progress bar advances smoothly across the full ~3s sequence
    const totalDuration = steps.length * 1000;
    const tick = 50;
    const increment = 100 / (totalDuration / tick);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, tick);

    // Finalize after the full sequence completes
    setTimeout(() => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep("");
        setHasFile(false);
        setFileName("");
        setRows([]);
        setTargetCourse("");
        setProgress(0);
        toast.success(
          "Matriculacion exitosa. Se han enviado las credenciales de acceso a los correos de los tutores responsables."
        );
      }, 400);
    }, totalDuration);
  }, [rows, targetCourse]);

  // Reset everything
  const handleClear = useCallback(() => {
    setHasFile(false);
    setFileName("");
    setRows([]);
    setTargetCourse("");
  }, []);

  if (!mounted) return null;

  const filledCount = rows.filter((r) => r.apellido.trim() && r.nombre.trim() && r.documento.trim()).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Centro de Matriculacion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importacion masiva por archivo o carga manual rapida de alumnos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleAddManualRow}
            className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-foreground"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Alumno
          </Button>
        </div>
      </header>

      {/* Prevention banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400">Evita duplicacion de legajos</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Asegurese de que el archivo no contenga alumnos que ya fueron promovidos desde el nivel
            anterior (Jardin / Primaria). Esos legajos ya existen en el sistema y se duplicarian.
          </p>
        </div>
      </div>

      {/* Upload zone - only when no data loaded yet */}
      {!hasFile && (
        <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl p-6 md:p-8">
          <div
            className={cn(
              "relative min-h-[280px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group",
              isDragging
                ? "border-[#d0bcff] bg-[#d0bcff]/5"
                : "border-white/20 hover:border-white/40 hover:bg-white/[0.02]"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSimulateUpload();
            }}
            onClick={handleSimulateUpload}
          >
            <div className="flex flex-col items-center gap-4 p-8">
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center transition-all",
                  isDragging ? "bg-[#d0bcff]/20 scale-110" : "bg-white/5 group-hover:bg-white/10"
                )}
              >
                <Upload
                  className={cn(
                    "w-10 h-10 transition-colors",
                    isDragging ? "text-[#d0bcff]" : "text-white/40 group-hover:text-white/60"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground">
                  Arrastra el archivo Excel o CSV aqui
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz clic para seleccionar la nomina de alumnos
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4" />
                <span>.xlsx, .xls, .csv</span>
                <span className="text-white/20">|</span>
                <span>Maximo 10MB</span>
              </div>
            </div>
          </div>

          {/* Divider + manual fallback */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={handleSimulateUpload}
              className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold w-full sm:w-auto"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Simular Carga de Archivo
            </Button>
            <Button
              variant="outline"
              onClick={handleAddManualRow}
              className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-foreground w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cargar Manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Data preview + inline editing */}
      {hasFile && (
        <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 md:p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4de082]/10 border border-[#4de082]/20 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-[#4de082]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  Vista Previa de Datos
                  {fileName && (
                    <span className="text-xs font-normal text-muted-foreground font-mono">
                      ({fileName})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} alumno(s) · {filledCount} con datos completos
                </p>
              </div>
            </div>

            {/* Global course mapping */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground whitespace-nowrap hidden md:flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#d0bcff]" />
                Asignar todos al curso:
              </label>
              <Select value={targetCourse} onValueChange={setTargetCourse}>
                <SelectTrigger
                  className={cn(
                    "bg-white/[0.02] border-white/10 min-w-[140px]",
                    !targetCourse && "text-muted-foreground"
                  )}
                >
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {COURSES.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="text-foreground">
                      {course.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Editable grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-10">#</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Apellido <span className="text-amber-400">*</span></th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre <span className="text-amber-400">*</span></th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documento (DNI) <span className="text-amber-400">*</span></th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha Nac.</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contacto</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Tutor 1 <span className="text-amber-400">*</span></th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => {
                  const isLastRow = rowIndex === rows.length - 1;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors group"
                    >
                      <td className="px-4 py-1 text-xs text-muted-foreground font-mono">
                        {rowIndex + 1}
                      </td>
                      {EDITABLE_FIELDS.map((field, fieldIndex) => (
                        <td key={field} className="px-1 py-1">
                          <input
                            ref={isLastRow && fieldIndex === 0 ? lastRowRef : undefined}
                            type={
                              field === "fechaNacimiento"
                                ? "date"
                                : field === "emailTutor1"
                                ? "email"
                                : "text"
                            }
                            value={row[field]}
                            onChange={(e) => handleCellChange(row.id, field, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, fieldIndex)}
                            placeholder={
                              field === "apellido"
                                ? "Apellido"
                                : field === "nombre"
                                ? "Nombre"
                                : field === "documento"
                                ? "00.000.000"
                                : field === "contacto"
                                ? "Telefono"
                                : field === "emailTutor1"
                                ? "tutor@email.com"
                                : ""
                            }
                            className={cn(
                              "w-full bg-transparent rounded-md px-2.5 py-2 text-sm text-foreground placeholder:text-white/20",
                              "border border-transparent hover:border-white/5",
                              "focus:outline-none focus:border-[#d0bcff]/40 focus:bg-[#d0bcff]/[0.04] transition-colors",
                              field === "documento" && "font-mono"
                            )}
                          />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row helper */}
          <button
            type="button"
            onClick={handleAddManualRow}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-muted-foreground hover:text-[#d0bcff] hover:bg-[#d0bcff]/[0.03] transition-colors border-b border-white/5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Agregar fila (o presiona Tab en el ultimo campo)
          </button>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Descartar Todo
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-[#4de082]" />
                {filledCount}/{rows.length} listos
              </div>
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Procesar Matricula Masiva
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar + descriptive step while processing */}
          {isProcessing && (
            <div className="px-4 md:px-6 pb-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#d0bcff]" aria-live="polite">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="font-medium">{processingStep}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      )}

      <Toaster theme="dark" />
    </div>
  );
}
