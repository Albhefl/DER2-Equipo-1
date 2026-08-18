import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Register } from './components/Register'; 

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
import { EvaluadorKanban } from './components/EvaluadorKanban'; 

// Componentes del Estudiante
import { LayoutEstudiante } from './components/LayoutEstudiante';
import { EstudianteDashboard } from './components/EstudianteDashboard'; 
import { EstudianteKanban } from './components/EstudianteKanban'; 
import { ActividadesPage } from './components/EstudianteVistas';
import { EstudianteEntregas as EntregasPage } from './EstudianteEntregas';
// 🟢 Nuevos componentes modulares del estudiante
import { EstudianteProyectos } from './components/EstudianteProyectos';
import { CalendarioFuncional } from './components/CalendarioFuncional';
import { EstudiantePerfil } from './components/EstudiantePerfil';
import { RecuperarPassword } from './components/RecuperarPassword';
import { RestablecerPassword } from './components/RestablecerPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        
        {/* 🟢 NUEVAS RUTAS PARA RECUPERAR CONTRASEÑA */}
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        
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
          {/* HU-028: recibe el id real de la actividad a evaluar */}
          <Route path="/evaluador-formulario/:id" element={<EvaluadorFormulario />} />
          <Route path="/evaluador-perfil" element={<EvaluadorPerfil />} />
          <Route path="/evaluador-perfil/editar" element={<EditarPerfilEvaluador />} />
          <Route path="/evaluador-kanban" element={<EvaluadorKanban />} /> 
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
          <Route path="/estudiante-proyectos" element={<EstudianteProyectos />} />
          <Route path="/estudiante-actividades" element={<ActividadesPage />} />
          /*{/*<Route path="/estudiante-entregas" element={<EntregasPage />} />*}
          
          {/* 🟢 RUTAS FUNCIONALES NUEVAS */}
          <Route path="/estudiante-calendario" element={<CalendarioFuncional />} />
          <Route path="/estudiante-perfil" element={<EstudiantePerfil />} />
          
          <Route path="/estudiante-kanban" element={<EstudianteKanban />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;