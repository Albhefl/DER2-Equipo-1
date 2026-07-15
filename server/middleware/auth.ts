import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'llave_secreta_para_classboard_2026';

// Extendemos el tipo Request para poder guardar los datos del usuario decodificado
// userId es string porque Prisma usa UUIDs como id (no enteros autoincrementales como en MySQL)
export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export function verificarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó un token de acceso.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado correctamente.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}