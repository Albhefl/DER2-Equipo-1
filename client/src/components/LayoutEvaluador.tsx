import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarEvaluador } from './SidebarEvaluador';
import { Menu, X } from 'lucide-react';

export const LayoutEvaluador: React.FC = () => {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    // 🟢 CORRECCIÓN: En móvil es un div normal (block por defecto), en escritorio se vuelve flex horizontal
    <div className="min-h-screen bg-gray-50 md:flex md:flex-row font-sans antialiased text-[#111827] w-full overflow-x-hidden">
      
      {/* 📱 HEADER SUPERIOR MÓVIL */}
      <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-[53px] w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">CB</div>
          <span className="font-bold text-gray-950 text-sm tracking-tight">ClassBoard</span>
        </div>
        <button 
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {menuMovilAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* 🖥️ SIDEBAR FIJO PARA COMPUTADORAS */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white">
        <SidebarEvaluador />
      </aside>

      {/* 🎒 MENÚ FLOTANTE MÓVIL (Fixed absoluto sobre la pantalla) */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-[53px] bg-white z-40 w-full overflow-y-auto animate-fade-in">
          <nav className="p-4" onClick={() => setMenuMovilAbierto(false)}>
            <SidebarEvaluador />
          </nav>
        </div>
      )}

      {/* 📈 CONTENIDO INYECTADO DE LAS VISTAS */}
      <main className="flex-grow p-4 md:p-8 w-full max-w-full box-border overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
};