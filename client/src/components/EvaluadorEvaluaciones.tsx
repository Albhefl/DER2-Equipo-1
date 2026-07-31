import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FolderOpen, AlertCircle } from 'lucide-react';

const API_ACTIVIDADES_URL = 'http://localhost:3000/api/actividades';

interface Miembro {
  id: string;
  name: string;
}

interface ProyectoSimple {
  id: string;
  name: string;
}

interface ActividadEvaluacion {
  id: string;
  name: string;
  deadline: string;
  status: string;
  project?: ProyectoSimple | null;
  assignees: { user: Miembro }[];
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case 'IN_PROCESS':
    case 'En proceso': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'DONE':
    case 'Completado': return 'bg-green-50 text-green-600 border border-green-100';
    case 'IN_REVIEW':
    case 'En revisión': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'PENDING':
    case 'Pendiente':
    default: return 'bg-gray-50 text-gray-500 border border-gray-100';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'IN_PROCESS': return 'En proceso';
    case 'DONE': return 'Completado';
    case 'IN_REVIEW': return 'En revisión';
    case 'PENDING':
    default: return 'Pendiente';
  }
}

function formatearFecha(f?: string) {
  if (!f) return 'Sin fecha límite';
  const d = new Date(f);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const EvaluadorEvaluaciones: React.FC = () => {
  const [actividades, setActividades] = useState<ActividadEvaluacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroProyecto, setFiltroProyecto] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [nombreEvaluador, setNombreEvaluador] = useState('Profesor01');

  useEffect(() => {
    const cargarActividades = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        const userStored = localStorage.getItem('user');
        if (userStored) {
          const parsed = JSON.parse(userStored);
          if (parsed.name) setNombreEvaluador(parsed.name);
        }

        const res = await fetch(API_ACTIVIDADES_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setActividades(data.actividades || []);
        }
      } catch (err) {
        console.error('Error al cargar actividades para evaluación:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarActividades();
  }, []);

  // Proyectos únicos para el selector de filtros
  const proyectosUnicos = Array.from(
    new Set(actividades.map(a => a.project?.name).filter(Boolean))
  ) as string[];

  const actividadesFiltradas = actividades.filter(a => {
    const coincideBusqueda = 
      a.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.assignees?.some(r => r.user.name.toLowerCase().includes(busqueda.toLowerCase()));
    
    const coincideProyecto = filtroProyecto === 'Todos' || a.project?.name === filtroProyecto;
    const coincideEstado = filtroEstado === 'Todos' || statusLabel(a.status) === filtroEstado;

    return coincideBusqueda && coincideProyecto && coincideEstado;
  });

  const iniciales = nombreEvaluador.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* HEADER */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-none mb-1">Evaluación de Actividades</h2>
          <p className="text-xs text-gray-400">Bienvenido, {nombreEvaluador}</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {iniciales}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{nombreEvaluador}</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* BANNER INFORMATIVO */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Aquí puedes evaluar individualmente cada actividad desarrollada por los estudiantes en sus proyectos asignados.
        </p>
      </div>

      {/* TABLA DE ACTIVIDADES */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/40 w-full">
        
        {/* BARRA DE FILTROS SUPERIOR */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroProyecto}
              onChange={e => setFiltroProyecto(e.target.value)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white"
            >
              <option value="Todos">Todos los proyectos</option>
              {proyectosUnicos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="En revisión">En revisión</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar actividad o responsable..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white transition"
            />
          </div>
        </div>

        {/* TABLA DE ACTIVIDADES / ENTREGABLES REALES */}
        <div className="overflow-x-auto w-full">
          {cargando ? (
            <div className="text-center py-12 text-xs text-gray-400 font-medium">
              Cargando actividades...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3.5">Actividad</th>
                  <th className="px-6 py-3.5">Proyecto</th>
                  <th className="px-6 py-3.5">Responsable(s)</th>
                  <th className="px-6 py-3.5">Fecha límite</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                {actividadesFiltradas.length > 0 ? (
                  actividadesFiltradas.map((act) => {
                    const proyectoNombre = act.project?.name || 'App de ventas';
                    const responsables = act.assignees?.map(r => r.user.name).join(', ') || 'Sin asignar';
                    const esCompletado = act.status === 'DONE' || act.status === 'Completado';

                    return (
                      <tr key={act.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                          {act.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-800 text-xs">{proyectoNombre}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {responsables}
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {formatearFecha(act.deadline)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeStyle(act.status)}`}>
                            {statusLabel(act.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            to={`/evaluador-formulario/${act.id}`}
                            className={`font-bold text-[12px] transition ${
                              esCompletado ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {esCompletado ? 'Ver evaluación →' : 'Evaluar →'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-xs text-gray-400 font-medium space-y-2">
                      <FolderOpen size={28} className="mx-auto text-gray-300 mb-1" />
                      <p>No se encontraron actividades registradas.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Mostrando {actividadesFiltradas.length} de {actividades.length} actividades
          </p>
        </div>

      </div>
    </div>
  );
};