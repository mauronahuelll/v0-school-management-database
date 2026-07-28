/**
 * level-config.ts
 * Fuente única de verdad para toda la lógica de aislamiento por nivel educativo.
 * INICIAL | PRIMARIO | SECUNDARIO — sin cruce de datos entre niveles.
 */

export type NivelEducativo = "INICIAL" | "PRIMARIO" | "SECUNDARIO";

// ─── Nomenclatura ─────────────────────────────────────────────────────────────

/** "Salas" / "Grados" / "Años" */
export function unitLabel(nivel: NivelEducativo | null | undefined): string {
  switch (nivel) {
    case "INICIAL":    return "Salas";
    case "PRIMARIO":   return "Grados";
    case "SECUNDARIO": return "Años";
    default:           return "Cursos";
  }
}

/** Etiqueta singular: "Sala" / "Grado" / "Año" */
export function unitLabelSingular(nivel: NivelEducativo | null | undefined): string {
  switch (nivel) {
    case "INICIAL":    return "Sala";
    case "PRIMARIO":   return "Grado";
    case "SECUNDARIO": return "Año";
    default:           return "Curso";
  }
}

// ─── Dashboard: métricas por nivel ───────────────────────────────────────────

export interface LevelMetricCard {
  label: string;
  value: string | number;
  subtext: string;
  status: "critical" | "warning" | "ok";
  accentColor: string;        // Tailwind color token p.ej. "pink" | "cyan" | "purple"
  badgeClass: string;         // bg + text Tailwind para el badge
}

