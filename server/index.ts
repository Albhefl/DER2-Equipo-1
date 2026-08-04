import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js'; // Importamos las rutas de login


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Permite al servidor leer formato JSON enviado desde el front

// Enlazamos las rutas de autenticación bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('¡El servidor de ClassBoard está vivo!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});