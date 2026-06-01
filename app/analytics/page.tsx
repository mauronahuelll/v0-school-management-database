"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap,
  AlertTriangle,
  Calendar,
  UserX,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateToLocalISO } from "@/lib/utils/date-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// HEATMAP DATA TYPES
// ============================================================================

interface HeatmapDay {
  date: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  value: number; // 0-1 opacity/intensity
  isWeekend: boolean;
  isHoliday: boolean;
  label: string;
}

// Generate heatmap data for a month with weekends and holidays marked
function generateHeatmapData(): HeatmapDay[] {
  const holidays = [
    { date: "2026-05-01", label: "Dia del Trabajador" },
    { date: "2026-05-25", label: "Dia de la Revolucion" },
  ];
  
  const data: HeatmapDay[] = [];
  const startDate = new Date("2026-05-01");
  
  for (let i = 0; i < 31; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    if (date.getMonth() !== 4) continue; // May only
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = formatDateToLocalISO(date);
    const holiday = holidays.find(h => h.date === dateStr);
    const isHoliday = !!holiday;
    
    data.push({
      date: dateStr,
      dayOfWeek,
      value: isWeekend || isHoliday ? 0 : Math.random() * 0.8 + 0.1,
      isWeekend,
      isHoliday,
      label: isHoliday ? holiday.label : isWeekend ? "Fin de semana" : `${date.getDate()} Mayo`,
    });
  }
  
  return data;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);

  useEffect(() => {
    setMounted(true);
    setHeatmapData(generateHeatmapData());
  }, []);

  if (!mounted) return null;

  // Group heatmap data by weeks for calendar view
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  // Add padding for first week
  if (heatmapData.length > 0) {
    const firstDay = heatmapData[0].dayOfWeek;
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({
        date: "",
        dayOfWeek: i,
        value: 0,
        isWeekend: i === 0 || i === 6,
        isHoliday: false,
        label: "",
      });
    }
  }
  
  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-[#e4e1ea]">Consola de Analitica</h1>
        <p className="text-sm text-white/40 mt-1">
          Metricas de rendimiento institucional en tiempo real
        </p>
      </header>

      {/* Stats Grid - Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Presentismo Alumnos", value: "94.2%", trend: "+2.4%", positive: true, icon: Users, color: "emerald" },
          { label: "Promedio General", value: "7.42", trend: "+0.3", positive: true, icon: GraduationCap, color: "blue" },
          { label: "Alertas Tempranas", value: "12", trend: "-3", positive: true, icon: AlertTriangle, color: "amber" },
          { label: "Tasa Aprobacion", value: "89%", trend: "+5%", positive: true, icon: TrendingUp, color: "purple" },
          { label: "Ausentismo Docente", value: "12%", trend: "+1.2%", positive: false, icon: UserX, color: "red" },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={cn(
              "rounded-2xl border bg-white/[0.02] backdrop-blur-md p-4 space-y-3",
              stat.color === "red" ? "border-red-500/20" : "border-white/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                stat.color === "emerald" && "bg-emerald-500/10",
                stat.color === "blue" && "bg-blue-500/10",
                stat.color === "amber" && "bg-amber-500/10",
                stat.color === "purple" && "bg-purple-500/10",
                stat.color === "red" && "bg-red-500/10",
              )}>
                <stat.icon className={cn(
                  "size-5",
                  stat.color === "emerald" && "text-emerald-400",
                  stat.color === "blue" && "text-blue-400",
                  stat.color === "amber" && "text-amber-400",
                  stat.color === "purple" && "text-purple-400",
                  stat.color === "red" && "text-red-400",
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-mono font-bold px-2 py-1 rounded-lg",
                stat.positive 
                  ? "text-emerald-400 bg-emerald-500/10" 
                  : "text-red-400 bg-red-500/10"
              )}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e4e1ea]">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ausentismo Docente Detail Card */}
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <UserX className="size-7 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-[#e4e1ea]">Ausentismo Docente - Mayo 2026</h3>
              <p className="text-sm text-white/50 mt-1">Detalle de inasistencias del personal docente</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-400">12%</p>
            <p className="text-xs text-red-400/70">+1.2% vs mes anterior</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider">Licencias Medicas</p>
            <p className="text-xl font-bold text-[#e4e1ea] mt-1">8</p>
            <p className="text-[10px] text-amber-400 mt-1">45% del total</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider">Injustificadas</p>
            <p className="text-xl font-bold text-[#e4e1ea] mt-1">3</p>
            <p className="text-[10px] text-red-400 mt-1">17% del total</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider">Paro/Asambleas</p>
            <p className="text-xl font-bold text-[#e4e1ea] mt-1">7</p>
            <p className="text-[10px] text-purple-400 mt-1">38% del total</p>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#e4e1ea]">Mapa de Calor de Ausentismo</h2>
            <p className="text-xs text-white/40 mt-1">Mayo 2026 - Vista diaria de inasistencias estudiantiles</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                  <Info className="size-4 text-white/40" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-[#1a1a2e] border-white/10">
                <p className="text-xs">
                  Los fines de semana y feriados aparecen deshabilitados (gris) 
                  porque NO computan en el calculo estadistico de ausentismo escolar.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
          {/* Day labels */}
          <div className="flex items-center gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((day, i) => (
              <div 
                key={day} 
                className={cn(
                  "flex-1 text-center text-[10px] font-mono",
                  i === 0 || i === 6 ? "text-white/20" : "text-white/40"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <TooltipProvider>
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1">
                  {week.map((day, dayIndex) => {
                    if (!day.date) {
                      return <div key={dayIndex} className="flex-1 aspect-square" />;
                    }
                    
                    const isDisabled = day.isWeekend || day.isHoliday;
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex-1 aspect-square rounded-md transition-all cursor-pointer",
                              isDisabled 
                                ? "bg-white/[0.03] border border-dashed border-white/10" 
                                : "hover:ring-2 hover:ring-purple-500/50"
                            )}
                            style={{
                              backgroundColor: isDisabled 
                                ? undefined 
                                : `rgba(208, 188, 255, ${day.value})`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1a1a2e] border-white/10">
                          <div className="text-xs">
                            <p className="font-medium">{day.label}</p>
                            {isDisabled ? (
                              <p className="text-white/40 mt-1">
                                {day.isHoliday ? "Feriado - No computa" : "Fin de semana - No computa"}
                              </p>
                            ) : (
                              <p className="text-purple-300 mt-1">
                                {Math.round(day.value * 100)}% ausentismo
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white/[0.03] border border-dashed border-white/10" />
                <span className="text-[10px] text-white/40">Fines de semana / Feriados (No computan)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Menos</span>
              <div className="flex gap-0.5">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: `rgba(208, 188, 255, ${opacity})` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/40">Mas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-white/60">Dias Habiles Mayo</span>
          </div>
          <p className="text-2xl font-bold text-[#e4e1ea]">21</p>
          <p className="text-[10px] text-white/30 mt-1">Excluyendo feriados y fines de semana</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-purple-500" />
            <span className="text-xs text-white/60">Feriados</span>
          </div>
          <p className="text-2xl font-bold text-[#e4e1ea]">2</p>
          <p className="text-[10px] text-white/30 mt-1">Dia del Trabajador, Revolucion de Mayo</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-blue-500" />
            <span className="text-xs text-white/60">Alumnos Activos</span>
          </div>
          <p className="text-2xl font-bold text-[#e4e1ea]">847</p>
          <p className="text-[10px] text-white/30 mt-1">Matricula vigente total</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-xs text-white/60">Docentes Activos</span>
          </div>
          <p className="text-2xl font-bold text-[#e4e1ea]">52</p>
          <p className="text-[10px] text-white/30 mt-1">Personal docente en planta</p>
        </div>
      </div>
    </div>
  );
}
