import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Clock, CheckCircle2, Eye, FileText, Paperclip, Package, Upload, Trash2, Link as LinkIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config/apis';

const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;

type EstadoEntrega = 'Pendiente' | 'En Revisión' | 'Aprobado' | 'Completada';

interface EvidenciaItem {
  id: string;
  url: string;
  isLink: boolean;
}

interface Entrega {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  format: string;
  status: EstadoEntrega;
  evidence?: EvidenciaItem[];
}

function StatCardEntrega({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export const EntregasPage: React.FC = () => {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [entregaTargetId, setEntregaTargetId] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchEntregasReal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ACTIVIDADES_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const listaRaw = data.actividades || data || [];

        const listaMapeada: Entrega[] = listaRaw.map((a: any) => {
          let st: EstadoEntrega = 'Pendiente';
          if (a.status === 'IN_REVIEW' || a.status === 'En Revisión') st = 'En Revisión';
          if (a.status === 'APPROVED' || a.status === 'Aprobado') st = 'Aprobado';
          if (a.status === 'DONE' || a.status === 'Completado' || a.status === 'Completada') st = 'Completada';

          const listaEvidencias = a.evidencias || a.evidence || [];
          const evidenciasLimpias = listaEvidencias
            .filter((e: any) => e && (e.url || e.contenido) && !String(e.url || e.contenido).includes('undefined'))
            .map((e: any) => {
              const urlVal = String(e.url || e.contenido);
              return {
                id: String(e.id || Date.now()),
                url: urlVal,
                isLink: urlVal.startsWith('http://') || urlVal.startsWith('https://')
              };
            });

          return {
            id: String(a.id),
            title: a.name || a.title || 'Entrega de proyecto',
            description: a.description || 'Sub reporte de hallazgos y evidencias correspondientes.',
            dueDate: a.deadline ? new Date(a.deadline).toLocaleDateString('es-MX') : 'Sin fecha',
            format: 'PDF / DOCX / LINK',
            status: st,
            evidence: evidenciasLimpias
          };
        });

        setEntregas(listaMapeada);

        if (listaMapeada.length > 0) {
          setSelectedEntrega(prev => {
            if (!prev) return listaMapeada[0];
            const actualizada = listaMapeada.find(item => item.id === prev.id);
            return actualizada || listaMapeada[0];
          });
        }
      }
    } catch (err) {
      console.error('Error al obtener entregas desde la API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntregasReal();
  }, []);

  const abrirModalSubida = (entregaId: string) => {
    setEntregaTargetId(entregaId);
    setLinkInput('');
    setActiveTab('file');
    setModalOpen(true);
  };

  const handleGuardarLink = async () => {
    if (!linkInput.trim() || !entregaTargetId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/${entregaTargetId}/evidencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: linkInput.trim() })
      });

      if (res.ok) {
        await fetchEntregasReal();
      } else {
        alert('Error al guardar el enlace.');
      }
    } catch (err) {
      console.error('Error al guardar link:', err);
    } finally {
      setModalOpen(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !entregaTargetId) return;

    setSubiendo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_ACTIVIDADES_URL}/${entregaTargetId}/evidencias/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        await fetchEntregasReal();
      } else {
        const err = await res.json().catch(() => ({}));
        alert((err as any).message || 'Error al subir el archivo.');
      }
    } catch (err) {
      console.error('Error al subir archivo:', err);
    } finally {
      setSubiendo(false);
      if (e.target) e.target.value = '';
      setModalOpen(false);
    }
  };

  const handleEliminarEvidencia = async (evidenciaId: string) => {
    if (!confirm('¿Deseas eliminar esta evidencia?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ACTIVIDADES_URL}/evidencias/${evidenciaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchEntregasReal();
      }
    } catch (err) {
      console.error('Error al eliminar evidencia:', err);
    }
  };

  const abrirEvidenciaUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const entregasFiltradas = entregas.filter(e => {
    const coincideEstado = filterStatus === 'Todos' || e.status === filterStatus;
    const coincideBusqueda = e.title.toLowerCase().includes(search.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const getBadgeStyle = (status: EstadoEntrega) => {
    switch (status) {
      case 'Pendiente': return 'bg-gray-100/80 text-gray-600 font-bold';
      case 'En Revisión': return 'bg-amber-100/80 text-amber-700 font-bold';
      case 'Aprobado': return 'bg-emerald-100/80 text-emerald-700 font-bold';
      case 'Completada': return 'bg-green-100/80 text-green-700 font-bold';
    }
  };

  const counts = {
    total: entregas.length,
    pendientes: entregas.filter(e => e.status === 'Pendiente').length,
    enRevision: entregas.filter(e => e.status === 'En Revisión').length,
    aprobados: entregas.filter(e => e.status === 'Aprobado').length,
    completadas: entregas.filter(e => e.status === 'Completada').length,
  };

  return (
    <div className="p-6 space-y-5 w-full font-sans antialiased text-gray-900 box-border">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.png,.jpg,.zip"
        className="hidden"
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entregas</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5">Proyecto: ClassBoard Equipo A</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        <StatCardEntrega label="Total" value={counts.total} color="bg-indigo-50 text-indigo-600" icon={<Package size={18} />} />
        <StatCardEntrega label="Pendientes" value={counts.pendientes} color="bg-gray-50 text-gray-400" icon={<Clock size={18} />} />
        <StatCardEntrega label="En Revisión" value={counts.enRevision} color="bg-amber-50 text-amber-600" icon={<Eye size={18} />} />
        <StatCardEntrega label="Aprobados" value={counts.aprobados} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 size={18} />} />
        <StatCardEntrega label="Completadas" value={counts.completadas} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar entrega..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-300 transition"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Todos', 'Pendiente', 'En Revisión', 'Aprobado', 'Completada'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === s
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        {/* LISTA DE ENTREGAS */}
        <div className="flex-1 w-full space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
              Cargando entregas...
            </div>
          ) : entregasFiltradas.length > 0 ? (
            entregasFiltradas.map((e) => {
              const isSelected = selectedEntrega?.id === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEntrega(e)}
                  className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between gap-4 ${
                    isSelected ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="shrink-0 text-slate-800">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs truncate">{e.title}</h4>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{e.description}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        Fecha límite: {e.dueDate} &nbsp;·&nbsp; Formato: {e.format}
                      </p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 bg-white border border-gray-200 shadow-sm text-gray-800 rounded-lg text-[11px] font-bold">
                          ClassBoard Equipo A
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${getBadgeStyle(e.status)}`}>
                      {e.status}
                    </span>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        abrirModalSubida(e.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Upload size={12} /> Subir
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
              No se encontraron entregas.
            </div>
          )}
        </div>

        {/* PANEL DETALLE DERECHO */}
        {selectedEntrega && (
          <div className="w-full lg:w-72 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0 space-y-4 lg:sticky lg:top-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DETALLE DE ENTREGA</p>
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{selectedEntrega.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{selectedEntrega.description}</p>
            </div>

            <div className="space-y-2 border-t border-gray-50 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Estado</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${getBadgeStyle(selectedEntrega.status)}`}>
                  {selectedEntrega.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Fecha límite</span>
                <span className="font-bold text-gray-800">{selectedEntrega.dueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Formato</span>
                <span className="font-bold text-gray-800">{selectedEntrega.format}</span>
              </div>
            </div>

            {/* SECCIÓN EVIDENCIAS */}
            <div className="border-t border-gray-50 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Evidencias ({selectedEntrega.evidence?.length || 0})
              </p>

              {selectedEntrega.evidence && selectedEntrega.evidence.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedEntrega.evidence.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        {ev.isLink ? (
                          <LinkIcon size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <FileText size={13} className="text-slate-700 shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={() => abrirEvidenciaUrl(ev.url)}
                          className="truncate hover:underline text-slate-800 font-bold text-left cursor-pointer"
                          title={ev.url}
                        >
                          {ev.url}
                        </button>
                      </div>
                      <button
                        onClick={() => handleEliminarEvidencia(ev.id)}
                        className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer shrink-0"
                        title="Eliminar evidencia"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin evidencias.</p>
              )}

              <button
                onClick={() => abrirModalSubida(selectedEntrega.id)}
                className="w-full py-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Paperclip size={13} /> Adjuntar archivo o enlace
              </button>
            </div>

            <div className="border-t border-gray-50 pt-3 space-y-2 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historial / próximas entregas</p>
              <div className="space-y-1.5">
                {entregas.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600 text-[11px]">
                    <span className="truncate max-w-[130px] font-medium">{item.title}</span>
                    <span className="font-bold text-gray-800">{item.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADJUNTAR EVIDENCIA */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 relative">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Adjuntar Evidencia</h3>
            <p className="text-xs text-gray-400">Selecciona el tipo de entrega que deseas registrar.</p>

            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Archivo local (PDF/DOCX)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Enlace Web
              </button>
            </div>

            {activeTab === 'file' && (
              <div className="space-y-3 py-2 text-center">
                <div
                  onClick={() => !subiendo && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-gray-400 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center gap-2 bg-gray-50/50"
                >
                  <Upload size={24} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-700">
                    {subiendo ? 'Subiendo archivo...' : 'Haz clic aquí para examinar tus archivos'}
                  </p>
                  <p className="text-[10px] text-gray-400">Formatos soportados: PDF, DOCX, PNG, ZIP</p>
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-3 py-2">
                <label className="block text-xs font-bold text-gray-700">Enlace URL *</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... o https://figma.com/..."
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleGuardarLink}
                  className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition"
                >
                  Guardar enlace
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
