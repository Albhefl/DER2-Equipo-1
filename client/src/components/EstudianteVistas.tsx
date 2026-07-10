import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Eye, EyeOff, Search, Plus, Edit2, ChevronLeft, ChevronRight,
  Upload, X, LayoutDashboard, FolderOpen, ListChecks, Package,
  CalendarDays, User, LogOut, Send, CheckCircle2, Circle,
  Users, Paperclip, MessageSquare, LayoutGrid, ArrowLeft, Mail, Phone, Building, Clock,
  AlertCircle, CheckSquare, Trash2, Link,
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ACTIVITIES = [
  {
    id: 1, title: "Investigar usuarios",
    description: "Analizar necesidades y comportamientos de los usuarios del sistema.",
    responsible: "Ana García", priority: "Alta", status: "Pendiente",
    dueDate: "23/05/2025", startDate: "10/05/2025",
    createdAt: "10/06/2025 10:30 a.m.", createdBy: "Juan Pérez",
    updatedAt: "15/06/2025 04:45 p.m.", updatedBy: "María González",
    comments: [
      { id: 1, author: "Juan Pérez", avatar: "JP", text: "Completé la encuesta inicial con 20 participantes.", time: "Hoy, 10:15" },
      { id: 2, author: "Ana García", avatar: "AG", text: "Revisando los resultados, parece que hay patrones interesantes.", time: "Hoy, 11:30" },
    ],
    evidence: ["Reporte_usuarios.pdf", "Encuesta_resultados.xlsx"],
    checklist: ["Definir segmentos de usuarios", "Diseñar encuesta", "Aplicar entrevistas", "Analizar resultados"],
  },
  {
    id: 2, title: "Definir alcance",
    description: "Establecer el alcance del proyecto y los objetivos principales.",
    responsible: "María González", priority: "Media", status: "En Proceso",
    dueDate: "25/05/2025", startDate: "12/05/2025",
    createdAt: "10/06/2025 09:00 a.m.", createdBy: "Juan Pérez",
    updatedAt: "16/06/2025 02:00 p.m.", updatedBy: "María González",
    comments: [], evidence: [],
    checklist: ["Revisar requerimientos", "Reunión con stakeholders", "Documentar alcance"],
  },
  {
    id: 3, title: "Diseño de interfaz",
    description: "Crear prototipos y guías de estilo de la interfaz de usuario.",
    responsible: "Carlos López", priority: "Alta", status: "En Revisión",
    dueDate: "27/05/2025", startDate: "15/05/2025",
    createdAt: "12/06/2025", createdBy: "Ana García",
    updatedAt: "18/06/2025", updatedBy: "Carlos López",
    comments: [
      { id: 1, author: "Carlos López", avatar: "CL", text: "Wireframes v2 listos para revisión.", time: "Ayer, 18:00" },
    ],
    evidence: ["Wireframes_v2.fig", "Guia_estilos.pdf"],
    checklist: ["Bocetos iniciales", "Wireframes de alta fidelidad", "Guía de estilos"],
  },
  {
    id: 4, title: "Pruebas de usabilidad",
    description: "Entregar resultados con usuarios y documentar observaciones.",
    responsible: "Juan Pérez", priority: "Baja", status: "Completado",
    dueDate: "30/05/2025", startDate: "20/05/2025",
    createdAt: "14/06/2025", createdBy: "María González",
    updatedAt: "20/06/2025", updatedBy: "Juan Pérez",
    comments: [], evidence: ["Pruebas_informe.pdf"],
    checklist: ["Definir escenarios", "Reclutar participantes", "Ejecutar pruebas", "Documentar hallazgos"],
  },
];

const MOCK_ENTREGAS = [
  { id: 1, title: "Investigar usuarios", description: "Sub reporte de hallazgos y entrevistas.", status: "Pendiente", dueDate: "23/05/2025", format: "PDF / DOCX", evidence: [] },
  { id: 2, title: "Definir alcance", description: "Documentación y análisis del proyecto.", status: "En Revisión", dueDate: "25/05/2025", format: "PDF", evidence: ["alcance_v1.pdf"] },
  { id: 3, title: "Diseño de interfaz", description: "Prototipos de alta fidelidad.", status: "Aprobado", dueDate: "27/05/2025", format: "PDF / IMG", evidence: ["diseno_final.pdf", "mockups.png"] },
  { id: 4, title: "Pruebas de usabilidad", description: "Entregar resultados con usuarios.", status: "Completada", dueDate: "30/05/2025", format: "PDF / DOCX", evidence: [] },
];

const KANBAN_COLUMNS = ["Pendiente", "En Proceso", "En Revisión", "Completado"];
const KANBAN_INIT = {
  "Pendiente": [
    { id: 1, title: "Investigar usuarios", responsible: "Ana García", priority: "Alta", dueDate: "23/05/2025" },
    { id: 5, title: "Reunión de equipo", responsible: "Juan Pérez", priority: "Media", dueDate: "22/05/2025" },
  ],
  "En Proceso": [
    { id: 2, title: "Definir alcance", responsible: "María González", priority: "Media", dueDate: "25/05/2025" },
    { id: 6, title: "Documentar API", responsible: "Carlos López", priority: "Alta", dueDate: "26/05/2025" },
    { id: 7, title: "Configurar entorno", responsible: "Ana García", priority: "Baja", dueDate: "20/05/2025" },
  ],
  "En Revisión": [
    { id: 3, title: "Diseño de interfaz", responsible: "Carlos López", priority: "Alta", dueDate: "27/05/2025" },
  ],
  "Completado": [
    { id: 4, title: "Pruebas de usabilidad", responsible: "Juan Pérez", priority: "Baja", dueDate: "30/05/2025" },
    { id: 8, title: "Análisis inicial", responsible: "María González", priority: "Media", dueDate: "15/05/2025" },
  ],
};

