import React, { useState } from 'react';
import { Search, Plus, Edit2, X, LayoutGrid, Clock, AlertCircle, Eye, CheckCircle2 } from 'lucide-react';

// ─── MOCK DATA LOCAL OPTIMIZADO ──────────────────────────────────────────────
const KANBAN_COLUMNS = ["Pendiente", "En Proceso", "En Revisión", "Completado"];

const KANBAN_INIT = {
  "Pendiente": [
    { id: 1, title: "Investigar usuarios", responsible: "Ana García", priority: "Alta", dueDate: "23/05/2025" },
    { id: 5, title: "Reunión de equipo", responsible: "Juan Pérez", priority: "Media", dueDate: "22/05/2025" },
  ],
  "En Proceso": [
    { id: 2, title: "Definir alcance", responsible: "María González", priority: "Media", dueDate: "25/05/2025" },
    { id: 6, title: "Documentar API", responsible: "Carlos López", priority: "Alta", dueDate: "26/05/2025" },
    { id: 7, title: "Configurar entorno", responsible: "Ana García", priority: "Baja", dueDate: "20/05/2025" },
  ],
  "En Revisión": [
    { id: 3, title: "Diseño de interfaz", responsible: "Carlos López", priority: "Alta", dueDate: "27/05/2025" },
  ],
  "Completado": [
    { id: 4, title: "Pruebas de usabilidad", responsible: "Juan Pérez", priority: "Baja", dueDate: "30/05/2025" },
    { id: 8, title: "Análisis inicial", responsible: "María González", priority: "Media", dueDate: "15/05/2025" },
  ],
};

type KanbanCard = { id: number; title: string; responsible: string; priority: string; dueDate: string };
type EditDraft = { title: string; responsible: string; priority: string; dueDate: string; status: string };

// ─── UTILS DE ESTILOS DE ACUERDO A FIGMA ─────────────────────────────────────
function priorityBg(p: string) {
  if (p === "Alta") return "bg-red-50 text-red-600 border border-red-100";
  if (p === "Media") return "bg-amber-50 text-amber-600 border border-amber-100";
  return "bg-green-50 text-green-600 border border-green-100";
}

