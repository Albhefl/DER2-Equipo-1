import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building, FileText, CalendarDays, 
  Upload, ListChecks, CheckCircle2, Package, FolderOpen, Edit2 
} from 'lucide-react';

const API_ACTIVIDADES_URL = "http://localhost:3000/api/actividades";
const API_PROYECTOS_URL = "http://localhost:3000/api/proyectos";

type ProfileData = {
  id?: string;
  name: string;
  email: string;
  role: string;
  university: string;
  phone: string;
  bio: string;
  career: string;
  semester: string;
};

function initials(name: string) {
  if (!name) return "AG";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function MetricCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm shadow-gray-100/30">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 font-semibold mt-1">{label}</p>
      </div>
    </div>
  );
}

export const EstudiantePerfil: React.FC = () => {
  // Estado para alternar entre MODO LECTURA ("view") y MODO EDICIÓN ("edit")
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Métricas reales de la API
  const [totalActividades, setTotalActividades] = useState(0);
  const [completadas, setCompletadas] = useState(0);
  const [totalEntregas, setTotalEntregas] = useState(0);
  const [totalProyectos, setTotalProyectos] = useState(0);

  // Estado del perfil activo
  const [profile, setProfile] = useState<ProfileData>({
    name: "Ana García Pérez",
    email: "ana.garcia@universidad.edu",
    role: "Estudiante",
    university: "Universidad Nacional Autónoma",
    phone: "+52 55 1234 5678",
    bio: "Estudiante de Ingeniería en Sistemas con interés en diseño UX y desarrollo de software.",
    career: "Ingeniería en Sistemas",
    semester: "6°",
  });

  // Borrador de edición
  const [draft, setDraft] = useState<ProfileData>(profile);

  // Cargar perfil guardado localmente o de la API
  useEffect(() => {
    const cargarUsuario = () => {
      try {
        const storedUser = localStorage.getItem("usuario") || localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          const datos = {
            id: u.id || "",
            name: u.name || u.nombre || u.fullName || "Ana García Pérez",
            email: u.email || u.correo || "ana.garcia@universidad.edu",
            role: "Estudiante",
            university: u.university || u.escuela || "Universidad Nacional Autónoma",
            phone: u.phone || u.telefono || "+52 55 1234 5678",
            bio: u.bio || "Estudiante de Ingeniería en Sistemas con interés en diseño UX y desarrollo de software.",
            career: u.career || u.carrera || "Ingeniería en Sistemas",
            semester: u.semester || u.semestre || "6°",
          };
          setProfile(datos);
          setDraft(datos);
        }
      } catch (e) {
        console.error("Error al cargar usuario", e);
      }
    };

    const fetchMetricas = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resAct, resProy] = await Promise.all([
          fetch(API_ACTIVIDADES_URL, { headers }).catch(() => null),
          fetch(API_PROYECTOS_URL, { headers }).catch(() => null),
        ]);

        if (resAct && resAct.ok) {
          const dataAct = await resAct.json();
          const actividades = dataAct.actividades || [];
          setTotalActividades(actividades.length);
          setCompletadas(actividades.filter((a: any) => a.status === "DONE" || a.status === "Completado").length);
          setTotalEntregas(actividades.filter((a: any) => a.status === "IN_REVIEW" || a.status === "En Revisión").length);
        }

        if (resProy && resProy.ok) {
          const dataProy = await resProy.json();
          setTotalProyectos((dataProy.proyectos || []).length);
        }
      } catch (err) {
        console.error("Error cargando métricas:", err);
      }
    };

    cargarUsuario();
    fetchMetricas();
  }, []);

  const setField = (k: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft(d => ({ ...d, [k]: e.target.value }));
  };

  // Acción para guardar los cambios y volver al modo lectura
  const handleGuardarCambios = () => {
    setSaving(true);
    try {
      const storedUser = localStorage.getItem("usuario") || localStorage.getItem("user");
      const currentObj = storedUser ? JSON.parse(storedUser) : {};
      const updatedObj = { ...currentObj, ...draft };
      
      localStorage.setItem("usuario", JSON.stringify(updatedObj));
      localStorage.setItem("user", JSON.stringify(updatedObj));
    } catch (e) {
      console.error(e);
    }
    
    setTimeout(() => {
      setProfile(draft);
      setIsEditing(false);
      setSaving(false);
    }, 300);
  };

  const handleCancelar = () => {
    setDraft(profile); // Restaurar valores originales
    setIsEditing(false);
  };

  return (
    <div className="p-6 flex flex-col gap-6 w-full max-w-5xl box-border font-sans">
      
      {/* CABECERA CON CONMUTADOR DE BOTONES FIGMA STYLE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Perfil</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Gestiona tu información personal</p>
        </div>

        {/* SI NO ESTÁ EDITANDO -> MUESTRA "EDITAR" */}
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200/80 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-300 transition shadow-sm"
          >
            <Edit2 size={13} /> Editar
          </button>
        ) : (
          /* SI ESTÁ EDITANDO -> MUESTRA "CANCELAR" Y "GUARDAR CAMBIOS" */
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelar}
              className="px-4 py-2 bg-gray-200/70 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarCambios}
              disabled={saving}
              className="px-4 py-2 bg-[#0B1026] text-white rounded-xl text-xs font-bold hover:bg-[#060916] transition shadow-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: AVATAR Y DATOS BÁSICOS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm shadow-gray-100/40">
        <div className="w-20 h-20 rounded-full bg-gray-200/80 text-gray-800 text-xl font-bold flex items-center justify-center shrink-0">
          {initials(profile.name)}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
          <p className="text-xs text-gray-400 font-medium">{profile.role} · {profile.university}</p>
          <button className="text-[11px] text-gray-500 hover:text-gray-800 transition flex items-center gap-1 font-medium pt-1">
            <Upload size={13} /> Cambiar foto
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: INFORMACIÓN PERSONAL (VISTA LECTURA O EDICIÓN) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm shadow-gray-100/40 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">
          Información personal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* NOMBRE COMPLETO */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <User size={13} className="text-gray-400" /> Nombre completo
            </label>
            {isEditing ? (
              <input 
                value={draft.name} 
                onChange={setField("name")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.name}
              </div>
            )}
          </div>

          {/* CORREO ELECTRÓNICO */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400" /> Correo electrónico
            </label>
            {isEditing ? (
              <input 
                value={draft.email} 
                onChange={setField("email")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.email}
              </div>
            )}
          </div>

          {/* TELÉFONO */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <Phone size={13} className="text-gray-400" /> Teléfono
            </label>
            {isEditing ? (
              <input 
                value={draft.phone} 
                onChange={setField("phone")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.phone}
              </div>
            )}
          </div>

          {/* UNIVERSIDAD */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <Building size={13} className="text-gray-400" /> Universidad
            </label>
            {isEditing ? (
              <input 
                value={draft.university} 
                onChange={setField("university")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.university}
              </div>
            )}
          </div>

          {/* CARRERA */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <FileText size={13} className="text-gray-400" /> Carrera
            </label>
            {isEditing ? (
              <input 
                value={draft.career} 
                onChange={setField("career")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.career}
              </div>
            )}
          </div>

          {/* SEMESTRE */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <CalendarDays size={13} className="text-gray-400" /> Semestre
            </label>
            {isEditing ? (
              <input 
                value={draft.semester} 
                onChange={setField("semester")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800">
                {profile.semester}
              </div>
            )}
          </div>

          {/* BIOGRAFÍA */}
          <div className="md:col-span-2 space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-gray-500">Biografía</label>
            {isEditing ? (
              <textarea 
                value={draft.bio} 
                onChange={setField("bio")} 
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 transition" 
              />
            ) : (
              <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-800 leading-relaxed">
                {profile.bio}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECCIÓN 3: ACTIVIDAD DEL PROYECTO */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm shadow-gray-100/40 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">
          Actividad del proyecto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <MetricCard label="Actividades" value={totalActividades} color="bg-indigo-100 text-indigo-600" icon={<ListChecks size={18} />} />
          <MetricCard label="Completadas" value={completadas} color="bg-green-100 text-green-600" icon={<CheckCircle2 size={18} />} />
          <MetricCard label="Entregas" value={totalEntregas} color="bg-amber-100 text-amber-600" icon={<Package size={18} />} />
          <MetricCard label="Proyectos" value={totalProyectos} color="bg-blue-100 text-blue-600" icon={<FolderOpen size={18} />} />
        </div>
      </div>

    </div>
  );
};

export default EstudiantePerfil;