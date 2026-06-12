"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  School,
  CalendarDays,
  LayoutGrid,
  BookMarked,
  Users2,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Rocket,
  Sparkles,
  GraduationCap,
  Baby,
  Backpack,
  Building2,
  Info,
  Fingerprint,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ====================================================================
// TYPES
// ====================================================================
type CalendarType = "TRIMESTRAL" | "CUATRIMESTRAL" | "BIMESTRAL"
type EducationLevel = "INICIAL" | "PRIMARIO" | "SECUNDARIO" | "SUPERIOR"

interface CourseConfig {
  id: string
  year: string
  divisions: string[]
}

interface SubjectConfig {
  id: string
  name: string
  isCurricular: boolean
}

interface TeacherAssignment {
  id: string
  subjectId: string
  courseId: string
  email: string
  revista: "TITULAR" | "PROVISORIO" | "SUPLENTE" | ""
}

// ====================================================================
// CONSTANTS
// ====================================================================
const STEPS = [
  { id: 1, label: "Ciclo y Calendario", icon: CalendarDays },
  { id: 2, label: "Aulas y Divisiones", icon: LayoutGrid },
  { id: 3, label: "Padron de Materias", icon: BookMarked },
  { id: 4, label: "Asignacion Docente", icon: Users2 },
]

const CALENDAR_OPTIONS: { value: CalendarType; label: string; desc: string; periods: string }[] = [
  { value: "TRIMESTRAL", label: "Trimestral", desc: "Tres periodos de evaluacion", periods: "3 periodos" },
  { value: "CUATRIMESTRAL", label: "Cuatrimestral", desc: "Dos periodos extensos", periods: "2 periodos" },
  { value: "BIMESTRAL", label: "Bimestral", desc: "Cuatro periodos cortos", periods: "4 periodos" },
]

const DEFAULT_DIVISIONS = ["A", "B", "C"]
const YEAR_OPTIONS = ["1°", "2°", "3°", "4°", "5°", "6°", "7°"]

const EDUCATION_LEVELS: { value: EducationLevel; label: string; desc: string; icon: typeof Baby }[] = [
  { value: "INICIAL", label: "Nivel Inicial", desc: "Jardin de infantes", icon: Baby },
  { value: "PRIMARIO", label: "Nivel Primario", desc: "Educacion primaria", icon: Backpack },
  { value: "SECUNDARIO", label: "Nivel Secundario", desc: "Educacion media", icon: GraduationCap },
  { value: "SUPERIOR", label: "Nivel Superior", desc: "Terciario / Universitario", icon: Building2 },
]

const LEVEL_LABELS: Record<EducationLevel, string> = {
  INICIAL: "Inicial",
  PRIMARIO: "Primario",
  SECUNDARIO: "Secundario",
  SUPERIOR: "Superior / Universitario",
}

