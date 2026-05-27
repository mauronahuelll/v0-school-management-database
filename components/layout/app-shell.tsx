"use client"

import { useAuth } from "@/lib/context/auth-context"
import { GlobalNav } from "@/components/navigation/global-nav"
import { ContextSelector } from "@/components/auth/context-selector"
import { LogOut, Terminal, ChevronUp, ChevronDown, School, ChevronRight, Menu, Users, GraduationCap, BookOpen, Home, Search, Calendar, AlertTriangle, Zap } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Toaster } from "@/components/ui/sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

// Role icons mapping
const ROLE_ICONS = {
  ADMIN: School,
  DOCENTE: BookOpen,
  PRECEPTOR: Users,
  FAMILIA: Home,
}

// Level labels
const LEVEL_LABELS = {
  INICIAL: "Nivel Inicial",
  PRIMARIO: "Nivel Primario",
  SECUNDARIO: "Nivel Secundario",
  TERCIARIO: "Nivel Terciario",
}

/**
 * AppShell - Layout Centralizado de Sequency
 * 
 * Responsabilidades:
 * - Detectar autenticacion y renderizar layout apropiado
 * - Manejar responsividad (mobile/desktop)
 * - Proveer navegacion global y utilidades
 * - Soportar Multi-Contexto (mismo usuario, diferentes roles)
 */
