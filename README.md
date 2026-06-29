# ClassBoard - Gestión de Proyectos Académicos 🚀

ClassBoard es una plataforma web de gestión de proyectos académicos universitarios basada en la metodología Kanban. Permite a equipos de estudiantes organizar, priorizar y hacer seguimiento de sus actividades de forma visual, mientras otorga a evaluadores académicos una vista de solo lectura para supervisar el avance sin interferir en el flujo de trabajo.

---

## 📁 Estructura del Monorepo

El proyecto está organizado bajo la siguiente jerarquía de directorios:

- **`client/`**: Frontend desarrollado con Vite + React 18, TypeScript y Tailwind CSS.
- **`server/`**: Backend desarrollado con Node.js, Express, TypeScript y Prisma ORM.
- **`docs/`**: Documentación general del proyecto.
- **`qa/`**: Plan de pruebas y reportes de calidad a cargo de QA.
- **`wireframes/`**: Diseños y componentes de UI/UX exportados.
- **`.github/workflows/`**: Pipelines de integración continua (CI/CD).

---

## 🛠️ Prerrequisitos

Antes de iniciar, asegúrate de tener instalado en tu equipo:
- **Node.js** (^20 LTS)
- **Docker & Docker Compose** (Para levantar PostgreSQL de forma local)
- **Git**

## 📥 Configuración Inicial del Proyecto

1. **Clonar el repositorio y entrar a la raíz:**
   ```bash
   git clone [https://github.com/Albhefl/DER2-Equipo-1.git]
   cd DER2-Equipo-1