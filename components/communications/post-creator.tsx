"use client";
import { useState, useRef } from "react";
import { Megaphone, Paperclip, Send, Loader2, X, FileText, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
const AUDIENCE_OPTIONS = [
  { value: "all", label: "Toda la Comunidad Educativa" },
  { value: "parents", label: "Solo Familias" },
  { value: "teachers", label: "Solo Docentes" },
  { value: "students", label: "Solo Alumnos" },
  { value: "course_1A", label: "1° Año A" },
  { value: "course_1B", label: "1° Año B" },
];
export function PostCreator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobalAlert, setIsGlobalAlert] = useState(false); // ESTADO CRITICO
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setAudience("");
    setFiles([]);
    setIsGlobalAlert(false);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !category || !audience) {
      toast.error("Por favor completa todos los campos obligatorios.");
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOpen(false);
      resetForm();
      
      toast.success(
        isGlobalAlert ? "⚠️ Alerta Global emitida exitosamente" : "Comunicado publicado y notificado", 
        { description: `El aviso "${title}" fue enviado.` }
      );
    }, 1500);
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black font-bold hover:scale-[1.02] shadow-[0_0_20px_rgba(208,188,255,0.4)] transition-all border-0">
          <Megaphone className="mr-2 h-4 w-4" />
          Nuevo Comunicado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-[#0A0A0F]/95 backdrop-blur-3xl border border-white/10 text-[#E4E1EA] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b border-white/5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#8A2BE2]" />
            Redactar Nuevo Comunicado
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-black/20 border-white/10 focus:border-[#d0bcff]/50 focus:ring-1 focus:ring-[#d0bcff]/50 text-white">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0F]/95 backdrop-blur-3xl border-white/10 text-white">
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="ACADEMICO">Académico</SelectItem>
                    <SelectItem value="EVENTO">Evento</SelectItem>
                    <SelectItem value="URGENTE" className="text-red-400 font-bold">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audiencia / Destinatarios *</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="bg-black/20 border-white/10 focus:border-[#d0bcff]/50 focus:ring-1 focus:ring-[#d0bcff]/50 text-white">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0F]/95 backdrop-blur-3xl border-white/10 text-white">
                    {AUDIENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título del Comunicado *</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ej. Suspensión de clases por desinfección" 
                className="bg-black/20 border-white/10 focus:border-[#d0bcff]/50 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Cuerpo del Mensaje *</Label>
              <Textarea 
                id="content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Escribe el contenido detallado aquí..." 
                className="min-h-[150px] bg-black/20 border-white/10 focus:border-[#d0bcff]/50 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Archivos Adjuntos (Opcional)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-8"
                >
                  <Paperclip className="h-3 w-3 mr-2" /> Examinar
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple 
                />
              </div>
              
              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/10 text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {file.type.includes('image') ? <ImageIcon className="h-4 w-4 text-purple-400 shrink-0" /> : <FileText className="h-4 w-4 text-blue-400 shrink-0" />}
                        <span className="truncate max-w-[150px]">{file.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(idx)} className="h-6 w-6 rounded-full hover:bg-red-500/20 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* AQUI ESTA EL INTERRUPTOR QUE FALTABA */}
            <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2 text-white">
                    <AlertTriangle className="size-4 text-red-500" />
                    Emitir como Alerta Global Urgente
                  </Label>
                  <p className="text-xs text-white/50">
                    Muestra un banner rojo persistente a todos los usuarios.
                  </p>
                </div>
                <Switch
                  checked={isGlobalAlert}
                  onCheckedChange={setIsGlobalAlert}
                  disabled={isSubmitting}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              
              {isGlobalAlert && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="size-3 flex-shrink-0" />
                    Atención: Esto mostrará la alerta en las pantallas de toda la comunidad al instante. Úselo solo para emergencias.
                  </p>
                </div>
              )}
            </div>
            
          </form>
        </ScrollArea>
        
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="hover:bg-white/5">
            Cancelar
          </Button>
          <Button type="submit" form="post-form" disabled={isSubmitting} className="bg-gradient-to-r from-[#8A2BE2] to-[#D0BCFF] text-black font-bold hover:scale-[1.02]">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {isSubmitting ? "Publicando..." : "Publicar Comunicado"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
