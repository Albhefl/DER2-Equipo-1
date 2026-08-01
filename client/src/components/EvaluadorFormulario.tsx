import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, FileText, ExternalLink, Paperclip 
} from 'lucide-react';

const API_ACTIVIDADES_URL = 'http://localhost:3000/api/actividades';

interface Criterio {
  id: string;
  nombre: string;
  score: number; // 1 a 5
}

interface Evidencia {
  id: string;
  url: string;
  createdAt?: string;
  creator?: { id: string; name: string };
}

function formatearFecha(f?: string) {
  if (!f) return 'Sin fecha límite';
  const d = new Date(f);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const EvaluadorFormulario: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ID de la Actividad
  const navigate = useNavigate();

  const [actividad, setActividad] = useState<any>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Rúbrica por Criterios para la Actividad
  const [criterios, setCriterios] = useState<Criterio[]>([
    { id: 'funcionalidad', nombre: 'Funcionalidad', score: 4 },
    { id: 'diseno', nombre: 'Diseño e interfaz', score: 4 },
    { id: 'codigo', nombre: 'Código y estructura', score: 3 },
    { id: 'pruebas', nombre: 'Pruebas unitarias', score: 4 },
    { id: 'documentacion', nombre: 'Documentación', score: 2 },
  ]);

  useEffect(() => {
    const cargarDatosActividadYEvidencias = async () => {
      if (!id) return;
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        
        // 1. Cargar detalle de la actividad
        const resAct = await fetch(`${API_ACTIVIDADES_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resAct.ok) {
          const dataAct = await resAct.json();
          setActividad(dataAct.actividad);
        }

        // 2. Cargar evidencias de la actividad (HU-028)
        const resEvi = await fetch(`${API_ACTIVIDADES_URL}/${id}/evidencias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resEvi.ok) {
          const dataEvi = await resEvi.json();
          setEvidencias(dataEvi.evidencias || []);
        }

      } catch (err) {
        console.error('Error al obtener la actividad/evidencias:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosActividadYEvidencias();
  }, [id]);

  const seleccionarScore = (criterioId: string, valor: number) => {
    setCriterios(prev => prev.map(c => c.id === criterioId ? { ...c, score: valor } : c));
  };

  // Cálculo de Nota sobre 10 (Suma / 25 * 10)
  const sumaTotal = criterios.reduce((acc, c) => acc + c.score, 0);
  const notaFinal = ((sumaTotal / 25) * 10).toFixed(1);

  const handleGuardarEvaluacion = async () => {
    setGuardando(true);
    setTimeout(() => {
      alert(`¡Evaluación de "${actividad?.name}" guardada con éxito (${notaFinal} / 10)!`);
      setGuardando(false);
      navigate('/evaluador-evaluaciones');
    }, 700);
  };

  if (cargando) {
    return <div className="text-center py-20 text-xs text-gray-400 font-medium">Cargando actividad y evidencias...</div>;
  }

  const nombreActividad = actividad?.name || 'Actividad sin nombre';
  const nombreProyecto = actividad?.project?.name || 'Proyecto general';
  const responsable = actividad?.assignees?.[0]?.user?.name || 'Sin responsable asignado';
  const estadoTexto = actividad?.status === 'DONE' ? 'Completado' : actividad?.status === 'IN_PROCESS' ? 'En proceso' : 'Pendiente';

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* BOTÓN VOLVER Y TÍTULO */}
      <div className="space-y-1">
        <Link to="/evaluador-evaluaciones" className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:underline mb-1">
          <ArrowLeft size={14} /> Volver a evaluaciones
        </Link>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Evaluar actividad</h1>
      </div>

      {/* CAJITA SUPERIOR CON METADATOS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-5 w-full">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{nombreActividad}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-50 text-xs">
          <div>
            <p className="text-gray-400 font-medium">Proyecto</p>
            <p className="font-bold text-gray-800 mt-0.5">{nombreProyecto}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Responsable</p>
            <p className="font-bold text-gray-800 mt-0.5">{responsable}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Fecha de entrega</p>
            <p className="font-bold text-gray-800 mt-0.5">{formatearFecha(actividad?.deadline)}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Estado</p>
            <p className="font-bold text-blue-600 mt-0.5">{estadoTexto}</p>
          </div>
        </div>
      </div>

      {/* 🟢 HU-028: BLOQUE DE EVIDENCIAS ADJUNTAS REALES */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-3 w-full">
        <div className="flex items-center gap-2">
          <Paperclip size={15} className="text-blue-600" />
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Evidencias adjuntas ({evidencias.length})
          </h3>
        </div>

        {evidencias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {evidencias.map((ev) => (
              <a
                key={ev.id}
                href={ev.url.startsWith('http') ? ev.url : `http://localhost:3000/uploads/${ev.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 rounded-xl transition group text-xs"
              >
                <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                  <FileText size={16} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                  <span className="font-semibold text-gray-700 group-hover:text-blue-700 truncate">
                    {ev.url}
                  </span>
                </div>
                <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic py-1">
            El estudiante aún no ha adjuntado enlaces o archivos de evidencia para esta actividad.
          </p>
        )}
      </div>

      {/* FORMULARIO DE EVALUACIÓN CON RÚBRICA Y TABLA RESPONSIVA */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-6 w-full">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Formulario de evaluación</h3>

        <div className="overflow-x-auto w-full">
          <div className="space-y-4 min-w-[450px] sm:min-w-0">
            <div className="grid grid-cols-12 text-[11px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-2.5">
              <div className="col-span-6 sm:col-span-7">Criterio a evaluar</div>
              <div className="col-span-6 sm:col-span-5 flex justify-between px-2">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>

            {criterios.map((c) => (
              <div key={c.id} className="grid grid-cols-12 items-center text-xs py-2 border-b border-gray-50">
                <div className="col-span-6 sm:col-span-7 font-semibold text-gray-800">{c.nombre}</div>
                <div className="col-span-6 sm:col-span-5 flex justify-between px-1">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = c.score === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => seleccionarScore(c.id, val)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CALIFICACIÓN FINAL */}
        <div className="pt-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs font-bold text-gray-700">Calificación final</span>
          <div className="text-base font-bold text-gray-900">
            <span className="text-blue-600 text-xl font-extrabold">{notaFinal}</span> / 10
          </div>
        </div>
      </div>

      {/* COMENTARIOS DEL EVALUADOR */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-3 w-full">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Comentarios del evaluador</h3>
        <textarea
          rows={4}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Escribe tus observaciones técnicas sobre esta actividad..."
          className="w-full p-3 bg-gray-50/60 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white resize-none"
        />
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <span>Máximo 500 caracteres</span>
          <span>{comentario.length}/500</span>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/evaluador-evaluaciones')}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardarEvaluacion}
          disabled={guardando}
          className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 size={14} /> {guardando ? 'Guardando...' : 'Guardar evaluación'}
        </button>
      </div>

    </div>
  );
};