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

export default router;