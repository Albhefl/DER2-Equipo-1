import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface EventoCalendario {
  title: string;
  date: string; // Formato 'YYYY-MM-DD'
  type: 'reunion' | 'entrega' | 'actividad';
}

export const CalendarioFuncional: React.FC = () => {
  // 🟢 Inicializar con el mes y año actuales del sistema
  const hoy = new Date();
  const [month, setMonth] = useState(hoy.getMonth());
  const [year, setYear] = useState(hoy.getFullYear());

  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [search, setSearch] = useState('');

  // 🟢 Obtener datos reales del backend al abrir el calendario
  useEffect(() => {
    const obtenerDatosCalendario = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/actividades/proyectos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const listaProyectos = data.proyectos || [];

          // Mapear las fechas reales de inicio y cierre de los proyectos a eventos del calendario
          const evs: EventoCalendario[] = [];

          listaProyectos.forEach((p: any) => {
            if (p.startDate) {
              evs.push({
                title: `Inicio: ${p.name}`,
                date: p.startDate.split('T')[0],
                type: 'actividad'
              });
            }

            if (p.endDate) {
              evs.push({
                title: `Cierre: ${p.name}`,
                date: p.endDate.split('T')[0],
                type: 'entrega'
              });
            }
          });

          setEventos(evs);
        }
      } catch (err) {
        console.error('Error al cargar datos del calendario:', err);
      }
    };

    obtenerDatosCalendario();
  }, []);

  const monthName = new Date(year, month, 1).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const eventColors: Record<string, string> = {
    reunion:
      'bg-blue-100 text-blue-700 border border-blue-100',
    entrega:
      'bg-amber-100 text-amber-700 border border-amber-100',
    actividad:
      'bg-green-100 text-green-700 border border-green-100'
  };

  return (
    <div
      className="
        w-full min-w-0 max-w-full overflow-hidden
        flex flex-col gap-5
        p-4 sm:p-6
        antialiased
      "
      style={{
        backgroundColor: '#f4f5f8',
        color: '#1a1d2e',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      {/* Encabezado */}
      <div className="min-w-0">
        <h1
          className="
            text-xl sm:text-2xl
            font-bold
            tracking-tight
            truncate
          "
          style={{ color: '#1a1d2e' }}
        >
          Calendario
        </h1>

        <p
          className="
            mt-1
            text-xs sm:text-sm
            font-medium
            leading-relaxed
            truncate
          "
          style={{ color: '#6b7280' }}
        >
          Visualización de fechas y entregas de tus proyectos
        </p>
      </div>

      {/* Buscador + navegación */}
      <div
        className="
          w-full min-w-0
          flex flex-col sm:flex-row
          sm:items-center sm:justify-between
          gap-3
        "
      >
        {/* Buscador */}
        <div className="relative w-full sm:max-w-xs min-w-0">
          <Search
            size={15}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              pointer-events-none
            "
            style={{ color: '#9ca3af' }}
          />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar evento..."
            className="
              w-full min-w-0
              h-10
              pl-9 pr-3
              rounded-xl
              text-xs sm:text-sm
              font-medium
              outline-none
              transition-all
              placeholder:text-gray-400
              focus:ring-2
            "
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#1a1d2e'
            }}
          />
        </div>

        {/* Navegación del mes */}
        <div
          className="
            w-full sm:w-auto
            min-w-0
            flex items-center
            justify-between sm:justify-end
            gap-1
          "
        >
          <button
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear(y => y - 1);
              } else {
                setMonth(m => m - 1);
              }
            }}
            className="
              shrink-0
              w-9 h-9
              flex items-center justify-center
              rounded-xl
              transition-colors
              cursor-pointer
            "
            style={{ color: '#6b7280' }}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={17} />
          </button>

          <span
            className="
              min-w-0
              flex-1 sm:flex-none
              px-2
              text-sm
              font-bold
              text-center
              capitalize
              truncate
            "
            style={{ color: '#1a1d2e' }}
          >
            {monthName}
          </span>

          <button
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear(y => y + 1);
              } else {
                setMonth(m => m + 1);
              }
            }}
            className="
              shrink-0
              w-9 h-9
              flex items-center justify-center
              rounded-xl
              transition-colors
              cursor-pointer
            "
            style={{ color: '#6b7280' }}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div
        className="
          w-full min-w-0 max-w-full
          rounded-2xl
          overflow-hidden
          bg-white
        "
        style={{
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        {/* Días de la semana */}
        <div
          className="grid grid-cols-7"
          style={{
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div
              key={d}
              className="
                min-w-0
                py-2.5 sm:py-3
                px-1
                text-center
                text-[9px] sm:text-[10px]
                font-bold
                uppercase
                tracking-wider
                truncate
              "
              style={{ color: '#9ca3af' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 min-w-0">
          {days.map((day, i) => {
            const fechaStr = day
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : '';

            const eventosDia = day
              ? eventos.filter(
                  ev =>
                    ev.date === fechaStr &&
                    ev.title.toLowerCase().includes(search.toLowerCase())
                )
              : [];

            const esHoy =
              day === hoy.getDate() &&
              month === hoy.getMonth() &&
              year === hoy.getFullYear();

            return (
              <div
                key={i}
                className="
                  min-w-0
                  min-h-22.5 sm:min-h-26.25
                  p-1.5 sm:p-2
                  transition-colors
                  overflow-hidden
                "
                style={{
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  borderRight: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: !day
                    ? 'rgba(248,250,252,0.6)'
                    : '#ffffff'
                }}
              >
                {day && (
                  <>
                    {/* Número del día */}
                    <span
                      className="
                        inline-flex
                        w-6 h-6
                        items-center
                        justify-center
                        rounded-full
                        text-[11px] sm:text-xs
                        font-bold
                        shrink-0
                      "
                      style={
                        esHoy
                          ? {
                              backgroundColor: '#4f46e5',
                              color: '#ffffff'
                            }
                          : {
                              color: '#1a1d2e'
                            }
                      }
                    >
                      {day}
                    </span>

                    {/* Eventos */}
                    <div className="mt-1.5 flex flex-col gap-1 min-w-0">
                      {eventosDia.map((ev, j) => (
                        <div
                          key={j}
                          className={`
                            min-w-0
                            max-w-full
                            overflow-hidden
                            text-[9px] sm:text-[10px]
                            leading-4
                            px-1.5
                            py-0.5
                            rounded-md
                            font-semibold
                            truncate
                            ${eventColors[ev.type] || 'bg-blue-100 text-blue-700'}
                          `}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarioFuncional;