import { Router, type Response, type NextFunction } from 'express';
import db from '../src/db.js';
import { verificarToken, type AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Configuración de almacenamiento para fotos de perfil
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const nombreUnico = `avatar-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, nombreUnico);
  }
});

// 🟢 CAMBIADO: límite subido de 5MB a 10MB (las capturas de pantalla suelen pesar más de 5MB)
const LIMITE_TAMANO_AVATAR = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage,
  limits: { fileSize: LIMITE_TAMANO_AVATAR },
  fileFilter: (_req, file, cb) => {
    const permitidos = /\.(png|jpe?g|webp)$/i;
    if (!permitidos.test(file.originalname)) {
      return cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP).'));
    }
    cb(null, true);
  }
});

// 🟢 NUEVO: middleware que envuelve a multer y convierte sus errores
// (archivo muy pesado, tipo no permitido, etc.) en una respuesta JSON clara,
// en vez de dejar que Express devuelva una página de error genérica (500 HTML).
function manejarSubidaAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  const middleware = upload.single('profileImage');

  middleware(req as any, res as any, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: `La imagen es demasiado grande. El tamaño máximo permitido es ${LIMITE_TAMANO_AVATAR / (1024 * 1024)}MB.`
          });
        }
        return res.status(400).json({ message: err.message });
      }

      // Errores lanzados desde fileFilter (ej. tipo de archivo no permitido)
      return res.status(400).json({ message: (err as Error).message || 'No se pudo procesar el archivo.' });
    }

    next();
  });
}

/**
 * =========================================================================
 * ENDPOINT: POST /api/usuarios/perfil/foto
 * Sube y actualiza la foto de perfil del usuario autenticado.
 * =========================================================================
 */
router.post('/perfil/foto', verificarToken, manejarSubidaAvatar, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;
  const file = (req as any).file;

  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });
  if (!file) return res.status(400).json({ message: 'No se recibió ninguna imagen.' });

  try {
    const usuarioActualizado = await db.user.update({
      where: { id: usuario_id },
      data: { profilePicture: file.filename },
      select: { id: true, name: true, email: true, role: true, profilePicture: true }
    });

    return res.status(200).json({
      message: 'Foto de perfil actualizada exitosamente.',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * ENDPOINT: GET /api/usuarios
 * Lista los usuarios con rol STUDENT (compañeros de equipo) para el selector
 * de responsables en el detalle de una actividad (HU-015.1).
 * =========================================================================
 */
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarios = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, profilePicture: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * ENDPOINT: GET /api/usuarios/evaluadores
 * Lista todos los usuarios con rol EVALUATOR para que el estudiante 
 * pueda elegir a sus profesores al crear un proyecto.
 * =========================================================================
 */
router.get('/evaluadores', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const evaluadores = await db.user.findMany({
      where: { role: 'EVALUATOR' },
      select: { id: true, name: true, email: true, profilePicture: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ evaluadores });
  } catch (error) {
    console.error('Error al obtener evaluadores:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;