import React from 'react';

interface ProgressBarProps {
  totalActividades: number;
  completadasActividades: number;
  titulo?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalActividades,
  completadasActividades,
  titulo = 'Progreso General del Proyecto',
}) => {
  // HU-030: Cálculo dinámico del porcentaje
  const porcentaje =
    totalActividades > 0
      ? Math.round((completadasActividades / totalActividades) * 100)
      : 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-2.5 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-800 uppercase tracking-wider">
          {titulo}
        </span>
        <span className="font-extrabold text-blue-600 text-sm">
          {porcentaje}%
        </span>
      </div>

      {/* Barra visual de progreso */}
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-gray-400 font-medium pt-0.5">
        <span>
          {completadasActividades} de {totalActividades} tareas completadas
        </span>
        <span>{totalActividades - completadasActividades} pendientes</span>
      </div>
    </div>
  );
};

export default ProgressBar;