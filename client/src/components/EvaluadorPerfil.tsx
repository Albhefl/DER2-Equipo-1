import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const EvaluadorPerfil: React.FC = () => {
  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* HEADER DE LA SECCIÓN ADAPTADO COMO CARD UNIFICADA */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">Mi perfil</h2>
          <p className="text-xs text-gray-400">Actualiza tu información personal</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">MG</div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* TARJETA SUPERIOR DE USUARIO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shrink-0">
            MG
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug truncate">María González</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">mgonzalez@gmail.itd.edu.mx</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 leading-normal">
              +52 222 123 4567 <span className="hidden xs:inline">•</span> <span className="block xs:inline">Tehuacán, Puebla, México</span>
            </p>
          </div>
        </div>
        <Link 
          to="/evaluador-perfil/editar" 
          className="text-center text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 bg-white transition-colors w-full sm:w-auto block shadow-sm"
        >
          Editar perfil
        </Link>
      </div>

      {/* GRID CONFIGURABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN PERSONAL */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 lg:col-span-7 space-y-4 w-full box-border">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Información personal</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input type="text" readOnly value="María González" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <input type="text" readOnly value="mgonzalez@gmail.itd.edu.mx" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input type="text" readOnly value="+52 222 123 4567" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ciudad / Estado</label>
              <input type="text" readOnly value="Tehuacán, Puebla, México" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de nacimiento</label>
              <input type="text" readOnly value="15 de enero de 2002" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">País</label>
              <input type="text" readOnly value="México" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SEGURIDAD Y ESTADÍSTICAS */}
        <div className="lg:col-span-5 space-y-6 w-full">
          
          {/* TARJETA SEGURIDAD */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Seguridad</h4>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" readOnly value="************" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-400 outline-none cursor-default" />
              <p className="text-[10px] text-gray-400 font-medium mt-2">Última actualización: 15 de abril de 2025</p>
            </div>
            <div className="pt-1">
              <Link 
                to="/evaluador-perfil/editar"
                className="text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 bg-white transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
              >
                <Lock size={12} /> Cambiar contraseña
              </Link>
            </div>
          </div>

          {/* TARJETA ESTADÍSTICAS PERSONALES */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Estadísticas personales</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50/40 border border-blue-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-base md:text-lg font-black text-blue-600 mb-0.5">6</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Proyectos asignados</p>
              </div>
              <div className="bg-green-50/40 border border-green-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-green-600 mb-0.5">18</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Evaluaciones realizadas</p>
              </div>
              <div className="bg-amber-50/40 border border-amber-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-amber-600 mb-0.5">24</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Actividades revisadas</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};