// ====================================================================
// MAIN WIZARD
// ====================================================================
export default function AdminSetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProvisioning, setIsProvisioning] = useState(false)

  // Step 1
  const [institutionName, setInstitutionName] = useState("")
  const [cueCode, setCueCode] = useState("")
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">("")
  const [calendarType, setCalendarType] = useState<CalendarType | "">("")

  // Step 2
  const [courses, setCourses] = useState<CourseConfig[]>([
    { id: "c1", year: "1°", divisions: ["A"] },
  ])
  const [customDivision, setCustomDivision] = useState<Record<string, string>>({})

  // Step 3
  const [subjects, setSubjects] = useState<SubjectConfig[]>([])
  const [subjectInput, setSubjectInput] = useState("")

  // Step 4
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [draftAssignment, setDraftAssignment] = useState<TeacherAssignment>({
    id: "",
    subjectId: "",
    courseId: "",
    email: "",
    revista: "",
  })

  // ----------------------------------------------------------------
  // STEP 2 HANDLERS
  // ----------------------------------------------------------------
  const addCourse = () => {
    const usedYears = courses.map((c) => c.year)
    const nextYear = YEAR_OPTIONS.find((y) => !usedYears.includes(y)) || YEAR_OPTIONS[0]
    setCourses((prev) => [
      ...prev,
      { id: `c${Date.now()}`, year: nextYear, divisions: ["A"] },
    ])
  }

  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCourseYear = (id: string, year: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, year } : c)))
  }

  const toggleDivision = (courseId: string, division: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c
        const has = c.divisions.includes(division)
        return {
          ...c,
          divisions: has
            ? c.divisions.filter((d) => d !== division)
            : [...c.divisions, division].sort(),
        }
      })
    )
  }

  const addCustomDivision = (courseId: string) => {
    const letter = (customDivision[courseId] || "").trim().toUpperCase()
    if (!letter) return
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c
        if (c.divisions.includes(letter)) return c
        return { ...c, divisions: [...c.divisions, letter].sort() }
      })
    )
    setCustomDivision((prev) => ({ ...prev, [courseId]: "" }))
  }

  // ----------------------------------------------------------------
  // STEP 3 HANDLERS
  // ----------------------------------------------------------------
  const addSubject = () => {
    const name = subjectInput.trim()
    if (!name) return
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Esa materia ya existe en el padron")
      return
    }
    setSubjects((prev) => [
      ...prev,
      { id: `s${Date.now()}`, name, isCurricular: true },
    ])
    setSubjectInput("")
  }

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
    setAssignments((prev) => prev.filter((a) => a.subjectId !== id))
  }

  const toggleSubjectType = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCurricular: !s.isCurricular } : s))
    )
  }

  // ----------------------------------------------------------------
  // STEP 4 HANDLERS
  // ----------------------------------------------------------------
  const courseLabel = (c: CourseConfig) =>
    c.divisions.length > 0
      ? c.divisions.map((d) => `${c.year} ${d}`).join(", ")
      : c.year

  const flatCourses = courses.flatMap((c) =>
    c.divisions.map((d) => ({
      id: `${c.id}-${d}`,
      label: `${c.year} ${d}`,
    }))
  )

  const addAssignment = () => {
    const { subjectId, courseId, email, revista } = draftAssignment
    if (!subjectId || !courseId || !email.trim() || !revista) {
      toast.error("Completa todos los campos de la asignacion")
      return
    }
    if (!email.includes("@")) {
      toast.error("Ingresa un correo valido")
      return
    }
    setAssignments((prev) => [
      ...prev,
      { ...draftAssignment, id: `a${Date.now()}` },
    ])
    setDraftAssignment({ id: "", subjectId: "", courseId: "", email: "", revista: "" })
    toast.success("Asignacion agregada")
  }

  const removeAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  // ----------------------------------------------------------------
  // VALIDATION PER STEP
  // ----------------------------------------------------------------
  const canAdvance = (() => {
    switch (currentStep) {
      case 1:
        return (
          institutionName.trim().length > 1 &&
          cueCode.trim().length > 0 &&
          educationLevel !== "" &&
          calendarType !== ""
        )
      case 2:
        return courses.length > 0 && courses.every((c) => c.divisions.length > 0)
      case 3:
        return subjects.length > 0
      case 4:
        return assignments.length > 0
      default:
        return false
    }
  })()

  // ----------------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------------
  const goNext = () => {
    if (!canAdvance) {
      toast.error("Completa este paso antes de continuar")
      return
    }
    if (currentStep < 4) setCurrentStep((s) => s + 1)
  }

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const handleFinish = async () => {
    if (!canAdvance) {
      toast.error("Agrega al menos una asignacion docente")
      return
    }
    setIsProvisioning(true)
    await new Promise((r) => setTimeout(r, 1800))
    setIsProvisioning(false)
    toast.success("Estructura escolar generada.", {
      description: "Redirigiendo al panel de control...",
    })
    setTimeout(() => router.push("/dashboard"), 1200)
  }

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="min-h-screen w-full bg-[#131319] text-[#e4e1ea] flex flex-col">
      {/* Subtle ambient gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#d0bcff]/[0.04] via-transparent to-transparent" />

      {/* Top brand bar */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#d0bcff]/15 border border-[#d0bcff]/20">
              <School className="size-4 text-[#d0bcff]" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sequency</span>
            <span className="text-xs text-white/30">/ Aprovisionamiento</span>
          </div>
          <span className="text-xs text-white/40 font-mono">
            Paso {currentStep} de 4
          </span>
        </div>
      </header>

      {/* Stepper */}
      <div className="relative z-10 px-6 pt-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon
              const isComplete = currentStep > step.id
              const isActive = currentStep === step.id
              return (
                <div key={step.id} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border transition-all duration-300",
                        isActive && "border-[#d0bcff] bg-[#d0bcff]/15 text-[#d0bcff] shadow-[0_0_20px_-4px_rgba(208,188,255,0.5)]",
                        isComplete && "border-[#4de082]/40 bg-[#4de082]/10 text-[#4de082]",
                        !isActive && !isComplete && "border-white/10 bg-white/[0.02] text-white/30"
                      )}
                    >
                      {isComplete ? <Check className="size-5" /> : <StepIcon className="size-5" />}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider text-center max-w-[80px] leading-tight",
                        isActive ? "text-[#d0bcff]" : isComplete ? "text-[#4de082]/70" : "text-white/30"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-px flex-1 transition-colors duration-300 mb-6",
                        currentStep > step.id ? "bg-[#4de082]/40" : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="relative z-10 flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          {/* STEP 1: Ciclo y Calendario */}
          {currentStep === 1 && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-balance">
                  Configura tu institucion
                </h1>
                <p className="mt-1.5 text-sm text-white/50">
                  Comencemos con la identidad y el ciclo lectivo de tu escuela.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-xs uppercase tracking-wider text-white/50">
                    Nombre de la Institucion
                  </Label>
                  <Input
                    id="institution"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Ej: Colegio San Martin"
                    className="h-12 bg-white/[0.02] border-white/10 text-base focus-visible:border-[#d0bcff]/50 focus-visible:ring-[#d0bcff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cue" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/50">
                    <Fingerprint className="size-3.5" />
                    Codigo CUE / Identificador Unico
                  </Label>
                  <Input
                    id="cue"
                    value={cueCode}
                    onChange={(e) => setCueCode(e.target.value)}
                    placeholder="Ej: 020123400"
                    className="h-12 bg-white/[0.02] border-white/10 text-base font-mono focus-visible:border-[#d0bcff]/50 focus-visible:ring-[#d0bcff]/20"
                  />
                  <p className="text-[11px] text-white/30">
                    Agrupa a los directores bajo la misma entidad legal.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-white/50">
                  Nivel Educativo a Cargo
                </Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {EDUCATION_LEVELS.map((opt) => {
                    const LevelIcon = opt.icon
                    const selected = educationLevel === opt.value
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setEducationLevel(opt.value)}
                        className={cn(
                          "group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-[#d0bcff]/50 bg-[#d0bcff]/10 shadow-[0_0_24px_-8px_rgba(208,188,255,0.4)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "flex size-9 items-center justify-center rounded-lg border transition-colors",
                              selected
                                ? "border-[#d0bcff]/30 bg-[#d0bcff]/15 text-[#d0bcff]"
                                : "border-white/10 bg-white/[0.03] text-white/40"
                            )}
                          >
                            <LevelIcon className="size-4" />
                          </div>
                          {selected && <Check className="size-4 text-[#d0bcff]" />}
                        </div>
                        <span className={cn("text-sm font-semibold", selected ? "text-[#d0bcff]" : "text-white/80")}>
                          {opt.label}
                        </span>
                        <p className="text-xs text-white/40">{opt.desc}</p>
                      </button>
                    )
                  })}
                </div>

                {educationLevel && (
                  <Alert className="border-[#d0bcff]/20 bg-[#d0bcff]/[0.06] text-[#e4e1ea] animate-in fade-in slide-in-from-top-1 duration-300">
                    <Info className="size-4 text-[#d0bcff]" />
                    <AlertDescription className="text-xs text-white/60 leading-relaxed">
                      Configurara la estructura exclusiva para el{" "}
                      <span className="font-semibold text-[#d0bcff]">
                        Nivel {LEVEL_LABELS[educationLevel]}
                      </span>
                      . La base de datos del alumnado sera compartida a nivel
                      institucional para facilitar la promocion entre niveles.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-white/50">
                  Estructura del Ciclo Lectivo
                </Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CALENDAR_OPTIONS.map((opt) => {
                    const selected = calendarType === opt.value
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setCalendarType(opt.value)}
                        className={cn(
                          "group relative rounded-xl border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-[#d0bcff]/50 bg-[#d0bcff]/10 shadow-[0_0_24px_-8px_rgba(208,188,255,0.4)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-semibold", selected ? "text-[#d0bcff]" : "text-white/80")}>
                            {opt.label}
                          </span>
                          {selected && <Check className="size-4 text-[#d0bcff]" />}
                        </div>
                        <p className="mt-1 text-xs text-white/40">{opt.desc}</p>
                        <span className="mt-3 inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50">
                          {opt.periods}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Aulas y Divisiones */}
          {currentStep === 2 && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-balance">
                    Aulas y divisiones
                  </h1>
                  <p className="mt-1.5 text-sm text-white/50">
                    Define los anos y marca las divisiones que existen en cada uno.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addCourse}
                  variant="outline"
                  className="shrink-0 border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 gap-2"
                >
                  <Plus className="size-4" />
                  Anadir Ano
                </Button>
              </div>

              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20">
                          <GraduationCap className="size-4 text-[#d0bcff]" />
                        </div>
                        <Select value={course.year} onValueChange={(v) => updateCourseYear(course.id, v)}>
                          <SelectTrigger className="w-28 bg-white/[0.02] border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a22] border-white/10">
                            {YEAR_OPTIONS.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y} Ano
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {courses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {DEFAULT_DIVISIONS.map((div) => {
                        const active = course.divisions.includes(div)
                        return (
                          <button
                            type="button"
                            key={div}
                            onClick={() => toggleDivision(course.id, div)}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all",
                              active
                                ? "border-[#d0bcff]/50 bg-[#d0bcff]/15 text-[#d0bcff]"
                                : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                            )}
                          >
                            {div}
                          </button>
                        )
                      })}

                      {/* Custom divisions already added (beyond A/B/C) */}
                      {course.divisions
                        .filter((d) => !DEFAULT_DIVISIONS.includes(d))
                        .map((d) => (
                          <button
                            type="button"
                            key={d}
                            onClick={() => toggleDivision(course.id, d)}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d0bcff]/50 bg-[#d0bcff]/15 px-3 text-sm font-semibold text-[#d0bcff]"
                          >
                            {d}
                            <X className="size-3" />
                          </button>
                        ))}

                      {/* Custom division input */}
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={customDivision[course.id] || ""}
                          onChange={(e) =>
                            setCustomDivision((prev) => ({
                              ...prev,
                              [course.id]: e.target.value.slice(0, 2),
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addCustomDivision(course.id)
                            }
                          }}
                          placeholder="Letra"
                          className="h-9 w-20 bg-white/[0.02] border-white/10 border-dashed text-center text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addCustomDivision(course.id)}
                          className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-[#d0bcff]/30 hover:text-[#d0bcff]"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 3: Padron de Materias */}
          {currentStep === 3 && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-balance">
                  Padron de materias
                </h1>
                <p className="mt-1.5 text-sm text-white/50">
                  Agrega las asignaturas y define si son curriculares o extraprogramaticas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSubject()
                    }
                  }}
                  placeholder="Ej: Matematica, Lengua, Educacion Fisica..."
                  className="h-12 bg-white/[0.02] border-white/10 focus-visible:border-[#d0bcff]/50 focus-visible:ring-[#d0bcff]/20"
                />
                <Button
                  type="button"
                  onClick={addSubject}
                  className="h-12 shrink-0 bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
                >
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </div>

              {subjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-12 text-center">
                  <BookMarked className="mx-auto size-8 text-white/20" />
                  <p className="mt-3 text-sm text-white/40">
                    Aun no agregaste materias al padron
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X className="size-4" />
                        </button>
                        <span className="truncate text-sm font-medium">{subject.name}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide border",
                            subject.isCurricular
                              ? "bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {subject.isCurricular ? "Curricular" : "Extraprog."}
                        </span>
                        <Switch
                          checked={subject.isCurricular}
                          onCheckedChange={() => toggleSubjectType(subject.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* STEP 4: Asignacion Docente */}
          {currentStep === 4 && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-balance">
                  Asignacion docente
                </h1>
                <p className="mt-1.5 text-sm text-white/50">
                  Vincula cada materia y curso con un docente y su situacion de revista.
                </p>
              </div>

              {/* Quick assignment matrix */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Materia</Label>
                    <Select
                      value={draftAssignment.subjectId}
                      onValueChange={(v) => setDraftAssignment((p) => ({ ...p, subjectId: v }))}
                    >
                      <SelectTrigger className="bg-white/[0.02] border-white/10">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a22] border-white/10">
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Curso</Label>
                    <Select
                      value={draftAssignment.courseId}
                      onValueChange={(v) => setDraftAssignment((p) => ({ ...p, courseId: v }))}
                    >
                      <SelectTrigger className="bg-white/[0.02] border-white/10">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a22] border-white/10">
                        {flatCourses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Correo del Docente</Label>
                    <Input
                      type="email"
                      value={draftAssignment.email}
                      onChange={(e) => setDraftAssignment((p) => ({ ...p, email: e.target.value }))}
                      placeholder="docente@escuela.edu.ar"
                      className="bg-white/[0.02] border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Situacion de Revista</Label>
                    <Select
                      value={draftAssignment.revista}
                      onValueChange={(v) =>
                        setDraftAssignment((p) => ({ ...p, revista: v as TeacherAssignment["revista"] }))
                      }
                    >
                      <SelectTrigger className="bg-white/[0.02] border-white/10">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a22] border-white/10">
                        <SelectItem value="TITULAR">Titular</SelectItem>
                        <SelectItem value="PROVISORIO">Provisorio</SelectItem>
                        <SelectItem value="SUPLENTE">Suplente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addAssignment}
                  variant="outline"
                  className="mt-4 w-full border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 gap-2"
                >
                  <Plus className="size-4" />
                  Agregar a la matriz
                </Button>
              </div>

              {/* Assignments list */}
              {assignments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-white/50">
                    Asignaciones cargadas ({assignments.length})
                  </Label>
                  {assignments.map((a) => {
                    const subject = subjects.find((s) => s.id === a.subjectId)
                    const course = flatCourses.find((c) => c.id === a.courseId)
                    const revistaColor =
                      a.revista === "TITULAR"
                        ? "bg-[#4de082]/10 text-[#4de082] border-[#4de082]/20"
                        : a.revista === "PROVISORIO"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20 shrink-0">
                            <BookMarked className="size-4 text-[#d0bcff]" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {subject?.name} <span className="text-white/30">·</span>{" "}
                              <span className="text-white/60">{course?.label}</span>
                            </p>
                            <p className="truncate text-xs text-white/40">{a.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                              revistaColor
                            )}
                          >
                            {a.revista}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAssignment(a.id)}
                            className="rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="relative z-10 border-t border-white/5 bg-[#131319]/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button
            type="button"
            onClick={goBack}
            variant="ghost"
            disabled={currentStep === 1}
            className="gap-2 text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            Atras
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={goNext}
              className="gap-2 bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90"
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isProvisioning}
              className="gap-2 bg-gradient-to-r from-[#d0bcff] to-[#b69dff] text-[#1b1b1f] font-semibold hover:opacity-90 shadow-[0_0_30px_-6px_rgba(208,188,255,0.6)] px-6"
            >
              {isProvisioning ? (
                <>
                  <Sparkles className="size-4 animate-pulse" />
                  Inicializando...
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Inicializar Institucion
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
