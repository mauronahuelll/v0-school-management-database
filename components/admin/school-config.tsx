"use client"

import { useState } from "react"
import { 
  Settings, 
  GraduationCap, 
  Calendar, 
  Shield, 
  Check, 
  X, 
  Save,
  RotateCcw,
  Loader2,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  useSchoolSettings, 
  getScalePreset,
  type GradingScaleType,
  type RolePermission,
} from "@/lib/context/school-settings-context"
import { useAuth } from "@/lib/context/auth-context"

// ============================================
// MAIN COMPONENT
// ============================================

export function SchoolConfigurator() {
  const { 
    settings, 
    updateGradingScale, 
    updateAcademicYear,
    updateRolePermission,
    resetToDefaults,
    isLoading 
  } = useSchoolSettings()

  // RBAC: solo ADMIN puede ver y modificar la Matriz de Permisos
  const { role } = useAuth()
  const isAdmin = role === "ADMIN"
  
  const [isSaving, setIsSaving] = useState(false)
  const [localYear, setLocalYear] = useState(settings.academicYear.toString())

  // Handle grading scale change
  const handleScaleChange = (type: GradingScaleType) => {
    const newScale = getScalePreset(type)
    updateGradingScale(newScale)
    toast.success(`Escala de calificacion cambiada a ${getScaleLabel(type)}`)
  }

  // Handle academic year change
  const handleYearChange = (value: string) => {
    setLocalYear(value)
    const year = parseInt(value, 10)
    if (!isNaN(year) && year >= 2020 && year <= 2030) {
      updateAcademicYear(year)
    }
  }

  // Handle permission toggle
  const handlePermissionToggle = (
    roleId: string, 
    permission: keyof Omit<RolePermission, "roleId" | "roleName">,
    value: boolean
  ) => {
    updateRolePermission(roleId, { [permission]: value })
  }

  // Simulate save to server
  const handleSaveSettings = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    toast.success("Configuracion guardada exitosamente")
  }

  // Reset to defaults
  const handleReset = () => {
    resetToDefaults()
    setLocalYear(new Date().getFullYear().toString())
    toast.info("Configuracion restablecida a valores por defecto")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Settings className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Configuracion de Institucion</h2>
            <p className="text-sm text-muted-foreground">
              Ajusta las preferencias academicas y permisos de tu escuela
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="size-4 mr-2" />
            Restablecer
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Grading Scale Section */}
        <section className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">Escala de Calificacion</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grading-scale">Tipo de Escala</Label>
              <Select 
                value={settings.gradingScale.type} 
                onValueChange={(v) => handleScaleChange(v as GradingScaleType)}
              >
                <SelectTrigger id="grading-scale" className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar escala" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="NUMERIC">
                    <div className="flex items-center gap-2">
                      <span>Numerica (1-10)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ALPHABETIC">
                    <div className="flex items-center gap-2">
                      <span>Alfabetica (A-F)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CONCEPTUAL">
                    <div className="flex items-center gap-2">
                      <span>Conceptual (TEA/TEP/TED)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scale Preview */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">
                Vista previa de la escala
              </p>
              <ScalePreview scale={settings.gradingScale} />
            </div>

            {/* Minimum Passing Grade Info */}
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Info className="size-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Nota minima de aprobacion: </span>
                {settings.gradingScale.type === "NUMERIC" 
                  ? settings.gradingScale.minPassing 
                  : settings.gradingScale.values?.[settings.gradingScale.minPassing] || "-"}
              </div>
            </div>
          </div>
        </section>

        {/* Academic Year Section */}
        <section className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">Ciclo Lectivo</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Ano Academico</Label>
              <Input
                id="academic-year"
                type="number"
                min={2020}
                max={2030}
                value={localYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periods">Periodos por Ano</Label>
              <Select value={settings.periodsPerYear.toString()}>
                <SelectTrigger id="periods" className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="2">2 Cuatrimestres</SelectItem>
                  <SelectItem value="3">3 Trimestres</SelectItem>
                  <SelectItem value="4">4 Bimestres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {Array.from({ length: settings.periodsPerYear }).map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg text-center text-sm font-medium transition-colors",
                    settings.currentPeriod === `${i + 1}T`
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/[0.02] text-muted-foreground border border-white/5"
                  )}
                >
                  {i + 1}° Periodo
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Role Permissions Section — RBAC: exclusivo para ADMIN, no existe en el DOM para otros roles */}
      {isAdmin && (
        <section className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">Matriz de Permisos por Rol</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Rol</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Ver Notas</TooltipTrigger>
                        <TooltipContent>Puede ver calificaciones</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Editar Notas</TooltipTrigger>
                        <TooltipContent>Puede modificar calificaciones</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Publicar</TooltipTrigger>
                        <TooltipContent>Puede publicar calificaciones oficiales</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Ver Asist.</TooltipTrigger>
                        <TooltipContent>Puede ver partes de asistencia</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Editar Asist.</TooltipTrigger>
                        <TooltipContent>Puede tomar asistencia</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Convivencia</TooltipTrigger>
                        <TooltipContent>Puede gestionar sanciones</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Admin</TooltipTrigger>
                        <TooltipContent>Acceso a panel de administracion</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {settings.rolePermissions.map((role) => (
                  <tr key={role.roleId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "size-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          role.roleId === "ADMIN" ? "bg-primary/20 text-primary" :
                          role.roleId === "DOCENTE" ? "bg-blue-500/20 text-blue-400" :
                          role.roleId === "PRECEPTOR" ? "bg-amber-500/20 text-amber-400" :
                          "bg-green-500/20 text-green-400"
                        )}>
                          {role.roleName[0]}
                        </div>
                        <span className="font-medium text-foreground">{role.roleName}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canViewGrades}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canViewGrades", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canEditGrades}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canEditGrades", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canPublishGrades}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canPublishGrades", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canViewAttendance}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canViewAttendance", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canEditAttendance}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canEditAttendance", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canEditBehavior}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canEditBehavior", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <PermissionToggle
                        checked={role.canAccessAdmin}
                        onChange={(v) => handlePermissionToggle(role.roleId, "canAccessAdmin", v)}
                        disabled={role.roleId === "ADMIN"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ScalePreview({ scale }: { scale: { type: string; values?: string[]; labels?: Record<string, string> } }) {
  if (scale.type === "NUMERIC") {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            className={cn(
              "size-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
              n >= 7 
                ? "bg-[#4de082]/20 text-[#4de082]" 
                : "bg-[#ffb4ab]/20 text-[#ffb4ab]"
            )}
          >
            {n}
          </div>
        ))}
      </div>
    )
  }

  if (scale.values) {
    return (
      <div className="flex flex-wrap gap-2">
        {scale.values.map((value, index) => (
          <div
            key={value}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-bold transition-colors",
              scale.type === "ALPHABETIC"
                ? index <= 2 
                  ? "bg-[#4de082]/20 text-[#4de082]" 
                  : "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                : value === "TEA" || value === "TEP"
                  ? "bg-[#4de082]/20 text-[#4de082]"
                  : "bg-[#ffb4ab]/20 text-[#ffb4ab]"
            )}
          >
            <span>{value}</span>
            {scale.labels?.[value] && (
              <span className="ml-1 text-[10px] opacity-70">
                ({scale.labels[value]})
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return null
}

function PermissionToggle({ 
  checked, 
  onChange, 
  disabled 
}: { 
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex justify-center">
      {disabled ? (
        <div className={cn(
          "size-6 rounded-md flex items-center justify-center",
          checked ? "bg-[#4de082]/20" : "bg-white/5"
        )}>
          {checked ? (
            <Check className="size-4 text-[#4de082]" />
          ) : (
            <X className="size-4 text-muted-foreground" />
          )}
        </div>
      ) : (
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[#4de082]"
        />
      )}
    </div>
  )
}

function getScaleLabel(type: GradingScaleType): string {
  const labels: Record<GradingScaleType, string> = {
    NUMERIC: "Numerica (1-10)",
    ALPHABETIC: "Alfabetica (A-F)",
    CONCEPTUAL: "Conceptual (TEA/TEP/TED)",
  }
  return labels[type]
}
