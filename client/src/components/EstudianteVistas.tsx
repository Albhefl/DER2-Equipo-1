import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Plus, Edit2, Clock, CheckCircle2, AlertCircle, 
  Eye, CheckSquare, ArrowLeft, Send, FileText, Paperclip, Folder, Circle, Trash2,
  X, CheckCircle, XCircle, Lock, Upload, Link as LinkIcon
} from 'lucide-react';

import { API_BASE_URL, SERVER_URL } from '../config/api';
import { obtenerMananaISO, validarFechaLimiteTarea, formatearFechaCorta } from '../utils/dateUtils';

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

function PriorityBadge({ priority }: { priority?: PrioridadActividad | string }) {
  const pStr = String(priority || '').toUpperCase();
  let label = 'Alta';
  let cls = 'bg-rose-50 text-rose-600';

  if (pStr === 'MED' || pStr === 'MEDIA' || pStr === 'Media') {
    label = 'Media';
    cls = 'bg-amber-50 text-amber-600';
  } else if (pStr === 'LOW' || pStr === 'BAJA' || pStr === 'Baja') {
    label = 'Baja';
    cls = 'bg-emerald-50 text-emerald-600';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function mapStatusToPrisma(s: string): EstadoActividad {
  const lower = String(s || '').toLowerCase();
  if (lower.includes('proceso') || lower === 'in_process') return 'IN_PROCESS';
  if (lower.includes('revisión') || lower.includes('revision') || lower === 'in_review') return 'IN_REVIEW';
  if (lower.includes('completado') || lower.includes('completada') || lower === 'done') return 'DONE';
  return 'PENDING';
}

function formatearFecha(f?: string) {
  if (!f) return '—';
  const d = new Date(f);
  return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function formatearFechaInput(f?: string) {
  if (!f) return '';
  const d = new Date(f);
  const anio = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaHora(f?: string) {
  if (!f) return 'No disponible';
  const d = new Date(f);
  const fecha = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${fecha} ${hora}`;
}

interface Miembro {
  id: string;
  name: string;
  email: string;
}

interface MiembroProyecto {
  id: string;
  user: Miembro;
}

interface ProyectoSimple {
  id: string;
  name: string;
  members?: MiembroProyecto[];
  endDate?: string | null;
}

interface Actividad {
  id: string;
  name: string;
  description: string | null;
  deadline: string;
  createdAt?: string;
  status: string;
  priority?: PrioridadActividad;
  projectId?: string | null;
  project?: ProyectoSimple | null;
  assignees: { user: Miembro }[];
  creator?: { id: string; name: string } | null;
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

type ToastTipo = 'success' | 'error';
interface ToastMsg {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

function ToastContainer({ toasts, onClose }: { toasts: ToastMsg[]; onClose: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={`flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-semibold animate-[fadeIn_0.2s_ease-out] ${
            t.tipo === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {t.tipo === 'success' ? (
            <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          )}
          <span className="flex-1 leading-relaxed">{t.mensaje}</span>
          <button
            onClick={() => onClose(t.id)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function abrirEvidenciaUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.open(`${SERVER_URL}/uploads/${url}`, '_blank', 'noopener,noreferrer');
  }
}

export const ActividadesPage: React.FC = () => {
  const [searchParams] = useSearchParams();

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
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fecha_limite?: string }>({});

  const fechaMinima = obtenerMananaISO();

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

  // Estados para el Modal de Evidencias
  const [evidenciaModalOpen, setEvidenciaModalOpen] = useState(false);
  const [evidenciaTab, setEvidenciaTab] = useState<'file' | 'link'>('file');
  const [evidenciaLinkError, setEvidenciaLinkError] = useState('');
  const [evidenciaSuccess, setEvidenciaSuccess] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    type: 'actividad' | 'comentario' | 'evidencia';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mostrarToast = (mensaje: string, tipo: ToastTipo = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, tipo, mensaje }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const cerrarToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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

        setActividadSeleccionada(prev => {
          if (!prev) return lista[0] ?? null;
          return lista.find(a => a.id === prev.id) ?? lista[0] ?? null;
        });

        setVistaDetalle(prev => {
          if (!prev) return prev;
          return lista.find(a => a.id === prev.id) ?? prev;
        });
      } else {
        mostrarToast('No se pudieron cargar las actividades.', 'error');
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      mostrarToast('Error de conexión al cargar actividades.', 'error');
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

      if (resU.ok) setUsuariosDisponibles((await resU.json()).usuarios || []);
      if (resP.ok) setProyectosDisponibles((await resP.json()).proyectos || []);
    } catch (err) {
      console.error('Error al cargar usuarios o proyectos:', err);
      mostrarToast('Error al cargar usuarios o proyectos.', 'error');
    }
  };

  useEffect(() => {
    fetchActividades();
    fetchUsuariosYProyectos();
  }, []);

  useEffect(() => {
    const idDesdeUrl = searchParams.get('id');
    if (idDesdeUrl && actividades.length > 0) {
      const encontrada = actividades.find(a => a.id === idDesdeUrl);
      if (encontrada) {
        setVistaDetalle(encontrada);
        setActividadSeleccionada(encontrada);
      }
    }
  }, [searchParams, actividades]);

  const projectIdDesdeUrl = searchParams.get('projectId');

  const nombreProyectoActual = projectIdDesdeUrl
    ? (proyectosDisponibles || []).find(p => p.id === projectIdDesdeUrl)?.name
    : null;

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
      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/comentarios`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setComentarios(data.comentarios || []))
        .catch(err => console.error('Error comentarios:', err));

      fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evaluacion`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setEvaluacion(data.evaluacion || null))
        .catch(err => console.error('Error evaluación:', err));

      fetchEvidenciasDeActividad(vistaDetalle.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaDetalle?.id]);

  const obtenerFechaFinProyectoActual = (): string | null => {
    const proyecto = (proyectosDisponibles || []).find(p => p.id === formDraft.projectId);
    return proyecto?.endDate || null;
  };

  const handleCambiarFechaLimite = (valor: string) => {
    setFormDraft(prev => ({ ...prev, fecha_limite: valor }));
    const resultado = validarFechaLimiteTarea(valor, obtenerFechaFinProyectoActual());
    setFieldErrors(prev => ({ ...prev, fecha_limite: resultado.mensaje || undefined }));
  };

  const handleCrearActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const resultadoFecha = validarFechaLimiteTarea(formDraft.fecha_limite, obtenerFechaFinProyectoActual());
    if (!resultadoFecha.valida) {
      setFieldErrors({ fecha_limite: resultadoFecha.mensaje || undefined });
      setModalError('Revisa los campos marcados en rojo antes de continuar.');
      return;
    }

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
        mostrarToast('Actividad creada correctamente.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        setModalError(err.message || 'Error al crear la actividad.');
      }
    } catch (err) {
      setModalError('Error de conexión al crear la actividad.');
    }
  };

  const handleEditarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOpen) return;
    setModalError(null);

    const resultadoFecha = validarFechaLimiteTarea(formDraft.fecha_limite, obtenerFechaFinProyectoActual());
    if (!resultadoFecha.valida) {
      setFieldErrors({ fecha_limite: resultadoFecha.mensaje || undefined });
      setModalError('Revisa los campos marcados en rojo antes de continuar.');
      return;
    }

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
        mostrarToast('Cambios guardados correctamente.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        setModalError(err.message || 'Error al actualizar actividad.');
      }
    } catch (err) {
      setModalError('Error de conexión al actualizar.');
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
      } else {
        mostrarToast('No se pudo enviar el comentario.', 'error');
      }
    } catch (err) {
      console.error('Error al comentar:', err);
      mostrarToast('Error de conexión al enviar el comentario.', 'error');
    }
  };

  const handleEliminarComentario = (comentarioId: string) => {
    setConfirmState({
      type: 'comentario',
      id: comentarioId,
      title: 'Eliminar comentario',
      message: '¿Deseas eliminar este comentario? Esta acción no se puede deshacer.'
    });
  };

  // Subida de evidencias por Enlace
  const handleSubirEvidenciaLink = async () => {
    setEvidenciaLinkError('');
    const url = nuevaEvidenciaUrl.trim();
    
    if (!url) {
      setEvidenciaLinkError('El enlace no puede estar vacío.');
      return;
    }

    // Validar estructura de URL válida (debe empezar con http:// o https://)
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
      setEvidenciaLinkError('Ingresa un enlace válido (ejemplo: https://drive.google.com/...)');
      return;
    }

    if (!vistaDetalle) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${vistaDetalle.id}/evidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url })
      });

      if (res.ok) {
        await fetchEvidenciasDeActividad(vistaDetalle.id);
        setNuevaEvidenciaUrl('');
        setEvidenciaSuccess('¡Enlace guardado correctamente!');
        setTimeout(() => {
          setEvidenciaModalOpen(false);
          setEvidenciaSuccess('');
        }, 1500);
      } else {
        setEvidenciaLinkError('No se pudo guardar el enlace.');
      }
    } catch (err) {
      console.error('Error al subir evidencia:', err);
      setEvidenciaLinkError('Error de conexión al guardar enlace.');
    }
  };

  // Subida de evidencias por Archivo Local
  const handleSubirArchivoEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vistaDetalle) return;

    setSubiendoArchivo(true);
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
        setEvidenciaSuccess('¡Archivo subido correctamente!');
        setTimeout(() => {
          setEvidenciaModalOpen(false);
          setEvidenciaSuccess('');
        }, 1500);
      } else {
        mostrarToast('Error al subir el archivo.', 'error');
      }
    } catch (err) {
      console.error('Error al subir archivo:', err);
      mostrarToast('Error de conexión al subir el archivo.', 'error');
    } finally {
      setSubiendoArchivo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleEliminarEvidencia = (evidenciaId: string) => {
    setConfirmState({
      type: 'evidencia',
      id: evidenciaId,
      title: 'Eliminar evidencia',
      message: '¿Eliminar esta evidencia? Esta acción no se puede deshacer.'
    });
  };

  const handleEliminarActividad = (actividadId: string) => {
    setConfirmState({
      type: 'actividad',
      id: actividadId,
      title: 'Eliminar actividad',
      message: '¿Eliminar esta actividad? Esta acción no se puede deshacer.'
    });
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmState) return;
    const { type, id } = confirmState;
    setConfirmState(null);

    const token = localStorage.getItem('token');

    if (type === 'actividad') {
      try {
        const res = await fetch(`${API_ACTIVIDADES_URL}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setActividades(prev => prev.filter(a => a.id !== id));
          if (actividadSeleccionada?.id === id) setActividadSeleccionada(null);
          if (vistaDetalle?.id === id) setVistaDetalle(null);
          mostrarToast('Actividad eliminada.', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          mostrarToast(err.message || 'Error al eliminar la actividad.', 'error');
        }
      } catch (err) {
        console.error('Error al eliminar actividad:', err);
        mostrarToast('Error de conexión al eliminar.', 'error');
      }
      return;
    }

    if (type === 'comentario') {
      try {
        const res = await fetch(`${API_ACTIVIDADES_URL}/comentarios/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setComentarios(prev => prev.filter(c => c.id !== id));
          mostrarToast('Comentario eliminado.', 'success');
        } else {
          mostrarToast('No se pudo eliminar el comentario.', 'error');
        }
      } catch (err) {
        console.error('Error al eliminar comentario:', err);
        mostrarToast('Error de conexión al eliminar el comentario.', 'error');
      }
      return;
    }

    if (type === 'evidencia') {
      try {
        const res = await fetch(`${API_ACTIVIDADES_URL}/evidencias/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setEvidencias(prev => prev.filter(item => item.id !== id));
          mostrarToast('Evidencia eliminada.', 'success');
        } else {
          mostrarToast('No se pudo eliminar la evidencia.', 'error');
        }
      } catch (err) {
        console.error('Error al eliminar evidencia:', err);
        mostrarToast('Error de conexión al eliminar la evidencia.', 'error');
      }
      return;
    }
  };

  const renderConfirmModal = () => {
    if (!confirmState) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-70 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 size={18} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-sm font-bold text-gray-900">{confirmState.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">{confirmState.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setConfirmState(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              onClick={ejecutarConfirmacion}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-red-700 transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const abrirEditar = (act: Actividad) => {
    setModalError(null);
    setFieldErrors({});
    setEditModalOpen(act);
    setFormDraft({
      nombre: act.name,
      descripcion: act.description || '',
      fecha_limite: formatearFechaInput(act.deadline),
      estado: mapStatusToPrisma(act.status),
      prioridad: act.priority || 'HIGH',
      responsableId: act.assignees?.[0]?.user?.id || '',
      projectId: projectIdDesdeUrl || act.projectId || ''
    });
  };

  const renderStatusIcon = (statusStr: string) => {
    const prismaStatus = mapStatusToPrisma(statusStr);
    switch (prismaStatus) {
      case 'PENDING': return <Circle size={18} className="text-gray-300" />;
      case 'IN_PROCESS': return <AlertCircle size={18} className="text-blue-500" />;
      case 'IN_REVIEW': return <Clock size={18} className="text-amber-500" />;
      case 'DONE': return <CheckCircle2 size={18} className="text-emerald-500" />;
    }
  };

  const actividadesFiltradas = (actividades || []).filter(a => {
    const estadoPrisma = mapStatusToPrisma(a.status);
    const coincideEstado = filterStatus === 'Todos' || 
      (filterStatus === 'PENDING' && estadoPrisma === 'PENDING') ||
      (filterStatus === 'IN_PROCESS' && estadoPrisma === 'IN_PROCESS') ||
      (filterStatus === 'IN_REVIEW' && estadoPrisma === 'IN_REVIEW') ||
      (filterStatus === 'DONE' && estadoPrisma === 'DONE');
    
    const coincideBusqueda = (a.name || '').toLowerCase().includes(search.toLowerCase());
    const coincideProyecto = !projectIdDesdeUrl || a.projectId === projectIdDesdeUrl;

    return coincideEstado && coincideBusqueda && coincideProyecto;
  });

  const counts = {
    total: actividades.length,
    pendientes: actividades.filter(a => mapStatusToPrisma(a.status) === 'PENDING').length,
    enProceso: actividades.filter(a => mapStatusToPrisma(a.status) === 'IN_PROCESS').length,
    enRevision: actividades.filter(a => mapStatusToPrisma(a.status) === 'IN_REVIEW').length,
    completadas: actividades.filter(a => mapStatusToPrisma(a.status) === 'DONE').length,
  };

  const proyectoSeleccionadoEnModal = (proyectosDisponibles || []).find(p => p.id === formDraft.projectId);
  const usuariosFiltradosModal = proyectoSeleccionadoEnModal?.members
    ? proyectoSeleccionadoEnModal.members.map(m => m.user).filter(Boolean)
    : (usuariosDisponibles || []);

  const renderCampoProyecto = () => {
    if (projectIdDesdeUrl) {
      return (
        <div>
          <label className="block font-bold text-gray-700 mb-1">Proyecto Asignado *</label>
          <div className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl font-semibold text-gray-700 flex items-center justify-between gap-2">
            <span className="truncate">{nombreProyectoActual || 'Proyecto actual'}</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-normal shrink-0">
              <Lock size={11} /> Fijo a este proyecto
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Estás creando actividades dentro de este proyecto, por eso no se puede cambiar aquí.
          </p>
        </div>
      );
    }

    return (
      <div>
        <label className="block font-bold text-gray-700 mb-1">Proyecto Asignado *</label>
        <select 
          required
          value={formDraft.projectId}
          onChange={e => setFormDraft({ ...formDraft, projectId: e.target.value, responsableId: '' })}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-gray-800"
        >
          <option value="">-- Selecciona un Proyecto --</option>
          {(proyectosDisponibles || []).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    );
  };

  if (vistaDetalle) {
    const badgeObj = ESTADO_BADGES[vistaDetalle.status] || ESTADO_BADGES['PENDING'];
    const nombreProyecto = (proyectosDisponibles || []).find(p => p.id === vistaDetalle.projectId)?.name || 'Sin proyecto asignado';
    const comentariosVisibles = (comentarios || []).filter(c => !c.content?.startsWith('__EVALUACION_JSON__:'));

    return (
      <div className="p-4 sm:p-6 space-y-6 w-full font-sans antialiased text-gray-900 box-border">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleSubirArchivoEvidencia} 
          accept=".pdf,.docx,.doc,.png,.jpg,.zip" 
          className="hidden" 
        />
        {renderConfirmModal()}
        <ToastContainer toasts={toasts} onClose={cerrarToast} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <button onClick={() => setVistaDetalle(null)} className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer shrink-0" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">{vistaDetalle.name}</h1>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                <Folder size={12} className="text-blue-500 shrink-0" />
                <span className="truncate">Proyecto: <strong className="text-gray-700">{nombreProyecto}</strong></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeObj.cls}`}>{badgeObj.label}</span>
            <button
              onClick={() => handleEliminarActividad(vistaDetalle.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition cursor-pointer"
              title="Eliminar actividad"
              aria-label="Eliminar actividad"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Descripción</h3>
              <p className="text-xs text-gray-600 leading-relaxed wrap-break-word">
                {vistaDetalle.description || 'Sin descripción registrada.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Responsable</p>
                  <p className="font-bold text-gray-800 mt-0.5 truncate">{vistaDetalle.assignees?.[0]?.user?.name || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Prioridad</p>
                  <div className="mt-0.5"><PriorityBadge priority={vistaDetalle.priority} /></div>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Fecha límite</p>
                  <p className="font-bold text-gray-800 mt-0.5">{formatearFecha(vistaDetalle.deadline)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Comentarios ({comentariosVisibles.length})</h3>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {comentariosVisibles.map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {c.author?.name ? c.author.name.slice(0, 2).toUpperCase() : '—'}
                    </div>
                    <div className="flex-1 bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-gray-800 truncate">{c.author?.name || 'Usuario'}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-400">{formatearFecha(c.createdAt)}</span>
                          {String(c.author?.id) === String(currentUserId) && (
                            <button onClick={() => handleEliminarComentario(c.id)} className="text-gray-400 hover:text-red-600 transition p-0.5 cursor-pointer" aria-label="Eliminar comentario">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 leading-normal wrap-break-word">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comentariosVisibles.length === 0 && <p className="text-xs text-gray-400 italic py-2">No hay comentarios aún. Escribe el primero.</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={nuevoComentario}
                  onChange={e => setNuevoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  onKeyDown={e => e.key === 'Enter' && handleEnviarComentario()}
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white min-w-0"
                />
                <button onClick={handleEnviarComentario} className="p-3 bg-black text-white rounded-xl hover:bg-gray-900 transition flex items-center justify-center cursor-pointer shrink-0" aria-label="Enviar comentario">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Tarjeta de Evidencias */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                EVIDENCIAS ({(evidencias || []).length})
              </h3>

              <div className="space-y-2">
                {(evidencias || []).map((e) => (
                  <div 
                    key={e.id} 
                    className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700 gap-2"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      {e.url.startsWith('http') ? (
                        <LinkIcon size={14} className="text-blue-500 shrink-0" />
                      ) : (
                        <FileText size={14} className="text-gray-500 shrink-0" />
                      )}
                      <button 
                        type="button" 
                        onClick={() => abrirEvidenciaUrl(e.url)} 
                        className="truncate font-bold text-gray-800 hover:underline text-left cursor-pointer"
                      >
                        {e.url}
                      </button>
                    </div>
                    <button 
                      onClick={() => handleEliminarEvidencia(e.id)} 
                      className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer shrink-0" 
                      aria-label="Eliminar evidencia"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {(evidencias || []).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Sin evidencias registradas.</p>
                )}
              </div>

              {/* Botón desencadenante del modal */}
              <button 
                onClick={() => {
                  setNuevaEvidenciaUrl('');
                  setEvidenciaLinkError('');
                  setEvidenciaSuccess('');
                  setEvidenciaTab('file');
                  setEvidenciaModalOpen(true);
                }}
                className="w-full py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Paperclip size={13} /> Adjuntar archivo o enlace
              </button>
            </div>

            {evaluacion && (
              <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Evaluación</h3>
                  <span className="text-blue-700 font-extrabold text-sm">{evaluacion.score} / 10</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-blue-100">
                  {(evaluacion.criteria || []).map((crit) => (
                    <div key={crit.id} className="flex justify-between text-gray-600">
                      <span>{crit.nombre}</span>
                      <span className="font-bold">{crit.score}/5</span>
                    </div>
                  ))}
                </div>
                {evaluacion.comentario && <p className="text-gray-600 pt-2 border-t border-blue-100 leading-relaxed">{evaluacion.comentario}</p>}
                {evaluacion.evaluator?.name && <p className="text-[10px] text-gray-400 pt-1">Evaluado por {evaluacion.evaluator.name}</p>}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Información</h3>
              <div className="flex justify-between text-gray-500">
                <span>Proyecto</span>
                <span className="font-bold text-blue-600">{nombreProyecto}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Creada el</span>
                <span className="font-bold text-gray-800">{formatearFechaHora(vistaDetalle.createdAt)}</span>
              </div>
              {/*<div className="flex justify-between text-gray-500">
                /*<span>Creada por</span>
                <span className="font-bold text-gray-800">{vistaDetalle.creator?.name || 'No disponible'}</span>
              </div>*/}
            </div>
          </div>
        </div>

        {/* Modal para Subir Evidencias */}
        {evidenciaModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 relative">
              <h3 className="text-sm font-bold text-gray-900 uppercase">ADJUNTAR EVIDENCIA</h3>
              <p className="text-xs text-gray-400">Selecciona el tipo de entrega que deseas registrar.</p>

              {/* Control de Pestañas (Tabs) */}
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => { setEvidenciaTab('file'); setEvidenciaSuccess(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    evidenciaTab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Archivo local (PDF/DOCX)
                </button>
                <button
                  type="button"
                  onClick={() => { setEvidenciaTab('link'); setEvidenciaSuccess(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    evidenciaTab === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Enlace Web
                </button>
              </div>

              {/* Contenido según pestaña activa */}
              {evidenciaSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700">{evidenciaSuccess}</p>
                </div>
              ) : (
                <>
                  {evidenciaTab === 'file' && (
                    <div className="space-y-3 py-2 text-center">
                      <div 
                        onClick={() => !subiendoArchivo && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-gray-400 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center gap-2 bg-gray-50/50"
                      >
                        <Upload size={24} className="text-gray-400" />
                        <p className="text-xs font-bold text-gray-700">
                          {subiendoArchivo ? 'Subiendo archivo...' : 'Haz clic aquí para examinar tus archivos'}
                        </p>
                        <p className="text-[10px] text-gray-400">Formatos soportados: PDF, DOCX, PNG, ZIP</p>
                      </div>
                    </div>
                  )}

                  {evidenciaTab === 'link' && (
                    <div className="space-y-3 py-2">
                      <label className="block text-xs font-bold text-gray-700">Enlace URL *</label>
                      <input 
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={nuevaEvidenciaUrl}
                        onChange={e => {
                          setNuevaEvidenciaUrl(e.target.value);
                          setEvidenciaLinkError('');
                        }}
                        className={`w-full p-2.5 bg-gray-50 border ${
                          evidenciaLinkError ? 'border-red-500' : 'border-gray-200'
                        } rounded-xl text-xs font-medium focus:outline-none focus:bg-white`}
                      />
                      {evidenciaLinkError && (
                        <p className="text-red-500 text-xs font-semibold">{evidenciaLinkError}</p>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleSubirEvidenciaLink}
                        className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition mt-2 cursor-pointer"
                      >
                        Guardar enlace
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Cierre del Modal */}
              {!evidenciaSuccess && (
                <div className="flex justify-end pt-2 border-t border-gray-50">
                  <button 
                    type="button"
                    onClick={() => setEvidenciaModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 w-full font-sans antialiased text-gray-900 box-border relative">
      {renderConfirmModal()}
      <ToastContainer toasts={toasts} onClose={cerrarToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">Actividades</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
            {nombreProyectoActual ? `Proyecto: ${nombreProyectoActual}` : 'Todas las actividades'}
          </p>
        </div>
        <button 
          onClick={() => {
            setModalError(null);
            setFieldErrors({});
            const primerProyectoId = (proyectosDisponibles && proyectosDisponibles.length > 0) ? proyectosDisponibles[0].id : '';
            const initialProjectId = projectIdDesdeUrl || primerProyectoId;
            setFormDraft({
              nombre: '',
              descripcion: '',
              fecha_limite: fechaMinima,
              estado: 'PENDING',
              prioridad: 'HIGH',
              responsableId: '',
              projectId: initialProjectId
            });
            setCreateModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-900 transition cursor-pointer shrink-0"
        >
          <Plus size={15} /> Agregar actividad
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><CheckSquare size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{counts.total}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0"><Clock size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{counts.pendientes}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><AlertCircle size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{counts.enProceso}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">En proceso</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Eye size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{counts.enRevision}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">En revisión</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-xs min-w-0 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{counts.completadas}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">Completadas</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar actividad..." 
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-300 transition" 
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
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
                  className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between gap-4 ${
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
                      {act.projectId && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 bg-white border border-gray-200 shadow-sm text-gray-800 rounded-lg text-[11px] font-bold">
                            {proyectosDisponibles.find(p => p.id === act.projectId)?.name || 'ClassBoard Equipo A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setVistaDetalle(act);
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Ver detalle
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEditar(act);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-xs font-bold px-1 transition cursor-pointer"
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarActividad(act.id);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-red-600 text-xs font-bold px-1 transition cursor-pointer"
                      title="Eliminar actividad"
                      aria-label="Eliminar actividad"
                    >
                      <Trash2 size={13} />
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
          <div className="w-full lg:w-72 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0 space-y-4 lg:sticky lg:top-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DETALLE RÁPIDO</p>
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{actividadSeleccionada.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {actividadSeleccionada.description || 'Sin descripción registrada.'}
              </p>
            </div>

            <div className="space-y-2 border-t border-gray-50 pt-3">
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
                <span className="font-bold text-gray-800">{formatearFecha(actividadSeleccionada.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Responsable</span>
                <span className="font-bold text-gray-800">
                  {actividadSeleccionada.assignees?.[0]?.user?.name || 'Sin asignar'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Actividad */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Crear actividad</h3>
            <p className="text-xs text-gray-400">Completa los datos para la nueva actividad.</p>
            {modalError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {modalError}
              </p>
            )}

            <form onSubmit={handleCrearActividad} className="space-y-4 text-xs">
              {renderCampoProyecto()}

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
                    min={fechaMinima}
                    max={obtenerFechaFinProyectoActual() || undefined}
                    value={formDraft.fecha_limite}
                    onChange={e => handleCambiarFechaLimite(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl focus:outline-none ${
                      fieldErrors.fecha_limite ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                  {fieldErrors.fecha_limite && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 leading-snug">{fieldErrors.fecha_limite}</p>
                  )}
                  {!fieldErrors.fecha_limite && obtenerFechaFinProyectoActual() && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Este proyecto cierra el {formatearFechaCorta(obtenerFechaFinProyectoActual())}; la fecha límite no puede ser posterior.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado *</label>
                  <select 
                    value={formDraft.estado}
                    onChange={e => setFormDraft({ ...formDraft, estado: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
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
                    {(usuariosFiltradosModal || []).map(u => (
                      <option key={u?.id} value={u?.id}>{u?.name}</option>
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
                  disabled={!!fieldErrors.fecha_limite}
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Crear actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Actividad */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Editar Actividad</h3>
            <p className="text-xs text-gray-400">Modifica los datos de la actividad seleccionada.</p>
            {modalError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {modalError}
              </p>
            )}

            <form onSubmit={handleEditarActividad} className="space-y-4 text-xs">
              {renderCampoProyecto()}

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
                    min={fechaMinima}
                    max={obtenerFechaFinProyectoActual() || undefined}
                    value={formDraft.fecha_limite}
                    onChange={e => handleCambiarFechaLimite(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl focus:outline-none ${
                      fieldErrors.fecha_limite ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                  {fieldErrors.fecha_limite && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 leading-snug">{fieldErrors.fecha_limite}</p>
                  )}
                  {!fieldErrors.fecha_limite && obtenerFechaFinProyectoActual() && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Este proyecto cierra el {formatearFechaCorta(obtenerFechaFinProyectoActual())}; la fecha límite no puede ser posterior.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado *</label>
                  <select 
                    value={formDraft.estado}
                    onChange={e => setFormDraft({ ...formDraft, estado: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-black font-semibold text-gray-900 cursor-pointer"
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
                    {(usuariosFiltradosModal || []).map(u => (
                      <option key={u?.id} value={u?.id}>{u?.name}</option>
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
                  disabled={!!fieldErrors.fecha_limite}
                  className="px-5 py-2 bg-black text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

export default ActividadesPage;