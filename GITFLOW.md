# GitFlow - Estrategia de Ramas

## Estructura de Ramas

```
main              (Producción)
  └── QA          (Testing de integración y pruebas finales)
       ├── Feat/nombre-de-funcionalidad  (Nuevas funcionalidades)
       └── Fix/nombre-del-bug            (Corrección sobre Feat)
```

---

## Ramas principales

### `main` — Producción
- Código listo para ser desplegado en producción.
- Solo se mergea desde `QA`.
- **Prohibido** commitear directamente.
- Cada merge a `main` debe generar un **tag** con versión semántica (`v1.0.0`, `v1.1.0`, etc.).

### `QA` — Testing de integración
- Rama de integración donde se unifican todas las funcionalidades y parches antes de pasar a producción.
- Aquí se ejecutan las pruebas de integración, pruebas de humo y validación final.
- Una vez que el equipo valida que todo funciona correctamente, se mergea a `main`.
- **Prohibido** commitear directamente (solo merges desde `Feat/` o `Fix/`).

---

## Ramas de apoyo

### `Feat/nombre-de-funcionalidad` — Nuevas funcionalidades
- Se crea a partir de `QA`.
- Convention: `Feat/login`, `Feat/mapa-interactivo`, `Feat/api-pagos`.
- Una vez terminada y aprobada mediante **Pull Request**, se mergea a `QA`.
- **Debe eliminarse inmediatamente después del merge** (tanto local como remoto).

**Flujo de trabajo:**
```bash
git checkout QA
git pull origin QA
git checkout -b Feat/nombre-de-funcionalidad
# ... trabajo, commits ...
git push origin Feat/nombre-de-funcionalidad
# Crear PR → QA
# Tras merge aprobado:
git branch -d Feat/nombre-de-funcionalidad
git push origin --delete Feat/nombre-de-funcionalidad
```

### `Fix/nombre-del-bug` — Corrección de errores
- Se crea a partir de la rama `Feat/` donde se detectó el bug.
- Convention: `Fix/login-error-validacion`, `Fix/mapa-no-carga`.
- Una vez corregido y aprobado el PR, se mergea a la rama `Feat/` de origen.
- **Debe eliminarse inmediatamente después del merge**.

**Flujo de trabajo:**
```bash
git checkout Feat/nombre-de-funcionalidad
git checkout -b Fix/nombre-del-bug
# ... corregir bug, commits ...
git push origin Fix/nombre-del-bug
# Crear PR → Feat/nombre-de-funcionalidad
# Tras merge aprobado:
git branch -d Fix/nombre-del-bug
git push origin --delete Fix/nombre-del-bug
```

---

## Diagrama de flujo completo

```
main  ───●──────────────────────●─────────
          \                    /
QA         └──●─────────●────●────●───────
               \        /    \    /
Feat/login      └──●───●      \  /
                    \          \/
Fix/login-error     └──●───●
```

---

## Reglas generales

| Regla | Descripción |
|-------|-------------|
| **Nadie commitea directo a `main` o `QA`** | Todo pasa por PR con revisión. |
| **Eliminar ramas tras el merge** | Mantenemos el repositorio limpio. |
| **Naming consistente** | `Feat/` con sustantivos, `Fix/` con descripción del error. |
| **Commits claros** | Usar imperativo: "Agrega validación de email", "Corrige error al cargar mapa". |
| **PRs a `QA` obligatorios** | Al menos un revisor debe aprobar antes del merge. |
| **Tags en `main`** | Cada merge a `main` lleva un tag semántico. |

---

## Ejemplo de ciclo completo

```bash
# 1. Crear funcionalidad desde QA
git checkout QA && git pull
git checkout -b Feat/registro-usuario

# 2. Trabajar y pushear
git add . && git commit -m "Agrega formulario de registro"
git push origin Feat/registro-usuario

# 3. Se detecta bug, se crea Fix desde Feat
git checkout Feat/registro-usuario
git checkout -b Fix/registro-error-pass
# ... corregir ...
git commit -m "Corrige validación de contraseña"
git push origin Fix/registro-error-pass
# PR: Fix/registro-error-pass → Feat/registro-usuario
# Merge aprobado, eliminar Fix
git checkout Feat/registro-usuario
git branch -d Fix/registro-error-pass
git push origin --delete Fix/registro-error-pass

# 4. PR: Feat/registro-usuario → QA
# Merge aprobado, eliminar Feat
git checkout QA && git pull
git branch -d Feat/registro-usuario
git push origin --delete Feat/registro-usuario

# 5. QA estable → PR a main
# Tras merge a main, crear tag
git checkout main && git pull
git tag -a v1.2.0 -m "Agrega registro de usuario"
git push origin v1.2.0
```
