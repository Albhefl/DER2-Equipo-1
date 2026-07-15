import { Router, type Response } from 'express';
import db from '../src/db.js'; // Cliente de Prisma (Postgres)
import { verificarToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const VALID_STATUSES = ['PENDING', 'IN_PROCESS', 'IN_REVIEW', 'DONE'];
const VALID_PRIORITIES = ['HIGH', 'MED', 'LOW'];

/**
 * ENDPOINT: POST /api/actividades
 * Crea una nueva actividad y asigna automáticamente al usuario autenticado
 * como responsable (relación activity_assignees).
 */
router.post('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { nombre, descripcion, fecha_limite, prioridad } = req.body;
  const usuario_id = req.user?.userId;

  if (!usuario_id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es obligatorio.' });
    }

    if (nombre.trim().length > 150) {
      return res.status(400).json({ message: 'El nombre no puede superar los 150 caracteres.' });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha_limite);

    if (!fecha_limite || fechaSeleccionada < hoy) {
      return res.status(400).json({ message: 'La fecha límite no puede ser anterior a hoy.' });
    }

    const prioridadUpper = prioridad ? String(prioridad).toUpperCase() : 'MED';
    if (!VALID_PRIORITIES.includes(prioridadUpper)) {
      return res.status(400).json({
        message: `Prioridad inválida. Debe ser una de: ${VALID_PRIORITIES.join(', ')}`
      });
    }

    const actividad = await db.activity.create({
      data: {
        name: nombre.trim(),
        description: descripcion?.trim() || null,
        deadline: fechaSeleccionada,
        priority: prioridadUpper as 'HIGH' | 'MED' | 'LOW',
        status: 'PENDING',
        assignees: {
          create: [{ userId: usuario_id }],
        },
      },
    });

    return res.status(201).json({
      message: 'Actividad creada exitosamente.',
      actividad,
    });

  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * ENDPOINT: GET /api/actividades
 * Lista todas las actividades donde el usuario autenticado es responsable
 */
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;

  if (!usuario_id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    const actividades = await db.activity.findMany({
      where: {
        assignees: {
          some: { userId: usuario_id },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ actividades });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * ENDPOINT: PUT /api/actividades/:id
 * Edita una actividad existente (HU-013 Escenario 1)
 * =========================================================================
 */
router.put('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { nombre, descripcion, fecha_limite, estado } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) {
    return res.status(400).json({ message: 'ID de actividad requerido.' });
  }

  if (!usuario_id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    // Verifica que la actividad exista y el usuario sea uno de los responsables
    const actividadExistente = await db.activity.findFirst({
      where: {
        id,
        assignees: { some: { userId: usuario_id } },
      },
    });

    if (!actividadExistente) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es obligatorio.' });
    }

    if (nombre.trim().length > 150) {
      return res.status(400).json({ message: 'El nombre no puede superar los 150 caracteres.' });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha_limite);

    if (!fecha_limite || fechaSeleccionada < hoy) {
      return res.status(400).json({ message: 'La fecha límite no puede ser anterior a hoy.' });
    }

    const estadoUpper = estado ? String(estado).toUpperCase() : actividadExistente.status;
    if (!VALID_STATUSES.includes(estadoUpper)) {
      return res.status(400).json({
        message: `Estado inválido. Debe ser uno de: ${VALID_STATUSES.join(', ')}`
      });
    }

    const actividadActualizada = await db.activity.update({
      where: { id },
      data: {
        name: nombre.trim(),
        description: descripcion?.trim() || null,
        deadline: fechaSeleccionada,
        status: estadoUpper as 'PENDING' | 'IN_PROCESS' | 'IN_REVIEW' | 'DONE',
      },
    });

    return res.status(200).json({
      message: 'Actividad actualizada exitosamente.',
      actividad: actividadActualizada,
    });

  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * ENDPOINT: DELETE /api/actividades/:id
 * Elimina una actividad existente (HU-013 Escenario 2)
 * =========================================================================
 */
router.delete('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) {
    return res.status(400).json({ message: 'ID de actividad requerido.' });
  }

  if (!usuario_id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    const actividadExistente = await db.activity.findFirst({
      where: {
        id,
        assignees: { some: { userId: usuario_id } },
      },
    });

    if (!actividadExistente) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    // onDelete: Cascade en el schema borra también sus activity_assignees, comments, evidence, status_history
    await db.activity.delete({ where: { id } });

    return res.status(200).json({ message: 'Actividad eliminada exitosamente.' });

  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;