import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { API_BASE_URL, SERVER_URL } from '../config/api';

const API_PROYECTOS_URL = `${API_BASE_URL}/actividades/proyectos`;
const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;

interface UsuarioPerfil {
  name: string;
  email: string;
  role?: string;
  profilePicture?: string;
}

const getInitials = (name?: string) => {
  if (!name) return 'EV';
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  } else {
    return parts[0][0].toUpperCase();
  }
};

export const EvaluadorPerfil: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil>({
    name: 'Profesor01',
    email: 'profesor01@classboard.com',
    role: 'EVALUATOR',
    profilePicture: ''
  });
  const [totalProyectos, setTotalProyectos] = useState(0);
  const [totalActividades, setTotalActividades] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPerfilYDatos = async () => {
      setLoading(true);
      try {
        const userStored = localStorage.getItem('user');
        if (userStored) {
          const parsed = JSON.parse(userStored);
          setPerfil({
            name: parsed.name || 'Profesor01',
            email: parsed.email || 'profesor01@classboard.com',
            role: parsed.role || 'EVALUATOR',
            profilePicture: parsed.profilePicture || ''
          });
        }

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resProyectos, resActividades] = await Promise.all([
          fetch(API_PROYECTOS_URL, { headers }),
          fetch(API_ACTIVIDADES_URL, { headers })
        ]);

        if (resProyectos.ok) {
          const dataP = await resProyectos.json();
          setTotalProyectos((dataP.proyectos || []).length);
        }

        if (resActividades.ok) {
          const dataA = await resActividades.json();
          setTotalActividades((dataA.actividades || []).length);
        }

      } catch (err) {
        console.error('Error al cargar datos del perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfilYDatos();
  }, []);

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/usuarios/perfil/foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.usuario;

        const storedUser = localStorage.getItem('user');
        const currentObj = storedUser ? JSON.parse(storedUser) : {};
        const newObj = { ...currentObj, profilePicture: updatedUser.profilePicture };
        localStorage.setItem('user', JSON.stringify(newObj));

        setPerfil(prev => ({ ...prev, profilePicture: updatedUser.profilePicture }));
      } else {
        alert('No se pudo actualizar la foto de perfil.');
      }
    } catch (err) {
      console.error('Error al subir la foto:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const nombreUsuario = perfil.name;
  const correoUsuario = perfil.email;
  const iniciales = getInitials(nombreUsuario);
  const rolUsuario = perfil.role === 'EVALUATOR' ? 'Evaluador' : 'Usuario';

  return (
    <div className="w-full max-w-full space-y-6 box-border">
      <input type="file" ref={fileInputRef} onChange={handleSubirFoto} accept="image/*" className="hidden" />
      
      {/* HEADER DE LA SECCIÓN */}
      <header className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-4 md:p-6 shadow-sm shadow-gray-100/40">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">Mi perfil</h2>
          <p className="text-xs text-gray-400">Información de tu cuenta</p>
        </div>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="relative group shrink-0">
            {perfil.profilePicture ? (
              <img 
                src={`${SERVER_URL}/uploads/${perfil.profilePicture}`} 
                alt="Avatar" 
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {iniciales}
              </div>
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{nombreUsuario}</p>
            <p className="text-xs text-gray-400">{rolUsuario}</p>
          </div>
        </div>
      </header>

      {/* TARJETA SUPERIOR DE USUARIO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group shrink-0">
            {perfil.profilePicture ? (
              <img 
                src={`${SERVER_URL}/uploads/${perfil.profilePicture}`} 
                alt="Avatar" 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                {iniciales}
              </div>
            )}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full shadow hover:bg-gray-800 transition cursor-pointer"
              title="Cambiar foto de perfil"
            >
              <Upload size={12} />
            </button>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug truncate">{nombreUsuario}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{correoUsuario}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 leading-normal">
              Rol en plataforma: <strong className="text-gray-600">{rolUsuario}</strong>
            </p>
          </div>
        </div>
        <Link 
          to="/evaluador-perfil/editar" 
          className="text-center text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 bg-white transition-colors w-full sm:w-auto block shadow-sm"
        >
          Editar perfil
        </Link>
      </div>

      {/* GRID CONFIGURABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN PERSONAL */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 lg:col-span-7 space-y-4 w-full box-border">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Información personal</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input type="text" readOnly value={loading ? 'Cargando...' : nombreUsuario} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <input type="text" readOnly value={loading ? 'Cargando...' : correoUsuario} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de cuenta</label>
              <input type="text" readOnly value={rolUsuario} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-default" />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SEGURIDAD Y ESTADÍSTICAS */}
        <div className="lg:col-span-5 space-y-6 w-full">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Seguridad</h4>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" readOnly value="************" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-400 outline-none cursor-default" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/40 space-y-4 w-full box-border">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Estadísticas personales</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50/40 border border-blue-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-base md:text-lg font-black text-blue-600 mb-0.5">{loading ? '...' : totalProyectos}</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Proyectos asignados</p>
              </div>
              <div className="bg-green-50/40 border border-green-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-green-600 mb-0.5">{loading ? '...' : totalActividades}</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Evaluaciones realizadas</p>
              </div>
              <div className="bg-amber-50/40 border border-amber-50/80 p-3 rounded-xl flex flex-col justify-center items-center">
                <p className="text-lg font-black text-amber-600 mb-0.5">{loading ? '...' : totalActividades}</p>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Actividades revisadas</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EvaluadorPerfil;