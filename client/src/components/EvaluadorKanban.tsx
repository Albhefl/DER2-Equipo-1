import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Clock, ArrowLeft, FolderOpen } from 'lucide-react';
import { API_BASE_URL } from '../config/apis';

const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const API_PROYECTOS_URL = `${API_BASE_URL}/actividades/proyectos`;

type EstadoActividad = "PENDING" | "IN_PROCESS" | "IN_REVIEW" | "DONE";
type PrioridadActividad = "HIGH" | "MED" | "LOW";

const ESTADOS: EstadoActividad[] = ["PENDING", "IN_PROCESS", "IN_REVIEW", "DONE"];

const ESTADO_LABELS: Record<EstadoActividad, string> = {
  PENDING: "Pendiente",
  IN_PROCESS: "En Proceso",
  IN_REVIEW: "En Revisión",
  DONE: "Completado",
};

const PRIORIDAD_LABELS: Record<PrioridadActividad, string> = { HIGH: "Alta", MED: "Media", LOW: "Baja" };

type Miembro = { id: string; name: string };
type Responsable = { user: Miembro };
type ProyectoSimple = { id: string; name: string };

type Actividad = {
  id: string;
  name: string;
  deadline: string;
  status: EstadoActividad;
  priority?: PrioridadActividad;
  projectId?: string | null;
  project?: ProyectoSimple | null;
  assignees: Responsable[];
};

function priorityBg(p?: PrioridadActividad) {
  if (p === "HIGH") return "bg-red-50 text-red-600 border border-red-100";
  if (p === "LOW") return "bg-green-50 text-green-600 border border-green-100";
  return "bg-amber-50 text-amber-600 border border-amber-100";
}

function columnStyle(estado: EstadoActividad) {
  switch (estado) {
    case "PENDING": return { border: "border-gray-200", header: "bg-gray-50/75 text-slate-400", dot: "bg-slate-400" };
    case "IN_PROCESS": return { border: "border-blue-100", header: "bg-blue-50/60 text-blue-500", dot: "bg-blue-500" };
    case "IN_REVIEW": return { border: "border-amber-100", header: "bg-amber-50/60 text-amber-500", dot: "bg-amber-500" };
    case "DONE": return { border: "border-green-100", header: "bg-green-50/60 text-green-500", dot: "bg-green-500" };
  }
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export const EvaluadorKanban: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdParam = searchParams.get("projectId");

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      setErrorCarga(null);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resAct, resProy] = await Promise.all([
          fetch(API_ACTIVIDADES_URL, { headers }),
          fetch(API_PROYECTOS_URL, { headers }),
        ]);

        const dataAct = await resAct.json();
        if (!resAct.ok) throw new Error(dataAct.message || "No se pudieron cargar las actividades.");
        setActividades(dataAct.actividades || []);

        if (resProy.ok) {
          const dataProy = await resProy.json();
          setProyectos(dataProy.proyectos || []);
        }
      } catch (err: any) {
        setErrorCarga(err.message || "Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  const proyectoActivo = proyectos.find(p => p.id === projectIdParam);

  const handleFiltroProyectoChange = (val: string) => {
    navigate(val ? `/evaluador-kanban?projectId=${val}` : "/evaluador-kanban");
  };

  return (
    <div className="w-full max-w-full space-y-6 box-border">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {projectIdParam && (
            <Link to={`/evaluador-detalle?projectId=${projectIdParam}`} className="flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:underline mb-1.5 w-fit">
              <ArrowLeft size={13} /> Volver al detalle del proyecto
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tablero Kanban</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {proyectoActivo ? `Proyecto: ${proyectoActivo.name} · Vista de solo lectura` : "Selecciona un proyecto para ver su tablero"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-44">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarjeta..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={projectIdParam || ""}
              onChange={e => handleFiltroProyectoChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40 cursor-pointer"
            >
              <option value="">Todos mis proyectos asignados</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-gray-400 font-medium">Cargando tablero...</div>
      ) : errorCarga ? (
        <div className="text-center py-10 text-xs text-red-500 font-semibold border border-dashed border-red-100 rounded-2xl bg-red-50/40">
          {errorCarga}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-start box-border">
          {ESTADOS.map(estado => {
            const style = columnStyle(estado);
            const filteredCards = actividades.filter(a =>
              a.status === estado &&
              (!projectIdParam || a.projectId === projectIdParam) &&
              a.name.toLowerCase().includes(search.toLowerCase())
            );

            return (
              <div key={estado} className={`flex flex-col rounded-2xl border ${style.border} bg-white shadow-sm shadow-gray-100/30 overflow-hidden w-full`}>
                <div className={`px-4 py-3 flex items-center justify-between border-b border-inherit ${style.header}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{ESTADO_LABELS[estado]}</span>
                  </div>
                  <span className="text-xs font-bold bg-white border border-inherit px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{filteredCards.length}</span>
                </div>

                <div className="p-3 flex flex-col gap-3 min-h-37.5 max-h-125 overflow-y-auto bg-gray-50/30">
                  {filteredCards.map(card => (
                    <div key={card.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800 leading-snug">{card.name}</p>
                        {card.project?.name && !projectIdParam && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[9px] font-bold">
                            {card.project.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {card.assignees.length > 0 ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0 border border-blue-100">
                                {initials(card.assignees[0].user.name)}
                              </div>
                              <span className="text-[11px] text-gray-400 font-semibold truncate">
                                {card.assignees.map(r => r.user.name).join(", ")}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-300 font-semibold italic">Sin asignar</span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${priorityBg(card.priority)}`}>
                          {PRIORIDAD_LABELS[card.priority || "MED"]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50 text-[10px] font-bold text-gray-400">
                        <Clock size={10} />
                        {new Date(card.deadline).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                  ))}

                  {filteredCards.length === 0 && (
                    <div className="text-center py-6 text-[11px] text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-white/50">
                      No hay actividades
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};