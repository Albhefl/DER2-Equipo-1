import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'llave_secreta_para_classboard_2026';

/**
 * ENDPOINT: POST /api/auth/login
 * Lógica de autenticación con validación de campos vacíos (HU-009.2)
 */
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const email = req.body?.email;
  const password = req.body?.password;

  try {
    // 1. NUEVA VALIDACIÓN: Verificar si los campos vienen vacíos
    if (!email || !password || email.trim() === '' || password.trim() === '') {
      return res.status(400).json({ 
        message: 'Por favor, rellena todos los campos.' 
      });
    }

    // Usuario simulado en base de datos
    const mockUser = {
      id: 'usr-991',
      email: 'floresjarumi312@gmail.com',
      passwordHash: bcrypt.hashSync('123456', 10), 
      role: 'ESTUDIANTE'
    };

    // 2. Criterio de Aceptación: Validar si el correo coincide
    if (email !== mockUser.email) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Intenta de nuevo.' });
    }

    // 3. Criterio de Aceptación: Comparar la contraseña de forma segura
    const isPasswordValid = await bcrypt.compare(password, mockUser.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Intenta de nuevo.' });
    }

    // 4. Si todo está bien: Generar el Token Seguro (JWT)
    const token = jwt.sign(
      { userId: mockUser.id, role: mockUser.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;