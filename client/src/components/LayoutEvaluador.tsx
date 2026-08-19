import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarEvaluador } from './SidebarEvaluador';
import { Menu, X } from 'lucide-react';

export const LayoutEvaluador: React.FC = () => {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 md:flex md:flex-row font-sans antialiased text-[#111827] w-full overflow-x-hidden">
      
      {/* HEADER MÓVIL OSCURO */}
      <header className="md:hidden bg-[#1a1d2e] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-13.25 w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight">ClassBoard</span>
        </div>
        <button 
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="p-1.5 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
        >
          {menuMovilAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* SIDEBAR FIJO OSCURO */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 sticky top-0 h-screen border-r border-white/10 bg-[#1a1d2e]">
        <SidebarEvaluador />
      </aside>

      {/* MENÚ FLOTANTE MÓVIL OSCURO */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-13.25 bg-[#1a1d2e] z-40 w-full overflow-y-auto">
          <nav className="p-4" onClick={() => setMenuMovilAbierto(false)}>
            <SidebarEvaluador />
          </nav>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="grow p-4 md:p-8 w-full max-w-full box-border overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
};