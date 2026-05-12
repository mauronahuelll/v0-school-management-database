// ============================================
// SCHOOL CONTEXT TYPES FOR MULTI-LEVEL NAVIGATION
// ============================================

export type CourseLevel = "PRIMARY" | "SECONDARY" | "TERTIARY";

export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT";

// ============================================
// COURSE & DIVISION STRUCTURE
// ============================================

export interface Division {
  id: string;
  name: string; // "A", "B", "C"
  shift: ShiftType;
  studentCount: number;
  preceptorId?: string;
  preceptorName?: string;
}

export interface Course {
  id: string;
  name: string; // "1° Año", "3° Grado"
  year: number;
  level: CourseLevel;
  divisions: Division[];
  academicYear: number;
  isActive: boolean;
}

export interface EducationalLevel {
  id: CourseLevel;
  name: string;
  shortName: string;
  courses: Course[];
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
}

// ============================================
// SCHOOL CONTEXT STATE
// ============================================

export interface SchoolContext {
  schoolId: string;
  schoolName: string;
  levels: EducationalLevel[];
  currentLevel: CourseLevel | null;
  currentCourse: Course | null;
  currentDivision: Division | null;
}

export interface ContextSelection {
  level: CourseLevel;
  courseId: string;
  divisionId: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getLevelLabel = (level: CourseLevel): string => {
  const labels: Record<CourseLevel, string> = {
    PRIMARY: "Primaria",
    SECONDARY: "Secundaria",
    TERTIARY: "Terciario",
  };
  return labels[level];
};

export const getLevelShortLabel = (level: CourseLevel): string => {
  const labels: Record<CourseLevel, string> = {
    PRIMARY: "Prim.",
    SECONDARY: "Sec.",
    TERTIARY: "Terc.",
  };
  return labels[level];
};

export const getShiftLabel = (shift: ShiftType): string => {
  const labels: Record<ShiftType, string> = {
    MORNING: "Manana",
    AFTERNOON: "Tarde",
    NIGHT: "Noche",
  };
  return labels[shift];
};

export const getShiftShortLabel = (shift: ShiftType): string => {
  const labels: Record<ShiftType, string> = {
    MORNING: "TM",
    AFTERNOON: "TT",
    NIGHT: "TN",
  };
  return labels[shift];
};

// ============================================
// MOCK DATA FOR TESTING
// ============================================

export const MOCK_SCHOOL_CONTEXT: SchoolContext = {
  schoolId: "school-demo-123",
  schoolName: "Escuela Tecnica N°5",
  levels: [
    {
      id: "PRIMARY",
      name: "Nivel Primario",
      shortName: "Primaria",
      icon: "School",
      color: "bg-emerald-500",
      courses: [
        {
          id: "primary-4",
          name: "4° Grado",
          year: 4,
          level: "PRIMARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "primary-4-a",
              name: "A",
              shift: "MORNING",
              studentCount: 28,
              preceptorName: "Maria Lopez",
            },
            {
              id: "primary-4-b",
              name: "B",
              shift: "MORNING",
              studentCount: 26,
              preceptorName: "Carlos Ruiz",
            },
          ],
        },
        {
          id: "primary-5",
          name: "5° Grado",
          year: 5,
          level: "PRIMARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "primary-5-a",
              name: "A",
              shift: "MORNING",
              studentCount: 30,
              preceptorName: "Ana Garcia",
            },
            {
              id: "primary-5-b",
              name: "B",
              shift: "AFTERNOON",
              studentCount: 27,
              preceptorName: "Luis Martinez",
            },
          ],
        },
        {
          id: "primary-6",
          name: "6° Grado",
          year: 6,
          level: "PRIMARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "primary-6-a",
              name: "A",
              shift: "MORNING",
              studentCount: 29,
              preceptorName: "Sofia Hernandez",
            },
          ],
        },
      ],
    },
    {
      id: "SECONDARY",
      name: "Nivel Secundario",
      shortName: "Secundaria",
      icon: "GraduationCap",
      color: "bg-blue-500",
      courses: [
        {
          id: "secondary-1",
          name: "1° Ano",
          year: 1,
          level: "SECONDARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "secondary-1-a",
              name: "A",
              shift: "MORNING",
              studentCount: 32,
              preceptorName: "Roberto Sanchez",
            },
            {
              id: "secondary-1-b",
              name: "B",
              shift: "MORNING",
              studentCount: 31,
              preceptorName: "Patricia Gomez",
            },
            {
              id: "secondary-1-c",
              name: "C",
              shift: "AFTERNOON",
              studentCount: 30,
              preceptorName: "Diego Fernandez",
            },
          ],
        },
        {
          id: "secondary-2",
          name: "2° Ano",
          year: 2,
          level: "SECONDARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "secondary-2-a",
              name: "A",
              shift: "MORNING",
              studentCount: 29,
              preceptorName: "Laura Torres",
            },
            {
              id: "secondary-2-b",
              name: "B",
              shift: "AFTERNOON",
              studentCount: 28,
              preceptorName: "Miguel Angel Diaz",
            },
          ],
        },
        {
          id: "secondary-3",
          name: "3° Ano",
          year: 3,
          level: "SECONDARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "secondary-3-a",
              name: "A",
              shift: "MORNING",
              studentCount: 27,
              preceptorName: "Carolina Mendez",
            },
            {
              id: "secondary-3-b",
              name: "B",
              shift: "MORNING",
              studentCount: 26,
              preceptorName: "Fernando Castro",
            },
          ],
        },
        {
          id: "secondary-4",
          name: "4° Ano",
          year: 4,
          level: "SECONDARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "secondary-4-a",
              name: "A",
              shift: "MORNING",
              studentCount: 25,
              preceptorName: "Valeria Rojas",
            },
          ],
        },
        {
          id: "secondary-5",
          name: "5° Ano",
          year: 5,
          level: "SECONDARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "secondary-5-a",
              name: "A",
              shift: "MORNING",
              studentCount: 24,
              preceptorName: "Andres Morales",
            },
          ],
        },
      ],
    },
    {
      id: "TERTIARY",
      name: "Nivel Terciario",
      shortName: "Terciario",
      icon: "BookOpen",
      color: "bg-purple-500",
      courses: [
        {
          id: "tertiary-1",
          name: "1° Ano - Tecnicatura",
          year: 1,
          level: "TERTIARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "tertiary-1-a",
              name: "A",
              shift: "NIGHT",
              studentCount: 35,
              preceptorName: "Ricardo Vega",
            },
          ],
        },
        {
          id: "tertiary-2",
          name: "2° Ano - Tecnicatura",
          year: 2,
          level: "TERTIARY",
          academicYear: 2024,
          isActive: true,
          divisions: [
            {
              id: "tertiary-2-a",
              name: "A",
              shift: "NIGHT",
              studentCount: 28,
              preceptorName: "Gabriela Paz",
            },
          ],
        },
      ],
    },
  ],
  currentLevel: null,
  currentCourse: null,
  currentDivision: null,
};

// ============================================
// CONTEXT HELPERS
// ============================================

export const findCourseById = (
  context: SchoolContext,
  courseId: string
): Course | null => {
  for (const level of context.levels) {
    const course = level.courses.find((c) => c.id === courseId);
    if (course) return course;
  }
  return null;
};

export const findDivisionById = (
  context: SchoolContext,
  divisionId: string
): { course: Course; division: Division } | null => {
  for (const level of context.levels) {
    for (const course of level.courses) {
      const division = course.divisions.find((d) => d.id === divisionId);
      if (division) return { course, division };
    }
  }
  return null;
};

export const getCoursesByLevel = (
  context: SchoolContext,
  level: CourseLevel
): Course[] => {
  const levelData = context.levels.find((l) => l.id === level);
  return levelData?.courses || [];
};

export const formatCourseDisplay = (
  course: Course,
  division: Division
): string => {
  return `${course.name} "${division.name}" - ${getShiftShortLabel(division.shift)}`;
};

export const formatCourseShortDisplay = (
  course: Course,
  division: Division
): string => {
  return `${course.year}° "${division.name}"`;
};
