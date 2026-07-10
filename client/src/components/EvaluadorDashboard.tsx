import React from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Folder, 
  Bell, 
  CheckSquare, 
  Clock 
} from 'lucide-react';

export const EvaluadorDashboard: React.FC = () => {
  const proyectos = [
    { id: 1, nombre: 'Funcionalidad de login', equipo: 'Equipo Beta', responsable: 'Carlos Flores', progreso: 75, fecha: 'Viernes 6', estado: 'En proceso', colorEstado: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { id: 2, nombre: 'Diseño de base de datos', equipo: 'Equipo Sigma', responsable: 'Ana Torres', progreso: 45, fecha: 'Viernes 8', estado: 'Completado', colorEstado: 'bg-green-50 text-green-600 border border-green-100' },
    { id: 3, nombre: 'Manual de usuario', equipo: 'Proyecto Héroe', responsable: 'Luis Ramírez', progreso: 38, fecha: 'Viernes 12', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-500 border border-gray-100' },
    { id: 4, nombre: 'Prueba de usabilidad', equipo: 'Equipo Alfa', responsable: 'María Díaz', progreso: 60, fecha: 'Viernes 15', estado: 'En revisión', colorEstado: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { id: 5, nombre: 'Presentación final', equipo: 'StarK Corp', responsable: 'Pedro Vega', progreso: 20, fecha: 'Viernes 20', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-500 border border-gray-100' },
  ];

  return (
    // 🟢 CONTENEDOR FLUIDO: Ocupa todo el ancho sin empujes duros
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TOPBAR (Responsivo: Oculta textos largos en móviles si es necesario) */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-none mb-1">Dashboard del Evaluador</h2>
          <p className="text-xs text-gray-400">Bienvenido, María González</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 p-2 hover:bg-gray-50 rounded-xl transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">MG</div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
              <p className="text-xs text-gray-400">Evaluador</p>
            </div>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO GRID RESPONSIVO */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
        
        {/* COLUMNA IZQUIERDA (Principal) */}
        <div className="flex-1 space-y-6 min-w-0 w-full">
          
          {/* INDICADORES (1 columna en móvil, 3 en pantallas md) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Folder size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">6</p>
                <p className="text-xs text-gray-400 font-medium">Proyectos asignados</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckSquare size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">12</p>
                <p className="text-xs text-gray-400 font-medium">Evaluaciones por revisar</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">18</p>
                <p className="text-xs text-gray-400 font-medium">Actividades por revisar</p>
              </div>
            </div>
          </div>

          {/* TABLA DE PROYECTOS CONTENIDA */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/40 w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-[15px]">Proyectos asignados</h3>
              <Link to="/evaluador-proyectos" className="text-xs font-semibold text-blue-600 border border-blue-100 px-3 py-1.5 rounded-xl hover:bg-blue-50/50 transition-colors">
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-3.5">Proyecto</th>
                    <th className="px-6 py-3.5">Equipo</th>
                    <th className="px-6 py-3.5">Responsable</th>
                    <th className="px-6 py-3.5">Progreso</th>
                    <th className="px-6 py-3.5">Fecha de entrega</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                  {proyectos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-950 whitespace-nowrap">{p.nombre}</td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{p.equipo}</td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{p.responsable}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 w-24">
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${p.progreso}%` }}></div>
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">{p.progreso}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{p.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${p.colorEstado}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to="/evaluador-detalle" className="text-blue-600 font-bold hover:text-blue-700 text-[12px]">
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Sidebar lateral de actividades, abajo en móvil) */}
        <div className="w-full lg:w-[280px] space-y-4 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40">
            <h4 className="font-bold text-gray-900 text-[14px] mb-1">Actividades por revisar</h4>
            <p className="text-xs text-gray-400 mb-4">4 pendientes</p>
            
            <div className="space-y-3">
              {proyectos.slice(0, 4).map((p) => (
                <div key={p.id} className="p-3.5 border border-gray-100 rounded-xl flex flex-col gap-2 bg-white hover:border-gray-200 transition-colors">
                  <p className="text-xs font-bold text-gray-950 truncate">{p.nombre}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-400 font-medium">{p.equipo}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${p.colorEstado}`}>
                      {p.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 text-center gap-1">
              <div>
                <p className="text-base font-bold text-gray-950">18</p>
                <p className="text-[10px] text-gray-400 font-medium">Total</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-950">4.0</p>
                <p className="text-[10px] text-gray-400 font-medium">Promedio</p>
              </div>
              <div>
                <p className="text-base font-bold text-red-500">2</p>
                <p className="text-[10px] text-gray-400 font-medium">Urgentes</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};