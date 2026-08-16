// src/config/api.ts
// Configuración centralizada de URLs de la API.
// En desarrollo usa el .env local; en producción, la variable de entorno del hosting.

export const API_BASE_URL = `${import.meta.env.VITE_API_URL}`; // ej: http://localhost:3000/api
export const SERVER_URL = API_BASE_URL.replace(/\/api$/, ''); // ej: http://localhost:3000 (sin /api, para /uploads)
