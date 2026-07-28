"use client"

import { useAuth } from "@/lib/context/auth-context"
import { GlobalNav, ChildContextSwitcher } from "@/components/navigation/global-nav"
import { ContextSelector } from "@/components/auth/context-selector"
import { LogOut, ChevronDown, School, ChevronRight, Menu, Users, GraduationCap, BookOpen, Home, Search, Calendar, AlertTriangle, Zap, Bell, Upload, FileBarChart2, Settings, Megaphone, X } from "lucide-react"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contextSelectorOpen, setContextSelectorOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const ALERT_MESSAGE = "ALERTA URGENTE: Suspension de actividades en el turno tarde por desinfeccion del establecimiento. Por favor, retirar a los alumnos a las 12:00 hs."
  
  // Derived values from activeContext
  const role = activeContext?.role ?? null
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

  // Keyboard shortcut (Cmd+K or Ctrl+K) for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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
  // RENDER: Flujo de Onboarding / Setup (Full-Screen inmersivo)
  // Se evalua ANTES que la autenticacion: el wizard de aprovisionamiento
  // toma control total de la pantalla y oculta el AppShell por completo.
  // ====================================================================
  if (pathname?.startsWith("/admin/setup")) {
    return (
      <main className="w-screen h-screen overflow-y-auto">
        {children}
        <Toaster position="bottom-center" />
      </main>
    )
  }

  // ====================================================================
  // RENDER: Usuario logueado pero sin contexto seleccionado
  // Muestra la pantalla de seleccion de perfil/sombrero
  // ====================================================================
  if (needsContextSelection) {
    return (
      <main className="w-screen h-screen overflow-hidden">
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
      <main className="w-screen h-screen overflow-hidden">
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
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden text-[#E4E1EA] antialiased selection:bg-[#8A2BE2]/40">

      {/* ── GLOBAL ALERT BANNER ─────────────────────────────────────────────
          Sticky fixed sobre todo el layout. z-[100] garantiza que nunca
          quede tapado por header, sidebar ni modales.
      ──────────────────────────────────────────────────────────────────── */}
      {showBanner && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[100]",
            "bg-gradient-to-r from-red-950 via-red-800 to-red-900",
            "border-b border-red-500/40",
            "transition-all duration-300 ease-in-out",
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
            {/* Icono */}
            <div className="shrink-0 flex items-center justify-center size-6 rounded-full bg-red-500/20 border border-red-400/30">
              <AlertTriangle className="size-3.5 text-red-300" aria-hidden="true" />
            </div>

            {/* Texto — en mobile trunca a 2 lineas, en desktop una sola */}
            <p className="flex-1 text-sm font-medium text-red-100 leading-snug line-clamp-2 md:line-clamp-1 min-w-0">
              <span className="font-bold text-white">ALERTA URGENTE:&nbsp;</span>
              Suspension de actividades en el turno tarde por desinfeccion del establecimiento.&nbsp;
              <span className="whitespace-nowrap">Por favor, retirar a los alumnos a las 12:00 hs.</span>
            </p>

            {/* Boton cerrar */}
            <button
              onClick={() => setShowBanner(false)}
              aria-label="Cerrar alerta"
              className={cn(
                "shrink-0 ml-2 p-1.5 rounded-lg",
                "text-red-300 hover:text-white",
                "hover:bg-red-500/25 active:bg-red-500/40",
                "transition-colors duration-150",
              )}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE TOP HEADER (visible only on small screens) */}
      <header
        className="md:hidden fixed left-0 right-0 z-40 h-14 px-4 flex items-center justify-between bg-[#0A0A0F]/40 backdrop-blur-2xl border-b border-white/5"
        style={{ top: showBanner ? "var(--banner-h, 42px)" : 0 }}
      >
        {/* School & Role Compact */}
        <button 
          onClick={() => setContextSelectorOpen(true)}
          className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
        >
          <img
            src="/sequency-isotype.png"
            alt="Sequency"
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.45)]"
          />
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
          {/* Child switcher — solo FAMILIA */}
          {role === "FAMILIA" && (
            <ChildContextSwitcher compact />
          )}

          {/* Global Search Toggle (Mobile) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Alerts Toggle (Mobile) */}
          <button
            onClick={() => setAlertsOpen(true)}
            className="relative p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Abrir alertas operativas"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
              {role === "ADMIN" ? "3" : role === "PRECEPTOR" ? "2" : role === "DOCENTE" ? "1" : "2"}
            </span>
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
        <SheetContent side="bottom" className="h-auto max-h-[70vh] p-0 bg-[#0A0A0F]/80 backdrop-blur-2xl border-t border-white/5 rounded-t-2xl">
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

      {/* GLOBAL SEARCH COMMAND DIALOG - Role-based filtering */}
      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        title="Buscador Global"
        description="Busca alumnos, personal o acciones rapidas"
      >
        <CommandInput placeholder="Buscar alumnos, personal, acciones..." />
        <CommandList className="bg-background">
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          {/* ── Alumnos: ADMIN, DOCENTE, PRECEPTOR ─────────────────────── */}
          {role !== "FAMILIA" && (
            <>
              <CommandGroup heading="Alumnos">
                {[
                  { name: "Sofia Alvarez",    curso: "4to Ano A" },
                  { name: "Mateo Benitez",    curso: "4to Ano A" },
                  { name: "Valentina Castro", curso: "4to Ano B" },
                  { name: "Lucas Diaz",       curso: "3ro Ano C" },
                  { name: "Camila Ferreyra",  curso: "2do Ano A" },
                ].map(({ name, curso }) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => { setSearchOpen(false); router.push("/students") }}
                  >
                    <GraduationCap className="mr-2 h-4 w-4 shrink-0 text-[#d0bcff]" />
                    <span>{name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{curso}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* ── Personal: solo ADMIN ─────────────────────────────────��──── */}
          {role === "ADMIN" && (
            <>
              <CommandGroup heading="Personal">
                {[
                  { name: "Prof. Maria Gonzalez",  cargo: "Docente" },
                  { name: "Lic. Juan Rodriguez",   cargo: "Preceptor" },
                  { name: "Dra. Ana Suarez",       cargo: "Directora" },
                ].map(({ name, cargo }) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => { setSearchOpen(false); router.push("/users") }}
                  >
                    <Users className="mr-2 h-4 w-4 shrink-0 text-[#4de082]" />
                    <span>{name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{cargo}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* ── Navegacion rapida ───────────────────────────────────────── */}
          <CommandGroup heading="Navegacion">
            <CommandItem value="dashboard inicio" onSelect={() => { setSearchOpen(false); router.push("/dashboard") }}>
              <Home className="mr-2 h-4 w-4 shrink-0 text-[#d0bcff]" />
              <span>Inicio</span>
            </CommandItem>
            <CommandItem value="calendario eventos" onSelect={() => { setSearchOpen(false); router.push("/calendar") }}>
              <Calendar className="mr-2 h-4 w-4 shrink-0 text-[#ffb93d]" />
              <span>Calendario</span>
            </CommandItem>
            <CommandItem value="muro escolar comunidad" onSelect={() => { setSearchOpen(false); router.push("/community") }}>
              <Megaphone className="mr-2 h-4 w-4 shrink-0 text-[#4de082]" />
              <span>Muro Escolar</span>
            </CommandItem>
            {role !== "FAMILIA" && (
              <CommandItem value="comunicaciones circulares" onSelect={() => { setSearchOpen(false); router.push("/communications") }}>
                <Megaphone className="mr-2 h-4 w-4 shrink-0 text-[#63a4ff]" />
                <span>Comunicaciones</span>
              </CommandItem>
            )}
            {role === "FAMILIA" && (
              <CommandItem value="muro familiar legajo hijo" onSelect={() => { setSearchOpen(false); router.push("/family-wall") }}>
                <GraduationCap className="mr-2 h-4 w-4 shrink-0 text-[#d0bcff]" />
                <span>Muro Familiar</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Acciones rapidas ────────────────────────────────────────── */}
          <CommandGroup heading="Acciones Rapidas">

            {/* Calificaciones: ADMIN, DOCENTE, PRECEPTOR */}
            {role !== "FAMILIA" && (
              <CommandItem value="calificaciones notas boletin" onSelect={() => { setSearchOpen(false); router.push("/grades") }}>
                <Zap className="mr-2 h-4 w-4 shrink-0 text-[#d0bcff]" />
                <span>Calificaciones</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Aula</span>
              </CommandItem>
            )}

            {/* Sanciones: ADMIN y PRECEPTOR */}
            {(role === "ADMIN" || role === "PRECEPTOR") && (
              <CommandItem value="emitir sancion comportamiento" onSelect={() => { setSearchOpen(false); router.push("/behavior") }}>
                <AlertTriangle className="mr-2 h-4 w-4 shrink-0 text-[#ffb4ab]" />
                <span>Emitir Sancion</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Convivencia</span>
              </CommandItem>
            )}

            {/* Mi Perfil: ADMIN, DOCENTE, PRECEPTOR */}
            {role !== "FAMILIA" && (
              <CommandItem value="mi perfil autogestión datos personales" onSelect={() => { setSearchOpen(false); router.push("/my-profile") }}>
                <Users className="mr-2 h-4 w-4 shrink-0 text-[#ffb93d]" />
                <span>Mi Perfil</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Autogestion</span>
              </CommandItem>
            )}

            {/* Importar Matricula: solo ADMIN */}
            {role === "ADMIN" && (
              <CommandItem value="importar matricula alumnos secretaria" onSelect={() => { setSearchOpen(false); router.push("/students?action=import") }}>
                <Upload className="mr-2 h-4 w-4 shrink-0 text-[#4de082]" />
                <span>Importar Matricula</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Secretaria</span>
              </CommandItem>
            )}

            {/* Generar Reportes: solo ADMIN */}
            {role === "ADMIN" && (
              <CommandItem value="generar reportes estadisticas exportar" onSelect={() => { setSearchOpen(false); router.push("/students?tab=reportes") }}>
                <FileBarChart2 className="mr-2 h-4 w-4 shrink-0 text-[#63a4ff]" />
                <span>Generar Reportes</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Secretaria</span>
              </CommandItem>
            )}

            {/* Configuracion Institucional: solo ADMIN */}
            {role === "ADMIN" && (
              <CommandItem value="configuracion institucion ajustes settings" onSelect={() => { setSearchOpen(false); router.push("/settings") }}>
                <Settings className="mr-2 h-4 w-4 shrink-0 text-[#ffb93d]" />
                <span>Configuracion de Institucion</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Ajustes</span>
              </CommandItem>
            )}

          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* MOBILE NAVIGATION DRAWER (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-[#0A0A0F]/40 backdrop-blur-2xl border-r border-white/5">
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
      <aside
        className="hidden md:flex w-[15%] min-w-[240px] flex-col bg-[#0A0A0F]/40 backdrop-blur-2xl border-r border-white/5 z-20 transition-[padding] duration-300"
        style={{ paddingTop: showBanner ? "var(--banner-h, 42px)" : 0 }}
      >
        {/* Brand Isotype */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <img
              src="/sequency-isotype.png"
              alt="Sequency"
              className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.45)]"
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight brand-gradient-text">Sequency</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Hub Académico</p>
          </div>
        </div>

        {/* School & Role Header - Clickable for context switch */}
        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => setContextSelectorOpen(true)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-[#8A2BE2]/50 text-white transition-all duration-300"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-[#8A2BE2]/30 transition-all duration-300 text-left group"
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            {/* Right-aligned actions: strict flex container, no absolute/z conflicts */}
            <div className="flex items-center gap-4 ml-auto">
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Abrir alertas operativas"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {role === "ADMIN" ? "3" : role === "PRECEPTOR" ? "2" : role === "DOCENTE" ? "1" : "2"}
                </span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* DESKTOP CONTEXT SELECTOR DROPDOWN */}
      {contextSelectorOpen && (
        <>
          <div 
            className="hidden md:block fixed inset-0 z-30" 
            onClick={() => setContextSelectorOpen(false)}
          />
          <div className="hidden md:block fixed left-4 top-20 w-80 bg-[#0A0A0F]/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_0_40px_rgba(138,43,226,0.15)] z-40 overflow-hidden">
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

      {/* MAIN CONTENT AREA (full width - permanent)
          Mobile: pt = banner-h (variable) + 56px (header fijo)
          Desktop: pt = banner-h solo (el aside absorbe el espacio, no hay header fijo)
      */}
      <main
        className="flex-1 w-full h-full overflow-y-auto relative scrollbar-galactic transition-[padding] duration-300"
        style={{
          paddingTop: showBanner
            ? "var(--banner-h, 42px)"
            : 0,
        }}
      >
        {/* Compensacion adicional del header mobile (solo md:down) */}
        <div className="md:hidden" style={{ height: "3.5rem" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* OPERATIVE ALERTS SHEET (replaces the old static right utility panel) */}
      <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-[#0A0A0F]/40 backdrop-blur-2xl border-l border-white/5 flex flex-col">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-left text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Alertas Operativas
            </SheetTitle>
            <p className="text-xs text-muted-foreground text-left">
              Ruta: <span className="text-primary font-mono">{pathname}</span>
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-galactic p-6 flex flex-col gap-6">
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
          </div>
        </SheetContent>
      </Sheet>

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
