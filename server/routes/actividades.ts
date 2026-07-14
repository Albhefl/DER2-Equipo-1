import { Router, type Response } from 'express';
import db from '../db.js';
import { verificarToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * ENDPOINT: POST /api/actividades
 * Crea una nueva actividad para el estudiante autenticado
 */
router.post('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { nombre, descripcion, fecha_limite } = req.body;
  const usuario_id = req.user?.userId;

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

    const [result]: any = await db.query(
      'INSERT INTO actividades (nombre, descripcion, fecha_limite, usuario_id) VALUES (?, ?, ?, ?)',
      [nombre.trim(), descripcion?.trim() || null, fecha_limite, usuario_id]
    );

    return res.status(201).json({
      message: 'Actividad creada exitosamente.',
      actividad: {
        id: result.insertId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        fecha_limite,
        estado: 'Pendiente',
        usuario_id
      }
    });

  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * ENDPOINT: GET /api/actividades
 * Lista todas las actividades del estudiante autenticado
 */
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;

  try {
    const [rows] = await db.query(
      'SELECT * FROM actividades WHERE usuario_id = ? ORDER BY created_at DESC',
      [usuario_id]
    );
    return res.status(200).json({ actividades: rows });
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

  try {
    // Verifica que la actividad exista y le pertenezca al usuario autenticado
    const [rows]: any = await db.query(
      'SELECT * FROM actividades WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if (!rows || rows.length === 0) {
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

    await db.query(
      'UPDATE actividades SET nombre = ?, descripcion = ?, fecha_limite = ?, estado = ? WHERE id = ? AND usuario_id = ?',
      [nombre.trim(), descripcion?.trim() || null, fecha_limite, estado || rows[0].estado, id, usuario_id]
    );

    return res.status(200).json({
      message: 'Actividad actualizada exitosamente.',
      actividad: {
        id: Number(id),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        fecha_limite,
        estado: estado || rows[0].estado,
        usuario_id
      }
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

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM actividades WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    await db.query(
      'DELETE FROM actividades WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    return res.status(200).json({ message: 'Actividad eliminada exitosamente.' });

  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;