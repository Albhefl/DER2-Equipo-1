import { Router } from 'express';
// Importa tu cliente de base de datos según lo tengas configurado (ej. Prisma o MySQL)
// import db from '../src/db.js'; 

const router = Router();

// GET: /api/proyectos
router.get('/', async (req, res) => {
  try {
    // Ejemplo si usas Prisma:
    // const proyectos = await db.proyecto.findMany();
    // res.json(proyectos);

    // Respuesta temporal para probar que ya no dé error 404:
    res.status(200).json([]);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

export default router;