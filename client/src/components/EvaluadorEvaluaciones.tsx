import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Bell,
  Search,
  Info,
  ChevronDown
} from 'lucide-react';

export const EvaluadorEvaluaciones: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  
  const [openProyecto, setOpenProyecto] = useState(false);
  const [openEstado, setOpenEstado] = useState(false);
  const [openEtapa, setOpenEtapa] = useState(false);

  const [filtroProyecto, setFiltroProyecto] = useState('Todos los proyectos');
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroEtapa, setFiltroEtapa] = useState('Todas las etapas');

  const opcionesProyectos = ['Todos los proyectos', 'App Web Banco', 'Plataforma educativa', 'Sistema de gestión', 'E-commerce Plus', 'Análisis de datos', 'App Mobile'];
  const opcionesEstados = ['Todos los estados', 'Completado', 'En proceso', 'Pendiente', 'En revisión'];
  const opcionesEtapas = ['Todas las etapas', 'Entrega final', 'Desarrollo', 'Pruebas', 'Documentación', 'Análisis', 'Diseño'];

  const evaluaciones = [
    { id: 1, actividad: 'Diseño de la base de datos', proyecto: 'App Web Banco', equipo: 'Equipo Sigma', fecha: '12 may 2025', etapa: 'Entrega final', estado: 'Completado', colorEstado: 'bg-green-50 text-green-600 border border-green-100', accionText: 'Ver evaluación', isLink: false },
    { id: 2, actividad: 'Funcionalidad de login', proyecto: 'App Web Banco', equipo: 'Equipo Beta', fecha: '15 may 2025', etapa: 'Desarrollo', estado: 'En proceso', colorEstado: 'bg-blue-50 text-blue-600 border border-blue-100', accionText: 'Evaluar →', isLink: true },
    { id: 3, actividad: 'Prueba de usabilidad', proyecto: 'Plataforma educativa', equipo: 'Equipo Alfa', fecha: '20 may 2025', etapa: 'Pruebas', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-400 border border-gray-100', accionText: 'Evaluar →', isLink: true },
    { id: 4, actividad: 'Manual de usuario', proyecto: 'Sistema de gestión', equipo: 'Proyecto Héroe', fecha: '22 may 2025', etapa: 'Documentación', estado: 'Pendiente', colorEstado: 'bg-gray-50 text-gray-400 border border-gray-100', accionText: 'Evaluar →', isLink: true },
    { id: 5, actividad: 'Presentación final', proyecto: 'E-commerce Plus', equipo: 'Stark Corp', fecha: '25 may 2025', etapa: 'Entrega final', estado: 'En revisión', colorEstado: 'bg-amber-50 text-amber-600 border border-amber-100', accionText: 'Evaluar →', isLink: true },
    { id: 6, actividad: 'Análisis de datos', proyecto: 'Análisis de datos', equipo: 'Equipo Delta', fecha: '28 may 2025', etapa: 'Análisis', estado: 'Completado', colorEstado: 'bg-green-50 text-green-600 border border-green-100', accionText: 'Ver evaluación', isLink: false },
    { id: 7, actividad: 'Diseño de interfaz', proyecto: 'App Mobile', equipo: 'Equipo Gamma', fecha: '30 may 2025', etapa: 'Diseño', estado: 'En proceso', colorEstado: 'bg-blue-50 text-blue-600 border border-blue-100', accionText: 'Evaluar →', isLink: true },
  ];

  const evaluacionesFiltradas = evaluaciones.filter(ev => {
    const cumpleBusqueda = ev.actividad.toLowerCase().includes(busqueda.toLowerCase()) || ev.equipo.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleProyecto = filtroProyecto === 'Todos los proyectos' || ev.proyecto === filtroProyecto;
    const cumpleEstado = filtroEstado === 'Todos los estados' || ev.estado === filtroEstado;
    const cumpleEtapa = filtroEtapa === 'Todas las etapas' || ev.etapa === filtroEtapa;
    return cumpleBusqueda && cumpleProyecto && cumpleEstado && cumpleEtapa;
  });

  return (
    // 🟢 CONTENEDOR FLUIDO GLOBAL
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TOPBAR ADAPTADO COMO CARD */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">Evaluaciones</h2>
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

      {/* BANNER INFORMATIVO */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Aquí puedes revisar las actividades de los proyectos que te fueron asignados.
        </p>
      </div>

      {/* CARD DE TABLA Y FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 min-h-[400px] overflow-hidden">
        
        {/* SECCIÓN DE FILTROS ADAPTATIVA (Flex-row en pantallas grandes, columnas en móvil) */}
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center relative z-20">
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {/* DROPDOWN 1: PROYECTOS */}
            <div className="relative flex-1 sm:flex-initial">
              <button 
                onClick={() => { setOpenProyecto(!openProyecto); setOpenEstado(false); setOpenEtapa(false); }}
                className="flex items-center justify-between gap-4 bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-xs text-gray-600 font-medium hover:bg-gray-50 w-full sm:min-w-[150px]"
              >
                <span className="truncate">{filtroProyecto}</span> <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
              {openProyecto && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
                  {opcionesProyectos.map(opc => (
                    <button 
                      key={opc}
                      onClick={() => { setFiltroProyecto(opc); setOpenProyecto(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 block transition-colors ${filtroProyecto === opc ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600'}`}
                    >
                      {opc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DROPDOWN 2: ESTADOS */}
            <div className="relative flex-1 sm:flex-initial">
              <button 
                onClick={() => { setOpenEstado(!openEstado); setOpenProyecto(false); setOpenEtapa(false); }}
                className="flex items-center justify-between gap-4 bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-xs text-gray-600 font-medium hover:bg-gray-50 w-full sm:min-w-[140px]"
              >
                <span className="truncate">{filtroEstado}</span> <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
              {openEstado && (
                <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30">
                  {opcionesEstados.map(opc => (
                    <button 
                      key={opc}
                      onClick={() => { setFiltroEstado(opc); setOpenEstado(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 block transition-colors ${filtroEstado === opc ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600'}`}
                    >
                      {opc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DROPDOWN 3: ETAPAS */}
            <div className="relative flex-1 sm:flex-initial">
              <button 
                onClick={() => { setOpenEtapa(!openEtapa); setOpenProyecto(false); setOpenEstado(false); }}
                className="flex items-center justify-between gap-4 bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-xs text-gray-600 font-medium hover:bg-gray-50 w-full sm:min-w-[130px]"
              >
                <span className="truncate">{filtroEtapa}</span> <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
              {openEtapa && (
                <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30">
                  {opcionesEtapas.map(opc => (
                    <button 
                      key={opc}
                      onClick={() => { setFiltroEtapa(opc); setOpenEtapa(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 block transition-colors ${filtroEtapa === opc ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600'}`}
                    >
                      {opc}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative w-full xl:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar evaluación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* TABLA REUTILIZABLE CON DESPLAZAMIENTO HORIZONTAL */}
        <div className="overflow-x-auto relative z-10 w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/75 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3.5">Actividad</th>
                <th className="px-6 py-3.5">Proyecto / Equipo</th>
                <th className="px-6 py-3.5">Fecha entrega</th>
                <th className="px-6 py-3.5">Etapa</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
              {evaluacionesFiltradas.length > 0 ? (
                evaluacionesFiltradas.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-950 whitespace-nowrap">{ev.actividad}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-950 leading-tight">{ev.proyecto}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{ev.equipo}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{ev.fecha}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-medium">{ev.etapa}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${ev.colorEstado}`}>
                        {ev.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ev.isLink ? (
                        <Link to="/evaluador-formulario" className="text-blue-600 font-bold hover:text-blue-700 text-[12px]">{ev.accionText}</Link>
                      ) : (
                        <span className="text-gray-400 text-[12px] font-medium cursor-not-allowed">{ev.accionText}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-gray-400 font-medium">
                    No se encontraron registros que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER DE LA TABLA */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Mostrando {evaluacionesFiltradas.length} de {evaluaciones.length} evaluaciones
          </p>
        </div>

      </div>
    </div>
  );
};