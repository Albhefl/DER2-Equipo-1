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
      colorIcono: 'text-[#4b5563]',
      bgIcono: 'bg-[#f3f4f6]',
      borderCard: 'border-border',
      icono: Clock,
    },
    {
      titulo: 'En Proceso',
      conteo: enProceso,
      colorIcono: 'text-[#1d4ed8]',
      bgIcono: 'bg-[#dbeafe]',
      borderCard: 'border-[#1d4ed8]/20',
      icono: PlayCircle,
    },
    {
      titulo: 'En Revisión',
      conteo: enRevision,
      colorIcono: 'text-[#b45309]',
      bgIcono: 'bg-[#fef3c7]',
      borderCard: 'border-[#b45309]/20',
      icono: AlertCircle,
    },
    {
      titulo: 'Completadas',
      conteo: completadas,
      colorIcono: 'text-[#15803d]',
      bgIcono: 'bg-[#dcfce7]',
      borderCard: 'border-[#15803d]/20',
      icono: CheckCircle2,
    },
  ];

  return (
    <div className="w-full space-y-3 font-['Inter',sans-serif]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-[#1a1d2e] lowercase first-letter:uppercase flex items-center gap-2">
          <Layers size={14} className="text-[#1a1d2e]" />
          resumen de actividades por estado
        </h3>
        <span className="text-xs font-bold text-[#6b7280] bg-[#eef0f6] px-2.5 py-0.5 rounded-full">
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
              className={`bg-white p-4 rounded-2xl border ${c.borderCard} shadow-sm flex items-center justify-between transition-all hover:shadow-md`}
            >
              <div className="space-y-1">
                <p className="text-[11px] sm:text-xs font-medium text-[#6b7280] lowercase first-letter:uppercase">
                  {c.titulo}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#1a1d2e] leading-none">
                    {c.conteo}
                  </span>
                  <span className="text-[10px] font-bold text-foreground-muted">
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
