"use client"

import { useAuth } from "@/lib/context/auth-context"
import { GlobalNav } from "@/components/navigation/global-nav"
import { LogOut, Terminal, ChevronUp, ChevronDown, School, ChevronRight } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { role, userName, schoolId, schoolName, logout, clearSchool } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    "[SYS] Initializing Sequency Core v4.2.0...",
    "[OK] Socket connected to node_AR_BUE_01",
  ])

  // Keyboard shortcut (Ctrl + Q) for dev console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault()
        setConsoleOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add route change logs
  useEffect(() => {
    if (role && schoolId) {
      const time = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      setLogs((prev) => [...prev.slice(-8), `[${time}] Route: ${pathname}`])
    }
  }, [pathname, role, schoolId])

  // Handle switching schools (for ADMIN)
  const handleSwitchSchool = () => {
    clearSchool()
    router.push("/")
  }

  // If no session, render raw content (Login page)
  if (!role) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-background">
        {children}
        <Toaster position="bottom-center" />
      </main>
    )
  }

  // If ADMIN but no school selected, also render raw content (school selector on login page)
  if (role === "ADMIN" && !schoolId) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-background">
        {children}
        <Toaster position="bottom-center" />
      </main>
    )
  }

  // If session exists and school selected, render 3-column Galactic layout
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* COLUMN 1: LEFT SIDEBAR (15%) */}
      <aside className="w-[15%] min-w-[240px] flex flex-col glass-panel border-r border-white/5 z-20">
        {/* School & Role Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <School className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{schoolName || "Sequency"}</p>
              <p className="text-[10px] text-primary uppercase tracking-widest font-bold">{role}</p>
            </div>
            {role === "ADMIN" && (
              <button 
                onClick={handleSwitchSchool}
                className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Cambiar Institucion"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-galactic px-4 py-4">
          <GlobalNav />
        </div>

        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold text-foreground">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* COLUMN 2: MAIN CONTENT AREA (60%) */}
      <main className="flex-1 w-[60%] h-full overflow-y-auto relative scrollbar-galactic">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>

      {/* COLUMN 3: RIGHT UTILITY PANEL (25%) */}
      <aside className="w-[25%] min-w-[300px] h-full glass-panel border-l border-white/5 p-6 overflow-y-auto scrollbar-galactic flex flex-col gap-6">
        <header className="border-b border-white/5 pb-4">
          <h2 className="text-sm font-bold text-foreground">Panel de Utilidades</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ruta: <span className="text-primary font-mono">{pathname}</span>
          </p>
        </header>

        {/* Role-based contextual content */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
          {role === "ADMIN" && (
            <>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Metricas Rapidas</span>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Sistema operando con normalidad.</p>
                <p><span className="text-secondary font-mono">14</span> docentes activos hoy.</p>
                <p><span className="text-secondary font-mono">342</span> alumnos registrados.</p>
              </div>
            </>
          )}
          {role === "DOCENTE" && (
            <>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Entregas Pendientes</span>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Faltan <span className="text-primary font-mono">12</span> dias para el cierre.</p>
                <p>Corregir: <span className="text-primary font-mono">18/24</span> examenes.</p>
              </div>
            </>
          )}
          {role === "PRECEPTOR" && (
            <>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Registro Diario</span>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Sin incidencias reportadas hoy.</p>
                <p>Asistencia: <span className="text-secondary font-mono">6/6</span> cursos.</p>
              </div>
            </>
          )}
          {role === "FAMILIA" && (
            <>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Notificaciones</span>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Reunion: <span className="text-primary">15 May, 18:00</span></p>
                <p><span className="text-secondary font-mono">2</span> documentos pendientes.</p>
              </div>
            </>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-2xl font-bold text-foreground">94.2%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Asistencia</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-2xl font-bold text-foreground">7.42</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Promedio</p>
          </div>
        </div>
      </aside>

      {/* DEV CONSOLE (Floating) */}
      <div 
        className={`fixed bottom-4 right-4 w-80 bg-black/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl z-50 transition-transform duration-300 ${
          consoleOpen ? "translate-y-0" : "translate-y-[calc(100%-48px)]"
        }`}
      >
        <div 
          className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer"
          onClick={() => setConsoleOpen(!consoleOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono text-primary font-bold tracking-widest uppercase">Dev Console</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded">Ctrl+Q</span>
            {consoleOpen ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronUp className="w-4 h-4 text-white/50" />}
          </div>
        </div>
        
        {consoleOpen && (
          <div className="p-4 font-mono text-[11px] flex flex-col gap-3 h-48 overflow-y-auto scrollbar-galactic text-muted-foreground">
            <div className="space-y-1">
              {logs.map((log, i) => (
                <p key={i} className={log.includes("[OK]") ? "text-secondary" : log.includes("[WAR]") ? "text-tertiary" : "text-white/60"}>
                  {log}
                </p>
              ))}
              <p className="text-secondary">[AUTH] session: {role}</p>
              <p className="text-secondary">[AUTH] school: {schoolId}</p>
              <p className="text-secondary">[AUTH] user: {userName}</p>
            </div>
            <p className="text-white/30 mt-auto">root@sequency:~$ <span className="animate-pulse">_</span></p>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "glass-panel border-white/10",
            title: "text-foreground font-medium text-sm",
            description: "text-muted-foreground text-sm",
          },
        }}
      />
    </div>
  )
}
