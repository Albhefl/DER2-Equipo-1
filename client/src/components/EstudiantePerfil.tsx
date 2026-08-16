import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building, FileText, CalendarDays,
  Upload, ListChecks, CheckCircle2, Package, FolderOpen, Edit2
} from 'lucide-react';

import { API_BASE_URL } from '../config/api';

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
};

function initials(name: string) {
  if (!name) return "AG";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

// Tarjeta de métrica -- misma estructura que el Figma (StatCard), usando
// tokens (bg-card/border-border/text-foreground) para el contenedor y
// colores Tailwind normales (-100/-600) para el ícono, igual que ya
// habíamos ajustado antes contra el Figma de "Actividad del proyecto".
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
      </div>
    </div>
  );
}

export const EstudiantePerfil: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Métricas reales de la API (igual que antes, sin tocar esta parte)
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
  });

  const [draft, setDraft] = useState<ProfileData>(profile);

  // 🟢 Carga el perfil SOLO desde la llave "user" (la única que escribe Login.tsx).
  // Antes también se leía una llave vieja "usuario" (en español) que quedaba
  // cacheada de versiones anteriores del proyecto y siempre tenía prioridad,
  // por eso el perfil mostraba datos de otra cuenta sin importar quién iniciara
  // sesión. Se elimina ese fallback para que esto no vuelva a pasar.
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

  // 🟢 Guardar cambios: sigue persistiendo solo en localStorage (todavía no existe
  // un PUT /api/usuarios/:id real; eso sería otra HU aparte). Ahora solo escribe
  // en la llave "user" -- ya no se duplica hacia "usuario" para evitar volver a
  // generar la misma inconsistencia que causaba el bug.
  const handleGuardarCambios = () => {
    setSaving(true);
    try {
      const storedUser = localStorage.getItem("user");
      const currentObj = storedUser ? JSON.parse(storedUser) : {};
      const updatedObj = { ...currentObj, ...draft };

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
    setDraft(profile);
    setIsEditing(false);
  };

  const campos: { label: string; key: keyof ProfileData; icon: React.ReactNode }[] = [
    { label: "Nombre completo", key: "name", icon: <User size={14} /> },
    { label: "Correo electrónico", key: "email", icon: <Mail size={14} /> },
    { label: "Teléfono", key: "phone", icon: <Phone size={14} /> },
    { label: "Universidad", key: "university", icon: <Building size={14} /> },
    { label: "Carrera", key: "career", icon: <FileText size={14} /> },
    { label: "Semestre", key: "semester", icon: <CalendarDays size={14} /> },
  ];

  return (
    <div className="p-6 flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu información personal</p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Edit2 size={15} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelar}
              className="px-3.5 py-2 bg-secondary text-secondary-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarCambios}
              disabled={saving}
              className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center shrink-0">
          {initials(profile.name)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.role} · {profile.university}</p>
          {isEditing && (
            <button type="button" className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
              <Upload size={12} /> Cambiar foto
            </button>
          )}
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Información personal</h3>
        <div className="grid grid-cols-2 gap-4">
          {campos.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">{f.icon} {f.label}</label>
              {!isEditing ? (
                <p className="text-sm font-medium text-foreground">{profile[f.key] as string}</p>
              ) : (
                <input
                  value={draft[f.key] as string}
                  onChange={setField(f.key)}
                  className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              )}
            </div>
          ))}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Biografía</label>
            {!isEditing ? (
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            ) : (
              <textarea
                value={draft.bio}
                onChange={setField("bio")}
                rows={3}
                className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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