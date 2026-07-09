import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 1. Importamos Link
import { SidebarEvaluador } from './SidebarEvaluador'; // 2. Importamos el menú global
import { 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export const EvaluadorFormulario: React.FC = () => {
  // 1. Estado para almacenar las notas de cada criterio
  const [notas, setNotas] = useState<{ [key: string]: number }>({
    'Funcionalidad': 4,
    'Diseño e interfaz': 4,
    'Código y estructura': 3,
    'Pruebas unitarias': 4,
    'Documentación': 2
  });

  // 2. Estado para el comentario de texto
  const [comentario, setComentario] = useState(
    'La funcionalidad de login cumple con los requisitos principales y fluye con correcto. El código tiene áreas bien estructuradas y en maduración. Se evidencia cobertura adecuada de pruebas. Sería importante mejorar la validación de mensajes de error y la accesibilidad en los formularios.'
  );

  // 3. Estado para calcular la nota final en base 10 de manera dinámica
  const [calificacionFinal, setCalificacionFinal] = useState(6.8);

  // Recalcular la nota promedio cada vez que el usuario cambie un número del 1 al 5
  useEffect(() => {
    const listaNotas = Object.values(notas);
    const suma = listaNotas.reduce((acc, curr) => acc + curr, 0);
    const promedioBase5 = suma / listaNotas.length;
    const base10 = promedioBase5 * 2;
    setCalificacionFinal(parseFloat(base10.toFixed(1)));
  }, [notas]);

  const manejarCambioNota = (criterio: string, valor: number) => {
    setNotas(prev => ({ ...prev, [criterio]: valor }));
  };

  const criteriosLista = [
    'Funcionalidad',
    'Diseño e interfaz',
    'Código y estructura',
    'Pruebas unitarias',
    'Documentación'
  ];

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans antialiased text-[#111827]">
      
      {/* 3. Reemplazo del aside por el Sidebar inteligente reutilizable */}
      <SidebarEvaluador />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span>Evaluaciones</span>
            <span>&gt;</span>
            <span className="text-gray-600">Funcionalidad de login</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">MG</div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
                <p className="text-xs text-gray-400">Evaluador</p>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="p-8 space-y-5 overflow-y-auto">
          
          {/* 4. Cambiamos el <button> estático por el <Link> interactivo para volver */}
          <Link to="/evaluador-evaluaciones" className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline mb-1 w-fit">
            <ArrowLeft size={14} /> Volver a evaluaciones
          </Link>

          <h3 className="text-base font-bold text-gray-900 leading-none">Evaluar actividad</h3>

          {/* TARJETA ENCABEZADO PROYECTO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <h4 className="font-bold text-gray-900 text-[15px]">Funcionalidad de login</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 text-left">
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Proyecto</p>
                <p className="text-xs font-bold text-gray-700">App Web Banco</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Equipo</p>
                <p className="text-xs font-bold text-gray-700">Equipo Beta</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Fecha de entrega</p>
                <p className="text-xs font-bold text-gray-700">15 may 2025</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Estado</p>
                <p className="text-xs font-bold text-gray-700">Desarrollado</p>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Responsable</p>
              <p className="text-xs font-bold text-gray-700">Carina Flores</p>
            </div>
          </div>

          {/* FORMULARIO DE EVALUACIÓN (TABLA) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 p-6 space-y-6">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Formulario de evaluación</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-b border-gray-50 pb-2">
                <span>Criterio a evaluar</span>
                <div className="flex items-center gap-5 pr-2">
                  {[1, 2, 3, 4, 5].map(num => <span key={num} className="w-6 text-center">{num}</span>)}
                </div>
              </div>

              {criteriosLista.map((criterio) => (
                <div key={criterio} className="flex justify-between items-center py-2 border-b border-gray-50/50">
                  <span className="text-xs font-semibold text-gray-600">{criterio}</span>
                  <div className="flex items-center gap-5 pr-2">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const activo = notas[criterio] === num;
                      return (
                        <button
                          key={num}
                          onClick={() => manejarCambioNota(criterio, num)}
                          className={`w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center border transition-all ${
                            activo 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-100' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-gray-900">
                Calificación final <span className="text-sm font-black text-blue-600 ml-1">{calificacionFinal}</span> <span className="text-gray-400 font-medium">/ 10</span>
              </p>
            </div>
          </div>

          {/* COMENTARIOS DEL EVALUADOR */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 p-6 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Comentarios del evaluador</h4>
            
            <div className="relative">
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value.slice(0, 500))}
                className="w-full h-28 p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600 focus:outline-none focus:border-blue-400 focus:bg-white resize-none leading-relaxed"
                placeholder="Escribe tus observaciones técnicas aquí..."
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-semibold tracking-tight">
                {comentario.length}/500
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                Guardar borrador
              </button>
              <button type="button" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-100 transition-colors">
                Enviar evaluación
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};