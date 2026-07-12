import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import db from '../db.js';

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

/**
 * =========================================================================
 * 1. ENDPOINT: POST /api/auth/register 
 * Registra usuarios encriptando la contraseña automáticamente
 * =========================================================================
 */
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  const { nombre, email, password, role } = req.body;

  try {
    if (!nombre || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // 🔐 ENCRIPTACIÓN AUTOMÁTICA
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Guardar limpio en MySQL
    await db.query(
      'INSERT INTO usuarios (nombre, email, password, role) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.trim(), passwordEncriptada, role.toUpperCase()]
    );

    return res.status(201).json({
      message: '¡Usuario registrado exitosamente con contraseña encriptada automáticamente! 🎉'
    });

  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * =========================================================================
 * 2. ENDPOINT: POST /api/auth/login
 * Autenticación conectada a MySQL con protección de Fuerza Bruta
 * =========================================================================
 */
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<any> => {
  const email = req.body?.email;
  const password = req.body?.password;

  try {
    if (!email || !password || email.trim() === '' || password.trim() === '') {
      return res.status(400).json({ message: 'Por favor, rellena todos los campos.' });
    }

    // Buscar en la tabla de XAMPP
    const [rows]: any = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.trim()]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Intenta de nuevo.' });
    }

    const user = rows[0];

    // Comparar clave plano vs hash seguro
    const isPasswordValid = await bcrypt.compare(password, user.password);
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
        name: user.nombre,
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