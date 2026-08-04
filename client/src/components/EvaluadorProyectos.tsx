import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Info, FolderOpen } from 'lucide-react';
import { API_BASE_URL } from '../config/apis';


interface Evaluador {
  id: string;
  name: string;
  email: string;
}

interface Proyecto {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: string;
  progress: number;
  members: Evaluador[];
  evaluators: Evaluador[];
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case 'En proceso':
    case 'IN_PROCESS': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'Completado':
    case 'DONE': return 'bg-green-50 text-green-600 border border-green-100';
    case 'En revisión':
    case 'IN_REVIEW': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'Activo':
    case 'PENDING':
    default: return 'bg-gray-50 text-gray-500 border border-gray-100';
  }
}

function formatearFecha(f?: string) {
  if (!f) return 'Sin fecha';
  const d = new Date(f);
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
}

export const EvaluadorProyectos: React.FC = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('María González');

  useEffect(() => {
    const obtenerProyectosAsignados = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        
        // Obtener usuario del localStorage para el header
        const userStored = localStorage.getItem('user');
        if (userStored) {
          const parsed = JSON.parse(userStored);
          if (parsed.name) setNombreUsuario(parsed.name);
        }

        const res = await fetch(`${API_BASE_URL}/actividades/proyectos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setProyectos(data.proyectos || []);
        }
      } catch (error) {
        console.error('Error al cargar proyectos del evaluador:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerProyectosAsignados();
  }, []);

  const proyectosFiltrados = proyectos.filter(p => {
    const coincideNombre = p.name.toLowerCase().includes(busqueda.toLowerCase());
    const coincideIntegrantes = p.members?.some(m => m.name.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideNombre || coincideIntegrantes;
  });

  const iniciales = nombreUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* HEADER DE LA SECCIÓN */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 leading-none mb-1">Proyectos asignados</h2>
          <p className="text-xs text-gray-400">Bienvenido, {nombreUsuario}</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {iniciales}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{nombreUsuario}</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* BANNER DE INFORMACIÓN */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Solo puedes revisar los proyectos que te han sido asignados por los estudiantes para evaluarlos.
        </p>
      </div>

      {/* CONTENEDOR DE LA TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/40 w-full max-w-full">
        
        {/* ENCABEZADO CON FILTRO DE BÚSQUEDA */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Mis proyectos asignados</h3>
          
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* TABLA DE PROYECTOS RESPONSIVA */}
        <div className="overflow-x-auto w-full">
          {cargando ? (
            <div className="text-center py-12 text-xs text-gray-400 font-medium">
              Cargando proyectos asignados...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3.5">Proyecto</th>
                  <th className="px-6 py-3.5">Integrantes</th>
                  <th className="px-6 py-3.5">Líder / Creador</th>
                  <th className="px-6 py-3.5">Progreso</th>
                  <th className="px-6 py-3.5">Fecha de entrega</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                {proyectosFiltrados.length > 0 ? (
                  proyectosFiltrados.map((p) => {
                    const lider = p.members?.[0]?.name || 'Estudiante';
                    const totalIntegrantes = p.members?.length || 1;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-950 whitespace-nowrap">{p.name}</td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{totalIntegrantes} integrantes</td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{lider}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 w-24">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }}></div>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatearFecha(p.endDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${statusBadgeStyle(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/evaluador-detalle?projectId=${p.id}`} className="text-blue-600 font-bold hover:text-blue-700 text-[12px]">
                            Ver detalle →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-gray-400 font-medium space-y-2">
                      <FolderOpen size={28} className="mx-auto text-gray-300 mb-1" />
                      <p>No tienes proyectos asignados actualmente para evaluar.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* CONTADOR DE REGISTROS */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Mostrando {proyectosFiltrados.length} de {proyectos.length} proyectos asignados
          </p>
        </div>

      </div>
    </div>
  );
};