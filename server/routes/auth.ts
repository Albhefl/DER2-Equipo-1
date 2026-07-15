import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import db from '../src/db.js'; // Cliente de Prisma (Postgres)

const router = Router();

// 🛡️ CONTROL DE FUERZA BRUTA (HU-010.3)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // Bloqueo temporal por 5 minutos
  max: 4, // Máximo 4 intentos permitidos
  handler: (req: Request, res: Response) => {
    return res.status(429).json({
      message: "🚫 Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente por 5 minutos por motivos de seguridad."
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const JWT_SECRET = process.env.JWT_SECRET || 'llave_secreta_para_classboard_2026';
const VALID_ROLES = ['STUDENT', 'EVALUATOR'];

/**
 * =========================================================================
 * 1. ENDPOINT: POST /api/auth/register
 * Registra usuarios encriptando la contraseña automáticamente
 * =========================================================================
 */
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const roleUpper = String(role).toUpperCase();
    if (!VALID_ROLES.includes(roleUpper)) {
      return res.status(400).json({
        message: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(', ')}`
      });
    }

    // 🔐 ENCRIPTACIÓN AUTOMÁTICA
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Guardar en PostgreSQL vía Prisma
    await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        passwordHash,
        role: roleUpper as 'STUDENT' | 'EVALUATOR',
      },
    });

    return res.status(201).json({
      message: '¡Usuario registrado exitosamente con contraseña encriptada automáticamente! 🎉'
    });

  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    // P2002 = violación de restricción única en Prisma (ej. email duplicado)
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * 2. ENDPOINT: POST /api/auth/login
 * Autenticación conectada a PostgreSQL (Prisma) con protección de Fuerza Bruta
 * =========================================================================
 */
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<any> => {
  const email = req.body?.email;
  const password = req.body?.password;

  try {
    if (!email || !password || email.trim() === '' || password.trim() === '') {
      return res.status(400).json({ message: 'Por favor, rellena todos los campos.' });
    }

    const user = await db.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Intenta de nuevo.' });
    }

    // Comparar clave plano vs hash seguro
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Intenta de nuevo.' });
    }

    // Generar el Token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;