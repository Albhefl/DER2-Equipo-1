import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all font-medium
    ${isActive(path) 
      ? 'bg-[#282e48] text-white font-semibold shadow-sm' 
      : 'text-white/60 hover:bg-white/10 hover:text-white'}
  `;

  return (
    // 🔴 CAMBIA bg-white por bg-[#1a1d2e] AQUÍ ABAJO:
    <div className="w-full flex flex-col p-4 bg-[#1a1d2e] h-full justify-between">
      <div className="space-y-6">
        <div className="hidden md:flex items-center gap-3 px-3 py-4">
          <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold text-sm">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ClassBoard</span>
        </div>

        <nav className="space-y-1">
          <Link to="/evaluador-dashboard" className={estiluEnlace('/evaluador-dashboard')}>
            <LayoutDashboard size={18} className={isActive('/evaluador-dashboard') ? 'text-white' : 'text-white/60'} /> 
            Dashboard
          </Link>
          
          <Link to="/evaluador-proyectos" className={estiluEnlace('/evaluador-proyectos')}>
            <Folder size={18} className={isActive('/evaluador-proyectos') ? 'text-white' : 'text-white/60'} /> 
            Proyectos asignados
          </Link>

          <Link to="/evaluador-kanban" className={estiluEnlace('/evaluador-kanban')}>
            <LayoutGrid size={18} className={isActive('/evaluador-kanban') ? 'text-white' : 'text-white/60'} /> 
            Tablero Kanban
          </Link>
          
          <Link to="/evaluador-evaluaciones" className={estiluEnlace('/evaluador-evaluaciones')}>
            <SquareCheckBig size={18} className={isActive('/evaluador-evaluaciones') ? 'text-white' : 'text-white/60'} /> 
            Evaluaciones
          </Link>
          
          <Link to="/evaluador-perfil" className={estiluEnlace('/evaluador-perfil')}>
            <User size={18} className={isActive('/evaluador-perfil') ? 'text-white' : 'text-white/60'} /> 
            Mi perfil
          </Link>
        </nav>
      </div>

      <div className="pt-4 mt-6 border-t border-white/10">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-white/60 hover:bg-white/10 hover:text-white text-[14px] transition-colors font-medium">
          <LogOut size={18} /> Cerrar sesión
        </Link>
      </div>
    </div>
  );
};

export default SidebarEvaluador;