# Plan de Pruebas General — ClassBoard
**Versión:** 1.0 (completo — todas las épicas y HUs cubiertas; pendiente aprobación de Fernando)
**QA:** Jarumi Flores
**Fecha:** 29/06/2026
**Estado:** Listo para revisión de Fernando (PO/BA)

---

## 1. Objetivo

Establecer el marco de criterios de calidad del proyecto ClassBoard, definiendo
tipos de prueba por épica, criterios de entrada/salida y responsables de
ejecución, antes de iniciar el desarrollo del Sprint 1.

Este documento es el **contrato de calidad** del proyecto (HU-004) y debe
mantenerse versionado en `docs/qa/`.

---

## 2. Alcance

Cubre las 11 épicas del proyecto, distribuidas en 2 Sprints:
- **Sprint 1 (Semanas 1–3):** Arquitectura, UI/UX, login, registro, actividades, asignación, fechas, prioridades (Épicas 1–7).
- **Sprint 2 (Semanas 4–6):** Tablero Kanban completo, comentarios, evidencias, dashboard (Épicas 8–11).

---

## 3. Herramientas y tipos de prueba

| Herramienta | Tipo de prueba | Uso |
|---|---|---|
| Vitest + Testing Library | Unitarias (componentes React) | Validar lógica de componentes aislados |
| Supertest + Jest | Integración (endpoints API) | Validar contratos de la API REST |
| Playwright | E2E — flujos completos | Validar flujos de usuario punta a punta |
| Postman Collections | Manual / exploratoria | Pruebas rápidas de API durante desarrollo |
| axe-core | Accesibilidad (WCAG 2.1 AA) | Validar accesibilidad de componentes UI |
| Lighthouse CI | Performance + accesibilidad automatizada | Gate general en CI, Sprint 2 |

---

## 4. Plan por Épica

### Épica 1 — Definición de Arquitectura y Configuración del Entorno Base
**Responsable principal:** Alberto (PM) | **Apoyo:** Fernando, Jarumi

| Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|
| Verificación de configuración (checklist manual) | Repositorio creado, ramas definidas | Ramas protegidas, permisos por rol confirmados, CI configurado | Jarumi |
| Revisión documental | Documento de definición aprobado | Convenciones de commits/ramas documentadas y socializadas | Jarumi + Fernando |

### Épica 2 — Diseño UI/UX
**Responsable principal:** Carlos (UI/UX)

| Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|
| Revisión de wireframes vs. requisitos | Wireframes entregados | Pantallas cubren todos los roles (Estudiante/Evaluador) y estados del Kanban, sin inconsistencias de marca | Jarumi |
| Accesibilidad temprana (heurística) | Wireframes de alta fidelidad / mockups | Contraste, jerarquía y navegación validados antes de pasar a desarrollo | Jarumi |

### Épica 3 — Inicio de Sesión Básico
**Responsable:** Llilia (Dev) | **Apoyo:** Carlos

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-009 Formulario de login | Unitarias (Vitest) + Accesibilidad (axe-core) | Componente de login implementado | Validaciones de campo correctas, sin errores críticos de accesibilidad | Jarumi |
| HU-010 Pruebas funcionales y seguridad del login | Integración (Supertest+Jest) + Manual (Postman) | Endpoint `/auth/login` implementado con rate-limit | Bloqueo tras intentos fallidos (fuerza bruta) verificado, JWT emitido correctamente | Jarumi |
| HU-011 Diferenciación de rol Evaluador vs. Estudiante | Integración + Manual | Roles definidos en BD | Redirección correcta según rol tras login, sin fuga de permisos | Jarumi |

### Épica 4 — Módulo de Registro de Actividades
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-012 Creación de actividad | Unitarias (Vitest) | Formulario de creación implementado | Validación de campos obligatorios (título, fecha, responsable) | Jarumi |
| HU-013 Edición y eliminación de actividad | Unitarias + Integración | CRUD implementado en API | Edición/eliminación reflejan cambios en BD y UI sin inconsistencias | Jarumi |
| HU-014 Pruebas funcionales del módulo de registro | Integración (Supertest+Jest) | Endpoints CRUD de actividades listos | Cobertura de casos válidos e inválidos (campos vacíos, fechas pasadas) | Jarumi |

### Épica 5 — Sistema de Asignación de Responsables
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-015 Asignación de responsable | Unitarias + Integración | Relación `activity_assignees` implementada | Asignación múltiple funciona, se refleja en tablero y dashboard | Jarumi |
| HU-016 Filtrado del tablero por responsable | Unitarias (Vitest) | Filtro de UI implementado | Filtro muestra solo actividades del responsable seleccionado | Jarumi |

### Épica 6 — Control de Fechas Límite de Entrega
**Responsable:** Llilia (Dev) | **Apoyo:** Carlos

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-017 Indicador visual de vencimiento | Unitarias (Vitest) + Visual | Lógica de fechas implementada | Indicador cambia correctamente según proximidad/vencimiento de fecha límite | Jarumi |
| HU-018 Ordenamiento por fecha límite | Unitarias | Ordenamiento implementado en tablero/lista | Orden ascendente/descendente correcto, sin romper otros filtros | Jarumi |

