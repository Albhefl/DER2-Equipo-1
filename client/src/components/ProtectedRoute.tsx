import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  rolPermitido: 'estudiante' | 'evaluador';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolPermitido }) => {
  // 🟢 Cambia la simulación anterior por la lectura de tu JSON real:
  const userStorage = localStorage.getItem('user');
  let usuarioRol = 'estudiante'; // Rol por defecto si no hay nada

  if (userStorage) {
    try {
      const parsedUser = JSON.parse(userStorage);
      usuarioRol = parsedUser.role; // Extrae "admin", "estudiante" o lo que contenga
    } catch (e) {
      console.error("Error al parsear el usuario de localStorage", e);
    }
  }

  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 EL CANDADO DE CONTROL DE ACCESO (HU-011.2)
  // Si eres un estudiante (o admin en tus pruebas) e intentas burlar la ruta
  if (usuarioRol !== rolPermitido) {
    if (rolPermitido === 'evaluador') {
      alert('🚫 Acceso no autorizado: No tienes permisos de Evaluador para acceder a esta ruta.');
      return <Navigate to="/estudiante-dashboard" replace />;
    }
    
    if (rolPermitido === 'estudiante') {
      return <Navigate to="/evaluador-dashboard" replace />;
    }
  }



  // Si todo está bien, lo deja pasar al componente original
  return children;
};