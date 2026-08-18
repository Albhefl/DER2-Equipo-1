import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, ListChecks,
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
    /*{ label: "Entregas", path: "/estudiante-entregas", icon: <Package size={18} /> },*/
    { label: "Calendario", path: "/estudiante-calendario", icon: <CalendarDays size={18} /> },
    { label: "Tablero Kanban", path: "/estudiante-kanban", icon: <LayoutGrid size={18} /> },
    { label: "Perfil", path: "/estudiante-perfil", icon: <User size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 md:flex md:flex-row font-sans antialiased text-[#111827] w-full overflow-x-hidden">
      
      {/* 📱 HEADER SUPERIOR MÓVIL */}
      <header className="md:hidden bg-[#1a1d2e] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-13.25 w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight">ClassBoard</span>
        </div>
        <button 
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="p-1.5 text-white/80 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          {menuAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* 🖥️ SIDEBAR LIMPIO PARA COMPUTADORAS (Sin huecos vacíos) */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 sticky top-0 min-h-screen bg-[#1a1d2e] flex-col justify-between">
        
        {/* SECCIÓN SUPERIOR: Logo y Enlaces */}
        <div>
          <div className="px-5 py-5 border-b border-white/10">
            <span className="text-white font-bold text-lg tracking-tight">ClassBoard</span>
          </div>
          
          <nav className="px-3 py-4 flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left cursor-pointer ${isActive(item.path)
                  ? "bg-[#282e48] text-white font-medium shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* SECCIÓN INFERIOR: Botón de Cerrar sesión ordenado */}
        <div className="px-3 py-4 border-t border-white/10 mt-auto">
          <button 
            onClick={cerrarSesion} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition text-left cursor-pointer"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>

      </aside>

      {/* 🎒 MENÚ FLOTANTE MÓVIL */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-13.25 bg-[#1a1d2e] z-40 w-full overflow-y-auto">
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
            <button onClick={cerrarSesion} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition mt-4 text-left cursor-pointer">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* 📈 CONTENIDO PRINCIPAL */}
      <main className="grow p-4 md:p-6 w-full max-w-full box-border overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
};