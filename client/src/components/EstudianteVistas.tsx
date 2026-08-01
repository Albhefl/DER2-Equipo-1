import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Clock, CheckCircle2, AlertCircle, 
  Eye, CheckSquare, ArrowLeft, Send, Link, FileText, Paperclip, Folder
} from 'lucide-react';

const API_ACTIVIDADES_URL = 'http://localhost:3000/api/actividades';
const API_USUARIOS_URL = 'http://localhost:3000/api/usuarios';

type EstadoActividad = 'PENDING' | 'IN_PROCESS' | 'IN_REVIEW' | 'DONE';
type PrioridadActividad = 'HIGH' | 'MED' | 'LOW';

const ESTADO_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendiente', cls: 'bg-gray-100 text-gray-700' },
  IN_PROCESS: { label: 'En Proceso', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'En Revisión', cls: 'bg-amber-100 text-amber-700' },
  DONE: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
  Pendiente: { label: 'Pendiente', cls: 'bg-gray-100 text-gray-700' },
  'En Proceso': { label: 'En Proceso', cls: 'bg-blue-100 text-blue-700' },
  'En Revisión': { label: 'En Revisión', cls: 'bg-amber-100 text-amber-700' },
  Completado: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
};

function mapStatusToPrisma(s: string): EstadoActividad {
  if (s === 'En Proceso' || s === 'IN_PROCESS') return 'IN_PROCESS';
  if (s === 'En Revisión' || s === 'IN_REVIEW') return 'IN_REVIEW';
  if (s === 'Completado' || s === 'DONE') return 'DONE';
  return 'PENDING';
}

