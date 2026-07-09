import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { EvaluadorDashboard } from './components/EvaluadorDashboard';
import { EvaluadorProyectos } from './components/EvaluadorProyectos';
import { EvaluadorDetalleProyecto } from './components/EvaluadorDetalleProyecto';
import { EvaluadorEvaluaciones } from './components/EvaluadorEvaluaciones';
import { EvaluadorFormulario } from './components/EvaluadorFormulario';
import { EditarPerfilEvaluador } from './components/EditarPerfilEvaluador'; // <-- Importación con el nombre correcto

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/evaluador-dashboard" element={<EvaluadorDashboard />} />
        <Route path="/evaluador-proyectos" element={<EvaluadorProyectos />} />
        <Route path="/evaluador-detalle" element={<EvaluadorDetalleProyecto />} />
        <Route path="/evaluador-evaluaciones" element={<EvaluadorEvaluaciones />} />
        <Route path="/evaluador-formulario" element={<EvaluadorFormulario />} />
        
        {/* Ruta apuntando al nombre correcto del componente */}
        <Route path="/evaluador-perfil" element={<EditarPerfilEvaluador />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;