"use client"

import { useState, useEffect } from "react"
import { GlobalNav } from "@/components/navigation/global-nav"
import { Terminal, ChevronUp, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"

interface AppShellProps {
  children: React.ReactNode
  schoolName?: string
}

export function AppShell({ children, schoolName = "Sequency" }: AppShellProps) {
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [userRole, setUserRole] = useState("ADMIN")
  const pathname = usePathname()

  // Atajo de teclado (Ctrl + Q) para abrir la consola flotante
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "q") {
        setConsoleOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* COLUMNA 1: SIDEBAR IZQUIERDO (15%) */}
      <aside className="w-[15%] min-w-[240px] flex flex-col glass-panel border-r border-white/5 z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-primary font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">{schoolName}</h1>
              <p className="text-[10px] text-primary uppercase tracking-widest font-bold">
                {userRole}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-galactic px-4 pb-6">
          {/* Tu componente de navegacion global existente */}
          <GlobalNav userRole={userRole} />
        </div>
      </aside>

      {/* COLUMNA 2: AREA CENTRAL (Tu sistema de rutas de Next.js) (60%) */}
      <main className="flex-1 w-[60%] h-full overflow-y-auto relative scrollbar-galactic">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>

      {/* COLUMNA 3: PANEL DE UTILIDADES DERECHO (25%) */}
      <aside className="w-[25%] min-w-[300px] h-full glass-panel border-l border-white/5 p-6 overflow-y-auto scrollbar-galactic flex flex-col gap-6">
        <header className="border-b border-white/5 pb-4">
          <h2 className="text-sm font-bold text-foreground">Panel de Utilidades</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ruta actual: <span className="text-primary font-mono">{pathname}</span>
          </p>
        </header>

        {/* Logica condicional basica para el panel derecho segun el rol/ruta */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          {userRole === "ADMIN" && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Metricas Rapidas</span>
              <p className="text-xs text-muted-foreground">Sistema operando con normalidad. 14 docentes activos hoy.</p>
            </div>
          )}
          {userRole === "DOCENTE" && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-status-present uppercase tracking-widest">Entregas</span>
              <p className="text-xs text-muted-foreground">Faltan 12 dias para el cierre del trimestre.</p>
            </div>
          )}
          {userRole === "PRECEPTOR" && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-status-tardy uppercase tracking-widest">Registro Diario</span>
              <p className="text-xs text-muted-foreground">Sin incidencias de conducta reportadas hoy.</p>
            </div>
          )}
          {userRole === "FAMILIA" && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-status-present uppercase tracking-widest">Novedades</span>
              <p className="text-xs text-muted-foreground">Tu hijo/a tiene 2 documentos pendientes de firma.</p>
            </div>
          )}
        </div>

        {/* Estadisticas rapidas */}
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

      {/* CONSOLA DEVELOPER (FLOTANTE) - Para simular roles sin romper la app */}
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
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono text-primary font-bold tracking-widest uppercase">Dev Sandbox</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded">Ctrl+Q</span>
            {consoleOpen ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronUp className="w-4 h-4 text-white/50" />}
          </div>
        </div>
        
        {consoleOpen && (
          <div className="p-4 font-mono text-xs flex flex-col gap-4 h-56 overflow-y-auto scrollbar-galactic text-muted-foreground">
            <div className="space-y-1">
              <p><span className="text-status-present">[SYS]</span> View-sync active.</p>
              <p><span className="text-status-present">[OK]</span> Socket connected to node_AR_BUE_01</p>
              <p><span className="text-status-tardy">[WAR]</span> 3 students below threshold</p>
            </div>
            <div>
              <p className="text-primary mb-2">{"> select_role --force"}</p>
              <div className="grid grid-cols-2 gap-2">
                {["ADMIN", "DOCENTE", "PRECEPTOR", "FAMILIA"].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setUserRole(role)}
                    className={`py-1.5 rounded-md border transition-all text-[10px] font-bold ${
                      userRole === role 
                        ? "bg-primary/20 border-primary text-primary" 
                        : "border-white/10 hover:bg-white/5 text-white/60"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-white/30 mt-auto">root@sequency:~$ <span className="animate-terminal-blink">_</span></p>
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
