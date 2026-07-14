import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Eye, EyeOff, Search, Plus, Edit2, ChevronLeft, ChevronRight,
  Upload, X, LayoutDashboard, FolderOpen, ListChecks, Package,
  CalendarDays, User, LogOut, Send, CheckCircle2, Circle,
  Users, Paperclip, MessageSquare, LayoutGrid, ArrowLeft, Mail, Phone, Building, Clock,
  AlertCircle, CheckSquare, Trash2, Link,
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ENTREGAS = [
  { id: 1, title: "Investigar usuarios", description: "Sub reporte de hallazgos y entrevistas.", status: "Pendiente", dueDate: "23/05/2025", format: "PDF / DOCX", evidence: [] },
  { id: 2, title: "Definir alcance", description: "Documentación y análisis del proyecto.", status: "En Revisión", dueDate: "25/05/2025", format: "PDF", evidence: ["alcance_v1.pdf"] },
  { id: 3, title: "Diseño de interfaz", description: "Prototipos de alta fidelidad.", status: "Aprobado", dueDate: "27/05/2025", format: "PDF / IMG", evidence: ["diseno_final.pdf", "mockups.png"] },
  { id: 4, title: "Pruebas de usabilidad", description: "Entregar resultados con usuarios.", status: "Completada", dueDate: "30/05/2025", format: "PDF / DOCX", evidence: [] },
];

const KANBAN_COLUMNS = ["Pendiente", "En Proceso", "En Revisión", "Completado"];
const KANBAN_INIT = {
  "Pendiente": [
    { id: 1, title: "Investigar usuarios", responsible: "Ana García", priority: "Alta", dueDate: "23/05/2025" },
    { id: 5, title: "Reunión de equipo", responsible: "Juan Pérez", priority: "Media", dueDate: "22/05/2025" },
  ],
  "En Proceso": [
    { id: 2, title: "Definir alcance", responsible: "María González", priority: "Media", dueDate: "25/05/2025" },
    { id: 6, title: "Documentar API", responsible: "Carlos López", priority: "Alta", dueDate: "26/05/2025" },
    { id: 7, title: "Configurar entorno", responsible: "Ana García", priority: "Baja", dueDate: "20/05/2025" },
  ],
  "En Revisión": [
    { id: 3, title: "Diseño de interfaz", responsible: "Carlos López", priority: "Alta", dueDate: "27/05/2025" },
  ],
  "Completado": [
    { id: 4, title: "Pruebas de usabilidad", responsible: "Juan Pérez", priority: "Baja", dueDate: "30/05/2025" },
    { id: 8, title: "Análisis inicial", responsible: "María González", priority: "Media", dueDate: "15/05/2025" },
  ],
};

const CHART_DATA = [
  { name: "Pendientes", value: 7 },
  { name: "En Proceso", value: 8 },
  { name: "En Revisión", value: 4 },
  { name: "Completados", value: 5 },
];
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

const CALENDAR_EVENTS: Record<number, { title: string; type: "reunion" | "entrega" | "actividad" }[]> = {
  3: [{ title: "Reunión de avance", type: "reunion" }],
  10: [{ title: "Entrega prueba", type: "entrega" }],
  12: [{ title: "Diseño de interfaz", type: "actividad" }],
  17: [{ title: "Revisión con equipo", type: "reunion" }],
  24: [{ title: "Entrega final", type: "entrega" }],
  27: [{ title: "Diseño de etapa", type: "actividad" }],
};

const UPCOMING_EVENTS = [
  { title: "Definir alcance", date: "17/06/2025", days: "En 2 días" },
  { title: "Diseño de interfaz", date: "20/06/2025", days: "En 5 días" },
  { title: "Revisión con equipo", date: "24/06/2025", days: "En 9 días" },
  { title: "Entrega wireframes", date: "27/06/2025", days: "En 12 días" },
];

const MOCK_PROJECTS = [
  {
    id: 1, name: "ClassBoard Equipo A", description: "Diseño del sistema académico",
    team: 5, status: "Activo", progress: 67, startDate: "01/05/2025", endDate: "30/06/2025", priority: "Alta", docente: "Dr. Roberto García", entregaFinal: "30/06/2025",
    members: [
      { name: "Ana García Pérez", email: "ana@universidad.edu", role: "Líder" },
      { name: "Juan Pérez López", email: "juan@universidad.edu", role: "Desarrollador" },
    ],
    evaluators: []
  }
];

// Helpers estáticos de estilos
function statusBg(status: string) {
  if (status === "Pendiente") return "bg-gray-100 text-gray-600";
  if (status === "En Proceso") return "bg-blue-100 text-blue-700";
  if (status === "En Revisión") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
function priorityBg(p: string) {
  if (p === "Alta") return "bg-red-100 text-red-700";
  if (p === "Media") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function Badge({ label, cls }: { label: string; cls: string }) { return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>; }
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-400 font-medium">{label}</p></div>
    </div>
  );
}

