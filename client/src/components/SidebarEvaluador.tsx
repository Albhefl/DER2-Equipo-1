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

  // Estilos de Tailwind para el modo claro del Evaluador (según Figma)
  const estiluEnlace = (path: string) => `
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all font-medium cursor-pointer
    ${isActive(path) 
      ? 'bg-blue-50/80 text-blue-600 font-semibold' 
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
  `;

  return (
    <div className="w-full h-full bg-white flex flex-col p-4 justify-between border-r border-gray-100">
      
      {/* SECCIÓN SUPERIOR: Logo y Enlaces de Navegación */}
      <div className="space-y-6">
        {/* Logo o Título */}
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="text-gray-900 font-bold text-base tracking-wide">ClassBoard</span>
        </div>

        {/* Menú de navegación del Evaluador */}
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

      {/* SECCIÓN INFERIOR: Botón de Cerrar sesión anclado al fondo */}
      <div className="pt-4 border-t border-gray-100 mt-auto">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition text-xs font-semibold cursor-pointer"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

    </div>
  );
};