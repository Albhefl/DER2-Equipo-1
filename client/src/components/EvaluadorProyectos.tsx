import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  Info
} from 'lucide-react';

export const EvaluadorProyectos: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');

  const proyectos = [
    { id: 1, nombre: 'Funcionalidad de login', equipo: 'Equipo Beta', responsable: 'Carlos Flores', progreso: 75, fecha: 'Viernes 6 jun', estado: 'En proceso', colorEstado: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { id: 2, nombre: 'Diseño de base de datos', equipo: 'Equipo Sigma', responsable: 'Ana Torres', progreso: 45, fecha: 'Viernes 8 jun', estado: 'Completado', colorEstado: 'bg-green-50 text-green-600 border border-green-100' },
    { id: 3, nombre: 'Manual de usuario', equipo: 'Proyecto Héroe', responsable: 'Luis Ramírez', progreso: 38, fecha: 'Viernes 12 jun', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-500 border border-gray-100' },
    { id: 4, nombre: 'Prueba de usabilidad', equipo: 'Equipo Alfa', responsable: 'María Díaz', progreso: 60, fecha: 'Viernes 15 jun', estado: 'En revisión', colorEstado: 'bg-amber-50 text-amber-600 border border-amber-100' },
    { id: 5, nombre: 'Presentación final', equipo: 'StarK Corp', responsable: 'Pedro Vega', progreso: 20, fecha: 'Viernes 20 jun', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-500 border border-gray-100' },
    { id: 6, nombre: 'Análisis de datos', equipo: 'Equipo Delta', responsable: 'Sofía Luna', progreso: 88, fecha: 'Viernes 25 jun', estado: 'Completado', colorEstado: 'bg-green-50 text-green-600 border border-green-100' },
  ];

  const proyectosFiltrados = proyectos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.equipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    // 🟢 CONTENEDOR UNIFICADO: Ocupa todo el ancho sin empujes fijos a la izquierda
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* HEADER DE LA SECCIÓN (Convertido en una card limpia para heredar el estilo general) */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-none mb-1">Proyectos asignados</h2>
          <p className="text-xs text-gray-400">Bienvenido, María González</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">MG</div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* BANNER DE INFORMACIÓN AZUL */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Solo puedes revisar los proyectos que te han sido asignados para evaluarlos.
        </p>
      </div>

      {/* CONTENEDOR DE LA TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/40 w-full max-w-full">
        
        {/* ENCABEZADO CON FILTRO DE BÚSQUEDA (Adaptado flex-col para móviles) */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Mis proyectos asignados</h3>
          
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* TABLA DE PROYECTOS RESPONSIVA CON DESPLAZAMIENTO RESTRINGIDO */}
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
              {proyectosFiltrados.length > 0 ? (
                proyectosFiltrados.map((p) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-gray-400 font-medium">
                    No se encontraron proyectos asignados con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTADOR DE REGISTROS INFERIOR */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Mostrando {proyectosFiltrados.length} de {proyectos.length} proyectos
          </p>
        </div>

      </div>
    </div>
  );
};