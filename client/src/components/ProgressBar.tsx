import React from 'react';

interface ProgressBarProps {
  totalActividades: number;
  completadasActividades: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalActividades,
  completadasActividades,
}) => {
  const porcentaje = totalActividades > 0 
    ? Math.round((completadasActividades / totalActividades) * 100) 
    : 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-3 font-['Inter',sans-serif]">
      
      {/* LÍNEA SUPERIOR: TÍTULO PORCENTAJE A LA DERECHA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-[#1a1d2e] lowercase first-letter:uppercase">
            Progreso del proyecto
          </h3>
        </div>
        <span className="text-xs font-extrabold text-[#1a1d2e]">
          {porcentaje}%
        </span>
      </div>

      {/* TEXTO SECUNDARIO ABAJO DEL TÍTULO */}
      <div className="text-[11px] text-[#6b7280] font-medium">
        {completadasActividades} de {totalActividades} Actividades completadas
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full bg-[#eef0f6] h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-[#1a1d2e] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

    </div>
  );
};

export default ProgressBar;
