import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, X, Clock, UserPlus, ArrowUpDown } from 'lucide-react';

// ─── CONEXIÓN A LA API REAL (sin datos simulados) ───────────────────────────
const API_ACTIVIDADES_URL = "http://localhost:3000/api/actividades";
const API_USUARIOS_URL = "http://localhost:3000/api/usuarios";

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

type EditDraft = {
  name: string;
  description: string;
  deadline: string;
  status: EstadoActividad;
  priority: PrioridadActividad;
};

// ─── UTILS DE ESTILOS ─────────────────────────────────────────────────────
function priorityBg(p?: PrioridadActividad) {
  if (p === "HIGH") return "bg-red-50 text-red-600 border border-red-100";
  if (p === "LOW") return "bg-green-50 text-green-600 border border-green-100";
  return "bg-amber-50 text-amber-600 border border-amber-100"; // MED o sin definir
}

// ── HU-017: indicador visual de vencimiento en tarjetas ──
// Escenario 1: > 5 días restantes  -> verde
// Escenario 2: entre 1 y 5 días restantes -> naranja
//   (una actividad que vence justo HOY, 0 días, se trata también como naranja:
//   los criterios no cubren ese punto exacto, pero aún no está "vencida" y ya
//   no cabe en "más de 5 días", así que es la lectura más razonable)
// Escenario 3: fecha límite ya pasada y la actividad no está completada -> rojo + "Vencida"
// Las actividades en la columna "Completado" no se marcan como vencidas ni se
// colorean por urgencia: ya no tiene sentido avisar que una tarea terminada "vence".
type VencimientoColor = "verde" | "naranja" | "rojo" | "neutral";

function calcularVencimiento(deadline: string, status: EstadoActividad): { color: VencimientoColor; vencida: boolean } {
  if (status === "DONE") return { color: "neutral", vencida: false };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaLimite = new Date(deadline);
  fechaLimite.setHours(0, 0, 0, 0);

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasRestantes = Math.round((fechaLimite.getTime() - hoy.getTime()) / msPorDia);

  if (diasRestantes < 0) return { color: "rojo", vencida: true };
  if (diasRestantes <= 5) return { color: "naranja", vencida: false };
  return { color: "verde", vencida: false };
}