export const NIVEL_METRICS: Record<NivelEducativo, LevelMetricCard[]> = {
  INICIAL: [
    {
      label: "Estado de las Salitas",
      value: "4/4",
      subtext: "Salas activas con maestra presente",
      status: "ok",
      accentColor: "pink",
      badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      label: "Alertas Medicas Activas",
      value: "3",
      subtext: "Alumnos con condicion de salud registrada",
      status: "warning",
      accentColor: "pink",
      badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      label: "Avisos de Retiros",
      value: "7",
      subtext: "Retiros anticipados registrados hoy",
      status: "ok",
      accentColor: "pink",
      badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
  ],
  PRIMARIO: [
    {
      label: "Desempeno General",
      value: "7.8",
      subtext: "Promedio institucional 1er Trimestre",
      status: "ok",
      accentColor: "cyan",
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      label: "Asistencia del Dia",
      value: "94%",
      subtext: "Presente sobre total matriculado",
      status: "ok",
      accentColor: "cyan",
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      label: "Novedades Trimestrales",
      value: "5",
      subtext: "Alumnos con observaciones pendientes",
      status: "warning",
      accentColor: "cyan",
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
  ],
  SECUNDARIO: [
    {
      label: "Riesgo Academico",
      value: "8",
      subtext: "Alumnos en situacion critica",
      status: "critical",
      accentColor: "purple",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      label: "Ausentismo Critico",
      value: "12%",
      subtext: "Sobre limite reglamentario (15%)",
      status: "warning",
      accentColor: "purple",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      label: "Indice de Convivencia",
      value: "4",
      subtext: "Sanciones activas este mes",
      status: "warning",
      accentColor: "purple",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  ],
};

// ─── Communications: opciones de audiencia aisladas por nivel ────────────────

export interface AudienceOption {
  value: string;
  label: string;
  group: string;
}

export const AUDIENCE_OPTIONS_BY_NIVEL: Record<NivelEducativo, AudienceOption[]> = {
  INICIAL: [
    { value: "all-inicial",   label: "Todo el Jardin",         group: "General"         },
    { value: "sala-3-a",      label: "Familias de Sala de 3 A", group: "Salas especificas" },
    { value: "sala-3-b",      label: "Familias de Sala de 3 B", group: "Salas especificas" },
    { value: "sala-4-a",      label: "Familias de Sala de 4 A", group: "Salas especificas" },
    { value: "sala-4-b",      label: "Familias de Sala de 4 B", group: "Salas especificas" },
    { value: "sala-5-a",      label: "Familias de Sala de 5 A", group: "Salas especificas" },
    { value: "sala-5-b",      label: "Familias de Sala de 5 B", group: "Salas especificas" },
  ],
  PRIMARIO: [
    { value: "all-primario",  label: "Toda la Primaria",       group: "General"           },
    { value: "1er-A",         label: "Familias de 1er Grado A", group: "Grados especificos" },
    { value: "1er-B",         label: "Familias de 1er Grado B", group: "Grados especificos" },
    { value: "2do-A",         label: "Familias de 2do Grado A", group: "Grados especificos" },
    { value: "2do-B",         label: "Familias de 2do Grado B", group: "Grados especificos" },
    { value: "3er-A",         label: "Familias de 3er Grado A", group: "Grados especificos" },
    { value: "3er-B",         label: "Familias de 3er Grado B", group: "Grados especificos" },
    { value: "4to-A",         label: "Familias de 4to Grado A", group: "Grados especificos" },
    { value: "4to-B",         label: "Familias de 4to Grado B", group: "Grados especificos" },
    { value: "5to-A",         label: "Familias de 5to Grado A", group: "Grados especificos" },
    { value: "5to-B",         label: "Familias de 5to Grado B", group: "Grados especificos" },
    { value: "6to-A",         label: "Familias de 6to Grado A", group: "Grados especificos" },
    { value: "6to-B",         label: "Familias de 6to Grado B", group: "Grados especificos" },
    { value: "7mo-A",         label: "Familias de 7mo Grado A", group: "Grados especificos" },
  ],
  SECUNDARIO: [
    { value: "all-secundario", label: "Toda la Secundaria",    group: "General"           },
    { value: "1er-anio-A",    label: "Familias de 1er Año A",  group: "Años especificos"  },
    { value: "1er-anio-B",    label: "Familias de 1er Año B",  group: "Años especificos"  },
    { value: "2do-anio-A",    label: "Familias de 2do Año A",  group: "Años especificos"  },
    { value: "2do-anio-B",    label: "Familias de 2do Año B",  group: "Años especificos"  },
    { value: "3er-anio-A",    label: "Familias de 3er Año A",  group: "Años especificos"  },
    { value: "3er-anio-B",    label: "Familias de 3er Año B",  group: "Años especificos"  },
    { value: "4to-anio-A",    label: "Familias de 4to Año A",  group: "Años especificos"  },
    { value: "4to-anio-B",    label: "Familias de 4to Año B",  group: "Años especificos"  },
    { value: "5to-anio-A",    label: "Familias de 5to Año A",  group: "Años especificos"  },
    { value: "5to-anio-B",    label: "Familias de 5to Año B",  group: "Años especificos"  },
    { value: "6to-anio-A",    label: "Familias de 6to Año A",  group: "Años especificos"  },
  ],
};

/**
 * Para SECUNDARIO: toggle adicional que habilita mensajes directos a alumnos.
 * Para INICIAL y PRIMARIO: `false` — no aplica.
 */
export function canSendDirectToStudents(nivel: NivelEducativo | null | undefined): boolean {
  return nivel === "SECUNDARIO";
}

// ─── Calendar: categorías de eventos por nivel ───────────────────────────────

export interface LevelEventCategory {
  value: string;
  label: string;
  badgeClass: string;     // Tailwind classes para el badge
  dotClass: string;       // Color del dot en la leyenda
}

export const EVENT_CATEGORIES_BY_NIVEL: Record<NivelEducativo, LevelEventCategory[]> = {
  INICIAL: [
    { value: "ADAPTACION",      label: "Adaptacion",        badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",   dotClass: "bg-pink-400/50"   },
    { value: "MUESTRA_ARTE",    label: "Muestra de Arte",   badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",   dotClass: "bg-pink-400/50"   },
    { value: "REUNION_PADRES",  label: "Reunion de Padres", badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",   dotClass: "bg-pink-400/50"   },
    { value: "TALLER",          label: "Taller Ludico",     badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",   dotClass: "bg-pink-400/50"   },
    { value: "JORNADA_JARDIN",  label: "Jornada de Jardin", badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",   dotClass: "bg-pink-400/50"   },
  ],
  PRIMARIO: [
    { value: "ACTO_ESCOLAR",    label: "Acto Escolar",      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",   dotClass: "bg-cyan-400/50"   },
    { value: "EXCURSION",       label: "Excursion",         badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",   dotClass: "bg-cyan-400/50"   },
    { value: "CIERRE_TRIMESTRE",label: "Cierre Trimestral", badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",   dotClass: "bg-cyan-400/50"   },
    { value: "OLIMPIADAS",      label: "Olimpiadas",        badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",   dotClass: "bg-cyan-400/50"   },
    { value: "FERIA_CIENCIAS",  label: "Feria de Ciencias", badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",   dotClass: "bg-cyan-400/50"   },
  ],
  SECUNDARIO: [
    { value: "MESA_EXAMEN",     label: "Mesa de Examen",    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-400/50" },
    { value: "ENTREGA_FINAL",   label: "Entrega Final",     badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-400/50" },
    { value: "PREVIA",          label: "Previa / TED",      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-400/50" },
    { value: "COLOQUIO",        label: "Coloquio",          badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-400/50" },
    { value: "VIAJE_EGRESADOS", label: "Viaje de Egresados",badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-400/50" },
  ],
};

/** Color de acento para el header del calendario según nivel */
export function calendarAccentColor(nivel: NivelEducativo | null | undefined): string {
  switch (nivel) {
    case "INICIAL":    return "#f472b6"; // pink-400
    case "PRIMARIO":   return "#22d3ee"; // cyan-400
    case "SECUNDARIO": return "#c084fc"; // purple-400
    default:           return "#d0bcff";
  }
}
