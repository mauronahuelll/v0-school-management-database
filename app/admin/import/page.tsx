"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Database,
  Link2,
  GraduationCap,
  Calendar,
  AlertCircle,
  Sparkles,
  FileUp,
  Table,
  CheckCircle2,
  XCircle,
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

// Simulated detected columns from the uploaded file
const DETECTED_COLUMNS = [
  { id: "col-1", name: "Nombre Completo", sample: "Martinez, Juan Pablo" },
  { id: "col-2", name: "Documento", sample: "45.678.901" },
  { id: "col-3", name: "Mail del Tutor", sample: "padre@email.com" },
  { id: "col-4", name: "Fecha de Nacimiento", sample: "15/03/2010" },
  { id: "col-5", name: "Direccion", sample: "Av. Mitre 1234" },
  { id: "col-6", name: "Telefono Emergencia", sample: "11-4567-8901" },
];

// System fields to map to
const SYSTEM_FIELDS = [
  { id: "identity.fullName", label: "Nombre Completo", icon: "user" },
  { id: "identity.dni", label: "DNI / Documento", icon: "id" },
  { id: "contact.tutorEmail", label: "Email del Tutor", icon: "mail" },
  { id: "identity.birthDate", label: "Fecha de Nacimiento", icon: "calendar" },
  { id: "contact.address", label: "Direccion", icon: "map" },
  { id: "contact.emergencyPhone", label: "Tel. Emergencia", icon: "phone" },
  { id: "skip", label: "-- Ignorar columna --", icon: "skip" },
];

// School levels
const SCHOOL_LEVELS = [
  { id: "INICIAL", label: "Nivel Inicial", years: "Sala 3 a 5" },
  { id: "PRIMARIA", label: "Nivel Primario", years: "1° a 6° Grado" },
  { id: "SECUNDARIA", label: "Nivel Secundario", years: "1° a 6° Ano" },
];

// School years
const SCHOOL_YEARS = [
  { id: "2024", label: "Ciclo Lectivo 2024" },
  { id: "2025", label: "Ciclo Lectivo 2025" },
  { id: "2026", label: "Ciclo Lectivo 2026" },
];

type ImportStep = "upload" | "mapping" | "config" | "processing" | "complete";

