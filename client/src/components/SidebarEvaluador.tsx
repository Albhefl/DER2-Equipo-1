import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Folder, 
  SquareCheckBig, 
  User, 
  LogOut 
} from 'lucide-react';

export const SidebarEvaluador: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const estiluEnlace = (path: string) => `
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all font-medium
    ${isActive(path) 
      ? 'bg-blue-600 text-white font-semibold shadow-sm' 
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
  `;

  return (
    // Cambiamos a div para que LayoutEvaluador controle el <aside> exterior sin anidar elementos de sección
    <div className="w-full h-full bg-[#111827] flex flex-col p-4 justify-between">
      
      {/* SECCIÓN SUPERIOR */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="text-white font-bold text-base tracking-wide">ClassBoard</span>
        </div>

        <nav className="space-y-1.5">
          <Link to="/evaluador-dashboard" className={estiluEnlace('/evaluador-dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/evaluador-proyectos" className={estiluEnlace('/evaluador-proyectos')}>
            <Folder size={18} />
            Proyectos asignados
          </Link>
          <Link to="/evaluador-evaluaciones" className={estiluEnlace('/evaluador-evaluaciones')}>
            <SquareCheckBig size={18} />
            Evaluaciones
          </Link>
          <Link to="/evaluador-perfil" className={estiluEnlace('/evaluador-perfil')}>
            <User size={18} />
            Mi perfil
          </Link>
        </nav>
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="pt-4 border-t border-gray-800/60">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition text-xs font-semibold cursor-pointer"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

    </div>
  );
};