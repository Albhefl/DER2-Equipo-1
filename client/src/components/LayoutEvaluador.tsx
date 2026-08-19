import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarEvaluador } from './SidebarEvaluador';
import { Menu, X } from 'lucide-react';

export const LayoutEvaluador: React.FC = () => {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 md:flex md:flex-row font-sans antialiased text-[#111827] w-full overflow-x-hidden">
      
      {/* HEADER MÓVIL OSCURO (Ahora claro) */}
      <header className="md:hidden bg-white text-[#1a1d2e] px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-13.25 w-full border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-bold text-sm tracking-tight">ClassBoard</span>
        </div>
        <button 
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="p-1.5 text-[#6b7280] hover:bg-gray-100 rounded-lg transition-colors"
        >
          {menuMovilAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* SIDEBAR FIJO (Tema Claro) */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 sticky top-0 h-screen border-r border-border bg-white">
        <SidebarEvaluador />
      </aside>

      {/* MENÚ FLOTANTE MÓVIL (Tema Claro) */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-13.25 bg-white z-40 w-full overflow-y-auto border-t border-border">
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