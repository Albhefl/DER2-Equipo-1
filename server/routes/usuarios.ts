import { Router, type Response } from 'express';
import db from '../src/db.js';
import { verificarToken, type AuthRequest } from '../middleware/auth.js';
 
const router = Router();
 
/**
 * ENDPOINT: GET /api/usuarios
 * Lista los usuarios con rol STUDENT (compañeros de equipo) para el selector
 * de responsables en el detalle de una actividad (HU-015.1).
 * No incluye el hash de contraseña.
 */
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarios = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
 
    return res.status(200).json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});
 
export default router;
 