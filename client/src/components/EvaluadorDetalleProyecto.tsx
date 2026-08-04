import React from 'react';
import { Link } from 'react-router-dom'; 
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Circle
} from 'lucide-react';

export const EvaluadorDetalleProyecto: React.FC = () => {
  const integrantes = [
    { iniciales: 'CF', nombre: 'Carlos Flores', rol: 'Responsable', bg: 'bg-blue-600' },
    { iniciales: 'AT', nombre: 'Ana Torres', rol: 'Desarrollador', bg: 'bg-purple-500' },
    { iniciales: 'LP', nombre: 'Luis Pérez', rol: 'Diseñador', bg: 'bg-emerald-500' },
    { iniciales: 'MP', nombre: 'María Pérez', rol: 'QA', bg: 'bg-orange-500' },
  ];

  const criterios = [
    { id: 1, texto: 'Funcionalidad completa', completado: true },
    { id: 2, texto: 'Código limpio y bien estructurado', completado: true },
    { id: 3, texto: 'Diseño responsivo', completado: false },
    { id: 4, texto: 'Documentación entregada', completado: false },
  ];

  const progresoDetallado = [
    { tarea: 'Análisis de requisitos', porcentaje: 100, color: 'bg-emerald-500' },
    { tarea: 'Diseño de interfaz', porcentaje: 100, color: 'bg-emerald-500' },
    { tarea: 'Desarrollo frontend', porcentaje: 75, color: 'bg-blue-500' },
    { tarea: 'Desarrollo backend', porcentaje: 50, color: 'bg-blue-500' },
    { tarea: 'Pruebas y validación', porcentaje: 25, color: 'bg-amber-500' },
    { tarea: 'Documentación', porcentaje: 10, color: 'bg-red-500' },
  ];

  return (
    // 🟢 CONTENEDOR FLUIDO GLOBAL
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TOPBAR ADAPTADO COMO CARD */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>Proyectos asignados</span>
          <span>&gt;</span>
          <span className="text-gray-600 truncate max-w-[120px] sm:max-w-none">Funcionalidad de login</span>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">MG</div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO FLEX DIRECIONAL (Se apila en móvil, lado a lado en lg) */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
        
        {/* COLUMNA IZQUIERDA: DETALLES DEL PROYECTO */}
        <div className="flex-1 space-y-4 min-w-0 w-full">
          
          <Link to="/evaluador-proyectos" className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline mb-2 w-fit">
            <ArrowLeft size={14} /> Volver a proyectos asignados
          </Link>

          {/* TARJETA ENCABEZADO PROYECTO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate leading-snug">Funcionalidad de login</h3>
                <p className="text-xs text-gray-400 truncate">Carlos Flores / Evaluador</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-6 pt-2 text-xs">
              <p className="text-gray-500 font-medium shrink-0">Fecha de entrega: <span className="text-gray-900 font-bold ml-1">Viernes 6 Jun</span></p>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100 w-fit">En proceso</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-gray-400 font-medium shrink-0 text-[11px]">Progreso: 75%</span>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA DESCRIPCIÓN */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción del proyecto</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Implementar el sistema de inicio de sesión para la plataforma, permitiendo a los usuarios acceder con sus correos electrónicos y contraseña. Debe incluir validación de credenciales, recuperación de contraseña y cierre de sesión.
            </p>
          </div>

          {/* TARJETA OBJETIVOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Objetivos</h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li className="flex items-center gap-2">• Permitir el inicio de sesión seguro de los usuarios</li>
              <li className="flex items-center gap-2">• Gestionar errores en el sistema</li>
              <li className="flex items-center gap-2">• Implementar recuperación de contraseña</li>
              <li className="flex items-center gap-2">• Diseñar de forma asíncrona</li>
            </ul>
          </div>

          {/* TARJETA TECNOLOGÍAS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tecnologías utilizadas</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'MongoDB', 'AngularJS', 'Tailwind'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl text-xs font-semibold shadow-sm shadow-gray-50">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* TARJETA PROGRESO DETALLADO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progreso detallado</h4>
            <div className="space-y-3.5">
              {progresoDetallado.map((item) => (
                <div key={item.tarea} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                  <p className="w-full sm:w-36 font-semibold text-gray-600 shrink-0">{item.tarea}</p>
                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden w-full">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.porcentaje}%` }}></div>
                  </div>
                  <span className="text-right text-gray-400 font-bold sm:w-10">{item.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN DEL EQUIPO Y EVALUACIÓN */}
        <div className="w-full lg:w-[280px] space-y-4 shrink-0">
          
          {/* INFORMACIÓN DEL EQUIPO */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40">
            <h4 className="font-bold text-gray-900 text-[14px] mb-1">Información del equipo</h4>
            <p className="text-xs text-gray-400 mb-4">Equipo Beta</p>
            
            <div className="space-y-3.5">
              {integrantes.map((i) => (
                <div key={i.nombre} className="flex items-center gap-3">
                  <div className={`w-7 h-7 ${i.bg} text-white font-bold text-[11px] rounded-full flex items-center justify-center shrink-0`}>
                    {i.iniciales}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 leading-none mb-1 truncate">{i.nombre}</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-none">{i.rol}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRITERIOS DE EVALUACIÓN */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40">
            <h4 className="font-bold text-gray-900 text-[14px] mb-4">Criterios de evaluación</h4>
            
            <div className="space-y-3.5">
              {criterios.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs font-medium">
                  {c.completado ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={16} className="text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={c.completado ? 'text-gray-600' : 'text-gray-400'}>
                    {c.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};