import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

type Miembro = { id: string; name: string };
type Responsable = { user: Miembro };

export type ActividadGrafico = {
  id: string;
  assignees?: Responsable[];
  projectId?: string | null;
};

interface Props {
  actividades: ActividadGrafico[];
  miembrosEquipo?: Miembro[]; // Opcional o se puede omitir si filtramos por asignaciones directas del proyecto
}

export const GraficoActividadesResponsables: React.FC<Props> = ({ actividades }) => {
  // 1. Agrupar la carga de trabajo exclusivamente por los responsables presentes en las actividades del proyecto actual
  const mapaConteo: Record<string, { nombre: string; total: number }> = {};

  let sinAsignarCount = 0;

  // Contabilizar actividades asignadas filtrando estrictamente al proyecto visible
  actividades.forEach(act => {
    if (!act.assignees || act.assignees.length === 0) {
      sinAsignarCount++;
    } else {
      act.assignees.forEach(r => {
        if (!r.user || !r.user.id) return;
        if (!mapaConteo[r.user.id]) {
          mapaConteo[r.user.id] = { nombre: r.user.name || 'Usuario', total: 0 };
        }
        mapaConteo[r.user.id].total += 1;
      });
    }
  });

  // Convertir a arreglo
  const datos = Object.values(mapaConteo);
  if (sinAsignarCount > 0) {
    datos.push({ nombre: 'Sin Asignar', total: sinAsignarCount });
  }

  const maxActividades = Math.max(...datos.map(d => d.total), 1);
  const totalActividadesGlobal = actividades.length;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full">
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1a1d2e] lowercase first-letter:uppercase">
              Carga de trabajo por responsable
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Distribución de actividades entre el equipo del proyecto
            </p>
          </div>
        </div>
      </div>

      {datos.length === 0 || totalActividadesGlobal === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 font-medium border border-dashed border-gray-100 rounded-xl">
          No hay actividades registradas para mostrar el gráfico en este proyecto.
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {datos.map((item, index) => {
            const porcentajeRelativo = Math.round((item.total / maxActividades) * 100);
            const porcentajeGlobal = totalActividadesGlobal > 0 
              ? Math.round((item.total / totalActividadesGlobal) * 100) 
              : 0;
            const esSinAsignar = item.nombre === 'Sin Asignar';

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold flex items-center gap-1.5 ${esSinAsignar ? 'text-amber-600 italic' : 'text-gray-700'}`}>
                    {esSinAsignar && <AlertCircle size={13} className="shrink-0" />}
                    {item.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">{item.total} tareas</span>
                    <span className="text-[10px] text-gray-400 font-medium">({porcentajeGlobal}%)</span>
                  </div>
                </div>

                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden p-0.5 border border-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      esSinAsignar 
                        ? 'bg-amber-400' 
                        : 'bg-[#1a1d2e]'
                    }`}
                    style={{ width: `${porcentajeRelativo}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GraficoActividadesResponsables;