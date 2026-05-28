"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, Users, Clock, ShieldAlert, 
  BookOpen, GraduationCap, Calendar, TrendingUp,
  Bell, FileText, Award, RefreshCw, PanelRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OperationalAlerts, getAlertsCount } from "@/components/dashboard/operational-alerts"

// Datos aislados por escuela (multi-tenant)
const DATA_POR_ESCUELA: Record<string, {
  name: string
  matricula: number
  presentesHoy: string
  alertasConvivencia: number
  periodo: string
  promedio: string
  docentesActivos: number
}> = {
  "inst-1": {
    name: "Instituto Padre Marquez",
    matricula: 420,
    presentesHoy: "94.2%",
    alertasConvivencia: 2,
    periodo: "1er Trimestre 2026",
    promedio: "7.42",
    docentesActivos: 14
  },
  "inst-2": {
    name: "Colegio Secundario San Martin",
    matricula: 310,
    presentesHoy: "88.5%",
    alertasConvivencia: 5,
    periodo: "1er Cuatrimestre 2026",
    promedio: "6.89",
    docentesActivos: 11
  },
  "inst-3": {
    name: "Escuela Tecnica N3",
    matricula: 580,
    presentesHoy: "91.3%",
    alertasConvivencia: 3,
    periodo: "1er Trimestre 2026",
    promedio: "7.15",
    docentesActivos: 22
  }
}

// Datos del alumno para vista FAMILIA
const ALUMNO_DATA = {
  nombre: "Valentina Castro",
  curso: "4to Ano Secundaria",
  division: "B",
  inasistencias: 3.5,
  limiteInasistencias: 15,
  promedio: 8.45,
  materias: [
    { nombre: "Matematica", nota: 8, estado: "TEA" },
    { nombre: "Lengua", nota: 9, estado: "TEP" },
    { nombre: "Historia", nota: 7, estado: "TED" },
    { nombre: "Fisica", nota: 8, estado: "TEA" },
  ]
}

// Materias asignadas para DOCENTE
const MATERIAS_DOCENTE = [
  { id: 1, nombre: "Matematica Avanzada IV", curso: "4to Ano", division: "B", alumnos: 24, pendientes: 18 },
  { id: 2, nombre: "Algebra Lineal", curso: "5to Ano", division: "A", alumnos: 28, pendientes: 12 },
  { id: 3, nombre: "Calculo I", curso: "6to Ano", division: "C", alumnos: 22, pendientes: 8 },
]

// Cursos asignados para PRECEPTOR
const CURSOS_PRECEPTOR = [
  { id: 1, nombre: "4to Ano A", presentes: 24, ausentes: 3, total: 27 },
  { id: 2, nombre: "4to Ano B", presentes: 22, ausentes: 2, total: 24 },
  { id: 3, nombre: "5to Ano A", presentes: 26, ausentes: 1, total: 27 },
  { id: 4, nombre: "5to Ano B", presentes: 23, ausentes: 4, total: 27 },
]