export default function AdminImportPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [progress, setProgress] = useState(0);
  const [recordCount] = useState(345);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle simulated file upload
  const handleSimulateUpload = useCallback(() => {
    setCurrentStep("mapping");
    toast.info("Archivo cargado. Detectando estructura de datos...");
  }, []);

  // Handle mapping change
  const handleMappingChange = useCallback((columnId: string, fieldId: string) => {
    setMappings((prev) => ({ ...prev, [columnId]: fieldId }));
  }, []);

  // Proceed to config step
  const handleProceedToConfig = useCallback(() => {
    const mappedCount = Object.values(mappings).filter((v) => v && v !== "skip").length;
    if (mappedCount < 2) {
      toast.error("Debes mapear al menos 2 columnas para continuar.");
      return;
    }
    setCurrentStep("config");
  }, [mappings]);

  // Start processing
  const handleStartProcessing = useCallback(() => {
    if (!selectedLevel) {
      toast.error("Selecciona un nivel escolar para continuar.");
      return;
    }
    
    setCurrentStep("processing");
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setCurrentStep("complete");
            toast.success(`Importacion finalizada. ${recordCount} legajos creados exitosamente.`);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  }, [selectedLevel, recordCount]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setCurrentStep("upload");
    setMappings({});
    setSelectedLevel("");
    setSelectedYear("2024");
    setProgress(0);
  }, []);

  // Hydration guard
  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Importador de Matricula
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Carga masiva de alumnos desde archivos Excel o CSV
          </p>
        </div>
        
        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-2">
          {["upload", "mapping", "config", "processing"].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  currentStep === step
                    ? "bg-[#d0bcff] text-[#131319]"
                    : ["mapping", "config", "processing", "complete"].indexOf(currentStep) > idx
                    ? "bg-[#4de082]/20 text-[#4de082] border border-[#4de082]/30"
                    : "bg-white/5 text-white/40 border border-white/10"
                )}
              >
                {["mapping", "config", "processing", "complete"].indexOf(currentStep) > idx ? (
                  <Check className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div
                  className={cn(
                    "w-8 h-px mx-1",
                    ["mapping", "config", "processing", "complete"].indexOf(currentStep) > idx
                      ? "bg-[#4de082]/50"
                      : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* Main content area */}
      <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl p-6 md:p-8">
        
        {/* STEP 1: Upload */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 mb-4">
                <FileSpreadsheet className="w-8 h-8 text-[#d0bcff]" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Cargar Nomina de Alumnos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sube un archivo Excel (.xlsx) o CSV con los datos de los estudiantes
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                "relative aspect-video max-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group",
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
                    isDragging
                      ? "bg-[#d0bcff]/20 scale-110"
                      : "bg-white/5 group-hover:bg-white/10"
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
                    Arrastra la nomina en formato Excel/CSV aqui
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    o haz clic para seleccionar el archivo
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>.xlsx, .xls, .csv</span>
                  <span className="text-white/20">|</span>
                  <span>Maximo 10MB</span>
                </div>
              </div>

              {/* Animated border effect */}
              {isDragging && (
                <div className="absolute inset-0 rounded-2xl pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-[#d0bcff]/10" />
                </div>
              )}
            </div>

            {/* Simulate button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSimulateUpload}
                className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold"
              >
                <FileUp className="w-4 h-4 mr-2" />
                Simular Carga de Archivo
              </Button>
            </div>

            {/* Info cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <Table className="w-5 h-5 text-[#d0bcff] mb-2" />
                <h3 className="text-sm font-bold text-foreground">Deteccion Automatica</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  El sistema analiza la estructura del archivo y sugiere mapeos
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <Database className="w-5 h-5 text-[#4de082] mb-2" />
                <h3 className="text-sm font-bold text-foreground">Validacion de Datos</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  DNIs duplicados y formatos incorrectos son detectados
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
                <h3 className="text-sm font-bold text-foreground">Creacion de Legajos</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada fila se convierte en un legajo digital completo
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Mapping */}
        {currentStep === "mapping" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#d0bcff]" />
                  Mapeo de Columnas
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Asocia cada columna del archivo con los campos del sistema
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#4de082]/10 border border-[#4de082]/20 text-[#4de082] text-xs font-mono">
                {recordCount} filas detectadas
              </div>
            </div>

            {/* Mapping grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Columna Detectada</span>
                <span></span>
                <span>Campo del Sistema</span>
              </div>

              {DETECTED_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Source column */}
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{col.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      Ej: {col.sample}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight
                      className={cn(
                        "w-5 h-5 transition-colors",
                        mappings[col.id] && mappings[col.id] !== "skip"
                          ? "text-[#4de082]"
                          : "text-white/20"
                      )}
                    />
                  </div>

                  {/* Target field selector */}
                  <Select
                    value={mappings[col.id] || ""}
                    onValueChange={(value) => handleMappingChange(col.id, value)}
                  >
                    <SelectTrigger
                      className={cn(
                        "bg-white/[0.02] border-white/10",
                        mappings[col.id] && mappings[col.id] !== "skip"
                          ? "border-[#4de082]/30 text-[#4de082]"
                          : ""
                      )}
                    >
                      <SelectValue placeholder="Seleccionar campo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {SYSTEM_FIELDS.map((field) => (
                        <SelectItem
                          key={field.id}
                          value={field.id}
                          className={cn(
                            "text-foreground",
                            field.id === "skip" && "text-muted-foreground"
                          )}
                        >
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("upload")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {Object.values(mappings).filter((v) => v && v !== "skip").length} de{" "}
                  {DETECTED_COLUMNS.length} columnas mapeadas
                </span>
                <Button
                  onClick={handleProceedToConfig}
                  className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Config */}
        {currentStep === "config" && (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#d0bcff]" />
                Configuracion de Destino
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona donde se crearan los nuevos legajos
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* School Year */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#d0bcff]" />
                  Ciclo Lectivo
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10 h-12">
                    <SelectValue placeholder="Seleccionar ciclo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {SCHOOL_YEARS.map((year) => (
                      <SelectItem key={year.id} value={year.id} className="text-foreground">
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* School Level */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#d0bcff]" />
                  Nivel Escolar
                </label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger
                    className={cn(
                      "bg-white/[0.02] border-white/10 h-12",
                      !selectedLevel && "text-muted-foreground"
                    )}
                  >
                    <SelectValue placeholder="Seleccionar nivel..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {SCHOOL_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id} className="text-foreground">
                        <div className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.years}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary card */}
            <div className="p-5 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 mt-6">
              <h3 className="text-sm font-bold text-[#d0bcff] mb-3">Resumen de Importacion</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{recordCount}</p>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.values(mappings).filter((v) => v && v !== "skip").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Campos Mapeados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedLevel
                      ? SCHOOL_LEVELS.find((l) => l.id === selectedLevel)?.label.split(" ")[1]
                      : "---"}
                  </p>
                  <p className="text-xs text-muted-foreground">Nivel Destino</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400">Verificacion Final</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Una vez procesada la importacion, se crearan {recordCount} legajos nuevos. 
                  Los DNIs duplicados seran omitidos automaticamente.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("mapping")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Mapeo
              </Button>
              <Button
                onClick={handleStartProcessing}
                className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold"
                disabled={!selectedLevel}
              >
                <Database className="w-4 h-4 mr-2" />
                Procesar {recordCount} Registros
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Processing */}
        {currentStep === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#d0bcff] animate-spin" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#131319] border border-[#d0bcff]/30 flex items-center justify-center">
                <span className="text-xs font-bold text-[#d0bcff]">{progress}%</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Procesando Importacion</h2>
              <p className="text-sm text-muted-foreground">
                Creando legajos y validando datos...
              </p>
            </div>

            <div className="w-full max-w-md space-y-2">
              <Progress value={progress} className="h-3 bg-white/5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {Math.floor((progress / 100) * recordCount)} de {recordCount} registros
                </span>
                <span>{progress}% completado</span>
              </div>
            </div>

            {/* Processing stages */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                {progress > 20 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4de082]" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span className={progress > 20 ? "text-[#4de082]" : ""}>
                  Validando formato de datos...
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {progress > 50 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4de082]" />
                ) : progress > 20 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20" />
                )}
                <span className={progress > 50 ? "text-[#4de082]" : ""}>
                  Verificando DNIs duplicados...
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {progress > 80 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4de082]" />
                ) : progress > 50 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20" />
                )}
                <span className={progress > 80 ? "text-[#4de082]" : ""}>
                  Creando legajos en base de datos...
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {progress >= 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4de082]" />
                ) : progress > 80 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20" />
                )}
                <span className={progress >= 100 ? "text-[#4de082]" : ""}>
                  Generando reporte de importacion...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Complete */}
        {currentStep === "complete" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#4de082]/10 border border-[#4de082]/20 flex items-center justify-center">
                <Check className="w-12 h-12 text-[#4de082]" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#4de082] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#131319]" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Importacion Exitosa</h2>
              <p className="text-sm text-muted-foreground">
                Se han creado {recordCount} legajos nuevos en el sistema
              </p>
            </div>

            {/* Result stats */}
            <div className="grid grid-cols-3 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#4de082]/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#4de082]" />
                </div>
                <p className="text-2xl font-bold text-[#4de082]">{recordCount}</p>
                <p className="text-xs text-muted-foreground">Importados</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">3</p>
                <p className="text-xs text-muted-foreground">Advertencias</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/10 flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-5 h-5 text-[#ffb4ab]" />
                </div>
                <p className="text-2xl font-bold text-[#ffb4ab]">2</p>
                <p className="text-xs text-muted-foreground">DNIs Duplicados</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-white/10 hover:bg-white/5"
              >
                <Upload className="w-4 h-4 mr-2" />
                Nueva Importacion
              </Button>
              <Button className="bg-[#d0bcff] hover:bg-[#d0bcff]/80 text-[#131319] font-bold">
                <Database className="w-4 h-4 mr-2" />
                Ver Legajos Creados
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toaster theme="dark" />
    </div>
  );
}
