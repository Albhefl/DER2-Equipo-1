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
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all font-medium
    ${isActive(path) 
      ? 'bg-[#ede9fe] text-primary font-semibold shadow-sm' 
      : 'text-[#6b7280] hover:bg-[#eef0f6] hover:text-[#1a1d2e]'}
  `;

  return (
    <div className="w-full flex flex-col p-4 bg-white">
      <div className="space-y-6">
        <div className="hidden md:flex items-center gap-3 px-3 py-4">
          <div className="w-8 h-8 bg-primary text-white flex items-center justify-center rounded-lg font-bold text-sm">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1a1d2e]">ClassBoard</span>
        </div>

        <nav className="space-y-1">
          <Link to="/evaluador-dashboard" className={estiluEnlace('/evaluador-dashboard')}>
            <LayoutDashboard size={18} className={isActive('/evaluador-dashboard') ? 'text-primary' : 'text-foreground-muted'} /> 
            Dashboard
          </Link>
          
          <Link to="/evaluador-proyectos" className={estiluEnlace('/evaluador-proyectos')}>
            <Folder size={18} className={isActive('/evaluador-proyectos') ? 'text-primary' : 'text-foreground-muted'} /> 
            Proyectos asignados
          </Link>

          <Link to="/evaluador-kanban" className={estiluEnlace('/evaluador-kanban')}>
            <LayoutGrid size={18} className={isActive('/evaluador-kanban') ? 'text-primary' : 'text-foreground-muted'} /> 
            Tablero Kanban
          </Link>
          
          {/* CORRECCIÓN: Se cambió el ':' por ',' dentro de la ternaria del className */}
          <Link to="/evaluador-evaluaciones" className={estiluEnlace('/evaluador-evaluaciones')}>
            <SquareCheckBig size={18} className={isActive('/evaluador-evaluaciones') ? 'text-primary' : 'text-foreground-muted'} /> 
            Evaluaciones
          </Link>
          
          <Link to="/evaluador-perfil" className={estiluEnlace('/evaluador-perfil')}>
            <User size={18} className={isActive('/evaluador-perfil') ? 'text-primary' : 'text-foreground-muted'} /> 
            Mi perfil
          </Link>
        </nav>
      </div>

      <div className="pt-4 mt-6 border-t border-border">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-foreground-muted hover:bg-red-50 hover:text-red-500 text-[14px] transition-colors font-medium">
          <LogOut size={18} /> Cerrar sesión
        </Link>
      </div>
    </div>
  );
};

export default SidebarEvaluador;