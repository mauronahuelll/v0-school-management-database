"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { motion } from "framer-motion"
import { 
  GraduationCap, Calendar, BookOpen, Award, 
  TrendingUp, Clock, FileText, ShieldAlert,
  User, Mail, Phone, MapPin
} from "lucide-react"
import { StudentComplementaryData } from "@/components/student/student-complementary-data"

// Datos del estudiante
const ESTUDIANTE = {
  nombre: "Valentina",
  apellido: "Castro",
  dni: "45.678.901",
  fechaNacimiento: "15/03/2010",
  curso: "4to Ano",
  division: "B",
  turno: "Manana",
  email: "vcastro@sequency.edu.ar",
  telefono: "+54 11 5555-1234",
  direccion: "Av. San Martin 1234, Berazategui",
  tutorPrincipal: "Maria Elena Castro",
  tutorTelefono: "+54 11 5555-5678",
  foto: null
}

const MATERIAS = [
  { nombre: "Matematica Avanzada", profesor: "Prof. Rodriguez", nota: 8, estado: "TEA", asistencia: 94 },
  { nombre: "Lengua y Literatura", profesor: "Prof. Fernandez", nota: 9, estado: "TEP", asistencia: 98 },
  { nombre: "Historia Argentina", profesor: "Prof. Martinez", nota: 7, estado: "TED", asistencia: 92 },
  { nombre: "Fisica", profesor: "Prof. Lopez", nota: 8, estado: "TEA", asistencia: 96 },
  { nombre: "Quimica", profesor: "Prof. Sanchez", nota: 7, estado: "TED", asistencia: 90 },
  { nombre: "Ingles", profesor: "Prof. Williams", nota: 9, estado: "TEP", asistencia: 100 },
  { nombre: "Educacion Fisica", profesor: "Prof. Garcia", nota: 10, estado: "TEA", asistencia: 100 },
  { nombre: "Arte y Cultura", profesor: "Prof. Ruiz", nota: 8, estado: "TEA", asistencia: 95 },
]

const HISTORIAL_CONVIVENCIA = [
  { fecha: "10/04/2026", tipo: "Positiva", descripcion: "Colaboracion destacada en organizacion del evento solidario.", profesor: "Preceptora Martinez" },
  { fecha: "22/03/2026", tipo: "Observacion", descripcion: "Llegada tarde sin justificativo.", profesor: "Preceptora Martinez" },
]

export default function StudentProfilePage() {
  const { role, schoolName } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"academico" | "convivencia" | "datos">("academico")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Solo FAMILIA y ADMIN pueden ver el perfil completo
  if (role !== "FAMILIA" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-3">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium">Acceso Restringido</p>
        <p className="text-sm text-center max-w-md">
          Esta seccion esta reservada para tutores familiares y administradores.
        </p>
      </div>
    )
  }

  const promedioGeneral = (MATERIAS.reduce((acc, m) => acc + m.nota, 0) / MATERIAS.length).toFixed(2)
  const asistenciaPromedio = Math.round(MATERIAS.reduce((acc, m) => acc + m.asistencia, 0) / MATERIAS.length)

  return (
    <div className="space-y-6">
      {/* Header con datos del alumno */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl glass-panel"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-white/10 shrink-0">
            <span className="text-2xl font-bold text-foreground">
              {ESTUDIANTE.nombre[0]}{ESTUDIANTE.apellido[0]}
            </span>
          </div>

          {/* Info Principal */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {ESTUDIANTE.apellido}, {ESTUDIANTE.nombre}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {ESTUDIANTE.curso} - Division {ESTUDIANTE.division} | Turno {ESTUDIANTE.turno}
                </p>
                <p className="text-xs text-primary mt-2">{schoolName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">DNI</p>
                <p className="text-sm font-mono text-foreground">{ESTUDIANTE.dni}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-2xl font-bold text-secondary">{promedioGeneral}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Promedio</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-2xl font-bold text-foreground">{asistenciaPromedio}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Asistencia</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-2xl font-bold text-tertiary">3.5</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inasist.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "academico", label: "Rendimiento Academico", icon: BookOpen },
          { id: "convivencia", label: "Convivencia", icon: Award },
          { id: "datos", label: "Datos Personales", icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/[0.02] text-muted-foreground border border-white/5 hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === "academico" && (
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Calificaciones por Materia</h2>
            <div className="space-y-2">
              {MATERIAS.map((materia, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{materia.nombre}</p>
                      <p className="text-xs text-muted-foreground">{materia.profesor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Asistencia</p>
                      <p className="text-sm font-mono text-foreground">{materia.asistencia}%</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      materia.estado === "TEA" ? "bg-secondary/10 text-secondary" :
                      materia.estado === "TEP" ? "bg-primary/10 text-primary" :
                      "bg-tertiary/10 text-tertiary"
                    }`}>
                      {materia.estado}
                    </span>
                    <span className="text-xl font-bold text-foreground w-8 text-right">{materia.nota}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "convivencia" && (
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Historial de Convivencia</h2>
            <div className="space-y-3">
              {HISTORIAL_CONVIVENCIA.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  item.tipo === "Positiva" 
                    ? "bg-secondary/5 border-secondary/20" 
                    : "bg-tertiary/5 border-tertiary/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.tipo === "Positiva" ? "bg-secondary/20 text-secondary" : "bg-tertiary/20 text-tertiary"
                    }`}>
                      {item.tipo}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.fecha}</span>
                  </div>
                  <p className="text-sm text-foreground">{item.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-2">Registrado por: {item.profesor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "datos" && (
          <div className="p-6 rounded-2xl glass-panel space-y-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Informacion Personal</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Datos del Estudiante</h3>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, label: "Fecha de Nacimiento", value: ESTUDIANTE.fechaNacimiento },
                    { icon: Mail, label: "Email Institucional", value: ESTUDIANTE.email },
                    { icon: MapPin, label: "Direccion", value: ESTUDIANTE.direccion },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <item.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Tutor Responsable</h3>
                <div className="space-y-3">
                  {[
                    { icon: User, label: "Nombre Completo", value: ESTUDIANTE.tutorPrincipal },
                    { icon: Phone, label: "Telefono de Contacto", value: ESTUDIANTE.tutorTelefono },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <item.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modulo de Responsabilidad Legal: autorizacion de retiro + firma digital */}
        {activeTab === "datos" && (
          <div className="mt-6">
            <StudentComplementaryData
              studentName={`${ESTUDIANTE.nombre} ${ESTUDIANTE.apellido}`}
              userRole={role ?? undefined}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
