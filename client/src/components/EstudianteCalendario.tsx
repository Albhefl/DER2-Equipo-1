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

  const monthName = new Date(year, month, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const eventColors: Record<string, string> = {
    reunion: 'bg-indigo-100 text-indigo-700',
    entrega: 'bg-red-100 text-red-700',
    actividad: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <div className="p-6 flex flex-col gap-5 w-full font-sans antialiased text-gray-900">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Visualización de fechas y entregas de tus proyectos</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar evento..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-300 transition" 
          />
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (month === 0) { setMonth(11); setYear(y => y - 1); } 
              else { setMonth(m => m - 1); }
            }} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold px-2 capitalize">{monthName}</span>
          <button 
            onClick={() => {
              if (month === 11) { setMonth(0); setYear(y => y + 1); } 
              else { setMonth(m => m + 1); }
            }} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const fechaStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const eventosDia = day ? eventos.filter(ev => ev.date === fechaStr && ev.title.toLowerCase().includes(search.toLowerCase())) : [];
            const esHoy = day === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();

            return (
              <div key={i} className={`min-h-[105px] border-b border-r border-gray-100 p-2 ${!day ? 'bg-gray-50/40' : 'hover:bg-gray-50/50 transition'}`}>
                {day && (
                  <>
                    <span className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full ${esHoy ? 'bg-black text-white' : 'text-gray-800'}`}>
                      {day}
                    </span>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {eventosDia.map((ev, j) => (
                        <div key={j} className={`text-[10px] px-1.5 py-0.5 rounded font-bold truncate ${eventColors[ev.type] || 'bg-blue-100 text-blue-700'}`} title={ev.title}>
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