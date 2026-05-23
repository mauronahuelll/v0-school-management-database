"use client";

import { useState } from "react";
import { Users, UserX, Clock, CalendarCheck, ChevronDown, CalendarIcon, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CourseInfo, AttendanceStats } from "@/lib/types/attendance";
import { formatShift } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

// Mock courses for the selector
const MOCK_COURSES = [
  { id: "course-1", year: 4, divisionName: "B", shift: "MORNING" as const, level: "SECONDARY" as const },
  { id: "course-2", year: 5, divisionName: "A", shift: "MORNING" as const, level: "SECONDARY" as const },
  { id: "course-3", year: 3, divisionName: "C", shift: "AFTERNOON" as const, level: "SECONDARY" as const },
  { id: "course-4", year: 6, divisionName: "A", shift: "MORNING" as const, level: "SECONDARY" as const },
];

interface AttendanceHeaderProps {
  course: CourseInfo;
  stats: AttendanceStats;
  currentDate: Date;
  onResetAll: () => void;
  onCourseChange?: (courseId: string) => void;
  onDateChange?: (date: Date) => void;
  onSaveAttendance?: () => Promise<void>;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

export function AttendanceHeader({
  course,
  stats,
  currentDate,
  onResetAll,
  onCourseChange,
  onDateChange,
  onSaveAttendance,
  isSubmitting = false,
  isSaving = false,
}: AttendanceHeaderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [selectedCourseId, setSelectedCourseId] = useState(course.id);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const formattedDate = selectedDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    onCourseChange?.(courseId);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange?.(date);
      setIsCalendarOpen(false);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <header className="glass-panel sticky top-0 z-20 border-b border-white/5">
      <div className="px-6 py-5 lg:px-8">
        {/* Top row: Course selector, date picker and actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Course Selector */}
            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white/[0.02] border-white/10 text-foreground">
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                {MOCK_COURSES.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-foreground">
                    {c.year}° Ano "{c.divisionName}" - {formatShift(c.shift)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-auto justify-start text-left font-normal bg-white/[0.02] border-white/10",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {isToday ? (
                    <span className="flex items-center gap-2">
                      Hoy
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {format(selectedDate, "dd/MM", { locale: es })}
                      </Badge>
                    </span>
                  ) : (
                    format(selectedDate, "EEEE dd 'de' MMMM", { locale: es })
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-white/10" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onResetAll}
              disabled={isSubmitting || isSaving}
              className="shrink-0 bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            >
              <CalendarCheck className="size-4" />
              <span className="hidden sm:inline">Poner todos Presentes</span>
              <span className="sm:hidden">Reset</span>
            </Button>

            {/* Save Button */}
            <Button
              onClick={onSaveAttendance}
              disabled={isSubmitting || isSaving}
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Guardar Parte Diario</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Course info subtitle */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {course.year}° Ano "{course.divisionName}"
          </h1>
          <p className="text-sm text-muted-foreground capitalize leading-relaxed">
            {formattedDate}
          </p>
        </div>

        {/* Stats row with generous spacing */}
        <div className="flex flex-wrap items-center gap-5 lg:gap-8">
          <StatBadge
            icon={Users}
            label="Presentes"
            value={stats.present}
            total={stats.total}
            variant="present"
          />
          <StatBadge
            icon={UserX}
            label="Ausentes"
            value={stats.absent}
            variant="absent"
          />
          <StatBadge
            icon={Clock}
            label="Tardes"
            value={stats.tardy}
            variant="tardy"
          />
          {stats.onLicense > 0 && (
            <StatBadge
              icon={CalendarCheck}
              label="En Licencia"
              value={stats.onLicense}
              variant="license"
            />
          )}
        </div>
      </div>
    </header>
  );
}

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total?: number;
  variant: "present" | "absent" | "tardy" | "license";
}

function StatBadge({ icon: Icon, label, value, total, variant }: StatBadgeProps) {
  const variantStyles = {
    present: "bg-secondary/20 text-secondary border-secondary/30",
    absent: "bg-destructive/20 text-destructive border-destructive/30",
    tardy: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    license: "bg-primary/20 text-primary border-primary/30",
  };

  return (
    <div className="flex items-center gap-3">
      <div 
        className={cn(
          "flex items-center justify-center size-10 rounded-xl border shadow-lg transition-all",
          variantStyles[variant]
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-base font-semibold text-foreground tabular-nums leading-none">
          {value}
          {total !== undefined && (
            <span className="text-muted-foreground font-normal text-sm">/{total}</span>
          )}
        </span>
      </div>
    </div>
  );
}
