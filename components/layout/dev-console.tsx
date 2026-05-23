"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronUp, ChevronDown, X, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type UserRole = "ADMIN" | "PRECEPTOR" | "DOCENTE" | "TUTOR";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "system" | "audit" | "ok" | "warning" | "error" | "info";
  message: string;
}

// ============================================
// MOCK LOGS BY ROLE
// ============================================

const SYSTEM_LOGS: Record<UserRole, LogEntry[]> = {
  ADMIN: [
    { id: "1", timestamp: "09:12:01", type: "system", message: "Socket connection established." },
    { id: "2", timestamp: "09:12:02", type: "audit", message: 'Admin updated "core.records" permissions.' },
    { id: "3", timestamp: "09:12:03", type: "info", message: "Fetching role_matrix..." },
    { id: "4", timestamp: "09:12:05", type: "ok", message: "4 users online in workspace." },
  ],
  PRECEPTOR: [
    { id: "1", timestamp: "08:45:12", type: "system", message: "Handshake protocol established..." },
    { id: "2", timestamp: "08:45:13", type: "ok", message: "Preceptoria view-sync active." },
    { id: "3", timestamp: "08:45:15", type: "info", message: 'fetch student_data --class="6B"' },
    { id: "4", timestamp: "08:45:18", type: "ok", message: "Loading high-density matrix..." },
    { id: "5", timestamp: "08:45:20", type: "info", message: "check status_attendance --all" },
    { id: "6", timestamp: "08:45:22", type: "ok", message: "27 records found. Mapping haptic triggers..." },
  ],
  DOCENTE: [
    { id: "1", timestamp: "10:30:01", type: "system", message: "Initializing grade_module v2.4..." },
    { id: "2", timestamp: "10:30:02", type: "ok", message: "connection stable: node_AR_BUE_01" },
    { id: "3", timestamp: "10:30:04", type: "ok", message: "sync_complete: 24 records modified" },
    { id: "4", timestamp: "10:30:06", type: "warning", message: "3 students below performance threshold" },
  ],
  TUTOR: [
    { id: "1", timestamp: "14:20:01", type: "system", message: "Initializing Sequency Core v4.2.0..." },
    { id: "2", timestamp: "14:20:02", type: "ok", message: "auth_token: valid_until_2024-12-31" },
    { id: "3", timestamp: "14:20:03", type: "ok", message: "fetching_muro_data... [OK]" },
    { id: "4", timestamp: "14:20:04", type: "info", message: "scanning_legal_vault... [2_DOCS_PENDING]" },
    { id: "5", timestamp: "14:20:06", type: "warning", message: "student_profile_incomplete (Lucia M.)" },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administracion",
  PRECEPTOR: "Preceptoria",
  DOCENTE: "Ciencias Exactas",
  TUTOR: "Tutor Familiar",
};

// ============================================
// DEV CONSOLE COMPONENT
// ============================================

interface DevConsoleProps {
  className?: string;
  onRoleChange?: (role: UserRole) => void;
}

export function DevConsole({ className, onRoleChange }: DevConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("PRECEPTOR");
  const [logs, setLogs] = useState<LogEntry[]>(SYSTEM_LOGS.PRECEPTOR);
  const [commandInput, setCommandInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Update logs when role changes
  useEffect(() => {
    setLogs(SYSTEM_LOGS[currentRole]);
    onRoleChange?.(currentRole);
  }, [currentRole, onRoleChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);

  // Handle command submission
  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && commandInput.trim()) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("es-AR", { 
          hour: "2-digit", 
          minute: "2-digit",
          second: "2-digit"
        }),
        type: "info",
        message: `> ${commandInput}`,
      };
      setLogs((prev) => [...prev, newLog]);
      
      // Simulate response
      setTimeout(() => {
        const response: LogEntry = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString("es-AR", { 
            hour: "2-digit", 
            minute: "2-digit",
            second: "2-digit"
          }),
          type: commandInput.includes("error") ? "error" : "ok",
          message: `Command executed: ${commandInput}`,
        };
        setLogs((prev) => [...prev, response]);
      }, 300);
      
      setCommandInput("");
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
        setIsMinimized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "size-10 rounded-xl",
          "bg-black/90 border border-primary/30",
          "flex items-center justify-center",
          "hover:border-primary/50 transition-colors",
          "shadow-lg shadow-black/20",
          className
        )}
        onClick={() => setIsMinimized(false)}
      >
        <Terminal className="size-4 text-primary" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        height: isExpanded ? 320 : 140
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-80 rounded-xl overflow-hidden",
        "console-terminal",
        "border border-primary/20",
        "shadow-2xl shadow-black/40",
        "flex flex-col",
        className
      )}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-success animate-pulse" />
          <span className="text-label-xs console-purple uppercase tracking-wider">
            {currentRole === "DOCENTE" ? "Dev Sandbox" : 
             currentRole === "TUTOR" ? "Sequency Developer Console" :
             currentRole === "ADMIN" ? "Developer_Console" : "Sequency CLI"} v2.4.0
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-label-xs console-dim">Ctrl + ~</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Minimize2 className="size-3 text-white/40" />
          </button>
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-white/40" />
          ) : (
            <ChevronUp className="size-3.5 text-white/40" />
          )}
        </div>
      </header>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-galactic">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <span className="console-dim shrink-0">[{log.type.toUpperCase().slice(0, 3)}]</span>
              <span
                className={cn(
                  log.type === "system" && "console-purple",
                  log.type === "audit" && "console-purple",
                  log.type === "ok" && "console-green",
                  log.type === "warning" && "console-yellow",
                  log.type === "error" && "console-red",
                  log.type === "info" && "text-white/70"
                )}
              >
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>

      {/* Command Input */}
      <div className="border-t border-white/10 p-2 flex items-center gap-2">
        <span className="console-dim">root@sequency:~$</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleCommand}
          placeholder={isExpanded ? "query --roles" : ""}
          className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-white/80 placeholder:text-white/30"
        />
        <span className="console-purple animate-terminal-blink">_</span>
      </div>

      {/* Role Switcher (Expanded Only) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 px-3 py-2 overflow-hidden"
          >
            <p className="text-[9px] console-dim mb-2 uppercase tracking-wider">
              Simular Vista de Rol:
            </p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(SYSTEM_LOGS) as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={cn(
                    "text-[9px] px-2 py-1 rounded font-mono transition-colors",
                    currentRole === role
                      ? "bg-primary/30 text-primary border border-primary/50"
                      : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DevConsole;