const CHART_DATA = [
  { name: "Pendientes", value: 7 },
  { name: "En Proceso", value: 8 },
  { name: "En Revisión", value: 4 },
  { name: "Completados", value: 5 },
];
const CHART_COLORS = ["#94a3b8", "#3b82f6", "#f59e0b", "#22c55e"];

const UPCOMING_ACTIVITIES = [
  { title: "Realizar pruebas de usabilidad", date: "22/05/2025" },
  { title: "Documentar resultados", date: "24/05/2025" },
  { title: "Preparar presentación final", date: "27/05/2025" },
];

const RECENT_LOG = [
  { action: "Completaste 'Investigar usuarios'", time: "Hoy, 10:15" },
  { action: "Actualizaste 'Definir alcance'", time: "Hoy, 09:40" },
  { action: "'Diseño de la interfaz' en revisión", time: "Ayer, 18:00" },
  { action: "Nueva actividad agregada: 'Pruebas'", time: "Ayer, 16:20" },
];

const CALENDAR_EVENTS: Record<number, { title: string; type: "reunion" | "entrega" | "actividad" }[]> = {
  3: [{ title: "Reunión de avance", type: "reunion" }],
  10: [{ title: "Entrega prueba", type: "entrega" }],
  12: [{ title: "Diseño de interfaz", type: "actividad" }],
  17: [{ title: "Revisión con equipo", type: "reunion" }],
  24: [{ title: "Entrega final", type: "entrega" }],
  27: [{ title: "Diseño de etapa", type: "actividad" }],
};

const UPCOMING_EVENTS = [
  { title: "Definir alcance", date: "17/06/2025", days: "En 2 días" },
  { title: "Diseño de interfaz", date: "20/06/2025", days: "En 5 días" },
  { title: "Revisión con equipo", date: "24/06/2025", days: "En 9 días" },
  { title: "Entrega wireframes", date: "27/06/2025", days: "En 12 días" },
];

const MOCK_PROJECTS = [
  {
    id: 1, name: "ClassBoard Equipo A", description: "Diseño del sistema académico",
    team: 5, status: "Activo", progress: 67, startDate: "01/05/2025", endDate: "30/06/2025", priority: "Alta", docente: "Dr. Roberto García", entregaFinal: "30/06/2025",
    members: [
      { name: "Ana García Pérez", email: "ana@universidad.edu", role: "Líder" },
      { name: "Juan Pérez López", email: "juan@universidad.edu", role: "Desarrollador" },
    ],
    evaluators: []
  }
];

// Helpers estáticos de estilos
function statusBg(status: string) {
  if (status === "Pendiente") return "bg-gray-100 text-gray-600";
  if (status === "En Proceso") return "bg-blue-100 text-blue-700";
  if (status === "En Revisión") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
function priorityBg(p: string) {
  if (p === "Alta") return "bg-red-100 text-red-700";
  if (p === "Media") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function Badge({ label, cls }: { label: string; cls: string }) { return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>; }
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-400 font-medium">{label}</p></div>
    </div>
  );
}

// ─── EXPORTACIONES INDIVIDUALES PARA TU ROUTER ──────────────────────────────

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard del Estudiante</h1><p className="text-sm text-gray-400">Proyecto: ClassBoard Equipo A</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <StatCard label="Total de actividades" value={24} color="bg-indigo-50 text-indigo-600" icon={<ListChecks size={20} />} />
        <StatCard label="Pendientes" value={7} color="bg-gray-50 text-gray-500" icon={<Clock size={20} />} />
        <StatCard label="En proceso" value={8} color="bg-blue-50 text-blue-600" icon={<AlertCircle size={20} />} />
        <StatCard label="En revisión" value={4} color="bg-amber-50 text-amber-600" icon={<Eye size={20} />} />
        <StatCard label="Completadas" value={5} color="bg-green-50 text-green-600" icon={<CheckCircle2 size={20} />} />
      </div>
      <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold mb-3">Progreso del proyecto</h3>
        <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400 font-medium">16 de 24 actividades</span><span className="text-sm font-black text-blue-600">67%</span></div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: "67%" }} /></div>
      </div>
    </div>
  );
}

export function ProyectosPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Mis Proyectos</h2><p className="text-xs text-gray-400 mt-1">ClassBoard Equipo A - Activo</p></div>;
}

export function ActividadesPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Lista de Actividades</h2><p className="text-xs text-gray-400 mt-1">Gestiona las tareas de tu sprint</p></div>;
}

export function EntregasPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Módulo de Entregas</h2><p className="text-xs text-gray-400 mt-1">Sube tus evidencias y reportes finales</p></div>;
}

export function CalendarioPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Calendario de Entregas</h2><p className="text-xs text-gray-400 mt-1">Consulta tus fechas límite</p></div>;
}

export function KanbanPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Tablero Kanban</h2><p className="text-xs text-gray-400 mt-1">Mueve tus tarjetas para actualizar estados</p></div>;
}

export function PerfilPage() {
  return <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><h2 className="font-bold text-gray-900 text-sm">Perfil del Alumno</h2><p className="text-xs text-gray-400 mt-1">Información académica</p></div>;
}