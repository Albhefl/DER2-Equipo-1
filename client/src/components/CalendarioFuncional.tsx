import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const API_ACTIVIDADES_URL = "http://localhost:3000/api/actividades";

export type EventoCalendario = {
  id: string;
  title: string;
  date: Date;
  type: "reunion" | "entrega" | "actividad";
};

export const CalendarioFuncional: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // Junio 2025 (Como en Figma)
  const [actividadesApi, setActividadesApi] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [viewMode, setViewMode] = useState<string>("Mes");

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_ACTIVIDADES_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setActividadesApi(data.actividades || []);
      } catch (err) {
        console.error("Error al obtener actividades", err);
      }
    };
    fetchActividades();
  }, []);

  // Eventos mapeados
  const eventosTotales: EventoCalendario[] = [
    { id: '1', title: 'Reunión de avance', date: new Date(2025, 5, 3), type: 'reunion' },
    { id: '2', title: 'Entrega prueba', date: new Date(2025, 5, 10), type: 'entrega' },
    { id: '3', title: 'Diseño de interfaz', date: new Date(2025, 5, 12), type: 'actividad' },
    { id: '4', title: 'Revisión con equipo', date: new Date(2025, 5, 17), type: 'reunion' },
    { id: '5', title: 'Entrega final', date: new Date(2025, 5, 24), type: 'entrega' },
    { id: '6', title: 'Diseño de etapa', date: new Date(2025, 5, 27), type: 'actividad' },
    ...actividadesApi.map(a => ({
      id: String(a.id),
      title: a.name || 'Actividad',
      date: new Date(a.deadline || Date.now()),
      type: 'actividad' as const
    }))
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Formato exacto de Figma: "Junio De 2025"
  const nombreMes = currentDate.toLocaleString("es-ES", { month: "long" });
  const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
  const textoFechaHeader = `${mesCapitalizado} De ${year}`;

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventosFiltrados = eventosTotales.filter(e => {
    const coincideTipo = filterType === "Todos" || 
      (filterType === "Reuniones" && e.type === "reunion") ||
      (filterType === "Actividades" && e.type === "actividad") ||
      (filterType === "Entregas" && e.type === "entrega");

    const coincideBusqueda = e.title.toLowerCase().includes(search.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  // Estilos de píldoras exactos a Figma
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'reunion': return 'bg-blue-100/70 text-blue-700';
      case 'entrega': return 'bg-red-100/70 text-red-700';
      case 'actividad': return 'bg-emerald-100/70 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventosParaDia = (day: number) => {
    return eventosFiltrados.filter(e => 
      e.date.getFullYear() === year &&
      e.date.getMonth() === month &&
      e.date.getDate() === day
    );
  };

  // Lista estática/dinámica de próximos eventos estilo Figma
  const proximosEventosMock = [
    { title: "Definir alcance", date: "17/06/2025", relative: "En 2 días" },
    { title: "Diseño de interfaz", date: "20/06/2025", relative: "En 5 días" },
    { title: "Revisión con equipo", date: "24/06/2025", relative: "En 9 días" },
    { title: "Entrega wireframes", date: "27/06/2025", relative: "En 12 días" },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 w-full box-border font-sans">
      
      {/* TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendario</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
      </div>

      {/* CONTENEDOR PRINCIPAL DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: BUSCADOR + GRILLA (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* BARRA SUPERIOR CON CONTROLES IGUAL A FIGMA */}
          <div className="flex items-center justify-between gap-3">
            
            {/* BUSCADOR Y DROPDOWNS */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar evento o entrega..." 
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                />
              </div>

              {/* DROPDOWN MES */}
              <select 
                value={viewMode}
                onChange={e => setViewMode(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="Mes">Mes</option>
                <option value="Semana">Semana</option>
                <option value="Día">Día</option>
              </select>

              {/* DROPDOWN TODOS */}
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Reuniones">Reuniones</option>
                <option value="Actividades">Actividades</option>
                <option value="Entregas">Entregas</option>
              </select>
            </div>

            {/* NAV DE MES EN LA DERECHA DE LA SECCIÓN */}
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-600 transition">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-gray-900 min-w-[90px] text-center">
                {textoFechaHeader}
              </span>
              <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-600 transition">
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

          {/* GRILLA DEL CALENDARIO FIGMA STYLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 overflow-hidden">
            
            {/* DIAS DE LA SEMANA */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-600">
                  {d}
                </div>
              ))}
            </div>

            {/* CASILLAS DE DIAS */}
            <div className="grid grid-cols-7 border-collapse">
              {daysArray.map((day, i) => {
                const eventosDia = day ? getEventosParaDia(day) : [];
                const esDia15 = day === 15; // Círculo negro del día 15 en Figma

                return (
                  <div 
                    key={i} 
                    className={`min-h-[85px] border-b border-r border-gray-100 p-1.5 flex flex-col justify-between ${
                      !day ? "bg-gray-50/20" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start">
                          <span className={`text-[11px] font-semibold flex items-center justify-center w-5 h-5 rounded-full ${
                            esDia15 ? "bg-black text-white font-bold" : "text-gray-700"
                          }`}>
                            {day}
                          </span>
                        </div>

                        {/* LISTA DE PÍLDORAS ANCHAS */}
                        <div className="mt-1 flex flex-col gap-1">
                          {eventosDia.map((ev) => (
                            <div 
                              key={ev.id} 
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate w-full ${getEventStyle(ev.type)}`}
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

        {/* COLUMNA DERECHA: PRÓXIMOS EVENTOS (FIGMA STYLE) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-gray-100/40 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">
            Próximos eventos
          </h3>

          <div className="space-y-4">
            {proximosEventosMock.map((e, i) => (
              <div key={i} className="space-y-0.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">{e.title}</p>
                <p className="text-[10px] text-gray-400 font-medium">{e.date}</p>
                <p className="text-[10px] text-gray-400 font-medium">{e.relative}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CalendarioFuncional;