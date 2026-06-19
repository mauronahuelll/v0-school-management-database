"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShieldAlert, 
  Settings, 
  GraduationCap, 
  ClipboardList,
  Save,
  Calendar,
  Award,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Plus,
  Users,
  Eye,
  Pencil,
  FileWarning,
  BarChart3,
  Trash2,
  X,
  FileStack,
  FileText,
  CalendarClock,
  Briefcase,
  Lock,
  IdCard,
  Cake,
  Phone,
  User,
  Columns3,
  Asterisk,
  Mail,
  Heart,
  Send,
  BookOpen,
  ChevronDown,
  Search,
  UserCog,
  Type,
  AlignLeft,
  Hash,
  ToggleLeft,
  Info,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import {
  useSchoolSettings,
  ACADEMIC_PERIOD_PRESETS,
  type AcademicPeriodLayout,
} from "@/lib/context/school-settings-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useStaffFields,
  type StaffField,
  type StaffFieldType,
  STAFF_FIELD_TYPE_LABELS,
} from "@/lib/context/staff-fields-context";

// ============================================================================
// TYPES
// ============================================================================

interface SystemRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  color: string;
}

interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

type RequirementAudience =
  | "TODOS"
  | "SOLO_DOCENTES"
  | "SOLO_TITULARES";

type RequirementTarget = "PERSONAL" | "ALUMNOS";

interface DocumentRequirement {
  id: string;
  title: string;
  target: RequirementTarget;
  audience: RequirementAudience;
  annualExpiration: boolean;
  isSystem: boolean;
}

type EnrollmentFieldType = "TEXTO" | "NUMERO" | "FECHA" | "TELEFONO" | "EMAIL" | "SELECCION";

interface EnrollmentField {
  id: string;
  label: string;
  type: EnrollmentFieldType;
  required: boolean;
  isFixed: boolean; // Fixed system fields cannot be edited or deleted
  icon?: "name" | "id" | "date" | "phone" | "email" | "relation";
}

// ============================================================================
// MOCK DATA
// ============================================================================

const SYSTEM_ROLES: SystemRole[] = [
  {
    id: "admin",
    name: "Administrador",
    description: "Control total del sistema",
    isSystem: true,
    userCount: 2,
    permissions: ["all"],
    color: "purple",
  },
  {
    id: "docente",
    name: "Docente",
    description: "Carga de notas y asistencia de sus cursos",
    isSystem: true,
    userCount: 34,
    permissions: ["ver_notas", "cargar_notas", "ver_asistencia"],
    color: "blue",
  },
  {
    id: "preceptor",
    name: "Preceptor",
    description: "Gestion de asistencia y convivencia",
    isSystem: true,
    userCount: 8,
    permissions: ["ver_notas", "cargar_notas", "ver_asistencia", "cargar_asistencia", "emitir_sanciones"],
    color: "emerald",
  },
  {
    id: "familia",
    name: "Familia/Tutor",
    description: "Consulta de notas y comunicados de sus hijos",
    isSystem: true,
    userCount: 412,
    permissions: ["ver_notas", "ver_asistencia", "ver_comunicados"],
    color: "amber",
  },
];

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "ver_notas", label: "Ver Calificaciones", description: "Consultar notas de alumnos", category: "Calificaciones" },
  { id: "cargar_notas", label: "Cargar Calificaciones", description: "Ingresar y modificar notas", category: "Calificaciones" },
  { id: "ver_asistencia", label: "Ver Asistencia", description: "Consultar registros de asistencia", category: "Asistencia" },
  { id: "cargar_asistencia", label: "Cargar Asistencia", description: "Registrar asistencia diaria", category: "Asistencia" },
  { id: "emitir_sanciones", label: "Emitir Sanciones", description: "Crear actas de convivencia", category: "Convivencia" },
  { id: "ver_analitica", label: "Ver Analitica", description: "Acceder a metricas institucionales", category: "Sistema" },
];

const INITIAL_REQUIREMENTS: DocumentRequirement[] = [
  { id: "req_1", title: "Declaracion Jurada (DD.JJ.) de Cargos", target: "PERSONAL", audience: "TODOS", annualExpiration: true, isSystem: true },
  { id: "req_2", title: "Titulo Habilitante", target: "PERSONAL", audience: "SOLO_DOCENTES", annualExpiration: false, isSystem: true },
  { id: "req_3", title: "Apto Medico (Aptitud Psicofisica)", target: "PERSONAL", audience: "TODOS", annualExpiration: true, isSystem: false },
  { id: "req_4", title: "Certificado de Antecedentes Penales", target: "PERSONAL", audience: "TODOS", annualExpiration: true, isSystem: false },
  { id: "req_5", title: "Certificado de Reincidencia", target: "PERSONAL", audience: "SOLO_TITULARES", annualExpiration: true, isSystem: false },
];

const INITIAL_STUDENT_REQUIREMENTS: DocumentRequirement[] = [
  { id: "sreq_1", title: "DNI (copia)", target: "ALUMNOS", audience: "TODOS", annualExpiration: false, isSystem: true },
  { id: "sreq_2", title: "Libreta de Vacunacion", target: "ALUMNOS", audience: "TODOS", annualExpiration: true, isSystem: false },
  { id: "sreq_3", title: "Ficha Medica / Apto Fisico", target: "ALUMNOS", audience: "TODOS", annualExpiration: true, isSystem: false },
  { id: "sreq_4", title: "Certificado de Estudios Previos", target: "ALUMNOS", audience: "TODOS", annualExpiration: false, isSystem: false },
];

const AUDIENCE_LABELS: Record<RequirementAudience, string> = {
  TODOS: "Todos",
  SOLO_DOCENTES: "Solo Docentes",
  SOLO_TITULARES: "Solo Titulares",
};

const STUDENT_AUDIENCE_LABELS: Record<RequirementAudience, string> = {
  TODOS: "Todos los alumnos",
  SOLO_DOCENTES: "Solo Ingresantes",
  SOLO_TITULARES: "Solo Egresados",
};

const FIXED_ENROLLMENT_FIELDS: EnrollmentField[] = [
  { id: "fx_nombre", label: "Nombre", type: "TEXTO", required: true, isFixed: true, icon: "name" },
  { id: "fx_apellido", label: "Apellido", type: "TEXTO", required: true, isFixed: true, icon: "name" },
  { id: "fx_dni", label: "DNI", type: "NUMERO", required: true, isFixed: true, icon: "id" },
  { id: "fx_nacimiento", label: "Fecha de Nacimiento", type: "FECHA", required: true, isFixed: true, icon: "date" },
  { id: "fx_contacto", label: "Contacto", type: "TELEFONO", required: true, isFixed: true, icon: "phone" },
  { id: "fx_email_tutor1", label: "Email Tutor 1", type: "EMAIL", required: true, isFixed: true, icon: "email" },
  { id: "fx_vinculo_tutor1", label: "Vinculo Tutor 1 (Padre/Madre/Tutor)", type: "SELECCION", required: true, isFixed: true, icon: "relation" },
  { id: "fx_email_tutor2", label: "Email Tutor 2 (Opcional)", type: "EMAIL", required: false, isFixed: true, icon: "email" },
];

const INITIAL_CUSTOM_FIELDS: EnrollmentField[] = [
  { id: "cf_obra_social", label: "Obra Social", type: "TEXTO", required: true, isFixed: false },
  { id: "cf_grupo_sanguineo", label: "Grupo Sanguineo", type: "SELECCION", required: false, isFixed: false },
];

const FIELD_TYPE_LABELS: Record<EnrollmentFieldType, string> = {
  TEXTO: "Texto",
  NUMERO: "Numero",
  FECHA: "Fecha",
  TELEFONO: "Telefono",
  EMAIL: "Email",
  SELECCION: "Seleccion",
};

// ============================================================================
// PLAN DE ESTUDIOS — TYPES & DATA
// ============================================================================

type SubjectType = "CURRICULAR" | "EXTRACURRICULAR";

