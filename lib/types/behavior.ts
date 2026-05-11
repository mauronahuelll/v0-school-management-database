// ============================================
// BEHAVIOR MODULE TYPES (Frontend)
// ============================================

export type BehaviorType = "OBSERVATION" | "SANCTION";
export type AcknowledgmentStatus = "PENDING" | "ACKNOWLEDGED" | "DISPUTED";

export interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  enrollmentNumber: string;
  courseName: string;
  divisionName: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  isPositive: boolean;
  icon?: string;
}

export interface SanctionTypeOption {
  id: string;
  name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  description?: string;
  requiresAcknowledgment: boolean;
  affectsRecord: boolean;
}

export interface BehaviorFormData {
  type: BehaviorType;
  studentIds: string[];
  category: string;
  description: string;
  isPositive: boolean;
  date: Date;
  
  // Sanction-specific
  sanctionTypeId?: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  requiresAcknowledgment?: boolean;
  
  // Visibility
  visibleToTutor: boolean;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// Severity configuration with colors
export const SEVERITY_CONFIG = {
  1: {
    label: "Leve",
    description: "Falta menor que requiere atencion",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-800 dark:text-amber-300",
    ringColor: "ring-amber-500/30",
    dotColor: "bg-amber-500",
  },
  2: {
    label: "Moderada",
    description: "Conducta que afecta el ambiente escolar",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-800 dark:text-orange-300",
    ringColor: "ring-orange-500/30",
    dotColor: "bg-orange-500",
  },
  3: {
    label: "Seria",
    description: "Falta significativa con consecuencias",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-800 dark:text-red-300",
    ringColor: "ring-red-500/30",
    dotColor: "bg-red-500",
  },
  4: {
    label: "Grave",
    description: "Afecta gravemente la convivencia",
    bgColor: "bg-red-200 dark:bg-red-900/50",
    textColor: "text-red-900 dark:text-red-200",
    ringColor: "ring-red-600/40",
    dotColor: "bg-red-600",
  },
  5: {
    label: "Muy Grave",
    description: "Requiere intervencion inmediata",
    bgColor: "bg-red-300 dark:bg-red-900/70",
    textColor: "text-red-950 dark:text-red-100",
    ringColor: "ring-red-700/50",
    dotColor: "bg-red-700",
  },
} as const;

// Default categories
export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: "conduct", name: "Conducta", description: "Comportamiento general en clase", isPositive: false },
  { id: "punctuality", name: "Puntualidad", description: "Llegadas tarde o retiros", isPositive: false },
  { id: "respect", name: "Respeto", description: "Trato hacia companeros y docentes", isPositive: false },
  { id: "participation", name: "Participacion", description: "Involucramiento en actividades", isPositive: true },
  { id: "academic", name: "Academico", description: "Rendimiento y esfuerzo", isPositive: false },
  { id: "merit", name: "Merito", description: "Logro o reconocimiento positivo", isPositive: true },
  { id: "uniform", name: "Uniforme", description: "Presentacion personal", isPositive: false },
  { id: "other", name: "Otro", description: "Otras situaciones", isPositive: false },
];

// Default sanction types
export const DEFAULT_SANCTION_TYPES: SanctionTypeOption[] = [
  { id: "warning", name: "Llamado de Atencion", severity: 1, description: "Advertencia verbal o escrita", requiresAcknowledgment: false, affectsRecord: false },
  { id: "reprimand", name: "Apercibimiento", severity: 2, description: "Anotacion formal en el legajo", requiresAcknowledgment: true, affectsRecord: true },
  { id: "admonition", name: "Amonestacion", severity: 3, description: "Sancion moderada con notificacion", requiresAcknowledgment: true, affectsRecord: true },
  { id: "suspension", name: "Suspension", severity: 4, description: "Suspension temporal de clases", requiresAcknowledgment: true, affectsRecord: true },
  { id: "expulsion", name: "Separacion", severity: 5, description: "Separacion del establecimiento", requiresAcknowledgment: true, affectsRecord: true },
];

// Utility function
export const getSeverityConfig = (severity: 1 | 2 | 3 | 4 | 5) => SEVERITY_CONFIG[severity];
