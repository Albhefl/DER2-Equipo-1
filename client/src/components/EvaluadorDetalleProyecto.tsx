import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom'; 
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Circle,
  FolderOpen
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Miembro {
  id: string;
  name: string;
  email: string;
}

interface ActividadSimple {
  id: string;
  name: string;
  status: string;
}

interface ProyectoDetalle {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: string;
  progress: number;
  members: Miembro[];
  evaluators: Miembro[];
  activities?: ActividadSimple[];
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case 'En proceso':
    case 'IN_PROCESS': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'Completado':
    case 'DONE': return 'bg-green-50 text-green-600 border border-green-100';
    case 'En revisión':
    case 'IN_REVIEW': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'Activo':
    case 'PENDING':
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
  if (!f) return 'Sin fecha definida';
  const d = new Date(f);
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const BG_COLORS = ['bg-blue-600', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-indigo-600', 'bg-teal-500'];

export const EvaluadorDetalleProyecto: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [actividades, setActividades] = useState<ActividadSimple[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreEvaluador, setNombreUsuario] = useState('Profesor01');

  useEffect(() => {
    const cargarProyectoReal = async () => {
      if (!projectId) {
        setCargando(false);
        return;
      }

      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        const userStored = localStorage.getItem('user');
        if (userStored) {
          const parsed = JSON.parse(userStored);
          if (parsed.name) setNombreUsuario(parsed.name);
        }

        // 1. Obtener la lista de proyectos asignados
        const resProyectos = await fetch(`${API_BASE_URL}/actividades/proyectos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (resProyectos.ok) {
          const dataP = await resProyectos.json();
          const proyectoEncontrado = (dataP.proyectos || []).find((p: any) => p.id === projectId);
          if (proyectoEncontrado) {
            setProyecto(proyectoEncontrado);
          }
        }

        // 2. Obtener actividades pertenecientes a este proyecto
        const resActividades = await fetch(`${API_BASE_URL}/actividades`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (resActividades.ok) {
          const dataA = await resActividades.json();
          const actividadesDelProyecto = (dataA.actividades || []).filter(
            (a: any) => a.projectId === projectId || a.project?.id === projectId
          );
          setActividades(actividadesDelProyecto);
        }

      } catch (err) {
        console.error('Error al cargar detalle del proyecto:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarProyectoReal();
  }, [projectId]);

  if (cargando) {
    return (
      <div className="w-full text-center py-20 text-xs text-gray-400 font-medium">
        Cargando detalle del proyecto...
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
        <FolderOpen size={36} className="mx-auto text-gray-300" />
        <p className="text-xs font-semibold text-gray-700">Proyecto no encontrado o sin acceso.</p>
        <Link to="/evaluador-proyectos" className="inline-block text-xs font-bold text-blue-600 hover:underline">
          ← Volver a proyectos asignados
        </Link>
      </div>
    );
  }

  const lider = proyecto.members?.[0]?.name || 'Sin asignar';
  const inicialesEvaluador = obtenerIniciales(nombreEvaluador);

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TOPBAR */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>Proyectos asignados</span>
          <span>&gt;</span>
          <span className="text-gray-600 truncate max-w-[120px] sm:max-w-none">{proyecto.name}</span>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {inicialesEvaluador}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{nombreEvaluador}</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="flex-1 space-y-4 min-w-0 w-full">
          
          <Link to="/evaluador-proyectos" className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline mb-2 w-fit">
            <ArrowLeft size={14} /> Volver a proyectos asignados
          </Link>

          {/* TARJETA ENCABEZADO PROYECTO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate leading-snug">{proyecto.name}</h3>
                <p className="text-xs text-gray-400 truncate">Líder: {lider} / Evaluador: {nombreEvaluador}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-6 pt-2 text-xs">
              <p className="text-gray-500 font-medium shrink-0">
                Fecha de entrega: <span className="text-gray-900 font-bold ml-1">{formatearFecha(proyecto.endDate)}</span>
              </p>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeStyle(proyecto.status)} w-fit`}>
                {proyecto.status}
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-gray-400 font-medium shrink-0 text-[11px]">Progreso: {proyecto.progress || 0}%</span>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${proyecto.progress || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA DESCRIPCIÓN */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción del proyecto</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {proyecto.description || 'Sin descripción registrada para este proyecto.'}
            </p>
          </div>

          {/* TARJETA ACTIVIDADES DEL PROYECTO (CON BOTÓN DE EVALUAR DENTRO DE CADA ACTIVIDAD) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Actividades del proyecto ({actividades.length})
            </h4>
            {actividades.length > 0 ? (
              <div className="space-y-3">
                {actividades.map((act) => {
                  const esDone = act.status === 'DONE' || act.status === 'Completado';
                  return (
                    <div key={act.id} className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        {esDone ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`font-semibold ${esDone ? 'text-gray-800' : 'text-gray-600'}`}>
                          {act.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeStyle(act.status)}`}>
                          {statusLabel(act.status)}
                        </span>
                        
                        {/* 🟢 ENLACE PARA EVALUAR ESTA ACTIVIDAD ESPECÍFICA */}
                        <Link 
                          to={`/evaluador-formulario/${act.id}`}
                          className="text-blue-600 hover:text-blue-700 font-bold text-[12px] transition"
                        >
                          Evaluar →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No hay actividades registradas en este proyecto aún.</p>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA: INTEGRANTES REALES */}
        <div className="w-full lg:w-[280px] space-y-4 shrink-0">
          
          {/* INFORMACIÓN DEL EQUIPO */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40">
            <h4 className="font-bold text-gray-900 text-[14px] mb-1">Integrantes del equipo</h4>
            <p className="text-xs text-gray-400 mb-4">{proyecto.members?.length || 0} alumnos inscritos</p>
            
            <div className="space-y-3.5">
              {proyecto.members && proyecto.members.length > 0 ? (
                proyecto.members.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 ${BG_COLORS[idx % BG_COLORS.length]} text-white font-bold text-[11px] rounded-full flex items-center justify-center shrink-0`}>
                      {obtenerIniciales(m.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 leading-none mb-1 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-none truncate">{m.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">Sin integrantes registrados.</p>
              )}
            </div>
          </div>

          {/* BOTÓN RÁPIDO A EVALUACIONES */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-3">
                <h4 className="font-bold text-gray-900 text-[14px]">Acción de Evaluación</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Como evaluador asignado, puedes revisar y calificar individualmente las actividades de este proyecto.
                </p>
                <Link 
                  to={`/evaluador-kanban?projectId=${proyecto.id}`}
                  className="w-full block py-2.5 text-center bg-white text-gray-900 border border-gray-200 font-bold rounded-xl text-xs hover:bg-gray-50 transition shadow-sm"
                >
                  Ver tablero Kanban
                </Link>
                <Link 
                  to="/evaluador-evaluaciones" 
                  className="w-full block py-2.5 text-center bg-black text-white font-bold rounded-xl text-xs hover:bg-gray-900 transition shadow-sm"
                >
                  Ir a Evaluaciones
                </Link>
              </div>

        </div>

      </div>
    </div>
  );
};