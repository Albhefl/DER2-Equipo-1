import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

type Miembro = { id: string; name: string };
type Responsable = { user: Miembro };

export type ActividadGrafico = {
  id: string;
  assignees?: Responsable[];
};

interface Props {
  actividades: ActividadGrafico[];
  miembrosEquipo?: Miembro[];
}

export const GraficoActividadesResponsables: React.FC<Props> = ({ actividades, miembrosEquipo = [] }) => {
  // 1. Agrupar la carga de trabajo por responsable
  const mapaConteo: Record<string, { nombre: string; total: number }> = {};

  // Inicializar miembros del equipo
  miembrosEquipo.forEach(m => {
    mapaConteo[m.id] = { nombre: m.name, total: 0 };
  });

  let sinAsignarCount = 0;

  // Contabilizar actividades asignadas
  actividades.forEach(act => {
    if (!act.assignees || act.assignees.length === 0) {
      sinAsignarCount++;
    } else {
      act.assignees.forEach(r => {
        if (!mapaConteo[r.user.id]) {
          mapaConteo[r.user.id] = { nombre: r.user.name, total: 0 };
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
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Carga de trabajo por responsable
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Distribución de actividades entre el equipo
            </p>
          </div>
        </div>
      </div>

      {datos.length === 0 || totalActividadesGlobal === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 font-medium border border-dashed border-gray-100 rounded-xl">
          No hay actividades registradas para mostrar el gráfico.
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
                        : 'bg-indigo-600'
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