// Ordinal en español para los años académicos (con ñ correcta)
const YEAR_ORDINALS: Record<number, string> = {
  1: "1er Año", 2: "2do Año", 3: "3er Año",
  4: "4to Año", 5: "5to Año", 6: "6to Año",
};

interface Subject {
  id: string;
  name: string;
  type: SubjectType;
  academicYear: number; // 1–6 — OBLIGATORIO para Certificados Analiticos
  courses: string[];    // divisiones donde se dicta (filtradas al año)
}

const AVAILABLE_COURSES = [
  { id: "1A", label: "1° A", year: 1, division: "A" },
  { id: "1B", label: "1° B", year: 1, division: "B" },
  { id: "1C", label: "1° C", year: 1, division: "C" },
  { id: "2A", label: "2° A", year: 2, division: "A" },
  { id: "2B", label: "2° B", year: 2, division: "B" },
  { id: "3A", label: "3° A", year: 3, division: "A" },
  { id: "3B", label: "3° B", year: 3, division: "B" },
  { id: "4A", label: "4° A", year: 4, division: "A" },
  { id: "4B", label: "4° B", year: 4, division: "B" },
  { id: "5A", label: "5° A", year: 5, division: "A" },
  { id: "5B", label: "5° B", year: 5, division: "B" },
  { id: "6A", label: "6° A", year: 6, division: "A" },
  { id: "6B", label: "6° B", year: 6, division: "B" },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: "sub_1",  name: "Matematica",                 type: "CURRICULAR",      academicYear: 1, courses: ["1A","1B","1C"] },
  { id: "sub_2",  name: "Matematica",                 type: "CURRICULAR",      academicYear: 2, courses: ["2A","2B"] },
  { id: "sub_3",  name: "Matematica",                 type: "CURRICULAR",      academicYear: 3, courses: ["3A","3B"] },
  { id: "sub_4",  name: "Lengua y Literatura",         type: "CURRICULAR",      academicYear: 1, courses: ["1A","1B","1C"] },
  { id: "sub_5",  name: "Lengua y Literatura",         type: "CURRICULAR",      academicYear: 2, courses: ["2A","2B"] },
  { id: "sub_6",  name: "Historia",                   type: "CURRICULAR",      academicYear: 3, courses: ["3A","3B"] },
  { id: "sub_7",  name: "Geografia",                  type: "CURRICULAR",      academicYear: 2, courses: ["2A","2B"] },
  { id: "sub_8",  name: "Biologia",                   type: "CURRICULAR",      academicYear: 4, courses: ["4A","4B"] },
  { id: "sub_9",  name: "Fisica",                     type: "CURRICULAR",      academicYear: 5, courses: ["5A","5B"] },
  { id: "sub_10", name: "Quimica",                    type: "CURRICULAR",      academicYear: 5, courses: ["5A","5B"] },
  { id: "sub_11", name: "Educacion Fisica",            type: "CURRICULAR",      academicYear: 1, courses: ["1A","1B","1C"] },
  { id: "sub_12", name: "Ingles",                     type: "CURRICULAR",      academicYear: 1, courses: ["1A","1B","1C"] },
  { id: "sub_13", name: "Formacion Etica y Ciudadana", type: "CURRICULAR",      academicYear: 1, courses: ["1A","1B","1C"] },
  { id: "sub_14", name: "Taller de Teatro",            type: "EXTRACURRICULAR", academicYear: 3, courses: ["3A","3B"] },
  { id: "sub_15", name: "Robotica e IA",               type: "EXTRACURRICULAR", academicYear: 5, courses: ["5A","5B"] },
];

// ============================================================================
// SUBJECT MODAL (Create / Edit)
// ============================================================================

interface SubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null; // null = create mode
  // En modo creación puede llegar un array (batch); en edición siempre un solo elemento
  onSave: (data: Omit<Subject, "id"> | Omit<Subject, "id">[]) => void;
}

