import React from 'react';
import { Clock, PlayCircle, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export type EstadoActividad = "PENDING" | "IN_PROCESS" | "IN_REVIEW" | "DONE";

export interface ActividadResumen {
  id: string;
  status: EstadoActividad;
}

interface ResumenActividadesProps {
  actividades: ActividadResumen[];
}

export const ResumenActividadesCards: React.FC<ResumenActividadesProps> = ({ actividades }) => {
  const total = actividades.length;
  const pendientes = actividades.filter(a => a.status === 'PENDING').length;
  const enProceso = actividades.filter(a => a.status === 'IN_PROCESS').length;
  const enRevision = actividades.filter(a => a.status === 'IN_REVIEW').length;
  const completadas = actividades.filter(a => a.status === 'DONE').length;

  const cards = [
    {
      titulo: 'Pendientes',
      conteo: pendientes,
      colorIcono: 'text-slate-500',
      bgIcono: 'bg-slate-100',
      borderCard: 'border-slate-100',
      icono: Clock,
    },
    {
      titulo: 'En Proceso',
      conteo: enProceso,
      colorIcono: 'text-blue-600',
      bgIcono: 'bg-blue-50',
      borderCard: 'border-blue-100/60',
      icono: PlayCircle,
    },
    {
      titulo: 'En Revisión',
      conteo: enRevision,
      colorIcono: 'text-amber-600',
      bgIcono: 'bg-amber-50',
      borderCard: 'border-amber-100/60',
      icono: AlertCircle,
    },
    {
      titulo: 'Completadas',
      conteo: completadas,
      colorIcono: 'text-emerald-600',
      bgIcono: 'bg-emerald-50',
      borderCard: 'border-emerald-100/60',
      icono: CheckCircle2,
    },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-blue-600" />
          Resumen de actividades por estado
        </h3>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
          Total: {total}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {cards.map((c) => {
          const IconComponent = c.icono;
          const porcentaje = total > 0 ? Math.round((c.conteo / total) * 100) : 0;

          return (
            <div
              key={c.titulo}
              className={`bg-white p-4 rounded-2xl border ${c.borderCard} shadow-sm shadow-gray-100/40 flex items-center justify-between transition-all hover:shadow-md`}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  {c.titulo}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-gray-900 leading-none">
                    {c.conteo}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    ({porcentaje}%)
                  </span>
                </div>
              </div>

              <div className={`w-10 h-10 ${c.bgIcono} ${c.colorIcono} rounded-xl flex items-center justify-center shrink-0`}>
                <IconComponent size={20} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumenActividadesCards;