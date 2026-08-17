import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { Folder, Bell, CheckSquare, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API_PROYECTOS_URL = `${API_BASE_URL}/actividades/proyectos`;
const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;

interface ProyectoReal {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
}

interface ActividadReal {
  id: string;
  name: string;
  status: string;
  deadline: string;
  projectId?: string;
  project?: { id?: string; name: string };
}

const getInitials = (name?: string) => {
  if (!name) return 'EV';
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  } else {
    return parts[0][0].toUpperCase();
  }
};

export const EvaluadorDashboard: React.FC = () => {
  const [proyectos, setProyectos] = useState<ProyectoReal[]>([]);
  const [actividades, setActividades] = useState<ActividadReal[]>([]);
  const [nombreEvaluador, setNombreEvaluador] = useState('Profesor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataReal = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Obtener nombre del evaluador desde el localStorage
        const userStored = localStorage.getItem('user');
        if (userStored) {
          const parsed = JSON.parse(userStored);
          if (parsed.name) setNombreEvaluador(parsed.name);
        }

        // 2. Petición en paralelo de proyectos y actividades
        const [resProyectos, resActividades] = await Promise.all([
          fetch(API_PROYECTOS_URL, { headers }),
          fetch(API_ACTIVIDADES_URL, { headers })
        ]);

        let proyectosAsignados: ProyectoReal[] = [];
        if (resProyectos.ok) {
          const dataP = await resProyectos.json();
          proyectosAsignados = dataP.proyectos || [];
          setProyectos(proyectosAsignados);
        }

        if (resActividades.ok) {
          const dataA = await resActividades.json();
          const todasLasActividades = dataA.actividades || [];

          // 3. Filtrar actividades estrictamente según los proyectos del profesor
          const idsProyectosDelProfesor = proyectosAsignados.map(p => String(p.id));
          const actividadesDelProfesor = todasLasActividades.filter((act: any) => {
            const pId = String(act.projectId || act.project?.id || '');
            return idsProyectosDelProfesor.includes(pId);
          });

          setActividades(actividadesDelProfesor);
        }

      } catch (err) {
        console.error('Error al cargar datos reales del evaluador:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDataReal();
  }, []);

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completado':
      case 'DONE': 
        return 'bg-green-50 text-green-600 border border-green-100';
      case 'En Proceso':
      case 'IN_PROCESS': 
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'En Revisión':
      case 'IN_REVIEW': 
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Pendiente':
      case 'PENDING':
      default: 
        return 'bg-gray-50 text-gray-500 border border-gray-100';
    }
  };

  const totalProyectos = proyectos.length;
  const actividadesEnRevision = actividades.filter(a => a.status === 'IN_REVIEW' || a.status === 'En Revisión').length;
  const actividadesPendientes = actividades.filter(a => a.status === 'PENDING' || a.status === 'Pendiente').length;
  const iniciales = getInitials(nombreEvaluador);

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-none mb-1">Dashboard del Evaluador</h2>
          <p className="text-xs text-gray-400">Bienvenido, {nombreEvaluador}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 p-2 hover:bg-gray-50 rounded-xl transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              {iniciales}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{nombreEvaluador}</p>
              <p className="text-xs text-gray-400">Evaluador</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
        <div className="flex-1 space-y-6 min-w-0 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Folder size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{loading ? '...' : totalProyectos}</p>
                <p className="text-xs text-gray-400 font-medium">Proyectos asignados</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckSquare size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{loading ? '...' : actividadesEnRevision}</p>
                <p className="text-xs text-gray-400 font-medium">Evaluaciones por revisar</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shadow-gray-100/40">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{loading ? '...' : actividades.length}</p>
                <p className="text-xs text-gray-400 font-medium">Actividades totales</p>
              </div>
            </div>
          </div>

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
                    <th className="px-6 py-3.5">Descripción</th>
                    <th className="px-6 py-3.5">Progreso</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando proyectos...</td>
                    </tr>
                  ) : proyectos.length > 0 ? (
                    proyectos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-950 whitespace-nowrap">{p.name}</td>
                        <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{p.description || 'Sin descripción'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 w-24">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${getBadgeStyle(p.status)}`}>
                            {p.status}
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
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No hay proyectos asignados actualmente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[280px] space-y-4 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40">
            <h4 className="font-bold text-gray-900 text-[14px] mb-1">Actividades recientes</h4>
            <p className="text-xs text-gray-400 mb-4">{actividadesPendientes} pendientes</p>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">Cargando...</p>
              ) : actividades.length > 0 ? (
                actividades.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3.5 border border-gray-100 rounded-xl flex flex-col gap-2 bg-white hover:border-gray-200 transition-colors">
                    <p className="text-xs font-bold text-gray-950 truncate">{act.name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400 font-medium truncate max-w-[120px]">
                        {act.project?.name || 'ClassBoard'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getBadgeStyle(act.status)}`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-2">Sin actividades registradas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};