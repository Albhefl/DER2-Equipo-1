import { useState, useEffect } from "react";
import {
  Eye, Search, Plus, Edit2, ListChecks,
  CheckCircle2, Circle, AlertCircle, Trash2, X, Clock, UserPlus, Calendar,
  ArrowLeft, Paperclip, Upload, Send, MessageSquare
} from "lucide-react";

// ─── COMPONENTES ATÓMICOS Y HELPERS ─────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function Badge({ label, cls }: { label: string; cls: string }) { 
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>; 
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── CONFIGURACIÓN DE TIPOS Y ENUMS (PRISMA ENUMS) ───────────────────────────

const API_ACTIVIDADES_URL = "http://localhost:3000/api/actividades";
const API_USUARIOS_URL = "http://localhost:3000/api/usuarios";

type EstadoActividad = "PENDING" | "IN_PROCESS" | "IN_REVIEW" | "DONE";
type PrioridadActividad = "HIGH" | "MED" | "LOW";

const ESTADOS: EstadoActividad[] = ["PENDING", "IN_PROCESS", "IN_REVIEW", "DONE"];

const ESTADO_LABELS: Record<EstadoActividad, string> = {
  PENDING: "Pendiente",
  IN_PROCESS: "En Proceso",
  IN_REVIEW: "En Revisión",
  DONE: "Completada",
};

function statusBg(estado: EstadoActividad) {
  if (estado === "PENDING") return "bg-gray-100 text-gray-600";
  if (estado === "IN_PROCESS") return "bg-blue-100 text-blue-700";
  if (estado === "IN_REVIEW") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700"; // DONE
}

const PRIORIDAD_LABELS: Record<PrioridadActividad, string> = { HIGH: "Alta", MED: "Media", LOW: "Baja" };

function prioridadBg(prioridad: PrioridadActividad) {
  if (prioridad === "HIGH") return "bg-red-100 text-red-700";
  if (prioridad === "LOW") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700"; // MED
}

function ActividadStatusIcon({ status }: { status: EstadoActividad }) {
  if (status === "DONE") return <CheckCircle2 size={16} className="text-green-500" />;
  if (status === "IN_PROCESS") return <AlertCircle size={16} className="text-blue-500" />;
  if (status === "IN_REVIEW") return <Clock size={16} className="text-amber-500" />;
  return <Circle size={16} className="text-gray-300" />; // PENDING
}

type Miembro = { id: string; name: string; email: string };
type Responsable = { user: Miembro };

type Actividad = {
  id: string; 
  name: string;
  description: string | null;
  deadline: string;
  status: EstadoActividad;
  priority?: PrioridadActividad;
  assignees: Responsable[];
};

// ── HU-015.2: fusión de responsables ──
// Combina los responsables que ya tenía la actividad con los que devuelve el backend
// tras una asignación, sin duplicados y sin perder a nadie. Esto convierte el criterio
// "el segundo no elimina al primero" en una garantía del propio frontend: aunque el
// backend llegara a responder con una lista incompleta, en pantalla nunca desaparece
// un responsable que ya estaba asignado.
function mergeMiembros(previos: Miembro[], nuevos: Miembro[]): Miembro[] {
  const combinados = [...previos, ...nuevos];
  const vistos = new Set<string>();
  return combinados.filter(m => {
    if (vistos.has(m.id)) return false;
    vistos.add(m.id);
    return true;
  });
}

// ─── VISTAS GENERALES DEL ROUTER ─────────────────────────────────────────────

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
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
  return <div className="p-6"><div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Mis Proyectos</h2><p className="text-xs text-gray-400 mt-1">ClassBoard Equipo A - Activo</p></div></div>;
}

export function EntregasPage() {
  return <div className="p-6"><div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Módulo de Entregas</h2><p className="text-xs text-gray-400 mt-1">Sube tus evidencias y reportes finales</p></div></div>;
}

