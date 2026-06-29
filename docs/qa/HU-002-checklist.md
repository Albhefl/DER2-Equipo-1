# Checklist de Verificación — HU-002
**Inicialización y configuración del repositorio compartido**
QA: Jarumi Flores · Fecha: 28/06/2026

---

## Escenario 1 — Accesos por rol
- [ x] Entro a github.com/Albhefl/DER2-Equipo-1 con mi cuenta y tengo acceso (al menos lectura).
- [ x] Settings → Collaborators muestra a los 5 integrantes con un rol asignado.
- [ x] Llilia tiene permiso de **Write** (Dev).
- [x ] Carlos, Fernando y yo tenemos permiso de **lectura/Triage** (QA/PO).
- [ x] Alberto tiene **Admin**.

## Escenario 2 — Rama principal protegida
- [x ] Settings → Branches → Branch protection rules tiene una regla para `main`.
- [x ] La regla exige "Require a pull request before merging".
- [x ] La regla exige mínimo 1 aprobación ("Require approvals").
- [x ] (Opcional, según el doc) `dev`, `staging`, `test` también tienen reglas equivalentes.
- [ x] Probé/confirmé que un push directo a `main` es rechazado.

## Escenario 3 — Verificación general
- [ x] Las 4 ramas existen: `main`, `dev`, `staging`, `test`.
- [x ] Las reglas de protección están activas (confirmado arriba).
- [x ] Registro el resultado de este checklist en el tablero (ClickUp) y lo adjunto a la HU-002.

---

## Resultado final
- [ x]  Aprobado — cumple todos los criterios
- [ ] Rechazado — ver observaciones

**Observaciones:**


**QA:** Jarumi Flores
