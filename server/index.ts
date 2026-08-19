import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import actividadesRoutes from './routes/actividades.js';
import usuariosRoutes from './routes/usuarios.js';
import proyectosRoutes from './routes/proyectos.js';
import db from './src/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 CORS robusto para producción
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // Quitar slash final

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    console.warn(`CORS bloqueado para: ${origin}`);
    return callback(new Error('No permitido por CORS'), false);
  },
  credentials: true,
}));

app.use(express.json());

// Enlazamos todas las rutas ANTES de app.listen
app.use('/api/auth', authRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/proyectos', proyectosRoutes);

// Servir la carpeta de archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('¡El servidor de ClassBoard está vivo!');
});

// app.listen siempre va al final
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});