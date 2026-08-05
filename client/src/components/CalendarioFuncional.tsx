import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { API_BASE_URL } from '../config/apis';

interface EventoCalendario {
  id?: string;
  title: string;
  date: string; // Formato 'YYYY-MM-DD'
  type: 'reunion' | 'entrega' | 'actividad';
  projectId?: string;
}

export const CalendarioFuncional: React.FC = () => {
  const navigate = useNavigate();
  
  // 🟢 Inicializar automáticamente con el mes y año actual del sistema
  const hoy = new Date();
  const [month, setMonth] = useState(hoy.getMonth());
  const [year, setYear] = useState(hoy.getFullYear());
  
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [search, setSearch] = useState('');

  // 🟢 Obtener proyectos y actividades reales del backend
  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Obtener proyectos
        const resProyectos = await fetch(`${API_BASE_URL}/actividades/proyectos`, { headers });
        let evs: EventoCalendario[] = [];

        if (resProyectos.ok) {
          const data = await resProyectos.json();
          const proyectos = data.proyectos || [];
          
          proyectos.forEach((p: any) => {
            if (p.startDate) {
              evs.push({
                id: p.id,
                title: `Inicio: ${p.name}`,
                date: p.startDate.split('T')[0],
                type: 'actividad',
                projectId: p.id
              });
            }
            if (p.endDate) {
              evs.push({
                id: p.id,
                title: `Cierre: ${p.name}`,
                date: p.endDate.split('T')[0],
                type: 'entrega',
                projectId: p.id
              });
            }
          });
        }

        // Obtener actividades (si el endpoint está disponible)
        try {
          const resActividades = await fetch(`${API_BASE_URL}/actividades`, { headers });
          if (resActividades.ok) {
            const dataAct = await resActividades.json();
            const actividades = dataAct.actividades || [];
            actividades.forEach((a: any) => {
              if (a.dueDate) {
                evs.push({
                  id: a.id,
                  title: a.title,
                  date: a.dueDate.split('T')[0],
                  type: 'actividad',
                  projectId: a.projectId
                });
              }
            });
          }
        } catch (e) {
          // Si el endpoint de actividades no está activo, se mantiene con los proyectos
        }

        setEventos(evs);
      } catch (err) {
        console.error('Error al cargar datos del calendario:', err);
      }
    };

    obtenerDatos();
  }, []);

  const monthName = new Date(year, month, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Arreglo tipado correctamente para evitar errores de TypeScript
  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const eventColors: Record<string, string> = {
    reunion: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    entrega: 'bg-red-100 text-red-700 hover:bg-red-200',
    actividad: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
  };

  const handleEventClick = (_ev: EventoCalendario) => {
    // Al dar clic en un evento, redirige a la vista de proyectos
    navigate('/estudiante-proyectos');
  };

  return (
    <div className="p-6 flex flex-col gap-5 w-full font-sans antialiased text-gray-900 box-border">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Cronograma de proyectos y actividades institucionales</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar evento o actividad..." 
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
              <div key={i} className={`min-h-[110px] border-b border-r border-gray-100 p-2 ${!day ? 'bg-gray-50/40' : 'hover:bg-gray-50/50 transition'}`}>
                {day && (
                  <>
                    <span className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full ${esHoy ? 'bg-black text-white' : 'text-gray-800'}`}>
                      {day}
                    </span>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {eventosDia.map((ev, j) => (
                        <div 
                          key={j} 
                          onClick={() => handleEventClick(ev)}
                          className={`text-[10px] px-1.5 py-1 rounded font-bold truncate cursor-pointer transition shadow-xs ${eventColors[ev.type] || 'bg-blue-100 text-blue-700'}`}
                          title={`${ev.title} (Haz clic para ir al proyecto)`}
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