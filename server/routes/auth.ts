import { Router, type Request, type Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import db from '../src/db.js'; // Cliente de Prisma (Postgres)
import { enviarCorreoRecuperacion } from '../src/mailer.js';

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
    const expiresIn: SignOptions['expiresIn'] =
      (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '2h';

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn }
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

/**
 * =========================================================================
 * 3. ENDPOINT: POST /api/auth/recover-password
 * Solicitud de recuperación de contraseña y envío de correo con token
 * =========================================================================
 */
router.post('/recover-password', async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;

  try {
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
    }

    const cleanEmail = email.trim();
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      // Token temporal para restablecer clave (válido por 15 min)
      const token = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Enviar correo electrónico
      await enviarCorreoRecuperacion(cleanEmail, token);
    }

    // Por seguridad, siempre devolvemos la misma respuesta de éxito
    return res.status(200).json({
      message: 'Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.'
    });

  } catch (error) {
    console.error('Error al procesar recuperación de contraseña:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud de recuperación.' });
  }
});

/**
 * =========================================================================
 * 4. ENDPOINT: POST /api/auth/reset-password
 * Restablece la contraseña utilizando el token enviado por correo
 * =========================================================================
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'El token y la nueva contraseña son obligatorios.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    // Verificar token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'El enlace de recuperación es inválido o ha expirado.' });
    }

    if (decoded.type !== 'password_reset' || !decoded.userId) {
      return res.status(400).json({ message: 'Token de recuperación inválido.' });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar en la base de datos
    await db.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    return res.status(200).json({
      message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la contraseña.' });
  }
});

export default router;