export default function DashboardPage() {
  const { activeContext } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [today, setToday] = useState("")
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(true)

  const role = activeContext?.role || null
  const schoolId = activeContext?.schoolId || "inst-1"
  const schoolName = activeContext?.schoolName || "Instituto"
  
  // Get alerts count for the floating button badge
  const alertsCount = getAlertsCount(role)

  useEffect(() => {
    setMounted(true)
    setToday(
      new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const escuelaActiva = DATA_POR_ESCUELA[schoolId || "inst-1"] || DATA_POR_ESCUELA["inst-1"]

  // Determine if we should show the alerts panel
  const showAlertsPanel = role !== "FAMILIA"
  const isAlertsPanelVisible = showAlertsPanel && !isAlertsCollapsed

  return (
    <div className="space-y-6">
      {/* Header Contextual */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl glass-panel"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                Entorno operativo unificado
              </p>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {role === "FAMILIA" ? "Portal Familiar" : escuelaActiva.name}
              </h1>
            </div>
          </div>
          <p className="text-xs text-muted-foreground capitalize pl-14">
            {today} | {escuelaActiva.periodo}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-bold">
            {role}
          </span>
          {showAlertsPanel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
              className={`gap-2 text-xs transition-colors ${
                !isAlertsCollapsed 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" 
                  : ""
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel de Control</span>
              {alertsCount > 0 && isAlertsCollapsed && (
                <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alertsCount}
                </span>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
        </div>
      </motion.header>

      {/* Main Grid: Content + Alerts Panel */}
      <div className={`grid gap-6 transition-all duration-300 ${isAlertsPanelVisible ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        {/* Main Content Area */}
        <div className="space-y-6">

      {/* VISTA: ADMIN */}
      {role === "ADMIN" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Matricula Total</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold tracking-tight">{escuelaActiva.matricula}</p>
              <p className="text-[11px] text-muted-foreground">Alumnos validados en sistema</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Asistencia Hoy</span>
                <Clock className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-secondary">{escuelaActiva.presentesHoy}</p>
              <p className="text-[11px] text-muted-foreground">Presentismo del parte diario</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Alertas Gabinete</span>
                <ShieldAlert className="w-4 h-4 text-tertiary" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-tertiary">{escuelaActiva.alertasConvivencia}</p>
              <p className="text-[11px] text-muted-foreground">Casos criticos en seguimiento</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Docentes Activos</span>
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold tracking-tight">{escuelaActiva.docentesActivos}</p>
              <p className="text-[11px] text-muted-foreground">Con sesion iniciada hoy</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Gestion de Usuarios", href: "/users" },
              { icon: FileText, label: "Reportes", href: "/analytics" },
              { icon: ShieldAlert, label: "Permisos", href: "/permissions" },
              { icon: Calendar, label: "Calendario", href: "/calendar" },
            ].map((action, i) => (
              <button
                key={i}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-white/[0.04] transition-all flex items-center gap-3 group"
              >
                <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* VISTA: DOCENTE */}
      {role === "DOCENTE" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Mis Materias Asignadas</h2>
              <span className="text-xs text-muted-foreground">{MATERIAS_DOCENTE.length} cursos</span>
            </div>
            <div className="grid gap-3">
              {MATERIAS_DOCENTE.map((materia) => (
                <div
                  key={materia.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{materia.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{materia.curso} - Division {materia.division} | {materia.alumnos} alumnos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-bold text-tertiary">{materia.pendientes}/{materia.alumnos}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl glass-panel text-center">
              <p className="text-2xl font-bold text-foreground">38</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Examenes Pendientes</p>
            </div>
            <div className="p-4 rounded-xl glass-panel text-center">
              <p className="text-2xl font-bold text-secondary">12</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dias al Cierre</p>
            </div>
            <div className="p-4 rounded-xl glass-panel text-center">
              <p className="text-2xl font-bold text-primary">74</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Alumnos Totales</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* VISTA: PRECEPTOR */}
      {role === "PRECEPTOR" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Panel de Asistencia</h2>
              <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary text-xs font-bold">Hoy</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {CURSOS_PRECEPTOR.map((curso) => (
                <div
                  key={curso.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-foreground">{curso.nombre}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      curso.ausentes > 2 ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"
                    }`}>
                      {curso.ausentes > 0 ? `${curso.ausentes} ausentes` : "Completo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${(curso.presentes / curso.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {curso.presentes}/{curso.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl glass-panel">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Presentes Totales</span>
              </div>
              <p className="text-3xl font-bold text-secondary">95</p>
            </div>
            <div className="p-4 rounded-xl glass-panel">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-4 h-4 text-tertiary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Incidencias Hoy</span>
              </div>
              <p className="text-3xl font-bold text-tertiary">0</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* VISTA: FAMILIA */}
      {role === "FAMILIA" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Student Card */}
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-white/10">
                <span className="text-lg font-bold text-foreground">VC</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{ALUMNO_DATA.nombre}</h2>
                <p className="text-sm text-muted-foreground">{ALUMNO_DATA.curso} - Division {ALUMNO_DATA.division}</p>
                <p className="text-xs text-primary mt-1">{escuelaActiva.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Inasistencias</p>
                <p className="text-2xl font-bold">
                  <span className="text-tertiary">{ALUMNO_DATA.inasistencias}</span>
                  <span className="text-muted-foreground text-lg"> / {ALUMNO_DATA.limiteInasistencias}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-tertiary rounded-full"
                    style={{ width: `${(ALUMNO_DATA.inasistencias / ALUMNO_DATA.limiteInasistencias) * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Promedio General</p>
                <p className="text-2xl font-bold text-secondary">{ALUMNO_DATA.promedio}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-secondary" />
                  <span className="text-[10px] text-secondary">+0.3 este mes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Calificaciones Recientes</h3>
            <div className="space-y-2">
              {ALUMNO_DATA.materias.map((materia, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{materia.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      materia.estado === "TEA" ? "bg-secondary/10 text-secondary" :
                      materia.estado === "TEP" ? "bg-primary/10 text-primary" :
                      "bg-tertiary/10 text-tertiary"
                    }`}>
                      {materia.estado}
                    </span>
                    <span className="text-lg font-bold text-foreground w-8 text-right">{materia.nota}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl glass-panel hover:border-primary/30 transition-all flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Muro Escolar</span>
            </button>
            <button className="p-4 rounded-xl glass-panel hover:border-primary/30 transition-all flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Tramites</span>
            </button>
          </div>
        </motion.div>
      )}
        </div>

        {/* Operational Alerts Panel - Right sidebar (hidden for FAMILIA) */}
        <AnimatePresence mode="wait">
          {isAlertsPanelVisible && (
            <OperationalAlerts 
              role={role} 
              className="sticky top-6" 
              onCollapse={() => setIsAlertsCollapsed(true)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