// ─── EXPORTACIONES INDIVIDUALES PARA TU ROUTER ──────────────────────────────

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard del Estudiante</h1><p className="text-sm text-gray-400">Proyecto: ClassBoard Equipo A</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <StatCard label="Total de actividades" value={24} color="bg-indigo-50 text-indigo-600" icon={<ListChecks size={20} />} />
        <StatCard label="Pendientes" value={7} color="bg-gray-50 text-gray-500" icon={<Clock size={20} />} />
        <StatCard label="En proceso" value={8} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={20} />} />
        <StatCard label="En revisión" value={4} color="bg-amber-50 text-amber-600" icon={<Eye size={20} />} />
        <StatCard label="Completadas" value={5} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={20} />} />
      </div>
      <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold mb-3">Progreso del proyecto</h3>
        <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400 font-medium">16 de 24 actividades</span><span className="text-sm font-black text-blue-600">67%</span></div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: "67%" }} /></div>
      </div>
    </div>
  );
}

export function ProyectosPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Mis Proyectos</h2><p className="text-xs text-gray-400 mt-1">ClassBoard Equipo A - Activo</p></div>;
}

// ─── ACTIVIDADES (conectado a la API real) ──────────────────────────────────
const API_ACTIVIDADES_URL = "http://localhost:3000/api/actividades";

type Actividad = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_limite: string;
  estado: "Pendiente" | "En Proceso" | "En Revisión" | "Completado";
};

function ActividadStatusIcon({ estado }: { estado: string }) {
  if (estado === "Completado") return <CheckCircle2 size={16} className="text-green-500" />;
  if (estado === "En Proceso") return <AlertCircle size={16} className="text-blue-500" />;
  if (estado === "En Revisión") return <Clock size={16} className="text-amber-500" />;
  return <Circle size={16} className="text-gray-300" />;
}

function ActividadCrearModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Actividad) => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fechaLimite);
    if (!fechaLimite || fechaSeleccionada < hoy) {
      setError("La fecha límite no puede ser anterior a hoy.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ACTIVIDADES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim(), fecha_limite: fechaLimite }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo crear la actividad.");
      onCreated(data.actividad);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md shadow-xl space-y-4 box-border" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Crear actividad</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-2.5 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de la actividad *</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Investigar metodologías ágiles"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Describe el objetivo y alcance de la actividad."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 resize-none focus:outline-none focus:border-blue-400 transition-all box-border"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha límite *</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={e => setFechaLimite(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1a1d2e] hover:bg-[#11131f] rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear actividad"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const fetchActividades = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_ACTIVIDADES_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) setActividades(data.actividades);
      } catch (err) {
        console.error("Error al cargar actividades:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActividades();
  }, []);

  const filtered = actividades.filter(a =>
    (filterStatus === "Todos" || a.estado === filterStatus) &&
    a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: actividades.length,
    pendientes: actividades.filter(a => a.estado === "Pendiente").length,
    enProceso: actividades.filter(a => a.estado === "En Proceso").length,
    enRevision: actividades.filter(a => a.estado === "En Revisión").length,
    completadas: actividades.filter(a => a.estado === "Completado").length,
  };

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Actividades</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">Gestiona tus actividades del proyecto</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#1a1d2e] text-white rounded-xl text-xs font-bold hover:bg-[#11131f] transition-all shadow-sm"
        >
          <Plus size={14} /> Agregar actividad
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        <StatCard label="Total" value={counts.total} color="bg-indigo-50 text-indigo-600" icon={<ListChecks size={20} />} />
        <StatCard label="Pendientes" value={counts.pendientes} color="bg-gray-50 text-gray-400" icon={<Clock size={20} />} />
        <StatCard label="En proceso" value={counts.enProceso} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={20} />} />
        <StatCard label="En revisión" value={counts.enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={20} />} />
        <StatCard label="Completadas" value={counts.completadas} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={20} />} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar actividad..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Todos", "Pendiente", "En Proceso", "En Revisión", "Completado"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? "bg-[#1a1d2e] text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400 font-medium">Cargando actividades...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-white/50">
            No se encontraron actividades.
          </div>
        ) : (
          filtered.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm shadow-gray-100/40">
              <div className="shrink-0"><ActividadStatusIcon estado={a.estado} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{a.nombre}</p>
                <p className="text-xs text-gray-400 font-medium">
                  Fecha límite: {new Date(a.fecha_limite).toLocaleDateString("es-MX")}
                </p>
              </div>
              <Badge label={a.estado} cls={statusBg(a.estado)} />
            </div>
          ))
        )}
      </div>

      {modal && (
        <ActividadCrearModal
          onClose={() => setModal(false)}
          onCreated={nueva => setActividades(prev => [nueva, ...prev])}
        />
      )}
    </div>
  );
}

export function EntregasPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Módulo de Entregas</h2><p className="text-xs text-gray-400 mt-1">Sube tus evidencias y reportes finales</p></div>;
}

export function CalendarioPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Calendario de Entregas</h2><p className="text-xs text-gray-400 mt-1">Consulta tus fechas límite</p></div>;
}

export function KanbanPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Tablero Kanban</h2><p className="text-xs text-gray-400 mt-1">Mueve tus tarjetas para actualizar estados</p></div>;
}

export function PerfilPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Perfil del Alumno</h2><p className="text-xs text-gray-400 mt-1">Información académica</p></div>;
}