export function CalendarioPage() {
  return <div className="p-6"><div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Calendario de Entregas</h2><p className="text-xs text-gray-400 mt-1">Consulta tus fechas límite</p></div></div>;
}

export function PerfilPage() {
  return <div className="p-6"><div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Perfil del Alumno</h2><p className="text-xs text-gray-400 mt-1">Información académica</p></div></div>;
}

// ─── MODALES DE OPERACIONES (MÓDULO ACTIVIDADES) ─────────────────────────────

function ActividadCrearModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Actividad) => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }

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

        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-2.5 rounded-xl text-center">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de la actividad *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Investigar metodologías ágiles" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Describe el objetivo y alcance de la actividad." className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 resize-none focus:outline-none focus:border-blue-400 transition-all box-border" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha límite *</label>
            <input type="date" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border" />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-xs font-bold text-white bg-[#1a1d2e] hover:bg-[#11131f] rounded-xl transition-colors shadow-sm disabled:opacity-50">{loading ? "Creando..." : "Crear actividad"}</button>
        </div>
      </div>
    </div>
  );
}

// Estilo compartido de campo para el modal de edición (blanco + borde fino, como en el diseño de Figma)
const editFieldCls = "w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border";

function ActividadEditarModal({
  actividad, onClose, onUpdated,
}: {
  actividad: Actividad;
  onClose: () => void;
  onUpdated: (a: Actividad) => void;
}) {
  const [nombre, setNombre] = useState(actividad.name);
  const [descripcion, setDescripcion] = useState(actividad.description || "");
  const [fechaLimite, setFechaLimite] = useState(actividad.deadline.split("T")[0]);
  const [estado, setEstado] = useState<EstadoActividad>(actividad.status);
  const [prioridad, setPrioridad] = useState<PrioridadActividad>(actividad.priority || "MED");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── HU-015: Manejo de responsables ──
  const [responsables, setResponsables] = useState<Miembro[]>(actividad.assignees.map(a => a.user));
  const [miembrosEquipo, setMiembrosEquipo] = useState<Miembro[]>([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState("");
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_USUARIOS_URL, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) setMiembrosEquipo(data.usuarios);
      } catch (err) {
        console.error("Error al cargar miembros del equipo:", err);
      }
    };
    fetchMiembros();
  }, []);

  const disponibles = miembrosEquipo.filter(m => !responsables.some(r => r.id === m.id));

  const handleAsignar = async () => {
    if (!miembroSeleccionado) return;
    setAsignando(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${actividad.id}/responsables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: miembroSeleccionado }),
      });
      const data = await response.json();
      if (response.ok) {
        // HU-015.2: se fusiona con los responsables que ya había en pantalla,
        // así el nuevo nunca elimina al que ya estaba asignado.
        const nuevos: Miembro[] = (data.actividad?.assignees ?? []).map((a: Responsable) => a.user);
        const fusionados = mergeMiembros(responsables, nuevos);
        setResponsables(fusionados);
        setMiembroSeleccionado("");
        onUpdated({ ...actividad, ...data.actividad, assignees: fusionados.map(u => ({ user: u })) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAsignando(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${actividad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim(), fecha_limite: fechaLimite, estado, prioridad }),
      });
      const data = await response.json();
      if (response.ok) {
        onUpdated(data.actividad);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-xl space-y-6 box-border max-h-[90vh] overflow-y-auto relative text-left" onClick={e => e.stopPropagation()}>

        {/* Botón cerrar X */}
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>

        {/* Título */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">Editar Actividad</h3>
          <p className="text-xs text-gray-400 mt-1">Modifica los datos de la actividad seleccionada.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl text-center font-medium">{error}</div>}

        <div className="space-y-4">
          {/* Título de la Actividad */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">Título de la actividad *</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={editFieldCls}
            />
          </div>

          {/* Fecha Límite y Estado en dos columnas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">Fecha límite *</label>
              <input
                type="date"
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                className={editFieldCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">Estado *</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as EstadoActividad)}
                className={editFieldCls}
              >
                {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              className={`${editFieldCls} resize-none`}
            />
          </div>

          {/* Responsable y Prioridad lado a lado */}
          <div className="grid grid-cols-2 gap-4 items-start">
            {/* Responsable Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">Responsable *</label>
              <div className="flex gap-2">
                <select
                  value={miembroSeleccionado}
                  onChange={e => setMiembroSeleccionado(e.target.value)}
                  className={editFieldCls}
                >
                  <option value="">
                    {responsables.length > 0 ? responsables.map(r => r.name).join(", ") : "Selecciona un compañero..."}
                  </option>
                  {disponibles.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {miembroSeleccionado && (
                  <button
                    type="button"
                    onClick={handleAsignar}
                    disabled={asignando}
                    className="px-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    {asignando ? "..." : "Ok"}
                  </button>
                )}
              </div>
            </div>

            {/* Prioridad en Radio Buttons horizontales */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">Prioridad *</label>
              <div className="flex items-center gap-4 h-[42px]">
                {[
                  { label: "Alta", value: "HIGH" as PrioridadActividad },
                  { label: "Media", value: "MED" as PrioridadActividad },
                  { label: "Baja", value: "LOW" as PrioridadActividad }
                ].map(p => (
                  <label key={p.value} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={prioridad === p.value}
                      onChange={e => setPrioridad(e.target.value as PrioridadActividad)}
                      className="accent-black w-3.5 h-3.5"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Información Actual / Auditoría */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-gray-800">Información actual</h4>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <span className="font-bold text-gray-700">Creada el:</span> 10/06/2025 10:30 a.m.
            </div>
            <div className="flex items-center gap-1.5">
              <UserPlus size={12} className="text-gray-400 shrink-0" />
              <span className="font-bold text-gray-700">Creada por:</span> Juan Pérez
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400 shrink-0" />
              <span className="font-bold text-gray-700">Última actualización:</span> 15/06/2025 04:45 p.m.
            </div>
            <div className="flex items-center gap-1.5">
              <UserPlus size={12} className="text-gray-400 shrink-0" />
              <span className="font-bold text-gray-700">Actualizada por:</span> María González
            </div>
          </div>
        </div>

        {/* Botonera de abajo */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border-none cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-black hover:bg-gray-900 rounded-xl transition-colors border-none shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}

function ActividadEliminarConfirm({ actividad, onClose, onDeleted }: { actividad: Actividad; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${actividad.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("No se pudo eliminar la actividad.");
      onDeleted(actividad.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl space-y-4 box-border" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Eliminar actividad</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"><X size={16} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-2.5 rounded-xl text-center">{error}</div>}
        <p className="text-sm text-gray-600">¿Estás segura de que quieres eliminar la actividad <span className="font-bold text-gray-900">"{actividad.name}"</span>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
          <button type="button" onClick={handleDelete} disabled={loading} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">{loading ? "Eliminando..." : "Eliminar"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA DE DETALLE DE ACTIVIDAD ───────────────────────────────────────────

type ChecklistItem = { id: string; label: string; done: boolean };

function ActividadDetallePage({
  actividad, onBack, onUpdated,
}: {
  actividad: Actividad;
  onBack: () => void;
  onUpdated: (a: Actividad) => void;
}) {
  const [estado, setEstado] = useState<EstadoActividad>(actividad.status);
  const [comentario, setComentario] = useState("");
  // TODO: reemplazar por el checklist real de la actividad cuando el backend lo exponga
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", label: "Revisar requerimientos", done: false },
    { id: "2", label: "Reunión con stakeholders", done: false },
    { id: "3", label: "Documentar alcance", done: false },
  ]);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  // ── HU-015 / HU-015.1 / HU-015.2: selección y asignación de responsable(s) ──
  // Los responsables se leen siempre de `actividad.assignees` (no de un estado local aparte)
  // para que, tras cada asignación, la tarjeta en la lista y este panel muestren lo mismo
  // de forma inmediata, sin necesidad de recargar ni de perder a los ya asignados.
  const responsables = actividad.assignees.map(a => a.user);
  const [miembrosEquipo, setMiembrosEquipo] = useState<Miembro[]>([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_USUARIOS_URL, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) setMiembrosEquipo(data.usuarios);
      } catch (err) {
        console.error("Error al cargar miembros del equipo:", err);
      }
    };
    fetchMiembros();
  }, []);

  // Escenario 2 (HU-015.2): solo se listan compañeros que aún NO son responsables,
  // así nunca se sobreescribe ni se duplica a quien ya está asignado.
  const disponibles = miembrosEquipo.filter(m => !responsables.some(r => r.id === m.id));

  const handleAsignar = async () => {
    if (!miembroSeleccionado) return;
    setAsignando(true);
    setErrorAsignar(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${actividad.id}/responsables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: miembroSeleccionado }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo asignar el responsable.");
      // HU-015.2: se fusiona con los responsables que ya tenía la actividad,
      // así el segundo (o el que sea) nunca elimina al primero.
      const nuevos: Miembro[] = (data.actividad?.assignees ?? []).map((a: Responsable) => a.user);
      const fusionados = mergeMiembros(responsables, nuevos);
      onUpdated({ ...actividad, ...data.actividad, assignees: fusionados.map(u => ({ user: u })) });
      setMiembroSeleccionado("");
    } catch (err: any) {
      setErrorAsignar(err.message || "Error de conexión con el servidor.");
    } finally {
      setAsignando(false);
    }
  };

  const prioridad = actividad.priority || "MED";

  return (
    <div className="w-full max-w-full space-y-6 box-border p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{actividad.name}</h1>
            <p className="text-sm text-gray-400 font-medium mt-0.5">Detalle de actividad</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-gray-500">Estado:</span>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as EstadoActividad)}
            className="appearance-none px-3 py-1.5 bg-[#1a1d2e] text-white text-xs font-bold rounded-xl focus:outline-none cursor-pointer"
          >
            {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
          </select>
          <Badge label={ESTADO_LABELS[estado]} cls={statusBg(estado)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">Descripción</h3>
              <p className="text-sm text-gray-500">{actividad.description || "Sin descripción."}</p>
            </div>
            <div className="border-t border-gray-50 pt-4 grid grid-cols-3 gap-4 items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Responsable(s)</p>

                {responsables.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {responsables.map(r => (
                      <span key={r.id} className="inline-flex items-center gap-1 pl-1 pr-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                        <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {initials(r.name)}
                        </span>
                        {r.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-400 mb-2">Sin asignar</p>
                )}

                <div className="flex gap-1.5">
                  <select
                    value={miembroSeleccionado}
                    onChange={e => setMiembroSeleccionado(e.target.value)}
                    className="flex-1 min-w-0 p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
                  >
                    <option value="">{disponibles.length > 0 ? "Agregar responsable..." : "Sin compañeros disponibles"}</option>
                    {disponibles.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={handleAsignar}
                    disabled={!miembroSeleccionado || asignando}
                    className="px-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 shrink-0"
                  >
                    {asignando ? "..." : "Asignar"}
                  </button>
                </div>
                {errorAsignar && <p className="text-[10px] text-red-500 font-semibold mt-1">{errorAsignar}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prioridad</p>
                <Badge label={PRIORIDAD_LABELS[prioridad]} cls={prioridadBg(prioridad)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha límite</p>
                <p className="text-sm font-semibold text-gray-800">{new Date(actividad.deadline).toLocaleDateString("es-MX")}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <MessageSquare size={15} className="text-gray-400" /> Comentarios (0)
            </h3>
            <div className="min-h-[160px] flex items-center justify-center text-xs text-gray-300 font-medium">
              Aún no hay comentarios.
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
              <input
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
              />
              <button
                type="button"
                onClick={() => setComentario("")}
                disabled={!comentario.trim()}
                className="w-9 h-9 shrink-0 flex items-center justify-center bg-[#1a1d2e] text-white rounded-xl hover:bg-[#11131f] transition-colors disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <Paperclip size={15} className="text-gray-400" /> Evidencias (0)
            </h3>
            <p className="text-xs text-gray-400">Sin evidencias adjuntas.</p>
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              <Upload size={13} /> Subir evidencia
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2.5">
            <h3 className="text-sm font-bold text-gray-900">Información</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Creada el</span><span className="text-gray-700 font-semibold">10/06/2025 09:00 a.m.</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Creada por</span><span className="text-gray-700 font-semibold">Juan Pérez</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Actualizada</span><span className="text-gray-700 font-semibold">16/06/2025 02:00 p.m.</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Actualizada por</span><span className="text-gray-700 font-semibold">María González</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2.5">
            <h3 className="text-sm font-bold text-gray-900">Checklist</h3>
            <div className="space-y-2">
              {checklist.map(item => (
                <label key={item.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="accent-black w-3.5 h-3.5 rounded"
                  />
                  <span className={item.done ? "line-through text-gray-400" : ""}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL DE ACTIVIDADES ─────────────────────────────────────────

export function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Todos" | EstadoActividad>("Todos");
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Actividad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Actividad | null>(null);
  const [viewTarget, setViewTarget] = useState<Actividad | null>(null);

  useEffect(() => {
    const fetchActividades = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_ACTIVIDADES_URL, { headers: { Authorization: `Bearer ${token}` } });
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
    (filterStatus === "Todos" || a.status === filterStatus) &&
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: actividades.length,
    pendientes: actividades.filter(a => a.status === "PENDING").length,
    enProceso: actividades.filter(a => a.status === "IN_PROCESS").length,
    enRevision: actividades.filter(a => a.status === "IN_REVIEW").length,
    completadas: actividades.filter(a => a.status === "DONE").length,
  };

  if (viewTarget) {
    return (
      <ActividadDetallePage
        actividad={viewTarget}
        onBack={() => setViewTarget(null)}
        onUpdated={actualizada => {
          setActividades(prev => prev.map(a => (a.id === actualizada.id ? actualizada : a)));
          setViewTarget(actualizada);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 box-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Actividades</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">Gestiona tus actividades del proyecto</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#1a1d2e] text-white rounded-xl text-xs font-bold hover:bg-[#11131f] transition-all shadow-sm">
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar actividad..." className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Todos", ...ESTADOS] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? "bg-[#1a1d2e] text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {s === "Todos" ? "Todos" : ESTADO_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400 font-medium">Cargando actividades...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-white/50">No se encontraron actividades.</div>
        ) : (
          filtered.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm shadow-gray-100/40">
              <div className="shrink-0"><ActividadStatusIcon status={a.status} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{a.name}</p>
                <p className="text-xs text-gray-400 font-medium">Fecha límite: {new Date(a.deadline).toLocaleDateString("es-MX")}</p>
                {a.assignees.length > 0 && (
                  <p className="text-xs text-indigo-500 font-semibold mt-0.5 truncate">Responsables: {a.assignees.map(r => r.user.name).join(", ")}</p>
                )}
              </div>
              <Badge label={ESTADO_LABELS[a.status]} cls={statusBg(a.status)} />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewTarget(a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Eye size={13} /> Ver detalle
                </button>
                <button
                  onClick={() => setEditTarget(a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button onClick={() => setDeleteTarget(a)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors" title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && <ActividadCrearModal onClose={() => setModal(false)} onCreated={nueva => setActividades(prev => [nueva, ...prev])} />}
      {editTarget && <ActividadEditarModal actividad={editTarget} onClose={() => setEditTarget(null)} onUpdated={actualizada => setActividades(prev => prev.map(a => a.id === actualizada.id ? actualizada : a))} />}
      {deleteTarget && <ActividadEliminarConfirm actividad={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={id => setActividades(prev => prev.filter(a => a.id !== id))} />}
    </div>
  );
}
