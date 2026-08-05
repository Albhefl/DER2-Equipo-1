import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Edit2, Clock, CheckCircle2, AlertCircle, 
  Eye, CheckSquare, ArrowLeft, Send, FileText, Paperclip, Folder, Circle, Upload, Trash2
} from 'lucide-react';

import { API_BASE_URL, SERVER_URL } from '../config/apis';

const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios`;

type EstadoActividad = 'PENDING' | 'IN_PROCESS' | 'IN_REVIEW' | 'DONE';
type PrioridadActividad = 'HIGH' | 'MED' | 'LOW';

const ESTADO_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendiente', cls: 'bg-gray-50 text-gray-600 font-medium' },
  IN_PROCESS: { label: 'En proceso', cls: 'bg-blue-50 text-blue-600 font-medium' },
  IN_REVIEW: { label: 'En revisión', cls: 'bg-amber-50 text-amber-600 font-medium' },
  DONE: { label: 'Completado', cls: 'bg-green-50 text-green-600 font-medium' },
  Pendiente: { label: 'Pendiente', cls: 'bg-gray-50 text-gray-600 font-medium' },
  'En Proceso': { label: 'En proceso', cls: 'bg-blue-50 text-blue-600 font-medium' },
  'En Revisión': { label: 'En revisión', cls: 'bg-amber-50 text-amber-600 font-medium' },
  Completado: { label: 'Completado', cls: 'bg-green-50 text-green-600 font-medium' },
};

// 🟢 Componente de Prioridad estilo píldora pastel idéntico a Figma
function PriorityBadge({ priority }: { priority?: PrioridadActividad | string }) {
  let label = 'Alta';
  let cls = 'bg-rose-50 text-rose-600'; // Rojo pastel para Alta

  if (priority === 'MED' || priority === 'Media') {
    label = 'Media';
    cls = 'bg-amber-50 text-amber-600'; // Ámbar/Amarillo pastel para Media
  } else if (priority === 'LOW' || priority === 'Baja') {
    label = 'Baja';
    cls = 'bg-emerald-50 text-emerald-600'; // Verde pastel para Baja
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function mapStatusToPrisma(s: string): EstadoActividad {
  if (s === 'En Proceso' || s === 'IN_PROCESS' || s === 'En proceso') return 'IN_PROCESS';
  if (s === 'En Revisión' || s === 'IN_REVIEW' || s === 'En revisión') return 'IN_REVIEW';
  if (s === 'Completado' || s === 'DONE' || s === 'Completada') return 'DONE';
  return 'PENDING';
}

function formatearFecha(f?: string) {
  if (!f) return '23/05/2025';
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
  createdAt?: string;
  creator?: { id: string; name: string };
}

interface EvaluacionData {
  score: number;
  criteria: { id: string; nombre: string; score: number }[];
  comentario: string | null;
  evaluator?: { id: string; name: string };
  createdAt?: string;
}

function abrirEvidenciaUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank');
  } else {
    window.open(`${SERVER_URL}/uploads/${url}`, '_blank');
  }
}

export const ActividadesPage: React.FC = () => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Miembro[]>([]);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<ProyectoSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);

  const [vistaDetalle, setVistaDetalle] = useState<Actividad | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState<Actividad | null>(null);

  const [formDraft, setFormDraft] = useState({
    nombre: '',
    descripcion: '',
    fecha_limite: '',
    estado: 'PENDING',
    prioridad: 'HIGH' as PrioridadActividad,
    responsableId: '',
    projectId: ''
  });

  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [evaluacion, setEvaluacion] = useState<EvaluacionData | null>(null);
  const [nuevaEvidenciaUrl, setNuevaEvidenciaUrl] = useState('');
  const [mostrandoInputEvidencia, setMostrandoInputEvidencia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.userId || '';
    } catch {
      return '';
    }
  };

  const currentUserId = getUserIdFromToken();

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
        fetch(`${API_BASE_URL}/actividades/proyectos`, { headers: { Authorization: `Bearer ${token}` } })
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

  const fetchEvidenciasDeActividad = async (actividadId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${actividadId}/evidencias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const listaEv = (data.evidencias || [])
        .filter((e: any) => e && e.url && !String(e.url).includes('undefined'))
        .map((e: any) => ({ id: String(e.id), url: e.url }));
      setEvidencias(listaEv);
    } catch (err) {
      console.error('Error evidencias:', err);
    }
  };

  useEffect(() => {
    if (vistaDetalle) {
      const token = localStorage.getItem('token');

      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/comentarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setComentarios(data.comentarios || []))
        .catch(err => console.error('Error comentarios:', err));

      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evaluacion`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setEvaluacion(data.evaluacion || null))
        .catch(err => console.error('Error evaluación:', err));

      fetchEvidenciasDeActividad(vistaDetalle.id);
    }
  }, [vistaDetalle]);

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

  const handleEliminarComentario = async (comentarioId: string) => {
    if (!confirm('¿Deseas eliminar este comentario?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/comentarios/${comentarioId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId));
      } else {
        alert('No se pudo eliminar el comentario.');
      }
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
    }
  };

  const handleSubirEvidenciaLink = async () => {
    if (!nuevaEvidenciaUrl.trim() || !vistaDetalle) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: nuevaEvidenciaUrl.trim() })
      });
      if (res.ok) {
        await fetchEvidenciasDeActividad(vistaDetalle.id);
        setNuevaEvidenciaUrl('');
        setMostrandoInputEvidencia(false);
      }
    } catch (err) {
      console.error('Error al subir evidencia:', err);
    }
  };

  const handleSubirArchivoEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vistaDetalle) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evidencias/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        await fetchEvidenciasDeActividad(vistaDetalle.id);
      } else {
        alert('Error al subir el archivo.');
      }
    } catch (err) {
      console.error('Error al subir archivo:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleEliminarEvidencia = async (evidenciaId: string) => {
    if (!confirm('¿Eliminar evidencia?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ACTIVIDADES_URL}/evidencias/${evidenciaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvidencias(prev => prev.filter(item => item.id !== evidenciaId));
    } catch (err) {
      console.error('Error al eliminar evidencia:', err);
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

  const renderStatusIcon = (statusStr: string) => {
    const prismaStatus = mapStatusToPrisma(statusStr);
    switch (prismaStatus) {
      case 'PENDING':
        return <Circle size={18} className="text-gray-300" />;
      case 'IN_PROCESS':
        return <AlertCircle size={18} className="text-blue-500" />;
      case 'IN_REVIEW':
        return <Clock size={18} className="text-amber-500" />;
      case 'DONE':
        return <CheckCircle2 size={18} className="text-emerald-500" />;
    }
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

  // 🟢 VISTA DE DETALLE IDÉNTICA A FIGMA
  if (vistaDetalle) {
    const badgeObj = ESTADO_BADGES[vistaDetalle.status] || ESTADO_BADGES['PENDING'];
    const nombreProyecto = proyectosDisponibles.find(p => p.id === vistaDetalle.projectId)?.name || 'ClassBoard Equipo A';
    const comentariosVisibles = comentarios.filter(c => !c.content.startsWith('__EVALUACION_JSON__:'));

    return (
      <div className="p-6 space-y-6 w-full font-sans antialiased text-gray-900 box-border">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleSubirArchivoEvidencia}
          accept=".pdf,.docx,.doc,.png,.jpg,.zip"
          className="hidden"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setVistaDetalle(null)} className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer">
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
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-gray-400 font-medium">Estado:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeObj.cls}`}>{badgeObj.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Descripción</h3>
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
                  <div className="mt-0.5">
                    <PriorityBadge priority={vistaDetalle.priority} />
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Fecha límite</p>
                  <p className="font-bold text-gray-800 mt-0.5">{formatearFecha(vistaDetalle.deadline)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Comentarios ({comentariosVisibles.length})
              </h3>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {comentariosVisibles.map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {c.author?.name ? c.author.name.slice(0, 2).toUpperCase() : 'AG'}
                    </div>
                    <div className="flex-1 bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{c.author?.name || 'Ana García'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{formatearFecha(c.createdAt)}</span>
                          {String(c.author?.id) === String(currentUserId) && (
                            <button
                              onClick={() => handleEliminarComentario(c.id)}
                              className="text-gray-400 hover:text-red-600 transition p-0.5 cursor-pointer"
                              title="Eliminar comentario"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 leading-normal">{c.content}</p>
                    </div>
                  </div>
                ))}

                {comentariosVisibles.length === 0 && (
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
                  className="p-3 bg-black text-white rounded-xl hover:bg-gray-900 transition flex items-center justify-center cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Evidencias ({evidencias.length})
              </h3>

              <div className="space-y-2">
                {evidencias.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText size={14} className="text-gray-500 shrink-0" />
                      <button
                        type="button"
                        onClick={() => abrirEvidenciaUrl(e.url)}
                        className="truncate font-bold text-gray-800 hover:underline text-left cursor-pointer"
                        title={e.url}
                      >
                        {e.url}
                      </button>
                    </div>
                    <button
                      onClick={() => handleEliminarEvidencia(e.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer shrink-0"
                      title="Eliminar evidencia"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {evidencias.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Sin evidencias registradas.</p>
                )}
              </div>

              {mostrandoInputEvidencia ? (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={nuevaEvidenciaUrl}
                      onChange={e => setNuevaEvidenciaUrl(e.target.value)}
                      placeholder="Pega un enlace (https://...)"
                      className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Upload size={13} /> Archivo
                    </button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setMostrandoInputEvidencia(false)}
                      className="px-3 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSubirEvidenciaLink}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-black rounded-lg cursor-pointer"
                    >
                      Guardar enlace
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setMostrandoInputEvidencia(true)}
                  className="w-full py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Paperclip size={13} /> Subir evidencia
                </button>
              )}
            </div>

            {evaluacion && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Evaluación</h3>
                  <span className="text-blue-600 font-extrabold text-sm">{evaluacion.score} / 10</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  {evaluacion.criteria?.map((crit) => (
                    <div key={crit.id} className="flex justify-between text-gray-600">
                      <span>{crit.nombre}</span>
                      <span className="font-bold text-gray-800">{crit.score}/5</span>
                    </div>
                  ))}
                </div>

                {evaluacion.comentario && (
                  <p className="text-gray-600 pt-2 border-t border-gray-50 leading-relaxed">
                    {evaluacion.comentario}
                  </p>
                )}

                {evaluacion.evaluator?.name && (
                  <p className="text-[10px] text-gray-400 pt-1">
                    Evaluado por {evaluacion.evaluator.name}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Información</h3>
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

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Checklist</h3>
              <div className="space-y-2">
                {['Definir segmentos de usuarios', 'Diseñar encuesta', 'Aplicar entrevistas', 'Analizar resultados'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <CheckSquare size={14} className="text-gray-800 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 w-full font-sans antialiased text-gray-900 box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Actividades</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
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
          className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-gray-900 transition cursor-pointer"
        >
          <Plus size={15} /> Agregar actividad
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckSquare size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{counts.total}</p>
            <p className="text-xs text-gray-400 font-medium">Total de actividades</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{counts.pendientes}</p>
            <p className="text-xs text-gray-400 font-medium">Pendientes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{counts.enProceso}</p>
            <p className="text-xs text-gray-400 font-medium">En proceso</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Eye size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{counts.enRevision}</p>
            <p className="text-xs text-gray-400 font-medium">En revisión</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{counts.completadas}</p>
            <p className="text-xs text-gray-400 font-medium">Completadas</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar actividad..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-300 transition" 
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === f.key ? 'bg-black text-white' : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        <div className="flex-1 w-full space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
              Cargando actividades...
            </div>
          ) : actividadesFiltradas.length > 0 ? (
            actividadesFiltradas.map((act) => {
              const badge = ESTADO_BADGES[act.status] || ESTADO_BADGES['PENDING'];
              const isSelected = actividadSeleccionada?.id === act.id;

              return (
                <div 
                  key={act.id} 
                  onClick={() => setActividadSeleccionada(act)}
                  className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-xs flex items-center justify-between gap-4 ${
                    isSelected ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="shrink-0">
                      {renderStatusIcon(act.status)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{act.name}</h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Fecha límite: {formatearFecha(act.deadline)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setVistaDetalle(act);
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Ver detalle
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEditar(act);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-xs font-bold px-1.5 transition cursor-pointer"
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
              No hay actividades registradas.
            </div>
          )}
        </div>

        {actividadSeleccionada && (
          <div className="w-full lg:w-80 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs shrink-0 space-y-5 lg:sticky lg:top-6 text-xs">
            <div>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">DETALLE RÁPIDO</p>
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{actividadSeleccionada.name}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {actividadSeleccionada.description || 'Analizar necesidades y comportamientos de los usuarios del sistema.'}
              </p>
            </div>

            <div className="space-y-3 border-t border-gray-50 pt-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Prioridad</span>
                <PriorityBadge priority={actividadSeleccionada.priority} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Fecha límite</span>
                <span className="font-bold text-gray-800">{formatearFecha(actividadSeleccionada.deadline)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Fecha de inicio</span>
                <span className="font-bold text-gray-800">10/05/2025</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Responsable</span>
                <span className="font-bold text-gray-800">
                  {actividadSeleccionada.assignees?.[0]?.user?.name || 'Ana García'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-2.5">
              <p className="text-xs font-bold text-gray-900">Checklist</p>
              <div className="space-y-2">
                {['Definir segmentos de usuarios', 'Diseñar encuesta', 'Aplicar entrevistas', 'Analizar resultados'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <CheckSquare size={14} className="text-gray-800 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Crear actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-xs cursor-pointer"
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