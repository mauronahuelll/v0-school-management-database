"use client";

import { useState, useCallback, useRef } from "react";
import { 
  Megaphone, 
  Paperclip, 
  Send, 
  Loader2, 
  X, 
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Calendar,
  BookOpen,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tag types for posts
const TAG_OPTIONS = [
  { value: "institucional", label: "Institucional", icon: Building2, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "alerta", label: "Alerta", icon: AlertTriangle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "evento", label: "Evento", icon: Calendar, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "academico", label: "Academico", icon: BookOpen, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

// Audience options
const AUDIENCE_OPTIONS = [
  { value: "all", label: "Toda la escuela" },
  { value: "1-year", label: "1er Ano" },
  { value: "2-year", label: "2do Ano" },
  { value: "3-year", label: "3er Ano" },
  { value: "4-year", label: "4to Ano" },
  { value: "5-year", label: "5to Ano" },
  { value: "6-year", label: "6to Ano" },
  { value: "teachers", label: "Solo Docentes" },
];

interface AttachedFile {
  name: string;
  type: string;
  size: number;
}

export function PostCreator() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagType, setTagType] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = title.trim() && body.trim() && tagType && audience;

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Solo PDF e imagenes.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo excede el limite de 10MB.");
      return;
    }
    setAttachedFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    toast.success(`Archivo "${file.name}" adjuntado correctamente.`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeAttachment = useCallback(() => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setBody("");
    setTagType("");
    setAudience("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      // Simulate encryption and API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("Comunicado publicado y notificado a las familias", {
        description: `El aviso "${title}" fue enviado a ${
          audience === "all" ? "toda la escuela" : AUDIENCE_OPTIONS.find(a => a.value === audience)?.label
        }.`,
      });
      
      resetForm();
    } catch (error) {
      toast.error("Error al publicar el comunicado. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, title, audience, resetForm]);

  const selectedTag = TAG_OPTIONS.find(t => t.value === tagType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Megaphone className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Nuevo Comunicado</h2>
          <p className="text-sm text-muted-foreground">
            Redacta un aviso para publicar en el Muro de las Familias
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="post-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Titulo del Comunicado
          </Label>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Suspension de clases por jornada docente"
            disabled={isSubmitting}
            className="h-12 bg-white/[0.02] border-white/10 focus:border-primary rounded-xl text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Body Textarea */}
        <div className="space-y-2">
          <Label htmlFor="post-body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cuerpo del Mensaje
          </Label>
          <Textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escriba el contenido completo del comunicado..."
            disabled={isSubmitting}
            className="min-h-[150px] bg-white/[0.02] border-white/10 focus:border-primary rounded-xl text-foreground placeholder:text-muted-foreground/50 resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {body.length} caracteres
          </p>
        </div>

        {/* Selectors Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tag Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de Etiqueta
            </Label>
            <Select value={tagType} onValueChange={setTagType} disabled={isSubmitting}>
              <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-xl">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent className="bg-[#131319] border-white/10">
                {TAG_OPTIONS.map((tag) => {
                  const Icon = tag.icon;
                  return (
                    <SelectItem key={tag.value} value={tag.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{tag.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedTag && (
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                selectedTag.color
              )}>
                <selectedTag.icon className="size-3" />
                {selectedTag.label}
              </div>
            )}
          </div>

          {/* Audience Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Audiencia Destinataria
            </Label>
            <Select value={audience} onValueChange={setAudience} disabled={isSubmitting}>
              <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-xl">
                <SelectValue placeholder="Seleccionar audiencia..." />
              </SelectTrigger>
              <SelectContent className="bg-[#131319] border-white/10">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Attachment Zone */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adjuntar Archivo (Opcional)
          </Label>
          
          {!attachedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]",
                isSubmitting && "pointer-events-none opacity-50"
              )}
            >
              <div className="p-3 rounded-xl bg-white/[0.02]">
                <Paperclip className="size-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground font-medium">
                  Arrastra un archivo o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG o WebP (max. 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {attachedFile.type.startsWith("image/") ? (
                    <ImageIcon className="size-5 text-primary" />
                  ) : (
                    <FileText className="size-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {attachedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(attachedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeAttachment}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="w-full h-14 rounded-xl bg-[#d0bcff] hover:bg-[#c4b0f3] text-[#381e72] font-bold text-base gap-3 shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Cifrando y Publicando...
            </>
          ) : (
            <>
              <Send className="size-5" />
              Publicar en el Muro
            </>
          )}
        </Button>

        {/* Helper Text */}
        <p className="text-center text-[10px] text-muted-foreground">
          Los comunicados son encriptados y enviados a los dispositivos de las familias de forma segura.
        </p>
      </div>
    </div>
  );
}
