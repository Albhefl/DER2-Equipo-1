import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FolderOpen, Edit2, ArrowLeft,
  CheckCircle2, AlertCircle, Eye, CheckSquare, Trash2, X 
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { obtenerHoyISO, obtenerMananaISO, validarFechaFinProyecto } from '../utils/dateUtils';

function Badge({ label }: { label: string }) {
  let cls = 'bg-[#f4f5f8] text-[#6b7280]';
  if (label === 'Activo') cls = 'bg-[#d1fae5] text-[#047857]';
  if (label === 'En proceso') cls = 'bg-[#dbeafe] text-[#1d4ed8]';
  if (label === 'En revisión') cls = 'bg-[#fef3c7] text-[#b45309]';
  if (label === 'Completado') cls = 'bg-[#dcfce7] text-[#15803d]';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const p = (priority || 'Alta').toLowerCase();
  let cls = 'bg-[#fee2e2] text-[#b91c1c]';
  let label = 'Alta';
  if (p === 'media') { cls = 'bg-[#fef3c7] text-[#b45309];'; label = 'Media'; }
  else if (p === 'baja') { cls = 'bg-[#dcfce7] text-[#15803d]'; label = 'Baja'; }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3.5 shadow-sm box-border min-w-0 font-['Inter',sans-serif]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-[#1a1d2e] leading-none mb-1 truncate">{value}</p>
        <p className="text-xs text-[#6b7280] font-medium truncate lowercase">{label}</p>
      </div>
    </div>
  );
}