function formatearFecha(f?: string) {
  if (!f) return '23/05/2026';
  const d = new Date(f);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function formatearFechaInput(f?: string) {
  if (!f) return '';
  return new Date(f).toISOString().split('T')[0];
}

interface Miembro {
  id: string;
  name: string;
  email: string;
}

interface ProyectoSimple {
  id: string;
  name: string;
}

interface Actividad {
  id: string;
  name: string;
  description: string | null;
  deadline: string;
  status: string;
  priority?: PrioridadActividad;
  projectId?: string | null;
  project?: ProyectoSimple | null;
  assignees: { user: Miembro }[];
}

interface Comentario {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

interface Evidencia {
  id: string;
  url: string;
  createdAt: string;
  creator: { id: string; name: string };
}

export const ActividadesPage: React.FC = () => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Miembro[]>([]);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<ProyectoSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);

  // Vistas y Modales
  const [vistaDetalle, setVistaDetalle] = useState<Actividad | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState<Actividad | null>(null);

  // Formulario Crear / Editar
  const [formDraft, setFormDraft] = useState({
    nombre: '',
    descripcion: '',
    fecha_limite: '',
    estado: 'PENDING',
    prioridad: 'HIGH' as PrioridadActividad,
    responsableId: '',
    projectId: ''
  });

  // Comentarios y Evidencias
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [nuevaEvidenciaUrl, setNuevaEvidenciaUrl] = useState('');
  const [mostrandoInputEvidencia, setMostrandoInputEvidencia] = useState(false);

  const fetchActividades = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ACTIVIDADES_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const lista: Actividad[] = data.actividades || [];
        setActividades(lista);
        if (lista.length > 0 && !actividadSeleccionada) setActividadSeleccionada(lista[0]);
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuariosYProyectos = async () => {
    try {
      const token = localStorage.getItem('token');
      const [resU, resP] = await Promise.all([
        fetch(API_USUARIOS_URL, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3000/api/actividades/proyectos', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resU.ok) {
        const dataU = await resU.json();
        setUsuariosDisponibles(dataU.usuarios || []);
      }
      if (resP.ok) {
        const dataP = await resP.json();
        setProyectosDisponibles(dataP.proyectos || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios o proyectos:', err);
    }
  };

  useEffect(() => {
    fetchActividades();
    fetchUsuariosYProyectos();
  }, []);

  useEffect(() => {
    if (vistaDetalle) {
      const token = localStorage.getItem('token');
      
      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/comentarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setComentarios(data.comentarios || []))
        .catch(err => console.error('Error comentarios:', err));

      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evidencias`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setEvidencias(data.evidencias || []))
        .catch(err => console.error('Error evidencias:', err));
    }
  }, [vistaDetalle]);

  // 🟢 Guardar nueva actividad (envía responsableId)
  const handleCrearActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ACTIVIDADES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: formDraft.nombre,
          descripcion: formDraft.descripcion,
          fecha_limite: formDraft.fecha_limite,
          estado: formDraft.estado,
          prioridad: formDraft.prioridad,
          projectId: formDraft.projectId || null,
          responsableId: formDraft.responsableId || null
        })
      });

      if (res.ok) {
        setCreateModalOpen(false);
        fetchActividades();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al crear la actividad.');
      }
    } catch (err) {
      console.error('Error al crear actividad:', err);
    }
  };

  // 🟢 Guardar edición de actividad (envía responsableId)
  const handleEditarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOpen) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${editModalOpen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: formDraft.nombre,
          descripcion: formDraft.descripcion,
          fecha_limite: formDraft.fecha_limite,
          estado: formDraft.estado,
          prioridad: formDraft.prioridad,
          projectId: formDraft.projectId || null,
          responsableId: formDraft.responsableId || null
        })
      });

      if (res.ok) {
        setEditModalOpen(null);
        fetchActividades();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al actualizar actividad.');
      }
    } catch (err) {
      console.error('Error al actualizar actividad:', err);
    }
  };

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !vistaDetalle) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenido: nuevoComentario })
      });
      if (res.ok) {
        const data = await res.json();
        setComentarios([...comentarios, data.comentario]);
        setNuevoComentario('');
      }
    } catch (err) {
      console.error('Error al comentar:', err);
    }
  };

  const handleSubirEvidencia = async () => {
    if (!nuevaEvidenciaUrl.trim() || !vistaDetalle) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: nuevaEvidenciaUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setEvidencias([data.evidencia, ...evidencias]);
        setNuevaEvidenciaUrl('');
        setMostrandoInputEvidencia(false);
      }
    } catch (err) {
      console.error('Error al subir evidencia:', err);
    }
  };

  const abrirEditar = (act: Actividad) => {
    setEditModalOpen(act);
    setFormDraft({
      nombre: act.name,
      descripcion: act.description || '',
      fecha_limite: formatearFechaInput(act.deadline),
      estado: mapStatusToPrisma(act.status),
      prioridad: act.priority || 'HIGH',
      responsableId: act.assignees?.[0]?.user?.id || '',
      projectId: act.projectId || ''
    });
  };

  const actividadesFiltradas = actividades.filter(a => {
    const estadoPrisma = mapStatusToPrisma(a.status);
    const coincideEstado = filterStatus === 'Todos' || 
      (filterStatus === 'PENDING' && estadoPrisma === 'PENDING') ||
      (filterStatus === 'IN_PROCESS' && estadoPrisma === 'IN_PROCESS') ||
      (filterStatus === 'IN_REVIEW' && estadoPrisma === 'IN_REVIEW') ||
      (filterStatus === 'DONE' && estadoPrisma === 'DONE');
    
    const coincideBusqueda = a.name.toLowerCase().includes(search.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const counts = {
    total: actividades.length,
    pendientes: actividades.filter(a => mapStatusToPrisma(a.status) === 'PENDING').length,
    enProceso: actividades.filter(a => mapStatusToPrisma(a.status) === 'IN_PROCESS').length,
    enRevision: actividades.filter(a => mapStatusToPrisma(a.status) === 'IN_REVIEW').length,
    completadas: actividades.filter(a => mapStatusToPrisma(a.status) === 'DONE').length,
  };

  // ─── VISTA DETALLE DE ACTIVIDAD COMPLETA ────────────────────────────────────
  if (vistaDetalle) {
    const badgeObj = ESTADO_BADGES[vistaDetalle.status] || ESTADO_BADGES['PENDING'];
    const nombreProyecto = proyectosDisponibles.find(p => p.id === vistaDetalle.projectId)?.name || 'ClassBoard Equipo A';

    return (
      <div className="p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setVistaDetalle(null)} className="p-1 text-gray-400 hover:text-gray-700 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{vistaDetalle.name}</h1>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <Folder size={12} className="text-blue-500" />
                Proyecto: <strong className="text-gray-700">{nombreProyecto}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-gray-400">Estado:</span>
            <span className={`px-3 py-1 rounded-full ${badgeObj.cls}`}>{badgeObj.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Descripción</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {vistaDetalle.description || 'Analizar necesidades y comportamientos de los usuarios del sistema.'}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Responsable</p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {vistaDetalle.assignees?.[0]?.user?.name || 'Ana García'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Prioridad</p>
                  <p className="font-bold text-red-600 mt-0.5">
                    {vistaDetalle.priority === 'HIGH' ? 'Alta' : vistaDetalle.priority === 'LOW' ? 'Baja' : 'Media'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Fecha límite</p>
                  <p className="font-bold text-gray-800 mt-0.5">{formatearFecha(vistaDetalle.deadline)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Comentarios ({comentarios.length})
              </h3>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {comentarios.map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {c.author?.name ? c.author.name.slice(0, 2).toUpperCase() : 'AG'}
                    </div>
                    <div className="flex-1 bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{c.author?.name || 'Ana García'}</span>
                        <span className="text-[10px] text-gray-400">{formatearFecha(c.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 leading-normal">{c.content}</p>
                    </div>
                  </div>
                ))}

                {comentarios.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">No hay comentarios aún. Escribe el primero.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={nuevoComentario}
                  onChange={e => setNuevoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  onKeyDown={e => e.key === 'Enter' && handleEnviarComentario()}
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                />
                <button 
                  onClick={handleEnviarComentario}
                  className="p-3 bg-black text-white rounded-xl hover:bg-gray-900 transition flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Evidencias ({evidencias.length})
              </h3>

              <div className="space-y-2">
                {evidencias.map((e) => (
                  <a
                    key={e.id}
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{e.url}</span>
                    </div>
                    <Link size={12} className="text-gray-400 shrink-0" />
                  </a>
                ))}

                {evidencias.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Sin evidencias registradas.</p>
                )}
              </div>

              {mostrandoInputEvidencia ? (
                <div className="space-y-2 pt-2">
                  <input 
                    type="url"
                    value={nuevaEvidenciaUrl}
                    onChange={e => setNuevaEvidenciaUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setMostrandoInputEvidencia(false)}
                      className="px-3 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSubirEvidencia}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-black rounded-lg"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setMostrandoInputEvidencia(true)}
                  className="w-full py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1.5"
                >
                  <Paperclip size={13} /> Subir evidencia
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Información</h3>
              <div className="flex justify-between text-gray-500">
                <span>Proyecto</span>
                <span className="font-bold text-blue-600">{nombreProyecto}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Creada el</span>
                <span className="font-bold text-gray-800">10/05/2026 10:30 a.m.</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Creada por</span>
                <span className="font-bold text-gray-800">Juan Pérez</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TABLERO PRINCIPAL DE ACTIVIDADES ──────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Actividades</h1>
          <p className="text-xs text-gray-400 font-medium">Gestiona y supervisa las tareas del equipo</p>
        </div>
        <button 
          onClick={() => {
            setFormDraft({
              nombre: '',
              descripcion: '',
              fecha_limite: new Date().toISOString().split('T')[0],
              estado: 'PENDING',
              prioridad: 'HIGH',
              responsableId: '',
              projectId: proyectosDisponibles[0]?.id || ''
            });
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-900 transition"
        >
          <Plus size={15} /> Agregar actividad
        </button>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckSquare size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{counts.total}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Total</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{counts.pendientes}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Pendientes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{counts.enProceso}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">En Proceso</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{counts.enRevision}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">En Revisión</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{counts.completadas}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Completadas</p>
          </div>
        </div>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar actividad..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'Todos', label: 'Todos' },
            { key: 'PENDING', label: 'Pendiente' },
            { key: 'IN_PROCESS', label: 'En Proceso' },
            { key: 'IN_REVIEW', label: 'En Revisión' },
            { key: 'DONE', label: 'Completado' }
          ].map(f => (
            <button 
              key={f.key} 
              onClick={() => setFilterStatus(f.key)} 
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === f.key ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA Y DETALLE */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 w-full space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
              Cargando actividades...
            </div>
          ) : actividadesFiltradas.length > 0 ? (
            actividadesFiltradas.map((act) => {
              const badge = ESTADO_BADGES[act.status] || ESTADO_BADGES['PENDING'];
              const isSelected = actividadSeleccionada?.id === act.id;
              const nombreP = proyectosDisponibles.find(p => p.id === act.projectId)?.name || 'ClassBoard Equipo A';

              return (
                <div 
                  key={act.id} 
                  onClick={() => setActividadSeleccionada(act)}
                  className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between gap-4 ${
                    isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs truncate">{act.name}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Proyecto: <span className="text-gray-700 font-semibold">{nombreP}</span> • Fecha límite: {formatearFecha(act.deadline)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setVistaDetalle(act);
                      }}
                      className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                    >
                      Ver detalle
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEditar(act);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs font-semibold text-gray-600">No hay actividades registradas.</p>
            </div>
          )}
        </div>

        {actividadSeleccionada && (
          <div className="w-full lg:w-72 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0 space-y-4 lg:sticky lg:top-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DETALLE RÁPIDO</p>
              <h3 className="font-bold text-gray-900 text-sm">{actividadSeleccionada.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{actividadSeleccionada.description}</p>
            </div>

            <div className="space-y-2 border-t border-gray-50 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Proyecto</span>
                <span className="font-bold text-blue-600">
                  {proyectosDisponibles.find(p => p.id === actividadSeleccionada.projectId)?.name || 'ClassBoard Equipo A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prioridad</span>
                <span className="font-bold text-red-600">
                  {actividadSeleccionada.priority === 'HIGH' ? 'Alta' : 'Media'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha límite</span>
                <span className="font-bold text-gray-800">{formatearFecha(actividadSeleccionada.deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Responsable</span>
                <span className="font-bold text-gray-800">
                  {actividadSeleccionada.assignees?.[0]?.user?.name || 'Sin Asignar'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR ACTIVIDAD */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 relative">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Crear actividad</h3>
            <p className="text-xs text-gray-400">Completa los datos para la nueva actividad.</p>

            <form onSubmit={handleCrearActividad} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Proyecto Asignado *</label>
                <select 
                  required
                  value={formDraft.projectId}
                  onChange={e => setFormDraft({ ...formDraft, projectId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-gray-800"
                >
                  <option value="">-- Selecciona un Proyecto --</option>
                  {proyectosDisponibles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Título de la actividad *</label>
                <input 
                  type="text"
                  required
                  value={formDraft.nombre}
                  onChange={e => setFormDraft({ ...formDraft, nombre: e.target.value })}
                  placeholder="Ej. Investigar usuarios"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha límite *</label>
                  <input 
                    type="date"
                    required
                    value={formDraft.fecha_limite}
                    onChange={e => setFormDraft({ ...formDraft, fecha_limite: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado *</label>
                  <select 
                    value={formDraft.estado}
                    onChange={e => setFormDraft({ ...formDraft, estado: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROCESS">En Proceso</option>
                    <option value="IN_REVIEW">En Revisión</option>
                    <option value="DONE">Completado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción *</label>
                <textarea 
                  rows={3}
                  required
                  value={formDraft.descripcion}
                  onChange={e => setFormDraft({ ...formDraft, descripcion: e.target.value })}
                  placeholder="Describe el objetivo y alcance de la actividad."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Responsable *</label>
                  <select 
                    value={formDraft.responsableId}
                    onChange={e => setFormDraft({ ...formDraft, responsableId: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {usuariosDisponibles.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Prioridad *</label>
                  <div className="flex items-center gap-3 pt-2">
                    {[
                      { key: 'HIGH', label: 'Alta' },
                      { key: 'MED', label: 'Media' },
                      { key: 'LOW', label: 'Baja' }
                    ].map(p => (
                      <label key={p.key} className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="radio"
                          name="prio-crear"
                          checked={formDraft.prioridad === p.key}
                          onChange={() => setFormDraft({ ...formDraft, prioridad: p.key as any })}
                          className="accent-black"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-sm"
                >
                  Crear actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ACTIVIDAD */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 relative">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Editar Actividad</h3>
            <p className="text-xs text-gray-400">Modifica los datos de la actividad seleccionada.</p>

            <form onSubmit={handleEditarActividad} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Proyecto Asignado *</label>
                <select 
                  required
                  value={formDraft.projectId}
                  onChange={e => setFormDraft({ ...formDraft, projectId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-gray-800"
                >
                  <option value="">-- Selecciona un Proyecto --</option>
                  {proyectosDisponibles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Título de la actividad *</label>
                <input 
                  type="text"
                  required
                  value={formDraft.nombre}
                  onChange={e => setFormDraft({ ...formDraft, nombre: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha límite *</label>
                  <input 
                    type="date"
                    required
                    value={formDraft.fecha_limite}
                    onChange={e => setFormDraft({ ...formDraft, fecha_limite: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado *</label>
                  <select 
                    value={formDraft.estado}
                    onChange={e => setFormDraft({ ...formDraft, estado: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROCESS">En Proceso</option>
                    <option value="IN_REVIEW">En Revisión</option>
                    <option value="DONE">Completado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción *</label>
                <textarea 
                  rows={3}
                  required
                  value={formDraft.descripcion}
                  onChange={e => setFormDraft({ ...formDraft, descripcion: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Responsable *</label>
                  <select 
                    value={formDraft.responsableId}
                    onChange={e => setFormDraft({ ...formDraft, responsableId: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {usuariosDisponibles.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Prioridad *</label>
                  <div className="flex items-center gap-3 pt-2">
                    {[
                      { key: 'HIGH', label: 'Alta' },
                      { key: 'MED', label: 'Media' },
                      { key: 'LOW', label: 'Baja' }
                    ].map(p => (
                      <label key={p.key} className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="radio"
                          name="prio-editar"
                          checked={formDraft.prioridad === p.key}
                          onChange={() => setFormDraft({ ...formDraft, prioridad: p.key as any })}
                          className="accent-black"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-sm"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const EntregasPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
  </div>
);

export const CalendarioPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
  </div>
);

export const PerfilPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
  </div>
);