import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FolderOpen, Edit2, ArrowLeft,
  CheckCircle2, AlertCircle, Eye, CheckSquare 
} from 'lucide-react';

function Badge({ label }: { label: string }) {
  let cls = 'bg-gray-100 text-gray-700';
  if (label === 'Activo') cls = 'bg-emerald-100 text-emerald-700';
  if (label === 'En proceso') cls = 'bg-blue-100 text-blue-700';
  if (label === 'En revisión') cls = 'bg-amber-100 text-amber-700';
  if (label === 'Completado') cls = 'bg-green-100 text-green-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
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

interface Proyecto {
  id?: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  status?: string;
  progress?: number;
  members: UsuarioSimple[];
  evaluators: UsuarioSimple[];
}

export const EstudianteProyectos: React.FC = () => {
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<UsuarioSimple[]>([]);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState<UsuarioSimple[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  
  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

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

  const [integranteSeleccionadoId, setIntegranteSeleccionadoId] = useState('');
  const [evaluadorSeleccionadoId, setEvaluadorSeleccionadoId] = useState('');

  const obtenerProyectos = async () => {
    setCargandoProyectos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/actividades/proyectos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const lista: Proyecto[] = data.proyectos || [];
        setProyectos(lista);
        if (lista.length > 0) setSelectedProyecto(lista[0]);
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
          fetch('http://localhost:3000/api/usuarios/evaluadores', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3000/api/usuarios', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (resE.ok) {
          const dataE = await resE.json();
          setProfesoresDisponibles(dataE.evaluadores || []);
        }
        if (resA.ok) {
          const dataA = await resA.json();
          setEstudiantesDisponibles(dataA.usuarios || []);
        }
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
      }
    };

    obtenerProyectos();
    cargarUsuarios();
  }, []);

  const abrirEditar = (p: Proyecto) => {
    setFormProyecto({
      ...p,
      startDate: formatearFechaParaInput(p.startDate),
      endDate: formatearFechaParaInput(p.endDate),
      members: p.members || [],
      evaluators: p.evaluators || []
    });
    setModo('editar');
  };

  const agregarIntegrante = () => {
    if (!integranteSeleccionadoId) return;
    const est = estudiantesDisponibles.find(u => u.id === integranteSeleccionadoId);
    if (est && !formProyecto.members.some(m => m.id === est.id)) {
      setFormProyecto(prev => ({ ...prev, members: [...prev.members, est] }));
    }
    setIntegranteSeleccionadoId('');
  };

  const quitarIntegrante = (id: string) => {
    setFormProyecto(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  };

  const agregarEvaluador = () => {
    if (!evaluadorSeleccionadoId) return;
    const prof = profesoresDisponibles.find(p => p.id === evaluadorSeleccionadoId);
    if (prof && !formProyecto.evaluators.some(e => e.id === prof.id)) {
      setFormProyecto(prev => ({ ...prev, evaluators: [...prev.evaluators, prof] }));
    }
    setEvaluadorSeleccionadoId('');
  };

  const quitarEvaluador = (id: string) => {
    setFormProyecto(prev => ({ ...prev, evaluators: prev.evaluators.filter(e => e.id !== id) }));
  };

  const guardarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/actividades/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formProyecto)
      });

      if (res.ok) {
        alert('¡Proyecto guardado exitosamente!');
        setModo('lista');
        obtenerProyectos();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error al guardar el proyecto.');
      }
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
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
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setModo('lista')} className="p-1 text-gray-400 hover:text-gray-700 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {modo === 'crear' ? 'Crear proyecto' : 'Editar proyecto'}
            </h1>
            <p className="text-xs text-gray-400 font-medium">Modifica la información del proyecto.</p>
          </div>
        </div>

        <form onSubmit={guardarProyecto} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Información del proyecto</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del proyecto *</label>
                <input 
                  type="text" 
                  required
                  value={formProyecto.name}
                  onChange={e => setFormProyecto({ ...formProyecto, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción *</label>
                <textarea 
                  rows={3}
                  required
                  value={formProyecto.description}
                  onChange={e => setFormProyecto({ ...formProyecto, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de inicio</label>
                  <input 
                    type="date" 
                    value={formProyecto.startDate || ''}
                    onChange={e => setFormProyecto({ ...formProyecto, startDate: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de cierre</label>
                  <input 
                    type="date" 
                    value={formProyecto.endDate || ''}
                    onChange={e => setFormProyecto({ ...formProyecto, endDate: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prioridad</label>
                  <select 
                    value={formProyecto.priority || 'Alta'}
                    onChange={e => setFormProyecto({ ...formProyecto, priority: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Estado social / Estado</label>
                  <select 
                    value={formProyecto.status || 'Activo'}
                    onChange={e => setFormProyecto({ ...formProyecto, status: e.target.value })}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:bg-white"
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

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Integrantes del proyecto</h3>
              <div className="flex gap-2">
                <select 
                  value={integranteSeleccionadoId}
                  onChange={e => setIntegranteSeleccionadoId(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none min-w-[200px]"
                >
                  <option value="">-- Selecciona Integrante --</option>
                  {estudiantesDisponibles.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={agregarIntegrante}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Agregar integrante
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                <div className="col-span-6">Integrante</div>
                <div className="col-span-5">Correo electrónico</div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>

              {formProyecto.members.map(m => (
                <div key={m.id} className="grid grid-cols-12 items-center gap-2 p-1.5">
                  <div className="col-span-6">
                    <input 
                      readOnly 
                      value={m.name} 
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs font-medium text-gray-800" 
                    />
                  </div>
                  <div className="col-span-5">
                    <input 
                      readOnly 
                      value={m.email} 
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs font-medium text-gray-500" 
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button 
                      type="button"
                      onClick={() => quitarIntegrante(m.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {formProyecto.members.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">Aún no has agregado integrantes al proyecto.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Evaluadores asignados</h3>
              <div className="flex gap-2">
                <select 
                  value={evaluadorSeleccionadoId}
                  onChange={e => setEvaluadorSeleccionadoId(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none min-w-[200px]"
                >
                  <option value="">-- Selecciona Evaluador --</option>
                  {profesoresDisponibles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={agregarEvaluador}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Agregar evaluador
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                <div className="col-span-6">Evaluador</div>
                <div className="col-span-5">Correo electrónico</div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>

              {formProyecto.evaluators.map(ev => (
                <div key={ev.id} className="grid grid-cols-12 items-center gap-2 p-1.5">
                  <div className="col-span-6">
                    <input 
                      readOnly 
                      value={ev.name} 
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs font-medium text-gray-800" 
                    />
                  </div>
                  <div className="col-span-5">
                    <input 
                      readOnly 
                      value={ev.email} 
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs font-medium text-gray-500" 
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button 
                      type="button"
                      onClick={() => quitarEvaluador(ev.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {formProyecto.evaluators.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">Aún no has asignado evaluadores al proyecto.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setModo('lista')}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-gray-900 rounded-xl shadow-sm transition"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proyectos</h1>
          <p className="text-xs text-gray-400 font-medium">Proyecto: ClassBoard Equipo A</p>
        </div>
        <button 
          onClick={() => {
            setFormProyecto({ name: '', description: '', members: [], evaluators: [] });
            setModo('crear');
          }}
          className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-900 transition"
        >
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard label="Total de proyectos" value={counts.total} color="bg-indigo-50 text-indigo-600" icon={<FolderOpen size={18} />} />
        <StatCard label="Activos" value={counts.activos} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 size={18} />} />
        <StatCard label="En proceso" value={counts.enProceso} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={18} />} />
        <StatCard label="En revisión" value={counts.enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={18} />} />
        <StatCard label="Completados" value={counts.completados} color="bg-green-50 text-green-600" icon={<CheckSquare size={18} />} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar proyecto..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Todos', 'Activo', 'En proceso', 'En revisión', 'Completado'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilterStatus(s)} 
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterStatus === s ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 w-full space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lista de proyectos</h3>

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
                  onClick={() => setSelectedProyecto(p)}
                  className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-sm space-y-3 ${
                    isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 line-clamp-1">{p.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium mt-2">
                        <span>Fecha: <strong className="text-gray-700">{formatearFechaVista(p.endDate)}</strong></span>
                        <span>Equipo: <strong className="text-gray-700">{p.members?.length || 1} integrantes</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge label={p.status || 'Activo'} />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEditar(p);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Progreso</span>
                      <span className="text-gray-900">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
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

        {selectedProyecto && (
          <div className="w-full lg:w-72 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0 space-y-4 lg:sticky lg:top-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DETALLE DEL PROYECTO</p>
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{selectedProyecto.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{selectedProyecto.description}</p>
            </div>

            <div className="space-y-2 text-xs border-t border-gray-50 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Estado</span>
                <Badge label={selectedProyecto.status || 'Activo'} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fecha inicio</span>
                <span className="font-bold text-gray-800">{formatearFechaVista(selectedProyecto.startDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fecha límite</span>
                <span className="font-bold text-gray-800">{formatearFechaVista(selectedProyecto.endDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Docente asignado</span>
                <span className="font-bold text-gray-800">
                  {selectedProyecto.evaluators?.[0]?.name || 'Dr. Roberto García'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Equipo</span>
                <span className="font-bold text-gray-800">{selectedProyecto.members?.length || 1} integrantes</span>
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400">Progreso</span>
                <span className="text-gray-900">{selectedProyecto.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${selectedProyecto.progress || 0}%` }} />
              </div>
            </div>

            <div className="border-t border-gray-50 pt-3 space-y-2 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Próximas fechas</p>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Definir alcance</span>
                <span className="font-bold text-gray-800">En 2 días</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Diseño de interfaz</span>
                <span className="font-bold text-gray-800">En 5 días</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Revisión con equipo</span>
                <span className="font-bold text-gray-800">En 9 días</span>
              </div>
            </div>

            {/* 🟢 REDIRECCIÓN ACTIVA AL KANBAN VINCULADO */}
            <div className="pt-2 space-y-2">
              <button 
                onClick={() => {
                  if (selectedProyecto?.id) {
                    navigate(`/estudiante-kanban?projectId=${selectedProyecto.id}`);
                  } else {
                    navigate('/estudiante-kanban');
                  }
                }}
                className="w-full py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition cursor-pointer"
              >
                Ir al tablero
              </button>
              <button 
                onClick={() => abrirEditar(selectedProyecto)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 size={12} /> Editar proyecto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};