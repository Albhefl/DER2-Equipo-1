import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Building, FileText, CalendarDays,
  Upload, ListChecks, CheckCircle2, Package, FolderOpen, Edit2, AlertCircle
} from 'lucide-react';

import { API_BASE_URL, SERVER_URL } from '../config/api';

const API_ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const API_PROYECTOS_URL = `${API_BASE_URL}/proyectos`;

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
  profilePicture?: string;
};

function initials(name: string) {
  if (!name) return "AG";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

// 🎨 CAMBIADO: min-w-0 + truncate para que el valor numérico o el label largo
// nunca empujen el layout ni desborden la tarjeta en pantallas angostas.
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-foreground leading-none tabular-nums">{value}</p>
        <p className="text-[11px] font-semibold mt-1 text-foreground-muted truncate">{label}</p>
      </div>
    </div>
  );
}

export const EstudiantePerfil: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🟢 el archivo seleccionado se guarda aquí, no se sube todavía
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [totalActividades, setTotalActividades] = useState(0);
  const [completadas, setCompletadas] = useState(0);
  const [totalEntregas, setTotalEntregas] = useState(0);
  const [totalProyectos, setTotalProyectos] = useState(0);

  const [profile, setProfile] = useState<ProfileData>({
    name: "Estudiante",
    email: "",
    role: "Estudiante",
    university: "Universidad Nacional Autónoma",
    phone: "+52 55 1234 5678",
    bio: "Estudiante de Ingeniería en Sistemas con interés en diseño UX y desarrollo de software.",
    career: "Ingeniería en Sistemas",
    semester: "6°",
    profilePicture: ""
  });

  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    const cargarUsuario = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          const datos = {
            id: u.id || "",
            name: u.name || u.nombre || u.fullName || "Estudiante",
            email: u.email || u.correo || "",
            role: "Estudiante",
            university: u.university || u.escuela || "Universidad Nacional Autónoma",
            phone: u.phone || u.telefono || "+52 55 1234 5678",
            bio: u.bio || "Estudiante de Ingeniería en Sistemas con interés en diseño UX y desarrollo de software.",
            career: u.career || u.carrera || "Ingeniería en Sistemas",
            semester: u.semester || u.semestre || "6°",
            profilePicture: u.profilePicture || ""
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

  // 🟢 Limpieza del object URL de previsualización al desmontar o reemplazar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 🟢 ya no sube nada al servidor. Solo guarda el archivo
  // seleccionado y genera una previsualización local (URL.createObjectURL).
  // La subida real ocurre en handleGuardarCambios().
  const handleSeleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorSubida(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    if (e.target) e.target.value = '';
  };

  // 🟢 sube la foto pendiente al servidor (se llama desde Guardar cambios)
  const subirFotoPendiente = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/usuarios/perfil/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'No se pudo actualizar la foto de perfil.');
    }

    const data = await res.json();
    return data.usuario.profilePicture as string;
  };

  const setField = (k: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft(d => ({ ...d, [k]: e.target.value }));
  };

  // 🟢 ahora es async. Si hay una foto pendiente, primero la sube;
  // solo si eso tiene éxito continúa guardando el resto del perfil.
  const handleGuardarCambios = async () => {
    setSaving(true);
    setErrorSubida(null);

    try {
      let profilePictureFinal = draft.profilePicture;

      if (selectedFile) {
        profilePictureFinal = (await subirFotoPendiente()) || profilePictureFinal;
      }

      const draftFinal = { ...draft, profilePicture: profilePictureFinal };

      const storedUser = localStorage.getItem("user");
      const currentObj = storedUser ? JSON.parse(storedUser) : {};
      const updatedObj = { ...currentObj, ...draftFinal };
      localStorage.setItem("user", JSON.stringify(updatedObj));

      setProfile(draftFinal);
      setDraft(draftFinal);
      setIsEditing(false);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error al guardar cambios:', err);
      setErrorSubida(err.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    setDraft(profile);
    setIsEditing(false);
    setErrorSubida(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const campos: { label: string; key: keyof ProfileData; icon: React.ReactNode }[] = [
    { label: "Nombre completo", key: "name", icon: <User size={14} /> },
    { label: "Correo electrónico", key: "email", icon: <Mail size={14} /> },
    { label: "Teléfono", key: "phone", icon: <Phone size={14} /> },
    { label: "Universidad", key: "university", icon: <Building size={14} /> },
    { label: "Carrera", key: "career", icon: <FileText size={14} /> },
    { label: "Semestre", key: "semester", icon: <CalendarDays size={14} /> },
  ];

  // 🟢 qué imagen mostrar en el avatar (previsualización local > la guardada)
  const avatarSrc = previewUrl || (profile.profilePicture ? `${SERVER_URL}/uploads/${profile.profilePicture}` : null);

  // 🎨 NUEVO: tokens de la paleta, escopados a este componente vía CSS custom
  // properties en el nodo raíz. Como bg-card / text-foreground / border-border
  // etc. ya se resuelven contra estas variables, todo el árbol hereda los
  // valores nuevos sin tocar el tema global ni ninguna función del componente.
  const paletteVars = {
    ['--color-background' as string]: '#f4f5f8',
    ['--color-foreground' as string]: '#1a1d2e',
    ['--color-primary' as string]: '#4f46e5',
    ['--color-primary-foreground' as string]: '#ffffff',
    ['--color-border' as string]: 'rgba(0,0,0,0.08)',
    ['--color-card' as string]: '#ffffff',
    ['--color-muted' as string]: '#f4f5f8',
    ['--color-muted-foreground' as string]: '#6b7280',
    ['--color-secondary' as string]: '#f4f5f8',
    ['--color-secondary-foreground' as string]: '#1a1d2e',
    ['--color-input-background' as string]: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties;

  return (
    // 🎨 CAMBIADO: w-full + overflow-x-hidden + box-border en la raíz para
    // que el componente nunca se desborde de su contenedor padre, sin
    // importar el ancho de pantalla.
    <div
      className="p-6 flex flex-col gap-5 w-full max-w-3xl mx-auto box-border overflow-x-hidden"
      style={paletteVars}
    >
      {/* 🎨 Import de Inter (400/500/600/700/900) que pide la especificación */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleSeleccionarFoto} accept="image/*" className="hidden" />

      {/* Alerta visual elegante en caso de error */}
      {errorSubida && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium flex items-start gap-2 wrap-break-word">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span className="min-w-0">{errorSubida}</span>
        </div>
      )}

      {/* 🎨 CAMBIADO: flex-wrap para que en móvil el título y los botones
          no se corten ni empujen el layout fuera de pantalla */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Perfil</h1>
          <p className="text-sm text-[#6b7280]">Gestiona tu información personal</p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition cursor-pointer shrink-0"
          >
            <Edit2 size={15} /> Editar
          </button>
        ) : (
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleCancelar}
              disabled={saving}
              className="px-3.5 py-2 bg-secondary text-secondary-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarCambios}
              disabled={saving}
              className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>

      {/* Avatar con soporte de imagen real, previsualización local o iniciales */}
      {/* 🎨 CAMBIADO: flex-wrap + min-w-0 + wrap-break-word para que un nombre o
          universidad largos nunca desborden la tarjeta */}
      <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-5 flex-wrap">
        <div className="relative group shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-xs"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center">
              {initials(profile.name)}
            </div>
          )}

          {/* 🟢 el botón de la cámara solo aparece en modo edición */}
          {/* 🎨 CAMBIADO: bg-black/hover:bg-gray-800 → bg-primary, coherente
              con el acento índigo del resto de la interfaz */}
          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow hover:bg-primary/90 transition cursor-pointer"
              title="Cambiar foto de perfil"
            >
              <Upload size={12} />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
          <p className="text-sm text-[#6b7280] truncate">{profile.role} · {profile.university}</p>

          {/* 🟢 el enlace de texto también solo aparece editando */}
          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload size={12} /> {selectedFile ? 'Cambiar foto seleccionada' : 'Cambiar foto de perfil'}
            </button>
          )}
          {isEditing && selectedFile && (
            <p className="text-[11px] text-foreground-muted mt-1">
              Se guardará al hacer clic en "Guardar cambios".
            </p>
          )}
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Información personal</h3>
        {/* 🎨 CAMBIADO: grid-cols-1 en móvil, 2 columnas desde sm, y min-w-0
            en cada celda para que valores largos no empujen el grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campos.map(f => (
            <div key={f.key} className="flex flex-col gap-1 min-w-0">
              <label className="text-xs text-foreground-muted flex items-center gap-1">{f.icon} {f.label}</label>
              {!isEditing ? (
                <p className="text-sm font-medium text-foreground wrap-break-word">{profile[f.key] as string}</p>
              ) : (
                <input
                  value={draft[f.key] as string}
                  onChange={setField(f.key)}
                  className="w-full min-w-0 px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              )}
            </div>
          ))}
          <div className="col-span-full sm:col-span-2 flex flex-col gap-1 min-w-0">
            <label className="text-xs text-foreground-muted">Biografía</label>
            {!isEditing ? (
              <p className="text-sm text-[#6b7280] wrap-break-word">{profile.bio}</p>
            ) : (
              <textarea
                value={draft.bio}
                onChange={setField("bio")}
                rows={3}
                className="w-full min-w-0 px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            )}
          </div>
        </div>
      </div>

      {/* Actividad del proyecto */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Actividad del proyecto</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Actividades" value={totalActividades} color="bg-indigo-100 text-indigo-600" icon={<ListChecks size={16} />} />
          <StatCard label="Completadas" value={completadas} color="bg-green-100 text-green-600" icon={<CheckCircle2 size={16} />} />
          <StatCard label="Entregas" value={totalEntregas} color="bg-amber-100 text-amber-600" icon={<Package size={16} />} />
          <StatCard label="Proyectos" value={totalProyectos} color="bg-blue-100 text-blue-600" icon={<FolderOpen size={16} />} />
        </div>
      </div>
    </div>
  );
};

export default EstudiantePerfil;
