import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  ListChecks, Clock, AlertCircle, Eye, CheckCircle2, LayoutGrid, Circle 
} from 'lucide-react';

import { ProgressBar } from './ProgressBar';
import { GraficoActividadesResponsables } from './GraficoActividadesResponsables';

import { API_BASE_URL } from '../config/api';

const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios`;

type EstadoActividad = "PENDING" | "IN_PROCESS" | "IN_REVIEW" | "DONE";

type Miembro = { id: string; name: string; email: string };
type Responsable = { user: Miembro };

type Actividad = {
  id: string;
  name: string;
  description: string | null;
  deadline: string;
  status: EstadoActividad;
  assignees: Responsable[];
  projectId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const CHART_COLORS = ["#94a3b8", "#3b82f6", "#f59e0b", "#22c55e"];

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs box-border">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

export const EstudianteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [miembrosEquipo, setMiembrosEquipo] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resAct, resUser] = await Promise.all([
          fetch(API_ACTIVIDADES_URL, { headers }),
          fetch(API_USUARIOS_URL, { headers }),
        ]);

        const dataAct = await resAct.json();
        const dataUser = await resUser.json();

        if (resAct.ok) setActividades(dataAct.actividades || []);
        if (resUser.ok) setMiembrosEquipo(dataUser.usuarios || []);
      } catch (err: any) {
        setError("Error al cargar datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const actividadesVisibles = actividades.filter(a => !projectIdParam || a.projectId === projectIdParam);

  const totalActividades = actividadesVisibles.length;
  const pendientes = actividadesVisibles.filter(a => a.status === 'PENDING').length;
  const enProceso = actividadesVisibles.filter(a => a.status === 'IN_PROCESS').length;
  const enRevision = actividadesVisibles.filter(a => a.status === 'IN_REVIEW').length;
  const completadas = actividadesVisibles.filter(a => a.status === 'DONE').length;

  const chartData = [
    { name: "Pendientes", value: pendientes },
    { name: "En Proceso", value: enProceso },
    { name: "En Revisión", value: enRevision },
    { name: "Completados", value: completadas },
  ];

  const proximasActividades = [...actividadesVisibles]
    .filter(a => a.status !== 'DONE')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const recentLogs = [...actividadesVisibles]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.deadline).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || b.deadline).getTime();
      return dateB - dateA;
    })
    .slice(0, 4)
    .map(a => {
      const fecha = new Date(a.updatedAt || a.createdAt || a.deadline);
      const fechaFormateada = fecha.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaFormateada = fecha.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' });

      let action = `Se actualizó '${a.name}'`;
      if (a.status === 'DONE') action = `Completaste '${a.name}'`;
      else if (a.status === 'IN_REVIEW') action = `'${a.name}' en revisión`;
      else if (a.status === 'IN_PROCESS') action = `Actualizaste '${a.name}'`;
      else if (a.status === 'PENDING') action = `Nueva actividad: '${a.name}'`;

      return {
        id: a.id,
        action,
        time: `${fechaFormateada}, ${horaFormateada}`
      };
    });

  return (
    <div className="w-full max-w-full space-y-6 box-border font-sans text-gray-900">
      {/* TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard del Estudiante</h1>
        <p className="text-sm text-gray-400 font-medium mt-0.5">
          {projectIdParam ? "Filtrado por proyecto seleccionado" : "Proyecto: ClassBoard Equipo A"}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 font-medium">Cargando métricas en tiempo real...</div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100">{error}</div>
      ) : (
        <>
          {/* MÉTRICAS / STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
            <StatCard label="Total de actividades" value={totalActividades} color="bg-indigo-50 text-indigo-600" icon={<ListChecks size={20} />} />
            <StatCard label="Pendientes" value={pendientes} color="bg-gray-50 text-gray-400" icon={<Clock size={20} />} />
            <StatCard label="En proceso" value={enProceso} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={20} />} />
            <StatCard label="En revisión" value={enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={20} />} />
            <StatCard label="Completadas" value={completadas} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={20} />} />
          </div>

          {/* SECCIÓN INTERACTIVA DE DOS COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-2 space-y-6 w-full min-w-0">
              
              {/* BARRA DE PROGRESO GENERAL */}
              <ProgressBar
                totalActividades={totalActividades}
                completadasActividades={completadas}
              />

              {/* GRÁFICA DE RECHARTS POR ESTADO */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Progreso por estado
                </h3>
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      {/* 🟢 allowDecimals={false} asegura números enteros limpios en el eje Y */}
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* HU-032: GRÁFICO POR RESPONSABLE */}
              <GraficoActividadesResponsables
                actividades={actividadesVisibles}
                miembrosEquipo={miembrosEquipo}
              />

              {/* PRÓXIMAS ACTIVIDADES */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Próximas actividades
                </h3>
                <div className="flex flex-col">
                  {proximasActividades.length > 0 ? (
                    proximasActividades.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Circle size={14} className="text-gray-300 shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">{a.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium shrink-0 pl-2">
                          {new Date(a.deadline).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">No hay actividades pendientes próximas.</p>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA */}
            <div className="space-y-6 w-full">
              
              {/* IR AL TABLERO KANBAN */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900">
                  <LayoutGrid size={22} />
                </div>
                <p className="text-sm font-bold text-gray-900 text-center">Ir al tablero Kanban</p>
                <button
                  type="button"
                  onClick={() => navigate(`/estudiante-kanban${projectIdParam ? `?projectId=${projectIdParam}` : ''}`)}
                  className="w-full py-2.5 bg-[#0B1026] text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-all shadow-xs cursor-pointer"
                >
                  Ir al tablero
                </button>
              </div>

              {/* ACTIVIDAD RECIENTE */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Actividad reciente
                </h3>
                {recentLogs.length > 0 ? (
                  <div className="flex flex-col gap-3.5">
                    {recentLogs.map((l) => (
                      <div key={l.id} className="flex gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-snug">{l.action}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{l.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">No hay actividad reciente registrada.</p>
                )}
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default EstudianteDashboard;