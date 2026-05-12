"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type {
  SchoolContext as SchoolContextType,
  CourseLevel,
  Course,
  Division,
  ContextSelection,
} from "@/lib/types/school-context";
import {
  MOCK_SCHOOL_CONTEXT,
  findCourseById,
  findDivisionById,
  getCoursesByLevel,
} from "@/lib/types/school-context";

// ============================================
// CONTEXT DEFINITION
// ============================================

interface SchoolContextValue {
  context: SchoolContextType;
  
  // Current selection
  currentLevel: CourseLevel | null;
  currentCourse: Course | null;
  currentDivision: Division | null;
  
  // Actions
  selectLevel: (level: CourseLevel) => void;
  selectCourse: (courseId: string) => void;
  selectDivision: (divisionId: string) => void;
  selectFullContext: (selection: ContextSelection) => void;
  clearSelection: () => void;
  
  // Utilities
  getCoursesForCurrentLevel: () => Course[];
  isContextComplete: boolean;
}

const SchoolContextContext = createContext<SchoolContextValue | null>(null);

// ============================================
// LOCAL STORAGE KEY
// ============================================

const STORAGE_KEY = "sequency-school-context";

interface StoredSelection {
  level: CourseLevel | null;
  courseId: string | null;
  divisionId: string | null;
}

// ============================================
// PROVIDER COMPONENT
// ============================================

interface SchoolContextProviderProps {
  children: ReactNode;
  initialContext?: SchoolContextType;
}

export function SchoolContextProvider({
  children,
  initialContext = MOCK_SCHOOL_CONTEXT,
}: SchoolContextProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [context] = useState<SchoolContextType>(initialContext);
  const [currentLevel, setCurrentLevel] = useState<CourseLevel | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentDivision, setCurrentDivision] = useState<Division | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const selection: StoredSelection = JSON.parse(stored);
        
        if (selection.level) {
          setCurrentLevel(selection.level);
        }
        
        if (selection.courseId) {
          const course = findCourseById(context, selection.courseId);
          if (course) setCurrentCourse(course);
        }
        
        if (selection.divisionId) {
          const result = findDivisionById(context, selection.divisionId);
          if (result) {
            setCurrentCourse(result.course);
            setCurrentDivision(result.division);
            setCurrentLevel(result.course.level);
          }
        }
      }
    } catch (e) {
      console.error("[v0] Error loading school context from localStorage:", e);
    }
  }, [context]);

  // Save to localStorage when selection changes
  useEffect(() => {
    const selection: StoredSelection = {
      level: currentLevel,
      courseId: currentCourse?.id || null,
      divisionId: currentDivision?.id || null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  }, [currentLevel, currentCourse, currentDivision]);

  // Actions
  const selectLevel = useCallback((level: CourseLevel) => {
    setCurrentLevel(level);
    setCurrentCourse(null);
    setCurrentDivision(null);
  }, []);

  const selectCourse = useCallback((courseId: string) => {
    const course = findCourseById(context, courseId);
    if (course) {
      setCurrentLevel(course.level);
      setCurrentCourse(course);
      setCurrentDivision(null);
    }
  }, [context]);

  const selectDivision = useCallback((divisionId: string) => {
    const result = findDivisionById(context, divisionId);
    if (result) {
      setCurrentLevel(result.course.level);
      setCurrentCourse(result.course);
      setCurrentDivision(result.division);
    }
  }, [context]);

  const selectFullContext = useCallback((selection: ContextSelection) => {
    const result = findDivisionById(context, selection.divisionId);
    if (result) {
      setCurrentLevel(selection.level);
      setCurrentCourse(result.course);
      setCurrentDivision(result.division);
    }
  }, [context]);

  const clearSelection = useCallback(() => {
    setCurrentLevel(null);
    setCurrentCourse(null);
    setCurrentDivision(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getCoursesForCurrentLevel = useCallback(() => {
    if (!currentLevel) return [];
    return getCoursesByLevel(context, currentLevel);
  }, [context, currentLevel]);

  const isContextComplete = currentLevel !== null && 
    currentCourse !== null && 
    currentDivision !== null;

  const value: SchoolContextValue = {
    context,
    currentLevel,
    currentCourse,
    currentDivision,
    selectLevel,
    selectCourse,
    selectDivision,
    selectFullContext,
    clearSelection,
    getCoursesForCurrentLevel,
    isContextComplete,
  };

  return (
    <SchoolContextContext.Provider value={value}>
      {children}
    </SchoolContextContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useSchoolContext() {
  const context = useContext(SchoolContextContext);
  if (!context) {
    throw new Error("useSchoolContext must be used within SchoolContextProvider");
  }
  return context;
}
