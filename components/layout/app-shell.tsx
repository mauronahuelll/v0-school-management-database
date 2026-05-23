"use client"

import { useAuth } from "@/lib/context/auth-context"
import { GlobalNav } from "@/components/navigation/global-nav"
import { LogOut, Terminal, ChevronUp, ChevronDown, School, ChevronRight, Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Toaster } from "@/components/ui/sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell - Layout Centralizado de Sequency
 * 
 * Responsabilidades:
 * - Detectar autenticacion y renderizar layout apropiado
 * - Manejar responsividad (mobile/desktop)
 * - Proveer navegacion global y utilidades
 * 
 * NO debe manejar:
 * - Logica de enrutamiento (eso es del AuthContext)
 * - Estados de paginas individuales
 */
export function AppShell({ children }: AppShellProps) {
  const { role, userName, schoolId, schoolName, logout, clearSchool } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    "[SYS] Initializing Sequency Core v4.2.0...",
    "[OK] Socket connected to node_AR_BUE_01",
  ])
  
  // Determinar si el usuario tiene sesion activa completa
  const isAuthenticated = useMemo(() => {
    // Usuario sin rol = no autenticado
    if (!role) return false
    // ADMIN sin escuela seleccionada = parcialmente autenticado (mostrar selector)
    if (role === "ADMIN" && !schoolId) return false
    return true
  }, [role, schoolId])

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Handle switching schools (for ADMIN)
  const handleSwitchSchool = () => {
    clearSchool()
    router.push("/")
  }

  // ====================================================================
  // RENDER: Usuario NO autenticado o ADMIN sin escuela seleccionada
  // Muestra solo el contenido (Login/Selector de escuela) sin shell
  // ====================================================================
  if (!isAuthenticated) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-background">
        {children}
        <Toaster position="bottom-center" />
      </main>
    )
  }

  // ====================================================================
  // RENDER: Usuario autenticado con sesion completa
  // Layout responsivo de 3 columnas (mobile-first)
  // ====================================================================
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background">
      
      {/* MOBILE TOP HEADER (visible only on small screens) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between bg-background/95 backdrop-blur-xl border-b border-white/5">
        {/* School & Role Compact */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <School className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{schoolName || "Sequency"}</p>
            <p className="text-[9px] text-primary uppercase tracking-widest font-bold">{role}</p>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2">
          {/* Dev Console Toggle (Mobile) */}
          <button
            onClick={() => setConsoleOpen(!consoleOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Terminal className="w-5 h-5" />
          </button>
          
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-white/5">
          <SheetHeader className="p-4 border-b border-white/5">
            <SheetTitle className="text-left">
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
            </SheetTitle>
          </SheetHeader>

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
        </SheetContent>
      </Sheet>

      {/* DESKTOP SIDEBAR (hidden on mobile, visible md+) */}
      <aside className="hidden md:flex w-[15%] min-w-[240px] flex-col glass-panel border-r border-white/5 z-20">
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

      {/* MAIN CONTENT AREA (full width mobile, flex-1 on desktop) */}
      <main className="flex-1 h-full overflow-y-auto relative scrollbar-galactic pt-14 md:pt-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* RIGHT UTILITY PANEL (hidden on mobile and tablets, visible lg+) */}
      <aside className="hidden lg:flex w-[25%] min-w-[300px] h-full glass-panel border-l border-white/5 p-6 overflow-y-auto scrollbar-galactic flex-col gap-6">
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

      {/* DEV CONSOLE (Floating - works on all screens) */}
      <div 
        className={`fixed bottom-4 right-4 w-72 md:w-80 bg-black/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl z-50 transition-transform duration-300 ${
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
            <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded">Ctrl+Q</span>
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
