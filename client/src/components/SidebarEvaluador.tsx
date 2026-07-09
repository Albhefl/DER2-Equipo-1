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

  // Función auxiliar para saber qué pestaña resaltar
  const isActive = (path: string) => location.pathname === path;

  // Estilos de Tailwind para los enlaces (Activo vs Inactivo)
  const estiluEnlace = (path: string) => `
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all font-medium
    ${isActive(path) 
      ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-sm shadow-blue-50/30' 
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
  `;

  return (
    <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 justify-between min-h-screen">
      <div className="space-y-6">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="w-8 h-8 bg-[#2563EB] text-white flex items-center justify-center rounded-lg font-bold text-sm">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">ClassBoard</span>
        </div>

        {/* MENÚ DE NAVEGACIÓN DINÁMICO */}
        <nav className="space-y-1">
          <Link to="/evaluador-dashboard" className={estiluEnlace('/evaluador-dashboard')}>
            <LayoutDashboard size={18} className={isActive('/evaluador-dashboard') ? 'text-blue-600' : 'text-gray-400'} /> 
            Dashboard
          </Link>
          
          <Link to="/evaluador-proyectos" className={estiluEnlace('/evaluador-proyectos')}>
            <Folder size={18} className={isActive('/evaluador-proyectos') ? 'text-blue-600' : 'text-gray-400'} /> 
            Proyectos asignados
          </Link>
          
          <Link to="/evaluador-evaluaciones" className={estiluEnlace('/evaluador-evaluaciones')}>
            <SquareCheckBig size={18} className={isActive('/evaluador-evaluaciones') ? 'text-blue-600' : 'text-gray-400'} /> 
            Evaluaciones
          </Link>
          
          <Link to="/evaluador-perfil" className={estiluEnlace('/evaluador-perfil')}>
            <User size={18} className={isActive('/evaluador-perfil') ? 'text-blue-600' : 'text-gray-400'} /> 
            Mi perfil
          </Link>
        </nav>
      </div>

      {/* BOTÓN INFERIOR DE CERRAR SESIÓN */}
      <div className="pt-4 border-t border-gray-50">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 text-[14px] transition-colors font-medium">
          <LogOut size={18} /> Cerrar sesión
        </Link>
      </div>
    </aside>
  );
};