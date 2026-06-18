"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateToLocalISO, getTodayLocalISO } from "@/lib/utils/date-utils";

// ============================================
// TYPES
// ============================================

export interface DayEvent {
  id: string;
  label: string;
  /** Tailwind classes for the pill: background + text + border */
  className: string;
}

interface MonthGridProps {
  /** Any date within the month to render */
  monthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  /** Returns the list of event pills for a given YYYY-MM-DD date */
  getEventsForDate: (dateStr: string) => DayEvent[];
  /** Fired when a day cell is clicked */
  onDayClick?: (date: Date) => void;
  /** Fired when the primary "new event" button is clicked */
  onNewEvent?: () => void;
  /** Whether to show the primary creation button */
  canCreate?: boolean;
  /** Label for the primary creation button */
  newEventLabel?: string;
}

// ============================================
// CONSTANTS
// ============================================

const WEEKDAYS_SHORT = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const WEEKDAYS_LONG = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ============================================
// COMPONENT
// ============================================

export function MonthGrid({
  monthDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  getEventsForDate,
  onDayClick,
  onNewEvent,
  canCreate = false,
  newEventLabel = "Nuevo Evento",
}: MonthGridProps) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const todayStr = getTodayLocalISO();

  // Build the matrix of cells (Monday-first, 6 weeks = 42 cells for layout stability)
  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    // JS getDay(): 0 = Sunday ... 6 = Saturday. Convert to Monday-first index.
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    // Start date = first cell (may belong to previous month)
    const startDate = new Date(year, month, 1 - leadingBlanks);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      return {
        date,
        dateStr: formatDateToLocalISO(date),
        inCurrentMonth: date.getMonth() === month,
      };
    });
  }, [year, month]);

  // For the mobile agenda view: only days of the current month that have events
  const agendaDays = useMemo(() => {
    return cells
      .filter((c) => c.inCurrentMonth)
      .map((c) => ({ ...c, events: getEventsForDate(c.dateStr) }))
      .filter((c) => c.events.length > 0);
  }, [cells, getEventsForDate]);

  return (
    <div className="flex flex-col w-full">
      {/* ============================== */}
      {/* CALENDAR HEADER */}
      {/* ============================== */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 pb-5">
        {/* Left: navigation + giant month/year title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-center sm:justify-start">
          <Button
            size="icon"
            variant="outline"
            onClick={onPrevMonth}
            className="size-10 rounded-full border-white/10 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/5 hover:border-purple-500/30 shrink-0"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#e4e1ea] text-center min-w-[200px] md:min-w-[280px] text-balance">
            {MONTH_NAMES[month]}{" "}
            <span className="text-purple-400 font-mono">{year}</span>
          </h2>

          <Button
            size="icon"
            variant="outline"
            onClick={onNextMonth}
            className="size-10 rounded-full border-white/10 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/5 hover:border-purple-500/30 shrink-0"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {/* Right: today shortcut + primary create button */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToday}
            className="text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-full px-4"
          >
            Hoy
          </Button>
          {canCreate && onNewEvent && (
            <Button
              size="sm"
              onClick={onNewEvent}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-full px-4 shadow-lg shadow-purple-900/30"
            >
              <Plus className="size-4 mr-1.5" />
              {newEventLabel}
            </Button>
          )}
        </div>
      </div>

      {/* ============================== */}
      {/* DESKTOP / TABLET: FULL-WIDTH GRID */}
      {/* ============================== */}
      <div className="hidden md:flex md:flex-col rounded-2xl overflow-hidden border border-white/10 bg-white/[0.01] backdrop-blur-md">
        {/* Weekday header row */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {WEEKDAYS_SHORT.map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white/40"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const events = getEventsForDate(cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            const isLastCol = (idx + 1) % 7 === 0;
            const isLastRow = idx >= 35;

            return (
              <button
                type="button"
                key={cell.dateStr}
                onClick={() => onDayClick?.(cell.date)}
                className={cn(
                  "group relative flex flex-col items-stretch gap-1 p-2 text-left min-h-[120px] md:min-h-[150px] border-white/10 transition-colors",
                  !isLastCol && "border-r",
                  !isLastRow && "border-b",
                  cell.inCurrentMonth ? "bg-transparent hover:bg-white/[0.03]" : "bg-black/20 hover:bg-black/10",
                  onDayClick && "cursor-pointer",
                )}
              >
                {/* Date number */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-colors",
                      isToday
                        ? "bg-purple-600 text-white"
                        : cell.inCurrentMonth
                          ? "text-white/80 group-hover:text-white"
                          : "text-white/25",
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                  {canCreate && onDayClick && (
                    <Plus className="size-3.5 text-white/0 group-hover:text-purple-400/70 transition-colors" />
                  )}
                </div>

                {/* Event pills */}
                <div className="flex flex-col gap-1 overflow-hidden">
                  {events.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      title={event.label}
                      className={cn(
                        "truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                        event.className,
                      )}
                    >
                      {event.label}
                    </span>
                  ))}
                  {events.length > 3 && (
                    <span className="px-1.5 text-[10px] font-medium text-white/40">
                      +{events.length - 3} mas
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================== */}
      {/* MOBILE: VERTICAL AGENDA VIEW */}
      {/* ============================== */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Weekday strip for orientation */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md divide-y divide-white/5 overflow-hidden">
          {agendaDays.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CalendarDays className="size-8 text-white/20" />
              <p className="text-xs text-white/40">Sin eventos en {MONTH_NAMES[month]}</p>
            </div>
          )}
          {agendaDays.map((day) => {
            const isToday = day.dateStr === todayStr;
            const weekdayIdx = (day.date.getDay() + 6) % 7;
            return (
              <button
                type="button"
                key={day.dateStr}
                onClick={() => onDayClick?.(day.date)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                {/* Date column */}
                <div className="flex flex-col items-center shrink-0 w-12">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                    {WEEKDAYS_SHORT[weekdayIdx]}
                  </span>
                  <span
                    className={cn(
                      "flex items-center justify-center size-9 rounded-full text-base font-bold mt-1",
                      isToday ? "bg-purple-600 text-white" : "text-white/80",
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                </div>
                {/* Events column */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0 pt-1">
                  {day.events.map((event) => (
                    <span
                      key={event.id}
                      className={cn(
                        "truncate rounded-md border px-2 py-1 text-xs font-medium",
                        event.className,
                      )}
                    >
                      {event.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {canCreate && onNewEvent && (
          <Button
            onClick={onNewEvent}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl py-5 shadow-lg shadow-purple-900/30"
          >
            <Plus className="size-4 mr-1.5" />
            {newEventLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
