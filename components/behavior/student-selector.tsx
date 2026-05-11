"use client";

import { useState, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, X, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StudentOption } from "@/lib/types/behavior";

interface StudentSelectorProps {
  students: StudentOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  disabled?: boolean;
}

export function StudentSelector({
  students,
  selectedIds,
  onChange,
  placeholder = "Buscar alumnos...",
  maxSelections,
  disabled = false,
}: StudentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds]
  );

  const filteredStudents = useMemo(() => {
    if (!searchValue.trim()) return students;
    const search = searchValue.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        s.enrollmentNumber.toLowerCase().includes(search) ||
        s.courseName.toLowerCase().includes(search)
    );
  }, [students, searchValue]);

  const toggleStudent = useCallback(
    (studentId: string) => {
      const isSelected = selectedIds.includes(studentId);
      if (isSelected) {
        onChange(selectedIds.filter((id) => id !== studentId));
      } else {
        if (maxSelections && selectedIds.length >= maxSelections) return;
        onChange([...selectedIds, studentId]);
      }
    },
    [selectedIds, onChange, maxSelections]
  );

  const removeStudent = useCallback(
    (studentId: string) => {
      onChange(selectedIds.filter((id) => id !== studentId));
    },
    [selectedIds, onChange]
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-3">
      {/* Selected Students Tags */}
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStudents.map((student) => (
            <Badge
              key={student.id}
              variant="secondary"
              className="gap-2 py-1.5 pl-1.5 pr-2 text-sm transition-all hover:bg-secondary/80"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={student.photoUrl} />
                <AvatarFallback className="text-[10px] bg-primary/10">
                  {getInitials(student.firstName, student.lastName)}
                </AvatarFallback>
              </Avatar>
              <span>
                {student.lastName}, {student.firstName}
              </span>
              <button
                type="button"
                onClick={() => removeStudent(student.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
                aria-label={`Quitar ${student.firstName} ${student.lastName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedStudents.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-auto py-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar todos
            </Button>
          )}
        </div>
      )}

      {/* Dropdown Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-12 px-4 font-normal transition-all",
              "border-input bg-background hover:bg-accent/50",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2",
              selectedIds.length === 0 && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4 shrink-0 opacity-60" />
              {selectedIds.length === 0
                ? placeholder
                : `${selectedIds.length} alumno${selectedIds.length > 1 ? "s" : ""} seleccionado${selectedIds.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Buscar por nombre o legajo..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron alumnos
                </p>
              </CommandEmpty>
              <CommandGroup>
                {filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  const isDisabled =
                    !isSelected &&
                    maxSelections !== undefined &&
                    selectedIds.length >= maxSelections;

                  return (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => !isDisabled && toggleStudent(student.id)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center gap-3 py-3 px-3 cursor-pointer",
                        isSelected && "bg-primary/5",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={student.photoUrl} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {student.lastName}, {student.firstName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.courseName} {student.divisionName} ·{" "}
                          Leg. {student.enrollmentNumber}
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper text */}
      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} de {maxSelections} alumnos seleccionados
        </p>
      )}
    </div>
  );
}
