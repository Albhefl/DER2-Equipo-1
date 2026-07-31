import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  rolPermitido: 'estudiante' | 'evaluador';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolPermitido }) => {
  const token = localStorage.getItem('token');
  const userStorage = localStorage.getItem('user');

  // Si no hay token o no hay usuario guardado, redirigir al login
  if (!token || !userStorage) {
    return <Navigate to="/login" replace />;
  }

  let usuarioRolRaw = '';

  try {
    const parsedUser = JSON.parse(userStorage);
    usuarioRolRaw = String(parsedUser.role || '').toUpperCase(); // Captura "EVALUATOR" o "STUDENT"
  } catch (e) {
    console.error("Error al parsear el usuario de localStorage", e);
    return <Navigate to="/login" replace />;
  }

  // Mapear el rol del backend a las banderas de frontend
  const esEvaluador = usuarioRolRaw === 'EVALUATOR' || usuarioRolRaw === 'EVALUADOR';
  const esEstudiante = usuarioRolRaw === 'STUDENT' || usuarioRolRaw === 'ESTUDIANTE';

  // 🚫 CONTROL DE ACCESO SEGÚN RUTA
  if (rolPermitido === 'evaluador' && !esEvaluador) {
    alert('🚫 Acceso no autorizado: No tienes permisos de Evaluador para acceder a esta ruta.');
    return <Navigate to="/estudiante-dashboard" replace />;
  }

  if (rolPermitido === 'estudiante' && !esEstudiante) {
    return <Navigate to="/evaluador-dashboard" replace />;
  }

  // Si pasa las validaciones, renderiza la vista solicitada
  return children;
};