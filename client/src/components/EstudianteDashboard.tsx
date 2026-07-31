import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  ListChecks, Clock, AlertCircle, Eye, CheckCircle2, LayoutGrid, Circle 
} from 'lucide-react';

// ─── MOCK DATA LOCAL OPTIMIZADO ──────────────────────────────────────────────
const CHART_COLORS = ["#94a3b8", "#3b82f6", "#f59e0b", "#22c55e"];

const UPCOMING_ACTIVITIES = [
  { title: "Realizar pruebas de usabilidad", date: "22/05/2025" },
  { title: "Documentar resultados", date: "24/05/2025" },
  { title: "Preparar presentación final", date: "27/05/2025" },
];

const RECENT_LOG = [
  { action: "Completaste 'Investigar usuarios'", time: "Hoy, 10:15" },
  { action: "Actualizaste 'Definir alcance'", time: "Hoy, 09:40" },
  { action: "'Diseño de la interfaz' en revisión", time: "Ayer, 18:00" },
  { action: "Nueva actividad agregada: 'Pruebas'", time: "Ayer, 16:20" },
];

// ─── COMPONENTES INTERNOS AUXILIARES ─────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm shadow-gray-100/40 box-border">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export const EstudianteDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/actividades", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setActividades(data.actividades || []);
        }
      } catch (error) {
        console.error("Error al cargar actividades", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActividades();
  }, []);

  const total = actividades.length;
  const pendientes = actividades.filter(a => a.status === 'PENDING').length;
  const enProceso = actividades.filter(a => a.status === 'IN_PROCESS').length;
  const enRevision = actividades.filter(a => a.status === 'IN_REVIEW').length;
  const completadas = actividades.filter(a => a.status === 'DONE').length;
  const progresoPorcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  const chartData = [
    { name: "Pendientes", value: pendientes },
    { name: "En Proceso", value: enProceso },
    { name: "En Revisión", value: enRevision },
    { name: "Completados", value: completadas },
  ];

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard del Estudiante</h1>
        <p className="text-sm text-gray-400 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
      </div>

      {/* METRICAS / STAT CARDS RESPONSIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        <StatCard label="Total de actividades" value={total} color="bg-indigo-50 text-indigo-600" icon={<ListChecks size={20} />} />
        <StatCard label="Pendientes" value={pendientes} color="bg-gray-50 text-gray-400" icon={<Clock size={20} />} />
        <StatCard label="En proceso" value={enProceso} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={20} />} />
        <StatCard label="En revisión" value={enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={20} />} />
        <StatCard label="Completadas" value={completadas} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={20} />} />
      </div>

      {/* SECCIÓN INTERACTIVA DE DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          
          {/* BARRA DE PROGRESO CORREGIDA CON EL TONO OSCURO DE FIGMA */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm shadow-gray-100/40">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 mb-4">Progreso del proyecto</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold">{completadas} de {total} actividades completadas</span>
              <span className="text-sm font-black text-gray-900">{progresoPorcentaje}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full">
              {/* 🟢 Cambiado a bg-[#1a1d2e] para igualar el color de Figma */}
              <div className="h-full bg-[#1a1d2e] rounded-full transition-all duration-500" style={{ width: `${progresoPorcentaje}%` }} />
            </div>
          </div>

          {/* GRÁFICA DE RECHARTS */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm shadow-gray-100/40">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 mb-4">Progreso por estado</h3>
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PRÓXIMAS ACTIVIDADES */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm shadow-gray-100/40">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 mb-3">Próximas actividades</h3>
            <div className="divide-y divide-gray-50">
              {UPCOMING_ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Circle size={12} className="text-gray-300 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 truncate">{a.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-bold shrink-0 pl-2">{a.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6 w-full">
          
          {/* BOTÓN ENLACE KANBAN CORREGIDO CON ESTILO OSCURO DE FIGMA */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm shadow-gray-100/40 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600 shadow-sm shadow-gray-100">
              <LayoutGrid size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ir al tablero Kanban</p>
            </div>
            {/* 🟢 Cambiado a bg-[#1a1d2e] y ajustado el texto a "Ir al tablero" igual a Figma */}
            <button
              type="button"
              onClick={() => navigate("/estudiante-kanban")}
              className="w-full py-2.5 bg-[#1a1d2e] text-white rounded-xl text-xs font-bold hover:bg-[#11131f] transition-all shadow-sm"
            >
              Ir al tablero
            </button>
          </div>

          {/* HISTORIAL / ACTIVIDAD RECIENTE */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm shadow-gray-100/40">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 mb-4">Actividad reciente</h3>
            <div className="space-y-4">
              {RECENT_LOG.map((l, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 leading-snug">{l.action}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{l.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};