function formatearFechaParaInput(fechaRaw?: string) {
  if (!fechaRaw) return '';
  const d = new Date(fechaRaw);
  const anio = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaVista(fechaRaw?: string) {
  if (!fechaRaw) return '30/06/2026';
  const d = new Date(fechaRaw);
  return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
}

interface UsuarioSimple {
  id: string;
  name: string;
  email: string;
}

interface ActividadSimple {
  id: string;
  name: string;
  status: string;
  priority: string;
  deadline?: string;
}

interface Proyecto {
  id?: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  priority?: string;
  status?: string;
  progress?: number;
  members: UsuarioSimple[];
  evaluators: UsuarioSimple[];
  activities?: ActividadSimple[];
}

export const EstudianteProyectos: React.FC = () => {
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<UsuarioSimple[]>([]);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState<UsuarioSimple[]>([]);
  
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [actividadesProyecto, setActividadesProyecto] = useState<ActividadSimple[]>([]);
  const [cargandoActividades, setCargandoActividades] = useState(false);

  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [backendError, setBackendError] = useState<string | null>(null);
  const [errorFechaCierre, setErrorFechaCierre] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [integranteEmail, setIntegranteEmail] = useState('');
  const [evaluadorEmail, setEvaluadorEmail] = useState('');

  const [formProyecto, setFormProyecto] = useState<Proyecto>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'Alta',
    status: 'Activo',
    members: [],
    evaluators: []
  });

  const obtenerProyectos = async () => {
    setCargandoProyectos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/actividades/proyectos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const lista: Proyecto[] = data.proyectos || [];
        setProyectos(lista);

        setSelectedProyecto(prev => {
          if (!prev) return prev;
          return lista.find(p => p.id === prev.id) ?? prev;
        });
      }
    } catch (err) {
      console.error('Error al obtener proyectos:', err);
    } finally {
      setCargandoProyectos(false);
    }
  };

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        const [resE, resA] = await Promise.all([
          fetch(`${API_BASE_URL}/usuarios/evaluadores`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (resE.ok) setProfesoresDisponibles((await resE.json()).evaluadores || []);
        if (resA.ok) setEstudiantesDisponibles((await resA.json()).usuarios || []);
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
      }
    };

    obtenerProyectos();
    cargarUsuarios();
  }, []);

  const seleccionarProyectoYCargarActividades = async (p: Proyecto) => {
    setSelectedProyecto(p);
    setCargandoActividades(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/actividades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const todasActividades = data.actividades || data || [];
        const delProyecto = todasActividades.filter((act: any) => 
          act.projectId === p.id || act.proyectoId === p.id || (act.project && act.project.id === p.id)
        );
        setActividadesProyecto(delProyecto);
      }
    } catch (err) {
      console.error('Error al cargar actividades del proyecto:', err);
    } finally {
      setCargandoActividades(false);
    }
  };

  const abrirEditar = (p: Proyecto) => {
    setBackendError(null);
    setErrorFechaCierre(null);
    setSuccessMessage(null);
    setIntegranteEmail('');
    setEvaluadorEmail('');
    setFormProyecto({
      ...p,
      startDate: formatearFechaParaInput(p.startDate),
      endDate: formatearFechaParaInput(p.endDate),
      members: p.members || [],
      evaluators: p.evaluators || []
    });
    setModo('editar');
  };

  const eliminarProyecto = async (id?: string) => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/actividades/proyectos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSelectedProyecto(null);
        obtenerProyectos();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'No se pudo eliminar el proyecto.');
      }
    } catch (err) {
      alert('Error de conexión al intentar eliminar el proyecto.');
    }
  };

  const agregarIntegrantePorCorreo = () => {
    setBackendError(null);
    if (!integranteEmail.trim()) return;
    const emailBuscado = integranteEmail.toLowerCase().trim();
    const estudianteEncontrado = estudiantesDisponibles.find(u => u.email.toLowerCase() === emailBuscado);

    if (estudianteEncontrado) {
      if (!formProyecto.members.some(m => m.id === estudianteEncontrado.id)) {
        setFormProyecto(prev => ({ ...prev, members: [...prev.members, estudianteEncontrado] }));
      }
      setIntegranteEmail('');
    } else {
      setBackendError(`No se encontró ningún estudiante con el correo: ${emailBuscado}`);
    }
  };

  const asignarEvaluadorPorCorreo = () => {
    setBackendError(null);
    if (!evaluadorEmail.trim()) return;
    const emailBuscado = evaluadorEmail.toLowerCase().trim();
    const profesorEncontrado = profesoresDisponibles.find(p => p.email.toLowerCase() === emailBuscado);

    if (profesorEncontrado) {
      setFormProyecto(prev => ({ ...prev, evaluators: [profesorEncontrado] }));
      setEvaluadorEmail('');
    } else {
      setBackendError(`No se encontró ningún evaluador con el correo: ${emailBuscado}`);
    }
  };

  const quitarIntegrante = (id: string) => {
    setFormProyecto(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  };

  const quitarEvaluador = (id: string) => {
    setFormProyecto(prev => ({ ...prev, evaluators: prev.evaluators.filter(e => e.id !== id) }));
  };

  const guardarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setSuccessMessage(null);

    const nombreTrim = formProyecto.name.trim();
    const yaExiste = proyectos.some(
      p => p.name.toLowerCase() === nombreTrim.toLowerCase() && p.id !== formProyecto.id
    );

    if (yaExiste) {
      setBackendError(`Ya existe un proyecto con el nombre "${nombreTrim}".`);
      return;
    }

    const payload = { ...formProyecto, name: nombreTrim };
    
    // ✅ FIX Bug 02: Normalizar la fecha de inicio con la hora local actual en formato ISO de fecha pura
    if (!payload.startDate) {
      payload.startDate = obtenerHoyISO();
    }

    const resultadoFecha = validarFechaFinProyecto(payload.startDate, payload.endDate);
    if (!resultadoFecha.valida) {
      setBackendError(resultadoFecha.mensaje || 'Fecha inválida.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/actividades/proyectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const proyectoActualizado = data?.proyecto || data;

        setSuccessMessage('¡Proyecto guardado exitosamente!');

        if (proyectoActualizado && selectedProyecto?.id === formProyecto.id) {
          setSelectedProyecto(prev => (prev ? { ...prev, ...proyectoActualizado } : prev));
        }

        setTimeout(() => {
          setModo('lista');
          obtenerProyectos();
          setSuccessMessage(null);
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setBackendError(errData.message || 'Error al guardar el proyecto.');
      }
    } catch (err) {
      setBackendError('Error de conexión con el servidor.');
    }
  };

  const proyectosFiltrados = proyectos.filter(p => {
    const coincideEstado = filterStatus === 'Todos' || p.status === filterStatus;
    const coincideBusqueda = p.name.toLowerCase().includes(search.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const counts = {
    total: proyectos.length,
    activos: proyectos.filter(p => p.status === 'Activo').length,
    enProceso: proyectos.filter(p => p.status === 'En proceso').length,
    enRevision: proyectos.filter(p => p.status === 'En revisión').length,
    completados: proyectos.filter(p => p.status === 'Completado').length,
  };

  if (modo === 'crear' || modo === 'editar') {
    return (
      <div className="p-4 sm:p-6 space-y-5 w-full max-w-4xl mx-auto font-['Inter',sans-serif] antialiased text-[#1a1d2e] box-border overflow-x-hidden bg-[#f4f5f8] min-h-screen">
        <div className="flex items-center gap-3">
          <button onClick={() => setModo('lista')} className="p-1.5 text-[#6b7280] hover:text-[#1a1d2e] hover:bg-[#eef0f6] rounded-xl transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1a1d2e] tracking-tight">
              {modo === 'crear' ? 'Crear proyecto' : 'Editar proyecto'}
            </h1>
            <p className="text-xs text-[#6b7280] font-medium">Modifica la información del proyecto.</p>
          </div>
        </div>

        {backendError && (
          <div className="bg-red-50 border border-red-200 text-destructive] text-sm p-3 rounded-xl font-medium flex items-center gap-2 break-all">
            <AlertCircle size={16} className="shrink-0" /> <span>{backendError}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl font-medium flex items-center gap-2 animate-pulse">
            <CheckCircle2 size={16} className="shrink-0" /> <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={guardarProyecto} className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1a1d2e] uppercase tracking-wider">Información del proyecto</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Nombre del proyecto *</label>
                <input 
                  type="text" 
                  required
                  disabled={!!successMessage}
                  value={formProyecto.name}
                  onChange={e => setFormProyecto({ ...formProyecto, name: e.target.value })}
                  className="w-full p-2.5 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium text-[#1a1d2e] focus:outline-none focus:bg-white focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Descripción *</label>
                <textarea 
                  rows={3}
                  required
                  disabled={!!successMessage}
                  value={formProyecto.description}
                  onChange={e => setFormProyecto({ ...formProyecto, description: e.target.value })}
                  className="w-full p-2.5 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium text-[#1a1d2e] focus:outline-none focus:bg-white focus:border-primary transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Fecha de cierre</label>
                  <input 
                    type="date" 
                    disabled={!!successMessage}
                    min={obtenerMananaISO()}
                    value={formProyecto.endDate || ''}
                    onChange={e => {
                      const valor = e.target.value;
                      setFormProyecto({ ...formProyecto, endDate: valor });
                      const resultado = validarFechaFinProyecto(formProyecto.startDate || obtenerHoyISO(), valor);
                      setErrorFechaCierre(resultado.mensaje);
                    }}
                    className={`w-full p-2.5 border rounded-xl text-xs font-medium text-[#1a1d2e] focus:outline-none focus:bg-white transition ${
                      errorFechaCierre ? 'bg-red-50 border-red-300' : 'bg-[#f4f5f8] border-border focus:border-primary'
                    }`}
                  />
                  {errorFechaCierre && (
                    <p className="text-[11px] text-destructive] font-semibold mt-1 leading-snug">{errorFechaCierre}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Prioridad</label>
                  <select 
                    disabled={!!successMessage}
                    value={formProyecto.priority || 'Alta'}
                    onChange={e => setFormProyecto({ ...formProyecto, priority: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium text-[#1a1d2e] focus:outline-none focus:bg-white focus:border-primary transition"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Estado</label>
                  <select 
                    disabled={!!successMessage}
                    value={formProyecto.status || 'Activo'}
                    onChange={e => setFormProyecto({ ...formProyecto, status: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium text-[#1a1d2e] focus:outline-none focus:bg-white focus:border-primary transition"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En proceso">En proceso</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
              <div>
                <h3 className="text-xs font-bold text-[#1a1d2e] uppercase tracking-wider mb-1">Integrantes del proyecto</h3>
                <p className="text-[11px] text-[#6b7280]">Invita a tus compañeros usando su correo electrónico.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input 
                  type="email"
                  placeholder="correo@estudiante.com"
                  disabled={!!successMessage}
                  value={integranteEmail}
                  onChange={e => setIntegranteEmail(e.target.value)}
                  className="p-2 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium focus:outline-none w-full sm:w-64"
                />
                <button 
                  type="button"
                  disabled={!!successMessage}
                  onClick={agregarIntegrantePorCorreo}
                  className="px-3 py-2 bg-[#eef0f6] hover:bg-gray-200 border border-border rounded-xl text-xs font-bold text-[#1a1d2e] flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {formProyecto.members.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#f4f5f8]/70 rounded-xl border border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1a1d2e] truncate">{m.name}</p>
                    <p className="text-[11px] text-[#6b7280] truncate">{m.email}</p>
                  </div>
                  <button type="button" disabled={!!successMessage} onClick={() => quitarIntegrante(m.id)} className="text-destructive] hover:text-red-700 text-xs font-bold text-left sm:text-right cursor-pointer shrink-0">
                    Eliminar
                  </button>
                </div>
              ))}

              {formProyecto.members.length === 0 && (
                <p className="text-xs text-foreground-muted italic py-2">Aún no has agregado integrantes al proyecto.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1a1d2e] uppercase tracking-wider">Evaluador asignado</h3>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
               <div className="flex-1">
                <label className="block text-xs font-bold text-[#1a1d2e] mb-1">Invitar evaluador por correo *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="correo@docente.com"
                    disabled={!!successMessage || formProyecto.evaluators.length > 0}
                    value={evaluadorEmail}
                    onChange={e => setEvaluadorEmail(e.target.value)}
                    className="w-full p-2.5 bg-[#f4f5f8] border border-border rounded-xl text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!!successMessage || formProyecto.evaluators.length > 0}
                    onClick={asignarEvaluadorPorCorreo}
                    className="px-4 py-2.5 bg-[#eef0f6] hover:bg-gray-200 border border-border rounded-xl text-xs font-bold text-[#1a1d2e] transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    Asignar
                  </button>
                </div>
              </div>
            </div>

            {formProyecto.evaluators[0] && (
              <div className="flex items-center justify-between p-3 mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1a1d2e] truncate">{formProyecto.evaluators[0].name}</p>
                    <p className="text-[11px] text-[#6b7280] truncate">{formProyecto.evaluators[0].email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!successMessage}
                  onClick={() => quitarEvaluador(formProyecto.evaluators[0].id)}
                  className="text-destructive] hover:text-red-700 text-xs font-bold cursor-pointer shrink-0 ml-3"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button 
              type="button" 
              disabled={!!successMessage}
              onClick={() => setModo('lista')}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#6b7280] bg-[#eef0f6] hover:bg-gray-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!!successMessage || !!errorFechaCierre}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#1a1d2e] hover:bg-black rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {successMessage ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 w-full font-['Inter',sans-serif] antialiased text-[#1a1d2e] box-border relative bg-[#f4f5f8] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1d2e] tracking-tight">Proyectos</h1>
        </div>
        <button 
          onClick={() => {
            setBackendError(null);
            setErrorFechaCierre(null);
            setSuccessMessage(null);
            setIntegranteEmail('');
            setEvaluadorEmail('');
            setFormProyecto({ name: '', description: '', startDate: '', endDate: '', priority: 'Alta', status: 'Activo', members: [], evaluators: [] });
            setModo('crear');
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#1a1d2e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-black transition cursor-pointer"
        >
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard label="total de proyectos" value={counts.total} color="bg-[#ede9fe] text-primary" icon={<FolderOpen size={18} />} />
        <StatCard label="activos" value={counts.activos} color="bg-[#d1fae5] text-[#047857]" icon={<CheckCircle2 size={18} />} />
        <StatCard label="en proceso" value={counts.enProceso} color="bg-[#dbeafe] text-[#1d4ed8]" icon={<AlertCircle size={18} />} />
        <StatCard label="en revisión" value={counts.enRevision} color="bg-[#fef3c7] text-[#b45309]" icon={<Eye size={18} />} />
        <StatCard label="completados" value={counts.completados} color="bg-[#dcfce7] text-[#15803d]" icon={<CheckSquare size={18} />} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar proyecto..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition" 
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Todos', 'Activo', 'En proceso', 'En revisión', 'Completado'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilterStatus(s)} 
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === s ? 'bg-[#1a1d2e] text-white' : 'bg-white border border-border text-[#6b7280] hover:bg-[#eef0f6]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        <div className="flex-1 w-full space-y-3 min-w-0">
          <h3 className="text-xs font-bold text-[#1a1d2e] mb-1">Lista de proyectos</h3>

          {cargandoProyectos ? (
            <div className="p-8 text-center text-xs text-[#6b7280] bg-white rounded-2xl border border-border">
              Cargando proyectos...
            </div>
          ) : proyectosFiltrados.length > 0 ? (
            proyectosFiltrados.map((p) => {
              const isSelected = selectedProyecto?.id === p.id;
              const porcentaje = p.progress || 0;

              return (
                <div 
                  key={p.id} 
                  onClick={() => seleccionarProyectoYCargarActividades(p)}
                  className={`bg-white p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-sm space-y-3.5 select-none w-full box-border ${
                    isSelected 
                      ? 'border-[#1a1d2e] ring-2 ring-[#1a1d2e]/10 shadow-md bg-[#eef0f6]/50' 
                      : 'border-border hover:border-[#6b7280]'
                  }`}
                  title="Haz clic para ver el detalle rápido"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1a1d2e] text-sm truncate">{p.name}</h4>
                        <div className="sm:hidden"><Badge label={p.status || 'Activo'} /></div>
                      </div>
                      <p className="text-xs text-[#6b7280] font-medium mt-0.5 line-clamp-1">{p.description}</p>
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-[#6b7280] font-medium mt-2 flex-wrap">
                        <span>Fecha: <strong className="text-[#1a1d2e]">{formatearFechaVista(p.endDate)}</strong></span>
                        <span>Equipo: <strong className="text-[#1a1d2e]">{p.members?.length || 1} integrantes</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#eef0f6]">
                      <div className="hidden sm:block"><Badge label={p.status || 'Activo'} /></div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarProyectoYCargarActividades(p);
                        }}
                        className={`lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected ? 'bg-[#1a1d2e] text-white' : 'bg-[#eef0f6] text-[#1a1d2e] hover:bg-gray-200'
                        }`}
                      >
                        <Eye size={13} /> {isSelected ? 'Seleccionado' : 'Ver detalle'}
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEditar(p);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f8] text-[#1a1d2e] rounded-xl text-xs font-bold hover:bg-[#eef0f6] transition cursor-pointer border border-border"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#6b7280]">
                      <span>Progreso</span>
                      <span className="text-[#1a1d2e]">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-[#f4f5f8] h-2 rounded-full overflow-hidden border border-border">
                      <div className="bg-[#1a1d2e] h-2 rounded-full transition-all duration-300" style={{ width: `${porcentaje}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-border space-y-2">
              <FolderOpen size={32} className="mx-auto text-foreground-muted" />
              <p className="text-xs font-semibold text-[#6b7280]">No hay proyectos registrados.</p>
              <p className="text-[11px] text-foreground-muted">Haz clic en "Nuevo proyecto" para comenzar.</p>
            </div>
          )}
        </div>

        {selectedProyecto && (
          <>
            <div 
              onClick={() => setSelectedProyecto(null)} 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
            />

            <div className="fixed inset-x-4 bottom-4 top-20 sm:inset-auto sm:right-6 sm:top-24 sm:w-105 sm:max-h-[85vh] bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-border shadow-2xl z-50 space-y-6 overflow-y-auto box-border lg:sticky lg:top-6 lg:inset-auto lg:z-10 lg:shadow-sm">
              
              <div className="flex justify-between items-start border-b border-border pb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">DETALLE RÁPIDO</span>
                  <h3 className="font-bold text-[#1a1d2e] text-base leading-snug mt-0.5 wrap-break-word">{selectedProyecto.name}</h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed wrap-break-word">{selectedProyecto.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedProyecto(null)}
                  className="p-1.5 text-[#6b7280] hover:text-[#1a1d2e] hover:bg-[#eef0f6] rounded-xl transition cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-[#f4f5f8] p-4 rounded-2xl border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] font-medium">Estado</span>
                  <Badge label={selectedProyecto.status || 'Activo'} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] font-medium">Prioridad</span>
                  <PriorityBadge priority={selectedProyecto.priority} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] font-medium">Creado el</span>
                  <span className="font-bold text-[#1a1d2e]">
                    {formatearFechaVista(selectedProyecto.createdAt || selectedProyecto.startDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] font-medium">Fecha límite</span>
                  <span className="font-bold text-[#1a1d2e]">{formatearFechaVista(selectedProyecto.endDate)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-[#6b7280] font-medium shrink-0">Docente asignado</span>
                  <span className="font-bold text-[#1a1d2e] truncate text-right">
                    {selectedProyecto.evaluators?.[0]?.name || 'Sin asignar'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] font-medium">Equipo</span>
                  <span className="font-bold text-[#1a1d2e]">{selectedProyecto.members?.length || 1} integrantes</span>
                </div>
              </div>

              <div className="border-t border-border pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#1a1d2e] uppercase tracking-wider">Actividades recientes</h4>
                  <button
                    onClick={() => navigate(`/estudiante-actividades?projectId=${selectedProyecto.id}`)}
                    className="text-[10px] font-bold text-[#6b7280] hover:text-[#1a1d2e] transition underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {cargandoActividades ? (
                    <p className="text-[11px] text-foreground-muted italic text-center py-4">Cargando...</p>
                  ) : actividadesProyecto.length > 0 ? (
                    actividadesProyecto.map(act => (
                      <div 
                        key={act.id} 
                        onClick={() => navigate(`/estudiante-actividades?id=${act.id}&projectId=${selectedProyecto.id}`)}
                        className="p-3.5 bg-white border border-border hover:border-[#6b7280] rounded-2xl text-xs shadow-sm flex justify-between items-center transition cursor-pointer group gap-2"
                      >
                        <span className="font-bold text-[#1a1d2e] group-hover:text-black truncate pr-1">{act.name}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          act.status === 'DONE' ? 'bg-[#dcfce7] text-[#15803d]' :
                          act.status === 'IN_PROCESS' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                          act.status === 'IN_REVIEW' ? 'bg-[#fef3c7] text-[#b45309]' :
                          'bg-[#f4f5f8] text-[#6b7280]'
                          }`}>
                            {act.status === 'IN_PROCESS' ? 'En proceso' :
                            act.status === 'IN_REVIEW' ? 'En revisión' :
                            act.status === 'DONE' ? 'Completado' : 'Pendiente'}
                            </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-foreground-muted italic text-center py-4 bg-[#f4f5f8] rounded-2xl border border-dashed border-border">
                      No hay actividades registradas.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 space-y-2.5 border-t border-border">
                <button 
                  onClick={() => {
                    if (selectedProyecto?.id) {
                      navigate(`/estudiante-kanban?projectId=${selectedProyecto.id}`);
                    } else {
                      navigate('/estudiante-kanban');
                    }
                  }}
                  className="w-full py-2.5 bg-[#1a1d2e] text-white rounded-xl text-xs font-semibold hover:bg-black transition cursor-pointer shadow-sm"
                >
                  Ir al tablero Kanban
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => abrirEditar(selectedProyecto)}
                    className="flex-1 py-2.5 bg-[#f4f5f8] text-[#1a1d2e] rounded-xl text-xs font-semibold hover:bg-[#eef0f6] transition flex items-center justify-center gap-1.5 cursor-pointer border border-border"
                  >
                    <Edit2 size={13} /> Editar proyecto
                  </button>
                  <button 
                    onClick={() => eliminarProyecto(selectedProyecto.id)}
                    className="px-3.5 py-2.5 bg-red-50 text-destructive] rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1 cursor-pointer shrink-0 border border-red-100"
                    title="Eliminar proyecto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EstudianteProyectos;