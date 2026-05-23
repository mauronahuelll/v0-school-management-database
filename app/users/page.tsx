"use client";

import { Users, UserPlus, Search, MoreHorizontal } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion de docentes, preceptores y administrativos
          </p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
          <UserPlus className="size-4" />
          Invitar Usuario
        </button>
      </header>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">Usuario</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">Rol</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">Estado</th>
              <th className="text-right text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Prof. Rodriguez", email: "rodriguez@escuela.edu", role: "Docente", status: "Activo" },
              { name: "Martinez, Ana", email: "martinez@escuela.edu", role: "Preceptora", status: "Activo" },
              { name: "Garcia, Luis", email: "garcia@escuela.edu", role: "Administrativo", status: "Pendiente" },
            ].map((user, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{user.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${user.status === "Activo" ? "bg-status-present/10 text-status-present" : "bg-status-tardy/10 text-status-tardy"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
