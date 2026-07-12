import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, ListChecks, Package, 
  CalendarDays, LayoutGrid, User, LogOut, Menu, X 
} from 'lucide-react';

export const LayoutEstudiante: React.FC = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/estudiante-dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Proyectos", path: "/estudiante-proyectos", icon: <FolderOpen size={18} /> },
    { label: "Actividades", path: "/estudiante-actividades", icon: <ListChecks size={18} /> },
    { label: "Entregas", path: "/estudiante-entregas", icon: <Package size={18} /> },
    { label: "Calendario", path: "/estudiante-calendario", icon: <CalendarDays size={18} /> },
    { label: "Tablero Kanban", path: "/estudiante-kanban", icon: <LayoutGrid size={18} /> },
    { label: "Perfil", path: "/estudiante-perfil", icon: <User size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const cerrarSesion = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 md:flex md:flex-row font-sans antialiased text-[#111827] w-full overflow-x-hidden">
      
      {/* 📱 HEADER SUPERIOR MÓVIL (Basado en el PDF) */}
      <header className="md:hidden bg-[#1a1d2e] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-[53px] w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight">ClassBoard</span>
        </div>
        <button 
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="p-1.5 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
        >
          {menuAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* 🖥️ SIDEBAR ORIGINAL PARA COMPUTADORAS (Tu diseño de Figma) */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 sticky top-0 h-screen bg-[#1a1d2e] flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-white font-bold text-lg tracking-tight">ClassBoard</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${isActive(item.path)
                ? "bg-blue-600 text-white font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10"}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={cerrarSesion} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition text-left">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* 🎒 MENÚ FLOTANTE MÓVIL (Cubre la pantalla en cel) */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-[53px] bg-[#1a1d2e] z-40 w-full overflow-y-auto">
          <nav className="p-4 flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuAbierto(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition text-left ${isActive(item.path)
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <button onClick={cerrarSesion} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition mt-4 text-left">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* 📈 CONTENIDO INYECTADO DE LAS VISTAS DEL ALUMNO */}
      <main className="flex-grow p-4 md:p-6 w-full max-w-full box-border overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
};