import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FolderOpen, Edit2, ArrowLeft,
  CheckCircle2, AlertCircle, Eye, CheckSquare, Trash2, X 
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

function Badge({ label }: { label: string }) {
  let cls = 'bg-gray-50 text-gray-600';
  if (label === 'Activo') cls = 'bg-emerald-50 text-emerald-600';
  if (label === 'En proceso') cls = 'bg-blue-50 text-blue-600';
  if (label === 'En revisión') cls = 'bg-amber-50 text-amber-600';
  if (label === 'Completado') cls = 'bg-green-50 text-green-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-xs box-border min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1 truncate">{value}</p>
        <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

function formatearFechaParaInput(fechaRaw?: string) {
  if (!fechaRaw) return '';
  return new Date(fechaRaw).toISOString().split('T')[0];
}

function formatearFechaVista(fechaRaw?: string) {
  if (!fechaRaw) return '30/06/2026';
  const d = new Date(fechaRaw);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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
        setProyectos(data.proyectos || []);
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
    if (!payload.startDate) {
      const hoy = new Date();
      payload.startDate = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }

    if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
      setBackendError('La fecha de cierre no puede ser anterior a la fecha de inicio.');
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
        setSuccessMessage('¡Proyecto guardado exitosamente!');
        setTimeout(() => {
          setModo('lista');
          obtenerProyectos();
          setSuccessMessage(null);
        }, 1500);
      } else {
        const errData = await res.json();
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
      <div className="p-4 sm:p-6 space-y-5 w-full max-w-4xl mx-auto font-sans antialiased text-gray-900 box-border overflow-x-hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setModo('lista')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {modo === 'crear' ? 'Crear proyecto' : 'Editar proyecto'}
            </h1>
            <p className="text-xs text-gray-400 font-medium">Modifica la información del proyecto.</p>
          </div>
        </div>

        {backendError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl font-medium flex items-center gap-2 break-all">
            <AlertCircle size={16} className="shrink-0" /> <span>{backendError}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl font-medium flex items-center gap-2 animate-pulse">
            <CheckCircle2 size={16} className="shrink-0" /> <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={guardarProyecto} className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Información del proyecto</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del proyecto *</label>
                <input 
                  type="text" 
                  required
                  disabled={!!successMessage}
                  value={formProyecto.name}
                  onChange={e => setFormProyecto({ ...formProyecto, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción *</label>
                <textarea 
                  rows={3}
                  required
                  disabled={!!successMessage}
                  value={formProyecto.description}
                  onChange={e => setFormProyecto({ ...formProyecto, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de cierre</label>
                  <input 
                    type="date" 
                    disabled={!!successMessage}
                    value={formProyecto.endDate || ''}
                    onChange={e => setFormProyecto({ ...formProyecto, endDate: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prioridad</label>
                  <select 
                    disabled={!!successMessage}
                    value={formProyecto.priority || 'Alta'}
                    onChange={e => setFormProyecto({ ...formProyecto, priority: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
                  <select 
                    disabled={!!successMessage}
                    value={formProyecto.status || 'Activo'}
                    onChange={e => setFormProyecto({ ...formProyecto, status: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition"
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

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Integrantes del proyecto</h3>
                <p className="text-[11px] text-gray-400">Invita a tus compañeros usando su correo electrónico.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input 
                  type="email"
                  placeholder="correo@estudiante.com"
                  disabled={!!successMessage}
                  value={integranteEmail}
                  onChange={e => setIntegranteEmail(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none w-full sm:w-64"
                />
                <button 
                  type="button"
                  disabled={!!successMessage}
                  onClick={agregarIntegrantePorCorreo}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {formProyecto.members.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate">{m.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{m.email}</p>
                  </div>
                  <button type="button" disabled={!!successMessage} onClick={() => quitarIntegrante(m.id)} className="text-red-500 hover:text-red-700 text-xs font-bold text-left sm:text-right cursor-pointer shrink-0">
                    Eliminar
                  </button>
                </div>
              ))}

              {formProyecto.members.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">Aún no has agregado integrantes al proyecto.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Evaluador asignado</h3>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
               <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Invitar evaluador por correo *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="correo@docente.com"
                    disabled={!!successMessage || formProyecto.evaluators.length > 0}
                    value={evaluadorEmail}
                    onChange={e => setEvaluadorEmail(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!!successMessage || formProyecto.evaluators.length > 0}
                    onClick={asignarEvaluadorPorCorreo}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition cursor-pointer disabled:opacity-50 shrink-0"
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
                    <p className="text-xs font-bold text-gray-800 truncate">{formProyecto.evaluators[0].name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{formProyecto.evaluators[0].email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!successMessage}
                  onClick={() => quitarEvaluador(formProyecto.evaluators[0].id)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer shrink-0 ml-3"
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
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!!successMessage}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-black hover:bg-gray-900 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {successMessage ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 w-full font-sans antialiased text-gray-900 box-border relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proyectos</h1>
        </div>
        <button 
          onClick={() => {
            setBackendError(null);
            setSuccessMessage(null);
            setIntegranteEmail('');
            setEvaluadorEmail('');
            setFormProyecto({ name: '', description: '', startDate: '', endDate: '', priority: 'Alta', status: 'Activo', members: [], evaluators: [] });
            setModo('crear');
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-gray-900 transition cursor-pointer"
        >
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard label="Total de proyectos" value={counts.total} color="bg-indigo-50 text-indigo-600" icon={<FolderOpen size={18} />} />
        <StatCard label="Activos" value={counts.activos} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 size={18} />} />
        <StatCard label="En proceso" value={counts.enProceso} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={18} />} />
        <StatCard label="En revisión" value={counts.enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={18} />} />
        <StatCard label="Completados" value={counts.completados} color="bg-green-50 text-green-600" icon={<CheckSquare size={18} />} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar proyecto..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-300 transition" 
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Todos', 'Activo', 'En proceso', 'En revisión', 'Completado'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilterStatus(s)} 
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === s ? 'bg-black text-white' : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        <div className="flex-1 w-full space-y-3 min-w-0">
          <h3 className="text-xs font-bold text-gray-900 mb-1">Lista de proyectos</h3>

          {cargandoProyectos ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
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
                  className={`bg-white p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs space-y-3.5 select-none w-full box-border ${
                    isSelected 
                      ? 'border-black ring-2 ring-black/10 shadow-md bg-slate-50/50' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                  title="Haz clic para ver el detalle rápido"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                        <div className="sm:hidden"><Badge label={p.status || 'Activo'} /></div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 line-clamp-1">{p.description}</p>
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-gray-400 font-medium mt-2 flex-wrap">
                        <span>Fecha: <strong className="text-gray-700">{formatearFechaVista(p.endDate)}</strong></span>
                        <span>Equipo: <strong className="text-gray-700">{p.members?.length || 1} integrantes</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                      <div className="hidden sm:block"><Badge label={p.status || 'Activo'} /></div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarProyectoYCargarActividades(p);
                        }}
                        className={`lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <Eye size={13} /> {isSelected ? 'Seleccionado' : 'Ver detalle'}
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEditar(p);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>Progreso</span>
                      <span className="text-gray-900">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${porcentaje}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-2">
              <FolderOpen size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-semibold text-gray-600">No hay proyectos registrados.</p>
              <p className="text-[11px] text-gray-400">Haz clic en "Nuevo proyecto" para comenzar.</p>
            </div>
          )}
        </div>

        {/* 🟢 PANEL DE DETALLE FLOTANTE / DRAWER EN MÓVIL Y LATERAL FIJO EN DESKTOP */}
        {selectedProyecto && (
          <>
            {/* Fondo oscuro translúcido en móvil al abrir el detalle */}
            <div 
              onClick={() => setSelectedProyecto(null)} 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
            />

            <div className="fixed inset-x-4 bottom-4 top-20 sm:inset-auto sm:right-6 sm:top-24 sm:w-[420px] sm:max-h-[85vh] bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-gray-100 shadow-2xl z-50 space-y-6 overflow-y-auto box-border lg:sticky lg:top-6 lg:inset-auto lg:z-10 lg:shadow-sm">
              
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DETALLE RÁPIDO</span>
                  <h3 className="font-bold text-gray-900 text-base leading-snug mt-0.5 break-words">{selectedProyecto.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">{selectedProyecto.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedProyecto(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-gray-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Estado</span>
                  <Badge label={selectedProyecto.status || 'Activo'} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Creado el</span>
                  <span className="font-bold text-gray-800">
                    {formatearFechaVista(selectedProyecto.createdAt || selectedProyecto.startDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Fecha límite</span>
                  <span className="font-bold text-gray-800">{formatearFechaVista(selectedProyecto.endDate)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 font-medium shrink-0">Docente asignado</span>
                  <span className="font-bold text-gray-800 truncate text-right">
                    {selectedProyecto.evaluators?.[0]?.name || 'Sin asignar'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Equipo</span>
                  <span className="font-bold text-gray-800">{selectedProyecto.members?.length || 1} integrantes</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Actividades recientes</h4>
                  <button
                    onClick={() => navigate(`/estudiante-actividades?projectId=${selectedProyecto.id}`)}
                    className="text-[10px] font-bold text-gray-500 hover:text-black transition underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {cargandoActividades ? (
                    <p className="text-[11px] text-gray-400 italic text-center py-4">Cargando...</p>
                  ) : actividadesProyecto.length > 0 ? (
                    actividadesProyecto.map(act => (
                      <div 
                        key={act.id} 
                        onClick={() => navigate(`/estudiante-actividades?id=${act.id}`)}
                        className="p-3.5 bg-white border border-gray-100 hover:border-gray-300 rounded-2xl text-xs shadow-xs flex justify-between items-center transition cursor-pointer group gap-2"
                      >
                        <span className="font-bold text-gray-800 group-hover:text-black truncate pr-1">{act.name}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-1 bg-gray-100 rounded-lg text-gray-700 shrink-0">
                          {act.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      No hay actividades registradas.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 space-y-2.5 border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (selectedProyecto?.id) {
                      navigate(`/estudiante-kanban?projectId=${selectedProyecto.id}`);
                    } else {
                      navigate('/estudiante-kanban');
                    }
                  }}
                  className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-900 transition cursor-pointer shadow-xs"
                >
                  Ir al tablero Kanban
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => abrirEditar(selectedProyecto)}
                    className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer border border-gray-200/60"
                  >
                    <Edit2 size={13} /> Editar proyecto
                  </button>
                  <button 
                    onClick={() => eliminarProyecto(selectedProyecto.id)}
                    className="px-3.5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
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