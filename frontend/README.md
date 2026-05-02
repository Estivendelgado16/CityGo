# CityGo Frontend — Agente Turístico de Medellín

Aplicación mobile-first tipo chatbot para descubrir lugares y eventos en Medellín. Construida con React + TypeScript, con soporte de datos mock para desarrollo sin backend.

---

## Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | ^18.3.1 | UI declarativa basada en componentes |
| **TypeScript** | ^5.5.4 | Tipado estático y seguridad en tiempo de compilación |
| **Vite** | ^5.4.2 | Bundler y dev server con HMR ultrarrápido |
| **React Router** | ^6.26.0 | Enrutamiento SPA (Chat, Guardados, Perfil, Onboarding) |
| **Tailwind CSS** | ^3.4.10 | Estilos utilitarios con diseño atómico |
| **PostCSS / Autoprefixer** | — | Post-procesado de CSS |
| **Lucide React** | ^0.441.0 | Iconos SVG ligeros y consistentes |
| **@vitejs/plugin-react** | ^4.3.1 | Fast Refresh y transform JSX |

---

## Requisitos previos

- **Node.js** ≥ 18.x (recomendado: 20.x LTS)
- **npm** ≥ 9.x (incluido con Node.js)

Verifica tu instalación:

```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <https://github.com/Estivendelgado16/CityGo.git>
cd CityGo/frontend
```

### 2. Instalar dependencias

#### Ubuntu / WSL / macOS

```bash
npm install
```

#### Windows (PowerShell, CMD o Git Bash)

```bash
npm install
```

> En Windows, si encuentras errores de permisos, ejecuta PowerShell como Administrador. Si usas `npm install` y falla por políticas de ejecución de scripts, prueba:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### 3. Configurar variables de entorno (opcional)

Crea un archivo `.env` en `frontend/`:

```env
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8000
```

| Variable | Default | Descripción |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true` = usa datos mock (sin backend). `false` = conecta con backend real |
| `VITE_API_URL` | `http://localhost:8000` | URL base del backend (solo cuando `VITE_USE_MOCK=false`) |

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

La aplicación arranca en **`http://localhost:5173`** con recarga en caliente (HMR).

### 5. (Opcional) Build de producción

```bash
npm run build
```

Genera los archivos estáticos en la carpeta `dist/`, listos para desplegar.

Para previsualizar el build localmente:

```bash
npm run preview
```

---

## Solución de problemas comunes

### Ubuntu / WSL

- **Error `EACCES: permission denied`**: no uses `sudo npm`. Reinstala Node.js con `nvm`:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install 20
  ```

- **Error `Module not found`**: borra `node_modules` y vuelve a instalar:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Windows

- **Error `"vite" no se reconoce como un comando interno o externo`**: asegúrate de haber ejecutado `npm install` sin errores. Si persiste, borra `node_modules` y `package-lock.json` y reinstala:
  ```powershell
  Remove-Item -Recurse -Force node_modules
  Remove-Item package-lock.json
  npm install
  ```

- **Error de scripts bloqueados por PowerShell**: ejecuta:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

- **Error de rutas largas en Windows**: activa rutas largas en Git:
  ```bash
  git config --system core.longpaths true
  ```

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo con HMR en `:5173` |
| `npm run build` | Compila TypeScript y genera bundle de producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente para pruebas |

---

## Estructura del proyecto

```
frontend/
├── index.html                 # Entry point HTML (carga main.tsx)
├── vite.config.ts             # Configuración de Vite (puerto, plugins)
├── tsconfig.json              # Configuración de TypeScript
├── tailwind.config.js         # Tema y colores personalizados de la marca
├── postcss.config.js          # Plugins de PostCSS
├── .env                       # Variables de entorno (no versionado)
├── .gitignore
├── package.json
│
└── src/
    ├── main.tsx               # Renderiza React dentro del DOM
    ├── App.tsx                # Router principal con layout global
    ├── index.css              # Directivas Tailwind y estilos globales
    ├── vite-env.d.ts          # Tipos de Vite para variables de entorno
    │
    ├── types/
    │   └── sse-contract.ts    # Contrato de tipos compartido frontend-backend
    │
    ├── hooks/
    │   └── useChat.ts         # Hook de chat con soporte mock + SSE real
    │
    ├── mocks/
    │   └── mock-sse.ts        # Simulador de backend con datos de Medellín
    │
    ├── components/
    │   ├── BottomNav.tsx       # Navegación inferior (Chat, Guardados, Perfil)
    │   ├── ChatInput.tsx       # Input de texto con envío
    │   ├── PlaceCard.tsx       # Card de lugar (reutilizable)
    │   ├── EventCard.tsx       # Card de evento con fecha
    │   └── ThinkingIndicator.tsx # Indicador de "el agente está pensando"
    │
    └── pages/
        ├── ChatPage.tsx        # Pantalla principal del chat
        ├── SavedPage.tsx       # Wishlist de lugares guardados
        ├── ProfilePage.tsx     # Perfil y preferencias del usuario
        └── OnboardingPage.tsx  # Onboarding inicial (placeholder)
```

---

## Uso con datos mock (por defecto)

Con `VITE_USE_MOCK=true`, el chat responde según palabras clave en el mensaje:

| Palabra clave | Escenario simulado |
|---|---|
| "comer", "restaurante" | Recomendaciones gastronómicas |
| "noche", "bar", "salir" | Vida nocturna (bares, discotecas) |
| "cultura", "museo" | Planes culturales |
| "deporte", "naturaleza" | Actividades al aire libre |
| Cualquier otra cosa | Saludo genérico del agente |

---

## Conexión con backend real

Cuando el backend esté disponible:

1. Cambia `VITE_USE_MOCK=false` en `.env`
2. Apunta `VITE_API_URL` a la URL del backend (ej. `https://parcero-api.onrender.com`)
3. El hook `useChat` detecta automáticamente el modo y cambia de mock a SSE real
4. El contrato de tipos en `src/types/sse-contract.ts` es la única fuente de verdad para la comunicación — cualquier cambio debe coordinarse entre los equipos de frontend, backend y agente
