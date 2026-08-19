import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Folder, 
  LayoutGrid,     
  SquareCheckBig, 
  User, 
  LogOut 
} from 'lucide-react';

export const SidebarEvaluador: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const estiluEnlace = (path: string) => `
    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all font-medium text-left cursor-pointer
    ${isActive(path) 
      ? 'bg-[#eff6ff] text-[#1d4ed8]' 
      : 'text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1d2e]'}
  `;

  return (
    <div className="w-full flex flex-col bg-transparent h-full justify-between">
      <div>
        <div className="hidden md:flex px-5 py-5 border-b border-border items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
            C
          </div>
          <span className="text-[#1a1d2e] font-bold text-lg tracking-tight">ClassBoard</span>
        </div>

        <nav className="px-3 py-4 flex flex-col gap-1 border-t md:border-t-0 border-border/50">
          <Link to="/evaluador-dashboard" className={estiluEnlace('/evaluador-dashboard')}>
            <LayoutDashboard size={18} /> 
            Dashboard
          </Link>
          
          <Link to="/evaluador-proyectos" className={estiluEnlace('/evaluador-proyectos')}>
            <Folder size={18} /> 
            Proyectos asignados
          </Link>

          <Link to="/evaluador-kanban" className={estiluEnlace('/evaluador-kanban')}>
            <LayoutGrid size={18} /> 
            Tablero Kanban
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

      <div className="px-3 py-4 border-t border-border mt-auto">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[#6b7280] hover:bg-red-50 hover:text-red-600 text-sm transition-colors font-medium cursor-pointer">
          <LogOut size={18} /> Cerrar sesión
        </Link>
      </div>
    </div>
  );
};

export default SidebarEvaluador;