function columnStyle(col: string) {
  switch (col) {
    case "Pendiente": return { border: "border-gray-200", header: "bg-gray-50/75 text-gray-700", dot: "bg-gray-400" };
    case "En Proceso": return { border: "border-blue-100", header: "bg-blue-50/60 text-blue-700", dot: "bg-blue-500" };
    case "En Revisión": return { border: "border-amber-100", header: "bg-amber-50/60 text-amber-700", dot: "bg-amber-500" };
    case "Completado": return { border: "border-green-100", header: "bg-green-50/60 text-green-700", dot: "bg-green-500" };
    default: return { border: "border-gray-200", header: "bg-gray-50 text-gray-700", dot: "bg-gray-400" };
  }
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export const EstudianteKanban: React.FC = () => {
  const [columns, setColumns] = useState<Record<string, KanbanCard[]>>(KANBAN_INIT);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<{ col: string; card: KanbanCard } | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const openEdit = (col: string, card: KanbanCard) => {
    setEditModal({ col, card });
    setEditDraft({ title: card.title, responsible: card.responsible, priority: card.priority, dueDate: card.dueDate, status: col });
  };

  const saveEdit = () => {
    if (!editModal || !editDraft) return;
    const { col, card } = editModal;
    const updated = { ...card, title: editDraft.title, responsible: editDraft.responsible, priority: editDraft.priority, dueDate: editDraft.dueDate };
    
    setColumns(prev => {
      const next = { ...prev };
      next[col] = next[col].filter(c => c.id !== card.id);
      next[editDraft.status] = [...next[editDraft.status], updated];
      return next;
    });
    setEditModal(null);
    setEditDraft(null);
  };

  const addCard = (col: string) => {
    const title = prompt(`Nueva actividad en "${col}":`) ?? "";
    if (!title.trim()) return;
    setColumns(prev => ({
      ...prev,
      [col]: [...prev[col], { id: Date.now(), title, responsible: "Ana García", priority: "Media", dueDate: "2025-06-30" }],
    }));
  };

  const removeCard = (col: string, id: number) =>
    setColumns(prev => ({ ...prev, [col]: prev[col].filter(c => c.id !== id) }));

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      {/* HEADER ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tablero Kanban</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarjeta..." 
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-all text-gray-700 shadow-sm shadow-gray-100/40" 
            />
          </div>
        </div>
      </div>

      {/* REJILLA RESPONSIVA DE COLUMNAS (1 columna en móviles, 2 en tablets, 4 en lg de escritorio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-start box-border">
        {KANBAN_COLUMNS.map(col => {
          const style = columnStyle(col);
          const filteredCards = columns[col].filter(card => 
            card.title.toLowerCase().includes(search.toLowerCase())
          );

          return (
            <div key={col} className={`flex flex-col rounded-2xl border ${style.border} bg-white shadow-sm shadow-gray-100/30 overflow-hidden w-full`}>
              {/* HEADER DE COLUMNA */}
              <div className={`px-4 py-3 flex items-center justify-between border-b border-inherit ${style.header}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{col}</span>
                </div>
                <span className="text-xs font-bold bg-white border border-inherit px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{filteredCards.length}</span>
              </div>

              {/* CUERPO DE TARJETAS */}
              <div className="p-3 flex flex-col gap-3 min-h-[150px] max-h-[500px] overflow-y-auto bg-gray-50/30">
                {filteredCards.map(card => (
                  <div key={card.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-gray-800 leading-snug flex-1">{card.title}</p>
                      <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                        <button onClick={() => openEdit(col, card)} className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => removeCard(col, card.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0 border border-blue-100">
                          {initials(card.responsible)}
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold truncate">{card.responsible}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${priorityBg(card.priority)}`}>
                        {card.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold tracking-tight pt-1 border-t border-gray-50 flex items-center gap-1">
                      <Clock size={10} /> {card.dueDate}
                    </div>
                  </div>
                ))}

                {filteredCards.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-white/50">
                    No hay actividades
                  </div>
                )}
              </div>

              {/* ACCIÓN AÑADIR ACTIVIDAD */}
              <div className="p-2 border-t border-inherit bg-gray-50/50">
                <button 
                  onClick={() => addCard(col)} 
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-100 transition-all"
                >
                  <Plus size={14} /> Agregar actividad
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 font-medium text-center">Despliega o gestiona las actividades usando los controles de estado de cada tarjeta.</p>

      {/* VENTANA MODAL PARA EDICIÓN DE TARJETAS (Idéntico a tus estilos controlados de perfil) */}
      {editModal && editDraft && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl space-y-4 relative box-border" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Editar tarjeta</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título</label>
                <input type="text" value={editDraft.title} onChange={e => setEditDraft(d => d && ({ ...d, title: e.target.value }))} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Responsable</label>
                <select value={editDraft.responsible} onChange={e => setEditDraft(d => d && ({ ...d, responsible: e.target.value }))} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border">
                  {["Ana García", "Juan Pérez", "María González", "Carlos López"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Prioridad</label>
                <select value={editDraft.priority} onChange={e => setEditDraft(d => d && ({ ...d, priority: e.target.value }))} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border">
                  {["Alta", "Media", "Baja"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha límite</label>
                <input type="date" value={editDraft.dueDate} onChange={e => setEditDraft(d => d && ({ ...d, dueDate: e.target.value }))} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado</label>
                <select value={editDraft.status} onChange={e => setEditDraft(d => d && ({ ...d, status: e.target.value }))} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 transition-all box-border">
                  {["Pendiente", "En Proceso", "En Revisión", "Completado"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-50">
              <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button type="button" onClick={saveEdit} className="px-4 py-2 text-xs font-bold text-white bg-[#1a1d2e] hover:bg-[#11131f] rounded-xl transition-colors shadow-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};