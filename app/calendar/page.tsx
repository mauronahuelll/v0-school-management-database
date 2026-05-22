"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const today = new Date();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Eventos y fechas importantes del ciclo lectivo
          </p>
        </div>
      </header>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="size-5 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-bold">{monthNames[today.getMonth()]} {today.getFullYear()}</h2>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
          Hoy
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
            <div key={day} className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 3; // Offset for month start
            const isToday = dayNum === today.getDate();
            const isCurrentMonth = dayNum > 0 && dayNum <= 31;
            
            return (
              <div
                key={i}
                className={`min-h-[80px] p-2 border-b border-r border-white/5 last:border-r-0 ${
                  isToday ? "bg-primary/5" : ""
                } ${!isCurrentMonth ? "opacity-30" : ""}`}
              >
                <span className={`text-sm ${isToday ? "text-primary font-bold" : ""}`}>
                  {isCurrentMonth ? dayNum : ""}
                </span>
                {/* Sample events */}
                {dayNum === 15 && (
                  <div className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-status-tardy/20 text-status-tardy truncate">
                    Cierre Trimestre
                  </div>
                )}
                {dayNum === 22 && (
                  <div className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-status-present/20 text-status-present truncate">
                    Reunion Padres
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