### Épica 7 — Manejo de Prioridades de Actividades
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-019 Asignación de prioridad | Unitarias | Campo `priority` (HIGH/MED/LOW) implementado | Prioridad se guarda y muestra correctamente al crear/editar | Jarumi |
| HU-020 Filtrado por prioridad | Unitarias | Filtro de UI implementado | Filtro combina correctamente con otros filtros activos (responsable, fecha) | Jarumi |

### Épica 8 — Vista Interactiva de Tablero Kanban
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-021 Visualización de las 4 columnas | Unitarias (Vitest) + Accesibilidad (axe-core) | Tablero implementado con `@dnd-kit/core` | Las 4 columnas (Pendiente/En Proceso/En Revisión/Completada) se renderizan correctamente | Jarumi |
| HU-022 Cambio de estado entre columnas (drag&drop) | E2E (Playwright) | Drag & drop funcional | Cambio de estado se persiste en BD y queda registrado en `status_history` | Jarumi |
| HU-023 Pruebas de regresión del tablero | E2E (Playwright, regresión) | Tablero estable en Sprint 2 | Sin romper funcionalidad previa tras nuevos cambios | Jarumi |

### Épica 9 — Sección de Comentarios y Notas de Seguimiento
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-024 Publicación de comentarios | Unitarias (Vitest) + Accesibilidad | Componente de comentarios implementado | Comentario se publica y muestra autor/hora correctamente | Jarumi |
| HU-025 Eliminación de comentario propio | Unitarias + Integración | Lógica de permisos de borrado implementada | Solo el autor puede eliminar su comentario; otros usuarios no pueden | Jarumi |
| HU-026 Pruebas de seguridad y consistencia | Integración (Supertest+Jest) + Manual (Postman) | Endpoints de comentarios listos | Sin inyección de contenido malicioso (XSS), permisos validados en backend | Jarumi |

### Épica 10 — Módulo de Carga de Evidencia mediante Enlace/URL
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-027 Registro de enlace de evidencia | Unitarias | Campo de URL con validación implementado | Solo acepta URLs válidas, se guarda asociada a la actividad | Jarumi |
| HU-028 Visualización de evidencias por el evaluador | Integración + Manual | Vista de solo lectura del evaluador lista | Evaluador ve evidencias sin poder editarlas/eliminarlas | Jarumi |
| HU-029 Pruebas de validación y seguridad | Integración (Supertest+Jest) | Endpoint de evidencias listo | Rechaza URLs malformadas o no permitidas (validación de esquema) | Jarumi |

### Épica 11 — Panel de Avance y Dashboard con Indicadores Visuales
**Responsable:** Llilia (Dev)

| HU | Tipo de prueba | Criterio de entrada | Criterio de salida | Responsable |
|---|---|---|---|---|
| HU-030 Barra de progreso general | Unitarias (Vitest) | Cálculo de progreso implementado | Porcentaje coincide con actividades completadas/total | Jarumi |
| HU-031 Resumen de actividades por estado | Unitarias + Visual (Recharts) | Gráficas del dashboard implementadas | Datos del resumen coinciden con el estado real de las actividades | Jarumi |
| HU-032 Gráfico de actividades por responsable | Unitarias + Visual (Recharts) | Gráfico implementado | Datos agrupados correctamente por responsable, sin discrepancias con el tablero | Jarumi |
| HU-033 Validación de exactitud de datos en el dashboard | Integración (Supertest+Jest) | Endpoints de métricas implementados | Los números del dashboard coinciden exactamente con los datos reales en BD (regresión) | Jarumi |
| HU-034 Prueba de aceptación de usuario final (UAT) y cierre del proyecto | E2E (Playwright) + Manual (UAT) | Producto completo, Sprint 2 finalizado | Flujos principales (login → crear actividad → mover en Kanban → comentar → evidencia → dashboard) validados de extremo a extremo sin errores críticos | Jarumi + Fernando |

---

## Referencia cruzada — Cobertura QA por herramienta (según doc. de proyecto)
- **axe-core** (accesibilidad): HU-008, HU-009, HU-021, HU-024
- **Vitest** (unitarias): HU-009, HU-012, HU-017, HU-021, HU-030
- **Supertest + Jest** (integración): HU-010, HU-014, HU-026, HU-029
- **Postman** (manual/exploratoria): HU-010, HU-011, HU-026, HU-028
- **Playwright** (E2E): HU-022, HU-023, HU-034 (UAT)
- **Lighthouse CI**: general Sprint 2, dashboard (Épica 11)

---

## 5. Checklist de validación general (gate previo a cada Sprint Review)

- [x ] Todas las HUs del sprint tienen criterios de aceptación verificados
- [ x] Cobertura de pruebas unitarias en componentes críticos (auth, board, dashboard)
- [ x] Pruebas de integración pasan en CI (GitHub Actions)
- [ x] Sin errores críticos de accesibilidad (axe-core)
- [ x] Flujos E2E principales validados en Playwright
- [ x] Evidencia de QA documentada en `docs/qa/`

---

## 6. Aprobación

| Rol | Nombre | Estado | Fecha |
|---|---|---|---|
| QA Tester | Jarumi Flores | Finalizado | 29/06/2026 |
| PO / BA | Fernando | Aprobado | 29/06/2026 |

**Observaciones de Fernando:**
Plan de pruebas completo y detallado, se aprueba para su ejecución en el Sprint 2.