function SubjectModal({ open, onOpenChange, subject, onSave }: SubjectModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SubjectType>("CURRICULAR");
  // En edición: año único; en creación: multi-select (batch)
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  // Divisiones por año: { [year]: courseId[] }
  const [divisionsByYear, setDivisionsByYear] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = subject !== null;

  // Año activo en el panel de divisiones (solo relevante en creación con varios años)
  const [activeYearPanel, setActiveYearPanel] = useState<number>(1);

  useEffect(() => {
    if (open) {
      setName(subject?.name ?? "");
      setType(subject?.type ?? "CURRICULAR");
      if (subject) {
        // Modo edición: un solo año pre-seleccionado
        setSelectedYears([subject.academicYear]);
        setActiveYearPanel(subject.academicYear);
        setDivisionsByYear({ [subject.academicYear]: subject.courses });
      } else {
        setSelectedYears([]);
        setActiveYearPanel(1);
        setDivisionsByYear({});
      }
    }
  }, [open, subject]);

  const resetForm = () => {
    setName("");
    setType("CURRICULAR");
    setSelectedYears([]);
    setActiveYearPanel(1);
    setDivisionsByYear({});
  };

  // Toggle un año del multi-select
  const toggleYear = (y: number) => {
    if (isEditing) return; // en edición el año es fijo
    setSelectedYears(prev => {
      if (prev.includes(y)) {
        // Quitar año y sus divisiones
        setDivisionsByYear(d => { const copy = { ...d }; delete copy[y]; return copy; });
        return prev.filter(x => x !== y);
      }
      setActiveYearPanel(y);
      return [...prev, y].sort((a, b) => a - b);
    });
  };

  // Divisiones disponibles para el panel activo
  const divisionsForPanel = AVAILABLE_COURSES.filter(c => c.year === activeYearPanel);
  const selectedCoursesForPanel = divisionsByYear[activeYearPanel] ?? [];

  const toggleCourse = (courseId: string) => {
    setDivisionsByYear(prev => {
      const cur = prev[activeYearPanel] ?? [];
      const next = cur.includes(courseId)
        ? cur.filter(id => id !== courseId)
        : [...cur, courseId];
      return { ...prev, [activeYearPanel]: next };
    });
  };

  const toggleAllDivisionsForPanel = () => {
    const allIds = divisionsForPanel.map(c => c.id);
    const allSelected = allIds.every(id => selectedCoursesForPanel.includes(id));
    setDivisionsByYear(prev => ({
      ...prev,
      [activeYearPanel]: allSelected ? [] : allIds,
    }));
  };

  const allPanelSelected = divisionsForPanel.every(c => selectedCoursesForPanel.includes(c.id));

  // Validación: todos los años seleccionados deben tener al menos una división
  const yearsWithNoDivisions = selectedYears.filter(y => (divisionsByYear[y] ?? []).length === 0);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ingresa el nombre de la asignatura");
      return;
    }
    if (selectedYears.length === 0) {
      toast.error("Selecciona al menos un Año Académico");
      return;
    }
    if (yearsWithNoDivisions.length > 0) {
      toast.error(
        `Faltan divisiones en: ${yearsWithNoDivisions.map(y => YEAR_ORDINALS[y]).join(", ")}`,
        { description: "Cada año debe tener al menos una división asignada." }
      );
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isEditing) {
      // Edición: siempre un registro único
      onSave({
        name: name.trim(),
        type,
        academicYear: selectedYears[0],
        courses: divisionsByYear[selectedYears[0]] ?? [],
      });
      toast.success("Asignatura actualizada en la malla curricular.");
    } else {
      // Creación batch: genera una entrada por cada año tildado
      const batch: Omit<Subject, "id">[] = selectedYears.map(y => ({
        name: name.trim(),
        type,
        academicYear: y,
        courses: divisionsByYear[y] ?? [],
      }));
      onSave(batch);
      toast.success("Asignaturas generadas y asignadas a la currícula correctamente.");
    }

    setIsSaving(false);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="bg-[#0e0e16] border-white/10 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
            <BookOpen className="size-5 text-[#d0bcff]" />
            {isEditing ? "Editar Asignatura" : "Nueva Asignatura"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {isEditing
              ? "Modifica la asignatura en la malla curricular de la institución."
              : "Tilda los Años Académicos y el sistema generará una fila por cada uno."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Alerta — Certificados Analíticos */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20">
            <AlertCircle className="size-4 text-[#d0bcff] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#d0bcff]/70 leading-relaxed">
              <span className="font-semibold text-[#d0bcff]">Importante:</span> Definir el{" "}
              <span className="font-semibold">Año Académico</span> es vital para la correcta
              generación automática de los{" "}
              <span className="font-semibold">Certificados Analíticos</span> (Historial Académico).
            </p>
          </div>

          {/* Nombre de la Asignatura */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Nombre de la Asignatura</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Matemática, Historia, Taller de Programación..."
              className="bg-white/[0.02] border-white/10 h-11"
            />
            {name.trim() && selectedYears.length > 0 && (
              <p className="text-[10px] text-white/35 font-mono pl-1">
                Se crearán{" "}
                <span className="text-[#d0bcff]/70">{selectedYears.length}</span> entrada
                {selectedYears.length !== 1 ? "s" : ""}: {selectedYears.map(y => `${name.trim()} — ${YEAR_ORDINALS[y]}`).join(" · ")}
              </p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Tipo de Asignatura</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["CURRICULAR", "EXTRACURRICULAR"] as SubjectType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-medium transition-all text-left",
                    type === t
                      ? "bg-[#d0bcff]/10 border-[#d0bcff]/30 text-[#d0bcff]"
                      : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10"
                  )}
                >
                  <span className="block text-[10px] font-mono mb-0.5 opacity-60">
                    {t === "CURRICULAR" ? "PLAN OFICIAL" : "OPCIONAL"}
                  </span>
                  {t === "CURRICULAR" ? "Curricular" : "Extracurricular"}
                </button>
              ))}
            </div>
          </div>

          {/* Años en los que se dicta — MULTI-SELECT BATCH */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                {isEditing ? "Año Académico" : "Años en los que se dicta"}
                <span className="text-[10px] font-normal text-[#ffb4ab] bg-[#ffb4ab]/10 px-1.5 py-0.5 rounded font-mono">
                  Obligatorio
                </span>
              </Label>
              {!isEditing && selectedYears.length > 0 && (
                <span className="text-[10px] text-[#d0bcff]/60 font-mono">
                  {selectedYears.length} año{selectedYears.length !== 1 ? "s" : ""} seleccionado{selectedYears.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(y => {
                const isSelected = selectedYears.includes(y);
                const hasDivisions = (divisionsByYear[y] ?? []).length > 0;
                const isActive = activeYearPanel === y && selectedYears.includes(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      toggleYear(y);
                      if (!isEditing && (isSelected || !selectedYears.includes(y))) {
                        setActiveYearPanel(y);
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-3 rounded-xl border text-sm font-semibold transition-all",
                      isSelected && isActive
                        ? "bg-[#d0bcff]/15 border-[#d0bcff]/50 text-[#d0bcff] ring-1 ring-[#d0bcff]/30"
                        : isSelected
                        ? "bg-[#d0bcff]/8 border-[#d0bcff]/30 text-[#d0bcff]/80"
                        : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/20 hover:text-white/70"
                    )}
                  >
                    {/* Checkbox visual en esquina */}
                    <span className={cn(
                      "absolute top-1.5 right-1.5 size-3.5 rounded border flex items-center justify-center transition-colors",
                      isSelected ? "bg-[#d0bcff] border-[#d0bcff]" : "border-white/20 bg-transparent"
                    )}>
                      {isSelected && <Check className="size-2 text-[#0e0e16]" strokeWidth={3} />}
                    </span>
                    <span className="text-lg font-bold leading-none">{y}°</span>
                    <span className="text-[10px] font-normal mt-0.5 opacity-70">Año</span>
                    {/* Indicador de divisiones configuradas */}
                    {isSelected && (
                      <span className={cn(
                        "mt-1 text-[9px] font-mono px-1 rounded",
                        hasDivisions ? "text-emerald-400 bg-emerald-500/10" : "text-[#ffb4ab] bg-[#ffb4ab]/10"
                      )}>
                        {hasDivisions ? `${(divisionsByYear[y] ?? []).length} div.` : "sin div."}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de divisiones — se muestra para el año activo si está seleccionado */}
          {selectedYears.length > 0 && (
            <div className="space-y-2">
              {/* Selector de año activo (si hay varios) */}
              {selectedYears.length > 1 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-white/40 mr-1">Configurar divisiones de:</span>
                  {selectedYears.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setActiveYearPanel(y)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                        activeYearPanel === y
                          ? "bg-[#d0bcff]/15 border-[#d0bcff]/40 text-[#d0bcff]"
                          : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/20"
                      )}
                    >
                      {YEAR_ORDINALS[y]}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs text-white/60">
                  Divisiones — <span className="text-[#d0bcff]/70">{YEAR_ORDINALS[activeYearPanel]}</span>
                </Label>
                <button
                  type="button"
                  onClick={toggleAllDivisionsForPanel}
                  className="text-[10px] text-[#d0bcff]/60 hover:text-[#d0bcff] transition-colors"
                >
                  {allPanelSelected ? "Desmarcar todas" : "Seleccionar todas"}
                </button>
              </div>

              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                {divisionsForPanel.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-2">
                    No hay divisiones configuradas para este año.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {divisionsForPanel.map(course => {
                      const isSelected = selectedCoursesForPanel.includes(course.id);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCourse(course.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-[#d0bcff]/15 border-[#d0bcff]/40 text-[#d0bcff]"
                              : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/20 hover:text-white/70"
                          )}
                        >
                          <span className={cn(
                            "size-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "bg-[#d0bcff] border-[#d0bcff]" : "border-white/25"
                          )}>
                            {isSelected && <Check className="size-2.5 text-[#0e0e16]" strokeWidth={3} />}
                          </span>
                          División {course.division}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-white/30 mt-2 font-mono">
                  {selectedCoursesForPanel.length} de {divisionsForPanel.length} división{divisionsForPanel.length !== 1 ? "es" : ""} seleccionada{selectedCoursesForPanel.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || selectedYears.length === 0}
            className="bg-[#d0bcff] text-[#0e0e16] hover:bg-[#d0bcff]/90 font-semibold"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0e0e16]/30 border-t-[#0e0e16] rounded-full animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                {isEditing
                  ? "Guardar Cambios"
                  : selectedYears.length > 1
                  ? `Generar ${selectedYears.length} Asignaturas`
                  : "Agregar a Malla Curricular"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-6 p-10 bg-white/[0.02] border border-red-500/20 rounded-3xl backdrop-blur-md max-w-md">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-400">403</h1>
          <h2 className="text-lg font-semibold text-[#e4e1ea]">Acceso Restringido</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Esta zona es exclusiva para la administracion de la institucion. 
            Si crees que deberias tener acceso, contacta al administrador del sistema.
          </p>
        </div>
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-white/30 font-mono">
            SECURITY_VIOLATION: INSUFFICIENT_PRIVILEGES
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE ROLE MODAL
// ============================================================================

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (role: Partial<SystemRole>) => void;
}

function CreateRoleModal({ open, onOpenChange, onSave }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [inheritFrom, setInheritFrom] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleInheritChange = (roleId: string) => {
    setInheritFrom(roleId);
    const baseRole = SYSTEM_ROLES.find(r => r.id === roleId);
    if (baseRole) {
      setSelectedPermissions(baseRole.permissions.filter(p => p !== "all"));
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Ingresa un nombre para el rol");
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    onSave({
      name: roleName,
      permissions: selectedPermissions,
      isSystem: false,
      userCount: 0,
      color: "slate",
    });
    
    setIsSaving(false);
    setRoleName("");
    setInheritFrom("");
    setSelectedPermissions([]);
    onOpenChange(false);
    
    toast.success("Rol creado. Ya puede asignarse al personal.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
            <Shield className="size-5 text-purple-400" />
            Crear Rol Personalizado
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Define un nuevo rol con permisos especificos para el personal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Name */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Nombre del Rol</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ej: Ayudante de Laboratorio"
              className="bg-white/[0.02] border-white/10 h-11"
            />
          </div>

          {/* Inherit From */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Heredar permisos base de</Label>
            <Select value={inheritFrom} onValueChange={handleInheritChange}>
              <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                <SelectValue placeholder="Seleccionar rol base (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="preceptor">Preceptor</SelectItem>
                <SelectItem value="familia">Familia/Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions Grid */}
          <div className="space-y-3">
            <Label className="text-xs text-white/60">Modulos Permitidos</Label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div 
                  key={perm.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                    selectedPermissions.includes(perm.id)
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      selectedPermissions.includes(perm.id) ? "bg-purple-500/20" : "bg-white/5"
                    )}>
                      {perm.category === "Calificaciones" && <GraduationCap className="size-4 text-blue-400" />}
                      {perm.category === "Asistencia" && <ClipboardList className="size-4 text-emerald-400" />}
                      {perm.category === "Convivencia" && <FileWarning className="size-4 text-amber-400" />}
                      {perm.category === "Sistema" && <BarChart3 className="size-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e4e1ea]">{perm.label}</p>
                      <p className="text-[10px] text-white/40">{perm.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => handleTogglePermission(perm.id)}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !roleName.trim()}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                Crear Rol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// REQUIREMENT LIST (Editable Documental Requirements)
// ============================================================================

interface RequirementListProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: "blue" | "emerald";
  requirements: DocumentRequirement[];
  labels: Record<RequirementAudience, string>;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function RequirementList({
  title,
  description,
  icon,
  accent,
  requirements,
  labels,
  onAdd,
  onDelete,
}: RequirementListProps) {
  return (
    <div className="flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border",
            accent === "blue" && "bg-blue-500/10 border-blue-500/20",
            accent === "emerald" && "bg-emerald-500/10 border-emerald-500/20",
          )}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-white/40">{description}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 shrink-0"
        >
          <Plus className="size-4 mr-1.5" />
          Anadir Requisito
        </Button>
      </div>

      {/* List */}
      <div className="p-3 space-y-2 flex-1">
        {requirements.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/30">
            No hay requisitos configurados. Anade el primero.
          </div>
        ) : (
          requirements.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <FileText className="size-4 text-white/50" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#e4e1ea] truncate">{req.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/50 border border-white/5">
                      {labels[req.audience]}
                    </span>
                    {req.annualExpiration && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-mono text-amber-400 border border-amber-500/20">
                        <CalendarClock className="size-2.5" />
                        Vencimiento Anual
                      </span>
                    )}
                    {req.isSystem && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] font-mono text-purple-400 border border-purple-500/20">
                        OBLIGATORIO LEY
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(req.id)}
                className="h-8 w-8 p-0 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Eliminar ${req.title}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ENROLLMENT FIELDS MANAGER (Campos de Matricula)
// ============================================================================

const FIXED_FIELD_ICONS: Record<string, React.ReactNode> = {
  name: <User className="size-4 text-white/50" />,
  id: <IdCard className="size-4 text-white/50" />,
  date: <Cake className="size-4 text-white/50" />,
  phone: <Phone className="size-4 text-white/50" />,
  email: <Mail className="size-4 text-white/50" />,
  relation: <Heart className="size-4 text-white/50" />,
};

interface EnrollmentFieldRowProps {
  field: EnrollmentField;
  onToggleRequired: (id: string) => void;
  onDelete: (id: string) => void;
}

function EnrollmentFieldRow({ field, onToggleRequired, onDelete }: EnrollmentFieldRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors group",
        field.isFixed
          ? "bg-white/[0.015] border-white/5"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          {field.isFixed && field.icon ? FIXED_FIELD_ICONS[field.icon] : <Columns3 className="size-4 text-[#d0bcff]/70" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#e4e1ea] truncate">{field.label}</p>
            {field.isFixed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/40 border border-white/10">
                <Lock className="size-2.5" />
                FIJO
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/50 border border-white/5">
              {FIELD_TYPE_LABELS[field.type]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border",
                field.required
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
            >
              {field.required && <Asterisk className="size-2.5" />}
              {field.required ? "Obligatorio" : "Opcional"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {field.isFixed ? (
          <span className="text-[10px] font-mono text-white/25 pr-1">Inmutable</span>
        ) : (
          <>
            <div className="flex items-center gap-2 pr-1">
              <span className="text-[10px] text-white/40 hidden sm:inline">Obligatorio</span>
              <Switch
                checked={field.required}
                onCheckedChange={() => onToggleRequired(field.id)}
                className="data-[state=checked]:bg-red-500 scale-90"
                aria-label={`Marcar ${field.label} como obligatorio`}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(field.id)}
              className="h-8 w-8 p-0 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Eliminar ${field.label}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface AddFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: Omit<EnrollmentField, "id" | "isFixed">) => void;
}

function AddFieldModal({ open, onOpenChange, onSave }: AddFieldModalProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<EnrollmentFieldType>("TEXTO");
  const [required, setRequired] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setLabel("");
    setType("TEXTO");
    setRequired(true);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error("Ingresa un nombre para la columna");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSave({ label: label.trim(), type, required });
    setIsSaving(false);
    resetForm();
    onOpenChange(false);
    toast.success("Campo de matricula creado", {
      description: "Se exigira como columna en la plantilla de importacion Excel/CSV.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
            <Columns3 className="size-5 text-[#d0bcff]" />
            Anadir Campo Personalizado
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Define una nueva columna que se exigira en la matricula. Se incorpora automaticamente a la plantilla de importacion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Nombre del Campo / Columna</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Obra Social, Grupo Sanguineo, Contacto de Emergencia"
              className="bg-white/[0.02] border-white/10 h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-white/60">Tipo de Dato</Label>
            <Select value={type} onValueChange={(v) => setType(v as EnrollmentFieldType)}>
              <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {(Object.keys(FIELD_TYPE_LABELS) as EnrollmentFieldType[]).map((opt) => (
                  <SelectItem key={opt} value={opt}>{FIELD_TYPE_LABELS[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Asterisk className="size-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e4e1ea]">Campo Obligatorio</p>
                <p className="text-[10px] text-white/40">La importacion fallara si esta columna esta vacia</p>
              </div>
            </div>
            <Switch
              checked={required}
              onCheckedChange={setRequired}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !label.trim()} className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5" />
                Crear Campo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ADD REQUIREMENT MODAL
// ============================================================================

interface AddRequirementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: RequirementTarget;
  onSave: (req: Omit<DocumentRequirement, "id" | "isSystem">) => void;
}

function AddRequirementModal({ open, onOpenChange, target, onSave }: AddRequirementModalProps) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<RequirementAudience>("TODOS");
  const [annualExpiration, setAnnualExpiration] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isStudent = target === "ALUMNOS";
  const audienceOptions: RequirementAudience[] = isStudent
    ? ["TODOS", "SOLO_DOCENTES", "SOLO_TITULARES"]
    : ["TODOS", "SOLO_DOCENTES", "SOLO_TITULARES"];
  const labels = isStudent ? STUDENT_AUDIENCE_LABELS : AUDIENCE_LABELS;

  const resetForm = () => {
    setTitle("");
    setAudience("TODOS");
    setAnnualExpiration(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Ingresa un titulo para el requisito");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSave({ title: title.trim(), target, audience, annualExpiration });
    setIsSaving(false);
    resetForm();
    onOpenChange(false);
    toast.success("Requisito documental creado", {
      description: "Se exigira automaticamente en los legajos correspondientes.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
            <FileStack className="size-5 text-purple-400" />
            Nuevo Requisito {isStudent ? "para Alumnos" : "para Personal"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Define un documento que la institucion exigira. Se aplica de forma dinamica sin tocar codigo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Titulo del Requisito</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isStudent ? "Ej: Libreta de Vacunacion" : "Ej: Certificado de Reincidencia"}
              className="bg-white/[0.02] border-white/10 h-11"
            />
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">A quien aplica</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as RequirementAudience)}>
              <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {audienceOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{labels[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Annual Expiration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <CalendarClock className="size-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e4e1ea]">Requiere Vencimiento Anual</p>
                <p className="text-[10px] text-white/40">El sistema solicitara renovacion cada ano</p>
              </div>
            </div>
            <Switch
              checked={annualExpiration}
              onCheckedChange={setAnnualExpiration}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="bg-purple-600 hover:bg-purple-500">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                Anadir Requisito
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SettingsPage() {
  const { activeContext } = useAuth();
  const { settings, updateMaxAbsences, updateAcademicPeriodLayout } = useSchoolSettings();
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  
  // Form states
  const [gradingModel, setGradingModel] = useState("numerico");
  const [enablePreliminary, setEnablePreliminary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Roles management
  const [roles, setRoles] = useState<SystemRole[]>(SYSTEM_ROLES);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  // Documental requirements management (dynamic compliance config)
  const [staffRequirements, setStaffRequirements] = useState<DocumentRequirement[]>(INITIAL_REQUIREMENTS);
  const [studentRequirements, setStudentRequirements] = useState<DocumentRequirement[]>(INITIAL_STUDENT_REQUIREMENTS);
  const [requirementModalTarget, setRequirementModalTarget] = useState<RequirementTarget | null>(null);

  // Hydration-safe initialization with localStorage fallback
  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || null;
    setCurrentRole(role);
  }, [activeContext]);

  // Handle save action
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSaving(false);
    toast.success("Politicas institucionales actualizadas y propagadas al sistema");
  };

  // Handle create role
  const handleCreateRole = useCallback((newRole: Partial<SystemRole>) => {
    const role: SystemRole = {
      id: `custom_${Date.now()}`,
      name: newRole.name || "Nuevo Rol",
      description: "Rol personalizado",
      isSystem: false,
      userCount: 0,
      permissions: newRole.permissions || [],
      color: "slate",
    };
    setRoles(prev => [...prev, role]);
  }, []);

  // Handle add documental requirement
  const handleAddRequirement = useCallback((req: Omit<DocumentRequirement, "id" | "isSystem">) => {
    const newReq: DocumentRequirement = {
      ...req,
      id: `req_${Date.now()}`,
      isSystem: false,
    };
    if (req.target === "ALUMNOS") {
      setStudentRequirements(prev => [...prev, newReq]);
    } else {
      setStaffRequirements(prev => [...prev, newReq]);
    }
  }, []);

  // Handle delete documental requirement
  const handleDeleteRequirement = useCallback((id: string, target: RequirementTarget) => {
    if (target === "ALUMNOS") {
      setStudentRequirements(prev => prev.filter(r => r.id !== id));
    } else {
      setStaffRequirements(prev => prev.filter(r => r.id !== id));
    }
    toast.success("Requisito eliminado del esquema institucional");
  }, []);

  // ── Plan de Estudios (Asignaturas) ───────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  const handleOpenCreateSubject = useCallback(() => {
    setEditingSubject(null);
    setSubjectModalOpen(true);
  }, []);

  const handleOpenEditSubject = useCallback((subject: Subject) => {
    setEditingSubject(subject);
    setSubjectModalOpen(true);
  }, []);

  const handleSaveSubject = useCallback((payload: Omit<Subject, "id"> | Omit<Subject, "id">[]) => {
    const entries = Array.isArray(payload) ? payload : [payload];

    // Regla de negocio: nombre + año debe ser único por cada entrada del batch
    const duplicates = entries.filter(data =>
      subjects.some(s =>
        s.name.toLowerCase() === data.name.toLowerCase() &&
        s.academicYear === data.academicYear &&
        s.id !== editingSubject?.id
      )
    );
    if (duplicates.length > 0) {
      toast.error(
        `Combinación duplicada: ${duplicates.map(d => `"${d.name}" en ${YEAR_ORDINALS[d.academicYear]}`).join(", ")}`,
        { description: "La combinación Asignatura + Año Académico debe ser única en la malla curricular." }
      );
      return;
    }

    if (editingSubject && entries.length === 1) {
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...entries[0] } : s));
    } else {
      // Batch: genera IDs únicos con offset para evitar colisiones en el mismo tick
      const newRows = entries.map((data, i) => ({ ...data, id: `sub_${Date.now()}_${i}` }));
      setSubjects(prev => [...prev, ...newRows]);
    }
    setEditingSubject(null);
  }, [editingSubject, subjects]);

  const handleDeleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast.success("Asignatura eliminada del plan de estudios");
  }, []);

  const filteredSubjects = subjects.filter(s => {
    const q = subjectSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      YEAR_ORDINALS[s.academicYear]?.toLowerCase().includes(q) ||
      String(s.academicYear).includes(q)
    );
  });

  // ── Campos de Personal (atributos dinamicos del perfil del staff) ─────────
  const { staffFields, addStaffField, updateStaffField, deleteStaffField } = useStaffFields();
  const [isStaffFieldModalOpen, setIsStaffFieldModalOpen] = useState(false);
  const [editingStaffField, setEditingStaffField] = useState<StaffField | null>(null);
  const [staffFieldForm, setStaffFieldForm] = useState<{
    label: string;
    type: StaffFieldType;
    required: boolean;
    placeholder: string;
  }>({ label: "", type: "TEXTO", required: false, placeholder: "" });
  const [isSavingStaffField, setIsSavingStaffField] = useState(false);

  const handleOpenStaffFieldModal = useCallback((field?: StaffField) => {
    if (field) {
      setEditingStaffField(field);
      setStaffFieldForm({
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder ?? "",
      });
    } else {
      setEditingStaffField(null);
      setStaffFieldForm({ label: "", type: "TEXTO", required: false, placeholder: "" });
    }
    setIsStaffFieldModalOpen(true);
  }, []);

  const handleSaveStaffField = useCallback(async () => {
    if (!staffFieldForm.label.trim()) {
      toast.error("Ingresa el nombre del campo");
      return;
    }
    setIsSavingStaffField(true);
    await new Promise(r => setTimeout(r, 600));
    const payload = {
      label: staffFieldForm.label.trim(),
      type: staffFieldForm.type,
      required: staffFieldForm.required,
      placeholder: staffFieldForm.placeholder.trim() || undefined,
    };
    if (editingStaffField) {
      updateStaffField(editingStaffField.id, payload);
      toast.success("Campo de personal actualizado");
    } else {
      addStaffField(payload);
      toast.success("Campo de personal creado", {
        description: "Ya aparecera en los perfiles del staff",
      });
    }
    setIsSavingStaffField(false);
    setIsStaffFieldModalOpen(false);
    setEditingStaffField(null);
  }, [staffFieldForm, editingStaffField, addStaffField, updateStaffField]);

  const handleDeleteStaffField = useCallback((id: string, label: string) => {
    deleteStaffField(id);
    toast.success(`Campo "${label}" eliminado del perfil de personal`);
  }, [deleteStaffField]);

  // ── Enrollment fields (Campos de Matricula) ───────────────────────────────
  const [customFields, setCustomFields] = useState<EnrollmentField[]>(INITIAL_CUSTOM_FIELDS);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);

  const handleAddField = useCallback((field: Omit<EnrollmentField, "id" | "isFixed">) => {
    setCustomFields(prev => [...prev, { ...field, id: `cf_${Date.now()}`, isFixed: false }]);
  }, []);

  const handleToggleFieldRequired = useCallback((id: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f));
  }, []);

  const handleDeleteField = useCallback((id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    toast.success("Campo personalizado eliminado de la matricula");
  }, []);

  // Loading state to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse text-white/30">Cargando configuracion...</div>
      </div>
    );
  }

  // Route Guard: Block non-ADMIN access
  if (currentRole !== "ADMIN") {
    return <AccessDenied />;
  }

  // ADMIN View: Full configuration panel
  return (
    <div className="space-y-6 text-[#e4e1ea]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/[0.01] border border-white/[0.05] rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
              Panel de Control
            </span>
            <h1 className="text-xl font-bold tracking-tight">Configuracion Institucional</h1>
            <p className="text-xs text-white/40">Politicas academicas, parametros y gestion de roles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acceso Verificado: ADMIN
          </div>
        </div>
      </header>

      {/* Main Configuration Tabs */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
        <Tabs defaultValue="regimen" className="space-y-6">
          <TabsList className="bg-black/40 border border-white/5 p-1 rounded-2xl w-full md:w-auto flex-wrap">
            <TabsTrigger 
              value="regimen" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Regimen Academico
            </TabsTrigger>
            <TabsTrigger 
              value="valoraciones"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Valoraciones
            </TabsTrigger>
            <TabsTrigger 
              value="roles"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Permisos y Roles
            </TabsTrigger>
            <TabsTrigger 
              value="requisitos"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <FileStack className="w-4 h-4 mr-2" />
              Requisitos Documentales
            </TabsTrigger>
            <TabsTrigger 
              value="matricula"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <Columns3 className="w-4 h-4 mr-2" />
              Campos de Matricula
            </TabsTrigger>
            <TabsTrigger
              value="asignaturas"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 rounded-xl px-4 py-2 text-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Plan de Estudios
            </TabsTrigger>
            <TabsTrigger
              value="campos-personal"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-xl px-4 py-2 text-sm"
            >
              <UserCog className="w-4 h-4 mr-2" />
              Campos de Personal
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Regimen Academico */}
          <TabsContent value="regimen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Division del Ciclo Lectivo */}
              <div className="space-y-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Division del Ciclo Lectivo</h3>
                    <p className="text-[10px] text-white/40">Estructura de periodos de evaluacion del ano</p>
                  </div>
                </div>

                {/* RadioGroup visual de opciones */}
                <RadioGroup
                  value={settings.academicPeriodLayout}
                  onValueChange={(v) => {
                    updateAcademicPeriodLayout(v as AcademicPeriodLayout);
                    toast.success("Estructura del ciclo lectivo actualizada.", {
                      description: `Periodos configurados: ${ACADEMIC_PERIOD_PRESETS[v as AcademicPeriodLayout].periods.map(p => p.shortName).join(" · ")}`,
                    });
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  {(
                    [
                      { value: "BIMESTRAL",    label: "Bimestral",    count: 4, desc: "4 periodos" },
                      { value: "TRIMESTRAL",   label: "Trimestral",   count: 3, desc: "3 periodos · Recomendado" },
                      { value: "CUATRIMESTRAL",label: "Cuatrimestral",count: 2, desc: "2 periodos" },
                      { value: "SEMESTRAL",    label: "Semestral",    count: 2, desc: "2 semestres" },
                    ] as { value: AcademicPeriodLayout; label: string; count: number; desc: string }[]
                  ).map((opt) => {
                    const isActive = settings.academicPeriodLayout === opt.value;
                    return (
                      <Label
                        key={opt.value}
                        htmlFor={`layout-${opt.value}`}
                        className={cn(
                          "relative flex flex-col gap-1 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all",
                          isActive
                            ? "border-blue-500/60 bg-blue-500/8"
                            : "border-white/8 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]"
                        )}
                      >
                        <RadioGroupItem
                          value={opt.value}
                          id={`layout-${opt.value}`}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-semibold",
                            isActive ? "text-blue-300" : "text-white/70"
                          )}>
                            {opt.label}
                          </span>
                          {/* Dot de seleccion */}
                          <span className={cn(
                            "size-2 rounded-full transition-all",
                            isActive ? "bg-blue-400" : "bg-white/15"
                          )} />
                        </div>
                        <span className="text-[10px] text-white/40">{opt.desc}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>

                {/* Preview de periodos activos */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-white/35 font-medium">
                    Periodos activos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {settings.academicPeriodConfig.periods.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-300/80"
                      >
                        <span className="font-semibold">{p.shortName}</span>
                        <span className="text-white/25">·</span>
                        <span className="text-white/40">
                          {new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          {" — "}
                          {new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <p className="text-[10px] text-blue-300/70 leading-relaxed">
                    El regimen seleccionado define los cortes de calificaciones y la estructura
                    de los boletines generados para las familias. El cambio se aplica de forma inmediata.
                  </p>
                </div>
              </div>

              {/* Modelo de Calificacion */}
              <div className="space-y-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Modelo de Calificacion</h3>
                    <p className="text-[10px] text-white/40">Sistema de evaluacion principal</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Escala de Notas</Label>
                  <Select value={gradingModel} onValueChange={setGradingModel}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numerico">Numerico (1-10)</SelectItem>
                      <SelectItem value="alfanumerico">Alfanumerico (A-F)</SelectItem>
                      <SelectItem value="conceptual">Conceptual (Excelente/Bueno/Regular/Insuficiente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <p className="text-[10px] text-amber-300/70 leading-relaxed">
                    El modelo numerico 1-10 es el estandar en Argentina para nivel secundario. 
                    El conceptual se usa comunmente en nivel inicial.
                  </p>
                </div>
              </div>
            </div>

            {/* Politica de Asistencia */}
            <div className="space-y-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Politica de Asistencia</h3>
                  <p className="text-[10px] text-white/40">Limite de inasistencias del ciclo lectivo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label htmlFor="max-absences" className="text-xs text-white/60">
                    Limite maximo de inasistencias permitidas por ciclo
                  </Label>
                  <Input
                    id="max-absences"
                    type="number"
                    min={1}
                    max={365}
                    value={settings.maxAbsences}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value, 10);
                      updateMaxAbsences(Number.isNaN(parsed) ? 0 : parsed);
                    }}
                    className="bg-black/40 border-white/10 h-11"
                  />
                </div>

                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                  <p className="text-[10px] text-rose-300/70 leading-relaxed">
                    Este valor define el umbral a partir del cual el alumno queda en condicion de
                    riesgo por inasistencias. Se utiliza en los legajos y alertas de toda la institucion.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Valoraciones Preliminares */}
          <TabsContent value="valoraciones" className="space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">
                      Entregas Preliminares (TEA/TEP/TED)
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-xl">
                      Habilita las trayectorias escolares anticipadas a mitad de periodo. 
                      Esto permite a los docentes registrar valoraciones intermedias.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-[10px] font-mono rounded-lg border border-purple-500/20">
                        TEA: Avanzada
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-300 text-[10px] font-mono rounded-lg border border-blue-500/20">
                        TEP: En Proceso
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-300 text-[10px] font-mono rounded-lg border border-amber-500/20">
                        TED: Dificultades
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <Switch 
                    checked={enablePreliminary}
                    onCheckedChange={setEnablePreliminary}
                    className="data-[state=checked]:bg-purple-500"
                  />
                  <span className={`text-[10px] font-mono ${enablePreliminary ? 'text-green-400' : 'text-white/30'}`}>
                    {enablePreliminary ? 'HABILITADO' : 'DESHABILITADO'}
                  </span>
                </div>
              </div>

              {enablePreliminary && (
                <div className="mt-6 p-4 bg-green-500/5 border border-green-500/10 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-300/70 leading-relaxed">
                    Las entregas preliminares estan activas. Los docentes podran cargar 
                    valoraciones TEA/TEP/TED y las familias recibiran notificaciones automaticas.
                  </p>
                </div>
              )}

              {!enablePreliminary && (
                <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70 leading-relaxed">
                    Las entregas preliminares estan desactivadas. Solo se emitiran boletines 
                    oficiales al cierre de cada periodo segun el regimen academico configurado.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Gestion de Permisos y Roles */}
          <TabsContent value="roles" className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Roles del Sistema</h3>
                <p className="text-xs text-white/40 mt-1">Administra los permisos de acceso del personal</p>
              </div>
              <Button
                onClick={() => setIsCreateRoleOpen(true)}
                className="bg-purple-600 hover:bg-purple-500"
              >
                <Plus className="size-4 mr-2" />
                Crear Rol Personalizado
              </Button>
            </div>

            {/* Roles Table */}
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Descripcion
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            role.color === "purple" && "bg-purple-500/10 border border-purple-500/20",
                            role.color === "blue" && "bg-blue-500/10 border border-blue-500/20",
                            role.color === "emerald" && "bg-emerald-500/10 border border-emerald-500/20",
                            role.color === "amber" && "bg-amber-500/10 border border-amber-500/20",
                            role.color === "slate" && "bg-slate-500/10 border border-slate-500/20",
                          )}>
                            <Shield className={cn(
                              "size-5",
                              role.color === "purple" && "text-purple-400",
                              role.color === "blue" && "text-blue-400",
                              role.color === "emerald" && "text-emerald-400",
                              role.color === "amber" && "text-amber-400",
                              role.color === "slate" && "text-slate-400",
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#e4e1ea]">{role.name}</p>
                            {role.isSystem && (
                              <span className="text-[10px] text-white/30 font-mono">SISTEMA</span>
                            )}
                            {!role.isSystem && (
                              <span className="text-[10px] text-purple-400 font-mono">PERSONALIZADO</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-white/50">{role.description}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5">
                          <Users className="size-3.5 text-white/40" />
                          <span className="text-sm font-medium text-[#e4e1ea]">{role.userCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-white/50">
                          {role.permissions.includes("all") ? "Todos" : `${role.permissions.length} permisos`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                          >
                            <Eye className="size-4" />
                          </Button>
                          {!role.isSystem && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Permissions Legend */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
              <h4 className="text-xs font-bold text-white/60 mb-3">Leyenda de Permisos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-white/70">{perm.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Requisitos Documentales (Dynamic Compliance) */}
          <TabsContent value="requisitos" className="space-y-6">
            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-3">
              <FileStack className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Define dinamicamente que documentacion exige la institucion. Los cambios se propagan 
                automaticamente a los legajos del personal y a las fichas de los alumnos, sin campos fijos.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Requirements */}
              <RequirementList
                title="Documentos para Personal"
                description="Exigibles a docentes, preceptores y administrativos"
                icon={<Briefcase className="size-5 text-blue-400" />}
                accent="blue"
                requirements={staffRequirements}
                labels={AUDIENCE_LABELS}
                onAdd={() => setRequirementModalTarget("PERSONAL")}
                onDelete={(id) => handleDeleteRequirement(id, "PERSONAL")}
              />

              {/* Student Requirements */}
              <RequirementList
                title="Documentos para Alumnos"
                description="Exigibles en el momento de la matriculacion"
                icon={<GraduationCap className="size-5 text-emerald-400" />}
                accent="emerald"
                requirements={studentRequirements}
                labels={STUDENT_AUDIENCE_LABELS}
                onAdd={() => setRequirementModalTarget("ALUMNOS")}
                onDelete={(id) => handleDeleteRequirement(id, "ALUMNOS")}
              />
            </div>
          </TabsContent>

          {/* Campos de Matricula */}
          <TabsContent value="matricula" className="space-y-6">
            <div className="p-4 bg-[#d0bcff]/5 border border-[#d0bcff]/10 rounded-2xl flex items-start gap-3">
              <Columns3 className="w-4 h-4 text-[#d0bcff] shrink-0 mt-0.5" />
              <p className="text-xs text-[#d0bcff]/80 leading-relaxed">
                Define que columnas exige el sistema al matricular alumnos. Los campos fijos son obligatorios por 
                normativa y no pueden modificarse. Los campos personalizados que agregues se incorporan 
                automaticamente a la plantilla de importacion Excel/CSV de Secretaria.
              </p>
            </div>

            <div className="flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
              {/* Fixed Fields Section */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="size-4 text-white/40" />
                  <h3 className="text-sm font-bold text-white">Campos Fijos del Sistema</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-white/40 border border-white/10">
                    {FIXED_ENROLLMENT_FIELDS.length} inmutables
                  </span>
                </div>

                {/* Onboarding Familiar - Alert informativo */}
                <div
                  role="note"
                  className="mb-4 p-3 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl flex items-start gap-3"
                >
                  <Send className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    El sistema utilizara estos correos electronicos para enviar automaticamente las invitaciones
                    de acceso al portal familiar (&quot;Sequency Family&quot;) una vez que el alumno sea matriculado.
                  </p>
                </div>

                <div className="space-y-2">
                  {FIXED_ENROLLMENT_FIELDS.map((field) => (
                    <EnrollmentFieldRow
                      key={field.id}
                      field={field}
                      onToggleRequired={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Columns3 className="size-4 text-[#d0bcff]/70" />
                    <h3 className="text-sm font-bold text-white">Campos Personalizados</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#d0bcff]/10 text-[10px] font-mono text-[#d0bcff] border border-[#d0bcff]/20">
                      {customFields.length} activos
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddFieldOpen(true)}
                    className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 shrink-0 font-medium"
                  >
                    <Plus className="size-4 mr-1.5" />
                    Anadir Campo Personalizado
                  </Button>
                </div>
                {customFields.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                    No hay campos personalizados. Anade el primero para exigir columnas extra en el Excel.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <EnrollmentFieldRow
                        key={field.id}
                        field={field}
                        onToggleRequired={handleToggleFieldRequired}
                        onDelete={handleDeleteField}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Plan de Estudios — Malla Curricular */}
          <TabsContent value="asignaturas" className="space-y-6">

            {/* Banner principal — Malla Curricular */}
            <div className="p-4 bg-[#d0bcff]/5 border border-[#d0bcff]/15 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#d0bcff] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#d0bcff]">Malla Curricular Institucional</p>
                <p className="text-xs text-[#d0bcff]/60 leading-relaxed">
                  Cada asignatura está atada a un <span className="font-semibold text-[#d0bcff]/80">Año Académico</span> específico.
                  Esta estructura es <span className="font-semibold">vital</span> para la correcta generación automática de los{" "}
                  <span className="font-semibold text-[#d0bcff]/80">Certificados Analíticos</span> (Historial Académico) de cada alumno.
                  La combinación <span className="font-mono bg-[#d0bcff]/10 px-1 rounded">Asignatura + Año</span> debe ser única.
                </p>
              </div>
            </div>

            {/* Header: search + create button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder="Buscar por asignatura o año (ej: 2do, Matematica)..."
                  className="w-full pl-9 pr-3 h-10 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-[#e4e1ea] placeholder:text-white/30 focus:outline-none focus:border-[#d0bcff]/40 transition-colors"
                />
              </div>
              <Button
                onClick={handleOpenCreateSubject}
                className="bg-[#d0bcff] text-[#0e0e16] hover:bg-[#d0bcff]/90 font-semibold shrink-0"
              >
                <Plus className="size-4 mr-2" />
                Nueva Asignatura
              </Button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-[11px] font-mono text-white/50">
                {subjects.length} entradas en malla
              </span>
              <span className="px-3 py-1 rounded-full bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-[11px] font-mono text-[#d0bcff]/70">
                {subjects.filter(s => s.type === "CURRICULAR").length} curriculares
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-400">
                {subjects.filter(s => s.type === "EXTRACURRICULAR").length} extracurriculares
              </span>
              {/* Chips de años presentes */}
              {[...new Set(subjects.map(s => s.academicYear))].sort().map(y => (
                <span key={y} className="px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-[11px] font-mono text-emerald-400">
                  {YEAR_ORDINALS[y]}: {subjects.filter(s => s.academicYear === y).length}
                </span>
              ))}
            </div>

            {/* Table */}
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    {/* Columna clave: Año Académico */}
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#d0bcff]/60 uppercase tracking-wider w-36">
                      Año Académico
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Asignatura
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider w-24">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Divisiones
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center text-sm text-white/30">
                        {subjectSearch
                          ? `Sin resultados para "${subjectSearch}"`
                          : "No hay asignaturas. Crea la primera con el boton de arriba."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects
                      .slice()
                      .sort((a, b) => a.academicYear - b.academicYear || a.name.localeCompare(b.name))
                      .map(subject => (
                      <tr key={subject.id} className="hover:bg-white/[0.015] transition-colors group">

                        {/* Año Académico — columna principal */}
                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#d0bcff]/8 border border-[#d0bcff]/20">
                            <span className="text-base font-bold text-[#d0bcff] leading-none">{subject.academicYear}°</span>
                            <span className="text-[11px] text-[#d0bcff]/60 font-medium">Año</span>
                          </div>
                        </td>

                        {/* Nombre de la asignatura */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                              <BookOpen className="size-3.5 text-white/40" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-[#e4e1ea]">
                                {subject.name}
                              </span>
                              <p className="text-[10px] text-white/30 font-mono mt-0.5">
                                {subject.name} — {YEAR_ORDINALS[subject.academicYear]}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-4">
                          {subject.type === "CURRICULAR" ? (
                            <Badge className="bg-[#d0bcff]/8 text-[#d0bcff]/70 border border-[#d0bcff]/20 hover:bg-[#d0bcff]/8 font-mono text-[10px]">
                              Curricular
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/10 font-mono text-[10px]">
                              Extracurricular
                            </Badge>
                          )}
                        </td>

                        {/* Divisiones — solo del año correspondiente */}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {subject.courses.map(courseId => {
                              const course = AVAILABLE_COURSES.find(c => c.id === courseId);
                              return course ? (
                                <Badge
                                  key={courseId}
                                  className="bg-white/5 text-white/55 border border-white/10 hover:bg-white/5 font-mono text-[10px] px-2 py-0.5"
                                >
                                  Div. {course.division}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditSubject(subject)}
                              className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                              aria-label="Editar asignatura"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="h-8 w-8 p-0 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                              aria-label="Eliminar asignatura"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Tab 7: Campos de Personal */}
          <TabsContent value="campos-personal" className="space-y-6">
            {/* Info banner */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300/70 leading-relaxed">
                Define los campos de informacion complementaria que apareceran en los perfiles
                de todo el personal (ADMIN, DOCENTE, PRECEPTOR). Los campos marcados como
                obligatorios generaran alertas hasta que el usuario los complete.
              </p>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#e4e1ea]">Campos Definidos</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {staffFields.length} campo{staffFields.length !== 1 ? "s" : ""} activo{staffFields.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={() => handleOpenStaffFieldModal()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
              >
                <Plus className="size-4 mr-2" />
                Nuevo Campo
              </Button>
            </div>

            {/* Table */}
            {staffFields.length === 0 ? (
              <div className="py-16 text-center text-sm text-white/30 border border-dashed border-white/10 rounded-2xl">
                No hay campos definidos. Crea el primero con el boton de arriba.
              </div>
            ) : (
              <div className="border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Campo</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">Obligatorio</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider hidden md:table-cell">Placeholder</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider w-20">Acc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffFields.map(field => {
                      const typeIcons: Record<StaffFieldType, React.ReactNode> = {
                        TEXTO:       <Type className="size-3.5 text-blue-400" />,
                        TEXTO_LARGO: <AlignLeft className="size-3.5 text-purple-400" />,
                        NUMERO:      <Hash className="size-3.5 text-amber-400" />,
                        FECHA:       <CalendarClock className="size-3.5 text-emerald-400" />,
                        TELEFONO:    <Phone className="size-3.5 text-teal-400" />,
                        EMAIL:       <Mail className="size-3.5 text-rose-400" />,
                      };
                      return (
                        <tr key={field.id} className="group hover:bg-white/[0.015] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                                {typeIcons[field.type]}
                              </div>
                              <span className="text-sm font-medium text-[#e4e1ea]">{field.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-white/50">
                              {STAFF_FIELD_TYPE_LABELS[field.type]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {field.required ? (
                              <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10 text-[10px] font-mono">
                                Obligatorio
                              </Badge>
                            ) : (
                              <Badge className="bg-white/5 text-white/40 border border-white/10 hover:bg-white/5 text-[10px] font-mono">
                                Opcional
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-xs text-white/30 truncate max-w-[160px] block">
                              {field.placeholder || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStaffFieldModal(field)}
                                className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                                aria-label="Editar campo"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStaffField(field.id, field.label)}
                                className="h-8 w-8 p-0 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                                aria-label="Eliminar campo"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button - Floating Action */}
      <div className="sticky bottom-6 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-purple-500/20 transition-all"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Politicas Institucionales
            </>
          )}
        </Button>
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={isCreateRoleOpen}
        onOpenChange={setIsCreateRoleOpen}
        onSave={handleCreateRole}
      />

      {/* Add Documental Requirement Modal */}
      <AddRequirementModal
        open={requirementModalTarget !== null}
        onOpenChange={(o) => { if (!o) setRequirementModalTarget(null); }}
        target={requirementModalTarget ?? "PERSONAL"}
        onSave={handleAddRequirement}
      />

      {/* Add Enrollment Field Modal */}
      <AddFieldModal
        open={isAddFieldOpen}
        onOpenChange={setIsAddFieldOpen}
        onSave={handleAddField}
      />

      {/* Subject Modal (Create / Edit) */}
      <SubjectModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        subject={editingSubject}
        onSave={handleSaveSubject}
      />

      {/* Staff Field Modal (Create / Edit) */}
      <Dialog
        open={isStaffFieldModalOpen}
        onOpenChange={(o) => {
          if (!o) { setIsStaffFieldModalOpen(false); setEditingStaffField(null); }
        }}
      >
        <DialogContent className="sm:max-w-[460px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <UserCog className="size-5 text-emerald-400" />
              {editingStaffField ? "Editar Campo de Personal" : "Nuevo Campo de Personal"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Este campo aparecera en la seccion &ldquo;Informacion Complementaria&rdquo; del perfil de cada miembro del staff.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">
            {/* Label */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Nombre del Campo <span className="text-red-400">*</span>
              </Label>
              <Input
                value={staffFieldForm.label}
                onChange={e => setStaffFieldForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Ej: CBU, Talle de uniforme, Alergias..."
                className="bg-white/[0.02] border-white/10 h-11"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60 uppercase tracking-wider">Tipo de dato</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(STAFF_FIELD_TYPE_LABELS) as [StaffFieldType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStaffFieldForm(p => ({ ...p, type: key }))}
                    className={cn(
                      "py-2 px-2 rounded-xl border text-xs font-medium text-center transition-all",
                      staffFieldForm.type === key
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/15"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Placeholder */}
            <div className="space-y-2">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Texto de ayuda (placeholder)
                <span className="ml-1 text-white/30 normal-case">(opcional)</span>
              </Label>
              <Input
                value={staffFieldForm.placeholder}
                onChange={e => setStaffFieldForm(p => ({ ...p, placeholder: e.target.value }))}
                placeholder="Ej: Ingresa tu CBU de 22 digitos..."
                className="bg-white/[0.02] border-white/10 h-11"
              />
            </div>

            {/* Required toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-[#e4e1ea]">Campo obligatorio</p>
                <p className="text-xs text-white/40">
                  El usuario vera una alerta hasta completarlo
                </p>
              </div>
              <Switch
                checked={staffFieldForm.required}
                onCheckedChange={v => setStaffFieldForm(p => ({ ...p, required: v }))}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button
              variant="outline"
              onClick={() => { setIsStaffFieldModalOpen(false); setEditingStaffField(null); }}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStaffField}
              disabled={isSavingStaffField || !staffFieldForm.label.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {isSavingStaffField ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
              ) : (
                <><CheckCircle2 className="size-4" />{editingStaffField ? "Guardar Cambios" : "Crear Campo"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
