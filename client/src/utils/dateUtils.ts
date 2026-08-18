// =============================================================================
// dateUtils.ts
// Utilidades y validaciones de fecha CENTRALIZADAS para Tareas y Proyectos.
// Todo el manejo de fechas del sistema debería pasar por aquí, para evitar que
// cada componente reinvente su propia lógica (y sus propios bugs) de zona horaria.
//
// REGLA DE ORO de este archivo:
// Las fechas de "día calendario" (fecha límite, fecha de fin de proyecto, etc.)
// se tratan SIEMPRE como año/mes/día en la zona horaria LOCAL del usuario,
// nunca se convierten a UTC ni se comparan como timestamps con hora. Esto evita
// el bug clásico de "se guardó el 18 pero se ve el 17" en zonas horarias
// negativas (México, todo Latam, EE.UU., etc.).
// =============================================================================

/** Devuelve la fecha de HOY como "YYYY-MM-DD", en la zona horaria LOCAL del usuario. */
export function obtenerHoyISO(): string {
  const hoy = new Date();
  return formatearComoISO(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
}

/** Devuelve la fecha de MAÑANA como "YYYY-MM-DD", en local. Útil como `min` del date picker. */
export function obtenerMananaISO(): string {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return formatearComoISO(manana.getFullYear(), manana.getMonth() + 1, manana.getDate());
}

function formatearComoISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Parsea un string de fecha ("YYYY-MM-DD" o con hora, "YYYY-MM-DDTHH:mm:ss.sssZ")
 * como fecha LOCAL (año/mes/día), ignorando cualquier componente de hora/zona.
 * Es la función base para que todas las comparaciones de "día calendario" sean
 * consistentes en toda la app.
 */
function parsearComoFechaLocal(fechaISO: string): Date {
  const soloFecha = fechaISO.split('T')[0]; // nos quedamos con "2026-08-18"
  const [anio, mes, dia] = soloFecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Compara dos fechas por día calendario. Negativo si a<b, 0 si son el mismo día, positivo si a>b. */
function compararFechas(a: string, b: string): number {
  return parsearComoFechaLocal(a).getTime() - parsearComoFechaLocal(b).getTime();
}

/** Formatea "YYYY-MM-DD" (o con hora) a "DD/MM/YYYY" para mostrar en UI, sin desfases de zona horaria. */
export function formatearFechaCorta(fechaISO?: string | null): string {
  if (!fechaISO) return '—';
  const soloFecha = fechaISO.split('T')[0];
  const [anio, mes, dia] = soloFecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Convierte un string de fecha (con o sin hora) al formato que espera un <input type="date">. */
export function formatearParaInputFecha(fechaISO?: string | null): string {
  if (!fechaISO) return '';
  return fechaISO.split('T')[0];
}

export interface ResultadoValidacionFecha {
  valida: boolean;
  mensaje: string | null;
}

/**
 * Valida la fecha límite de una TAREA/ACTIVIDAD.
 *
 * Reglas (en orden):
 *  1. Es obligatoria.
 *  2. Debe ser ESTRICTAMENTE posterior a hoy — ni hoy ni fechas pasadas.
 *  3. Si se conoce la fecha de fin del proyecto (`fechaFinProyectoISO`), la
 *     fecha límite no puede excederla.
 *
 * @param fechaLimiteISO      Fecha elegida por el usuario ("YYYY-MM-DD").
 * @param fechaFinProyectoISO Fecha de cierre del proyecto al que pertenece la
 *                            tarea, si se conoce. Si es null/undefined, la
 *                            regla 3 simplemente no se evalúa.
 */
export function validarFechaLimiteTarea(
  fechaLimiteISO: string,
  fechaFinProyectoISO?: string | null
): ResultadoValidacionFecha {
  if (!fechaLimiteISO) {
    return { valida: false, mensaje: 'La fecha límite es requerida.' };
  }

  const hoy = obtenerHoyISO();

  if (compararFechas(fechaLimiteISO, hoy) <= 0) {
    return { valida: false, mensaje: 'La fecha límite debe ser posterior al día de hoy.' };
  }

  if (fechaFinProyectoISO && compararFechas(fechaLimiteISO, fechaFinProyectoISO) > 0) {
    return {
      valida: false,
      mensaje: `La fecha límite de la tarea no puede exceder la fecha de término del proyecto (${formatearFechaCorta(fechaFinProyectoISO)}).`
    };
  }

  return { valida: true, mensaje: null };
}

/**
 * Valida la fecha de CIERRE DE UN PROYECTO.
 *
 * Reglas:
 *  1. Es opcional a nivel proyecto — si no se proporciona, es válida.
 *  2. Si se proporciona, debe ser ESTRICTAMENTE posterior a hoy (misma regla
 *     que las fechas límite de tareas: ni hoy ni fechas pasadas).
 *  3. No puede ser anterior a la fecha de inicio del proyecto.
 */
export function validarFechaFinProyecto(
  fechaInicioISO: string,
  fechaFinISO?: string | null
): ResultadoValidacionFecha {
  if (!fechaFinISO) {
    // La fecha de cierre es opcional a nivel proyecto en este sistema.
    return { valida: true, mensaje: null };
  }

  const hoy = obtenerHoyISO();
  if (compararFechas(fechaFinISO, hoy) <= 0) {
    return { valida: false, mensaje: 'La fecha de cierre debe ser posterior al día de hoy. Elige otra fecha.' };
  }

  if (fechaInicioISO && compararFechas(fechaFinISO, fechaInicioISO) < 0) {
    return { valida: false, mensaje: 'La fecha de cierre no puede ser anterior a la fecha de inicio.' };
  }

  return { valida: true, mensaje: null };
}