export function AppShell({ children }: AppShellProps) {
  const { 
    user, 
    activeContext, 
    availableContexts, 
    logout, 
    switchContext 
  } = useAuth()
  
  const pathname = usePathname()
  const router = useRouter()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contextSelectorOpen, setContextSelectorOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    "[SYS] Initializing Sequency Core v4.2.0...",
    "[OK] Socket connected to node_AR_BUE_01",
  ])
  
  // Derived values from activeContext
  const role = activeContext?.role ?? null
  const schoolId = activeContext?.schoolId ?? null
  const schoolName = activeContext?.schoolName ?? null
  const userName = user?.name ?? ""
  
  // Determinar si el usuario tiene sesion activa completa
  const isAuthenticated = useMemo(() => {
    // Usuario sin user = no autenticado
    if (!user) return false
    // Usuario sin contexto activo = debe seleccionar contexto
    if (!activeContext) return false
    return true
  }, [user, activeContext])

  // Usuario logueado pero sin contexto seleccionado
  const needsContextSelection = useMemo(() => {
    return user !== null && availableContexts.length > 0 && activeContext === null
  }, [user, availableContexts, activeContext])

  // Keyboard shortcut (Ctrl + Q) for dev console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault()
        setConsoleOpen((prev) => !prev)
      }
      // Cmd+K or Ctrl+K for global search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add route change logs
  useEffect(() => {
    if (user && activeContext) {
      const time = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      setLogs((prev) => [...prev.slice(-8), `[${time}] Route: ${pathname}`])
    }
  }, [pathname, user, activeContext])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setContextSelectorOpen(false)
  }, [pathname])

  // Handle context switch
  const handleSwitchContext = (contextId: string) => {
    switchContext(contextId)
    setContextSelectorOpen(false)
  }

  // ====================================================================
  // RENDER: Usuario logueado pero sin contexto seleccionado
  // Muestra la pantalla de seleccion de perfil/sombrero
  // ====================================================================
  if (needsContextSelection) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-background">
        <ContextSelector />
        <Toaster position="bottom-center" />
      </main>
    )
  }

  // ====================================================================
  // RENDER: Usuario NO autenticado
  // Muestra el contenido raw (pagina de login)
  // ====================================================================
  if (!isAuthenticated) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-background">
        {children}
        <Toaster position="bottom-center" />
      </main>
    )
  }

  const RoleIcon = ROLE_ICONS[role!] || School

  // ====================================================================
  // RENDER: Usuario autenticado con contexto activo
  // Layout responsivo de 3 columnas (mobile-first)
  // ====================================================================
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background">
      
      {/* MOBILE TOP HEADER (visible only on small screens) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between bg-background/95 backdrop-blur-xl border-b border-white/5">
        {/* School & Role Compact */}
        <button 
          onClick={() => setContextSelectorOpen(true)}
          className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <RoleIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{schoolName || "Sequency"}</p>
            <p className="text-[9px] text-primary uppercase tracking-widest font-bold">{role}</p>
          </div>
          {availableContexts.length > 1 && (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2">
          {/* Global Search Toggle (Mobile) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
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

      {/* CONTEXT SELECTOR SHEET (Mobile) */}
      <Sheet open={contextSelectorOpen} onOpenChange={setContextSelectorOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] p-0 bg-background border-t border-white/5 rounded-t-2xl">
          <SheetHeader className="p-4 border-b border-white/5">
            <SheetTitle className="text-left text-sm font-bold">
              Cambiar Contexto
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              Selecciona el rol con el que deseas trabajar
            </p>
          </SheetHeader>

          <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
            {availableContexts.map((ctx) => {
              const CtxIcon = ROLE_ICONS[ctx.role]
              const isActive = ctx.id === activeContext?.id
              
              return (
                <button
                  key={ctx.id}
                  onClick={() => handleSwitchContext(ctx.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                    isActive 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isActive ? "bg-primary/20" : "bg-white/5"
                  )}>
                    <CtxIcon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {ctx.role}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {LEVEL_LABELS[ctx.level]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ctx.schoolName}</p>
                    {ctx.description && (
                      <p className="text-xs text-muted-foreground truncate">{ctx.description}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* GLOBAL SEARCH COMMAND DIALOG */}
      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        title="Buscador Global"
        description="Busca alumnos, personal o acciones rapidas"
      >
        <CommandInput placeholder="Buscar alumnos, personal, acciones..." />
        <CommandList className="bg-background">
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          
          <CommandGroup heading="Alumnos">
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/students") }}>
              <GraduationCap className="mr-2 h-4 w-4 text-[#d0bcff]" />
              <span>Sofia Alvarez</span>
              <span className="ml-auto text-xs text-muted-foreground">4to Ano A</span>
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/students") }}>
              <GraduationCap className="mr-2 h-4 w-4 text-[#d0bcff]" />
              <span>Mateo Benitez</span>
              <span className="ml-auto text-xs text-muted-foreground">4to Ano A</span>
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/students") }}>
              <GraduationCap className="mr-2 h-4 w-4 text-[#d0bcff]" />
              <span>Valentina Castro</span>
              <span className="ml-auto text-xs text-muted-foreground">4to Ano B</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Personal">
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/users") }}>
              <Users className="mr-2 h-4 w-4 text-[#4de082]" />
              <span>Prof. Maria Gonzalez</span>
              <span className="ml-auto text-xs text-muted-foreground">Docente</span>
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/users") }}>
              <Users className="mr-2 h-4 w-4 text-[#4de082]" />
              <span>Lic. Juan Rodriguez</span>
              <span className="ml-auto text-xs text-muted-foreground">Preceptor</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Acciones Rapidas">
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/calendar") }}>
              <Calendar className="mr-2 h-4 w-4 text-[#ffb93d]" />
              <span>Ir a Calendario</span>
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/behavior") }}>
              <AlertTriangle className="mr-2 h-4 w-4 text-[#ffb4ab]" />
              <span>Emitir Sancion</span>
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push("/grades") }}>
              <Zap className="mr-2 h-4 w-4 text-[#d0bcff]" />
              <span>Cargar Calificaciones</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* MOBILE NAVIGATION DRAWER (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-white/5">
          <SheetHeader className="p-4 border-b border-white/5">
            <SheetTitle className="text-left">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false)
                  setContextSelectorOpen(true)
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                  <RoleIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-foreground truncate">{schoolName || "Sequency"}</p>
                  <p className="text-[10px] text-primary uppercase tracking-widest font-bold">{role}</p>
                </div>
                {availableContexts.length > 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
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
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
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
        {/* School & Role Header - Clickable for context switch */}
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={() => setContextSelectorOpen(true)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <RoleIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-foreground truncate">{schoolName || "Sequency"}</p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-primary uppercase tracking-widest font-bold">{role}</p>
                {activeContext?.level && (
                  <span className="text-[8px] text-muted-foreground">• {activeContext.level}</span>
                )}
              </div>
            </div>
            {availableContexts.length > 1 && (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
          
          {/* Context description */}
          {activeContext?.description && (
            <p className="mt-2 px-2 text-[10px] text-muted-foreground truncate">
              {activeContext.description}
            </p>
          )}
        </div>

        {/* Search Button */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors text-left group"
          >
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground">Buscar...</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
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
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
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

      {/* DESKTOP CONTEXT SELECTOR DROPDOWN */}
      {contextSelectorOpen && (
        <>
          <div 
            className="hidden md:block fixed inset-0 z-30" 
            onClick={() => setContextSelectorOpen(false)}
          />
          <div className="hidden md:block fixed left-4 top-20 w-80 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <p className="text-xs font-bold text-foreground">Cambiar Contexto</p>
              <p className="text-[10px] text-muted-foreground">
                {availableContexts.length} perfil{availableContexts.length !== 1 ? "es" : ""} disponible{availableContexts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {availableContexts.map((ctx) => {
                const CtxIcon = ROLE_ICONS[ctx.role]
                const isActive = ctx.id === activeContext?.id
                
                return (
                  <button
                    key={ctx.id}
                    onClick={() => handleSwitchContext(ctx.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-2.5 rounded-lg transition-all text-left",
                      isActive 
                        ? "bg-primary/10" 
                        : "hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      isActive ? "bg-primary/20" : "bg-white/5"
                    )}>
                      <CtxIcon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {ctx.role}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {LEVEL_LABELS[ctx.level]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ctx.schoolName}</p>
                      {ctx.description && (
                        <p className="text-[10px] text-muted-foreground truncate">{ctx.description}</p>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

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
              <p className="text-secondary">[AUTH] user: {user?.email}</p>
              <p className="text-secondary">[AUTH] context: {activeContext?.id}</p>
              <p className="text-secondary">[AUTH] role: {role}</p>
              <p className="text-secondary">[AUTH] school: {schoolId}</p>
              <p className="text-secondary">[AUTH] level: {activeContext?.level}</p>
              <p className="text-white/40">[AUTH] contexts: {availableContexts.length} available</p>
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
