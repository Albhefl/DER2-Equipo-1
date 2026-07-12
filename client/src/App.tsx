import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';

// Importación del Guardián de Seguridad (HU-011.2)
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes del Evaluador
import { EvaluadorDashboard } from './components/EvaluadorDashboard';
import { EvaluadorProyectos } from './components/EvaluadorProyectos';
import { EvaluadorDetalleProyecto } from './components/EvaluadorDetalleProyecto';
import { EvaluadorEvaluaciones } from './components/EvaluadorEvaluaciones';
import { EvaluadorFormulario } from './components/EvaluadorFormulario';
import { EvaluadorPerfil } from './components/EvaluadorPerfil';
import { EditarPerfilEvaluador } from './components/EditarPerfilEvaluador';
import { LayoutEvaluador } from './components/LayoutEvaluador';

// Componentes del Estudiante
import { LayoutEstudiante } from './components/LayoutEstudiante';
import { EstudianteDashboard } from './components/EstudianteDashboard'; 
import { EstudianteKanban } from './components/EstudianteKanban'; 
import { 
  ProyectosPage, ActividadesPage, EntregasPage, CalendarioPage, PerfilPage 
} from './components/EstudianteVistas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />
        
        {/* 🔒 RUTA ENVOLVEDORA PROTEGIDA DEL EVALUADOR (SÓLO PARA EVALUADORES) */}
        <Route 
          element={
            <ProtectedRoute rolPermitido="evaluador">
              <LayoutEvaluador />
            </ProtectedRoute>
          }
        >
          <Route path="/evaluador-dashboard" element={<EvaluadorDashboard />} />
          <Route path="/evaluador-proyectos" element={<EvaluadorProyectos />} />
          <Route path="/evaluador-detalle" element={<EvaluadorDetalleProyecto />} />
          <Route path="/evaluador-evaluaciones" element={<EvaluadorEvaluaciones />} />
          <Route path="/evaluador-formulario" element={<EvaluadorFormulario />} />
          <Route path="/evaluador-perfil" element={<EvaluadorPerfil />} />
          <Route path="/evaluador-perfil/editar" element={<EditarPerfilEvaluador />} />
        </Route>

        {/* 🔒 RUTA ENVOLVEDORA PROTEGIDA DEL ESTUDIANTE (SÓLO PARA ESTUDIANTES) */}
        <Route 
          element={
            <ProtectedRoute rolPermitido="estudiante">
              <LayoutEstudiante />
            </ProtectedRoute>
          }
        >
          <Route path="/estudiante-dashboard" element={<EstudianteDashboard />} />
          <Route path="/estudiante-proyectos" element={<ProyectosPage />} />
          <Route path="/estudiante-actividades" element={<ActividadesPage />} />
          <Route path="/estudiante-entregas" element={<EntregasPage />} />
          <Route path="/estudiante-calendario" element={<CalendarioPage />} />
          <Route path="/estudiante-kanban" element={<EstudianteKanban />} />
          <Route path="/estudiante-perfil" element={<PerfilPage />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;