function vencimientoEstilos(color: VencimientoColor) {
  switch (color) {
    case "verde": return { text: "text-green-600", dot: "bg-green-500" };
    case "naranja": return { text: "text-amber-600", dot: "bg-amber-500" };
    case "rojo": return { text: "text-red-600", dot: "bg-red-500" };
    default: return { text: "text-gray-400", dot: "bg-gray-300" };
  }
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

// HU-015.2: combina responsables anteriores + nuevos sin duplicados y sin perder a nadie
// (misma lógica usada en la vista de Lista/Detalle, replicada aquí para el tablero).
function mergeMiembros(previos: Miembro[], nuevos: Miembro[]): Miembro[] {
  const combinados = [...previos, ...nuevos];
  const vistos = new Set<string>();
  return combinados.filter(m => {
    if (vistos.has(m.id)) return false;
    vistos.add(m.id);
    return true;
  });
}

export const EstudianteKanban: React.FC = () => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── HU-016: filtrado del tablero por responsable ──
  const [filtroResponsable, setFiltroResponsable] = useState("");

  // ── HU-018: ordenamiento del tablero por fecha límite ──
  type OrdenFecha = "" | "asc" | "desc";
  const [ordenFecha, setOrdenFecha] = useState<OrdenFecha>("");

  const [editModal, setEditModal] = useState<Actividad | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // ── Asignación de responsables dentro del modal (misma mecánica de HU-015) ──
  const [miembrosEquipo, setMiembrosEquipo] = useState<Miembro[]>([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState("");
  const [asignando, setAsignando] = useState(false);

  const fetchActividades = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ACTIVIDADES_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudieron cargar las actividades.");
      setActividades(data.actividades);
    } catch (err: any) {
      setErrorCarga(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActividades(); }, []);

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

  // Responsables que realmente aparecen en el tablero, para poblar el filtro (HU-016.1).
  const responsablesDisponibles = mergeMiembros([], actividades.flatMap(a => a.assignees.map(r => r.user)));

  const openEdit = (actividad: Actividad) => {
    setEditModal(actividad);
    setEditDraft({
      name: actividad.name,
      description: actividad.description || "",
      deadline: actividad.deadline.split("T")[0],
      status: actividad.status,
      priority: actividad.priority || "MED",
    });
    setMiembroSeleccionado("");
    setErrorGuardar(null);
  };

  const closeEdit = () => {
    setEditModal(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editModal || !editDraft) return;
    if (!editDraft.name.trim()) { setErrorGuardar("El nombre es obligatorio."); return; }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${editModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: editDraft.name.trim(),
          descripcion: editDraft.description.trim(),
          fecha_limite: editDraft.deadline,
          estado: editDraft.status,
          prioridad: editDraft.priority,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo guardar la actividad.");
      setActividades(prev => prev.map(a => (a.id === data.actividad.id ? data.actividad : a)));
      closeEdit();
    } catch (err: any) {
      setErrorGuardar(err.message || "Error de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignar = async () => {
    if (!editModal || !miembroSeleccionado) return;
    setAsignando(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${editModal.id}/responsables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: miembroSeleccionado }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo asignar el responsable.");
      // HU-015.2: se fusiona con lo que ya tenía la actividad, nunca se sobreescribe.
      const nuevos: Miembro[] = (data.actividad?.assignees ?? []).map((a: Responsable) => a.user);
      const fusionados = mergeMiembros(editModal.assignees.map(a => a.user), nuevos);
      const actividadActualizada = { ...editModal, ...data.actividad, assignees: fusionados.map(u => ({ user: u })) };
      setActividades(prev => prev.map(a => (a.id === actividadActualizada.id ? actividadActualizada : a)));
      setEditModal(actividadActualizada);
      setMiembroSeleccionado("");
    } catch (err: any) {
      setErrorGuardar(err.message || "Error de conexión con el servidor.");
    } finally {
      setAsignando(false);
    }
  };

  const addCard = async (estado: EstadoActividad) => {
    const nombre = prompt(`Nueva actividad en "${ESTADO_LABELS[estado]}":`) ?? "";
    if (!nombre.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const hoy = new Date().toISOString().split("T")[0];
      const response = await fetch(API_ACTIVIDADES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: "", fecha_limite: hoy, estado }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo crear la actividad.");
      setActividades(prev => [data.actividad, ...prev]);
    } catch (err: any) {
      alert(err.message || "Error de conexión con el servidor.");
    }
  };

  const removeCard = async (id: string) => {
    if (!confirm("¿Eliminar esta actividad? Esta acción no se puede deshacer.")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ACTIVIDADES_URL}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("No se pudo eliminar la actividad.");
      setActividades(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Error de conexión con el servidor.");
    }
  };

  const disponibles = editModal
    ? miembrosEquipo.filter(m => !editModal.assignees.some(r => r.user.id === m.id))
    : [];

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      {/* HEADER ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tablero Kanban</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarjeta..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40"
            />
          </div>

          {/* HU-016.1: control de filtro por responsable */}
          <div className="relative w-full sm:w-44">
            <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={filtroResponsable}
              onChange={e => setFiltroResponsable(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40 cursor-pointer"
            >
              <option value="">Todos los responsables</option>
              {responsablesDisponibles.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* HU-018: ordenamiento del tablero por fecha límite */}
          <div className="relative w-full sm:w-52">
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={ordenFecha}
              onChange={e => setOrdenFecha(e.target.value as OrdenFecha)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40 cursor-pointer"
            >
              <option value="">Sin ordenar</option>
              <option value="asc">Fecha: más próxima primero</option>
              <option value="desc">Fecha: más lejana primero</option>
            </select>
          </div>

          {/* HU-016.2: limpiar filtro y restaurar vista completa, sin recargar */}
          {filtroResponsable && (
            <button
              type="button"
              onClick={() => setFiltroResponsable("")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
            >
              <X size={13} /> Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-gray-400 font-medium">Cargando tablero...</div>
      ) : errorCarga ? (
        <div className="text-center py-10 text-xs text-red-500 font-semibold border border-dashed border-red-100 rounded-2xl bg-red-50/40">
          {errorCarga}
        </div>
      ) : (
        <>
          {/* REJILLA RESPONSIVA DE COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-start box-border">
            {ESTADOS.map(estado => {
              const style = columnStyle(estado);
              // HU-016 escenario 1: el filtro de responsable aplica en TODAS las columnas a la vez,
              // combinado (AND) con la búsqueda por título que ya existía.
              const filteredCards = actividades
                .filter(a =>
                  a.status === estado &&
                  a.name.toLowerCase().includes(search.toLowerCase()) &&
                  (!filtroResponsable || a.assignees.some(r => r.user.id === filtroResponsable))
                )
                // HU-018: ordena dentro de cada columna por fecha límite.
                // ordenFecha === "" deja el orden tal como llega de la API (sin ordenar).
                .sort((a, b) => {
                  if (!ordenFecha) return 0;
                  const fechaA = new Date(a.deadline).getTime();
                  const fechaB = new Date(b.deadline).getTime();
                  return ordenFecha === "asc" ? fechaA - fechaB : fechaB - fechaA;
                });

              return (
                <div key={estado} className={`flex flex-col rounded-2xl border ${style.border} bg-white shadow-sm shadow-gray-100/30 overflow-hidden w-full`}>
                  {/* HEADER DE COLUMNA */}
                  <div className={`px-4 py-3 flex items-center justify-between border-b border-inherit ${style.header}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{ESTADO_LABELS[estado]}</span>
                    </div>
                    <span className="text-xs font-bold bg-white border border-inherit px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{filteredCards.length}</span>
                  </div>

                  {/* CUERPO DE TARJETAS */}
                  <div className="p-3 flex flex-col gap-3 min-h-37.5 max-h-125 overflow-y-auto bg-gray-50/30">
                    {filteredCards.map(card => {
                      const venc = calcularVencimiento(card.deadline, card.status);
                      const estilosVenc = vencimientoEstilos(venc.color);
                      return (
                      <div key={card.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-gray-800 leading-snug flex-1">{card.name}</p>
                          <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                            <button onClick={() => openEdit(card)} className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => removeCard(card.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
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

                        {/* HU-017: indicador de color por proximidad a la fecha límite */}
                        <div className={`flex items-center gap-1.5 pt-1 border-t border-gray-50 text-[10px] font-bold tracking-tight ${estilosVenc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estilosVenc.dot}`} />
                          <Clock size={10} className="shrink-0" />
                          {new Date(card.deadline).toLocaleDateString("es-MX")}
                          {venc.vencida && (
                            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[9px] font-bold uppercase tracking-wide shrink-0">
                              Vencida
                            </span>
                          )}
                        </div>
                      </div>
                      );
                    })}

                    {filteredCards.length === 0 && (
                      <div className="text-center py-6 text-[11px] text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-white/50">
                        {filtroResponsable ? "Sin actividades para este responsable" : "No hay actividades"}
                      </div>
                    )}
                  </div>

                  {/* ACCIÓN AÑADIR ACTIVIDAD */}
                  <div className="p-2 border-t border-inherit bg-gray-50/50">
                    <button
                      onClick={() => addCard(estado)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-100 transition-all"
                    >
                      <Plus size={14} /> Agregar actividad
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 font-medium text-center">Despliega o gestiona las actividades usando los controles de estado de cada tarjeta.</p>
        </>
      )}

      {/* VENTANA MODAL PARA EDICIÓN DE TARJETAS */}
      {editModal && editDraft && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeEdit}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl space-y-4 relative box-border" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Editar tarjeta</h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                <X size={16} />
              </button>
            </div>

            {errorGuardar && <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-2.5 rounded-xl text-center">{errorGuardar}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título</label>
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={e => setEditDraft(d => d && ({ ...d, name: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
                />
              </div>

              {/* Responsables: badges + selector de asignación (misma mecánica de HU-015) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Responsable(s)</label>
                {editModal.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {editModal.assignees.map(r => (
                      <span key={r.user.id} className="inline-flex items-center gap-1 pl-1 pr-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-semibold">
                        <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {initials(r.user.name)}
                        </span>
                        {r.user.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-semibold mb-1.5">Sin asignar</p>
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
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Prioridad</label>
                <select
                  value={editDraft.priority}
                  onChange={e => setEditDraft(d => d && ({ ...d, priority: e.target.value as PrioridadActividad }))}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
                >
                  {(["HIGH", "MED", "LOW"] as PrioridadActividad[]).map(p => <option key={p} value={p}>{PRIORIDAD_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha límite</label>
                <input
                  type="date"
                  value={editDraft.deadline}
                  onChange={e => setEditDraft(d => d && ({ ...d, deadline: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado</label>
                <select
                  value={editDraft.status}
                  onChange={e => setEditDraft(d => d && ({ ...d, status: e.target.value as EstadoActividad }))}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border"
                >
                  {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-50">
              <button type="button" onClick={closeEdit} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button type="button" onClick={saveEdit} disabled={guardando} className="px-4 py-2 text-xs font-bold text-white bg-[#0B1026] hover:bg-[#060916] rounded-xl transition-colors shadow-sm disabled:opacity-50">
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
