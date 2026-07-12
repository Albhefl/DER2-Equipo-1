import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';

export const EditarPerfilEvaluador: React.FC = () => {
  const navigate = useNavigate();

  // Estados para controlar los inputs principales del perfil
  const [nombre, setNombre] = useState('María González');
  const [correo, setCorreo] = useState('mgonzalez@gmail.itd.edu.mx');
  const [telefono, setTelefono] = useState('+52 222 123 4567');
  const [ciudad, setCiudad] = useState('Tehuacán, Puebla, México');
  const [nacimiento, setNacimiento] = useState('15 de enero de 2002');
  const [pais, setPais] = useState('México');

  // Estado para simular la carga al guardar el perfil principal
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS PARA LA VENTANA MODAL DE CAMBIAR CONTRASEÑA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [successPassword, setSuccessPassword] = useState('');

  // Función para guardar los cambios generales del perfil
  const manejarGuardarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('¡Información personal actualizada con éxito en el cliente!');
      navigate('/evaluador-perfil');
    }, 1200);
  };

  // Lógica de validación para el cambio seguro de contraseña
  const manejarCambioContrasena = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword('');
    setSuccessPassword('');

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setErrorPassword('Por favor, rellena todos los campos de seguridad.');
      return;
    }

    if (passwordNueva.length < 6) {
      setErrorPassword('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setSuccessPassword('¡Contraseña actualizada de forma segura!');
    
    setTimeout(() => {
      setPasswordActual('');
      setPasswordNueva(''); // 🟢 Solución del linter aplicada correctamente
      setPasswordConfirmar('');
      setSuccessPassword('');
      setIsModalOpen(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      
      {/* TOPBAR ADAPTADO COMO CARD */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">Mi perfil</h2>
          <p className="text-xs text-gray-400">Actualiza tu información personal</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">MG</div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">María González</p>
            <p className="text-xs text-gray-400">Evaluador</p>
          </div>
        </div>
      </header>

      {/* TARJETA SUPERIOR DE USUARIO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full box-border">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shrink-0">
            MG
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug truncate">María González</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{correo}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 leading-normal">
              {telefono} <span className="hidden xs:inline">•</span> <span className="block xs:inline">{ciudad}</span>
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={manejarGuardarPerfil}
          className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm w-full sm:w-auto shrink-0"
        >
          {isSaving ? 'Guardando...' : 'Guardar todo'}
        </button>
      </div>

      {/* FORMULARIO Y SECCIONES EN REJILLA */}
      <form onSubmit={manejarGuardarPerfil} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* FORMULARIO: INFORMACIÓN PERSONAL MODIFICABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 lg:col-span-7 space-y-5 w-full box-border">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Información personal</h4>
          
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ciudad / Estado</label>
              <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha de nacimiento</label>
              <input type="text" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">País</label>
              <input type="text" value={pais} onChange={(e) => setPais(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-400 transition-all box-border" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-50">
              Guardar cambios
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/evaluador-perfil')}
              className="px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: SEGURIDAD Y ESTADÍSTICAS */}
        <div className="lg:col-span-5 space-y-6 w-full">
          
          {/* TARJETA SEGURIDAD (Abre la modal al dar clic) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Seguridad</h4>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" readOnly value="************" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-400 outline-none cursor-not-allowed box-border" />
              <p className="text-[10px] text-gray-400 font-medium mt-2">Última actualización: 15 de abril de 2025</p>
            </div>
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 bg-white transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
              >
                <Lock size={12} /> Cambiar contraseña
              </button>
            </div>
          </div>

          {/* TARJETA ESTADÍSTICAS PERSONALES */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Estadísticas personales</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50/40 border border-blue-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-blue-600 mb-0.5">6</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Proyectos asignados</p>
              </div>
              <div className="bg-green-50/40 border border-green-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-green-600 mb-0.5">18</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Evaluaciones realizadas</p>
              </div>
              <div className="bg-amber-50/40 border border-amber-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-amber-600 mb-0.5">24</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Actividades revisadas</p>
              </div>
            </div>
          </div>

        </div>

      </form>

      {/* VENTANA MODAL PARA EL CAMBIO DE CONTRASEÑA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md p-6 shadow-xl space-y-4 m-4 relative box-border">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-gray-900">
                <Lock size={16} className="text-blue-600" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Actualizar contraseña</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); setErrorPassword(''); }} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {errorPassword && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">⚠ {errorPassword}</div>}
            {successPassword && <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-semibold">✓ {successPassword}</div>}

            <form onSubmit={manejarCambioContrasena} className="space-y-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña actual</label>
                <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="••••••••••••" className="w-full p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-gray-700 font-medium box-border" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
                <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-gray-700 font-medium box-border" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Confirmar nueva contraseña</label>
                <input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} placeholder="Repite la nueva contraseña" className="w-full p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-gray-700 font-medium box-border" />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setErrorPassword(''); }} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cerrar</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-100">Actualizar clave</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};