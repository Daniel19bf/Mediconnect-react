# MediConnect — Sistema Médico Profesional

> Sistema hospitalario full-stack construido con **React 18 + Vite + TypeScript + Supabase**.
> Diseño premium estilo clínica privada, listo para producción.

---

## 📋 Tabla de contenidos

1. [Stack tecnológico](#stack)
2. [Arquitectura del proyecto](#arquitectura)
3. [Instalación rápida](#instalación)
4. [Configuración de Supabase](#supabase)
5. [Variables de entorno](#variables)
6. [Módulos implementados](#módulos)
7. [Roles y permisos](#roles)
8. [Despliegue en producción](#despliegue)
9. [Estructura de carpetas](#carpetas)

---

## 🚀 Stack tecnológico {#stack}

| Capa            | Tecnología                                    |
|-----------------|-----------------------------------------------|
| Frontend        | React 18, Vite 5, TypeScript 5                |
| UI / Estilos    | Tailwind CSS 3, Material Design 3 principios  |
| Estado global   | Zustand 5 + React Query 5                     |
| Formularios     | React Hook Form + Zod                         |
| Backend         | Supabase (PostgreSQL + Auth + Storage + RT)   |
| Videollamadas   | Jitsi Meet External API                       |
| Gráficos        | Recharts                                      |
| PDF / Excel     | jsPDF + autoTable + xlsx                      |
| Animaciones     | Framer Motion                                 |
| Toast / Alerts  | react-hot-toast                               |

---

## 🏗️ Arquitectura del proyecto {#arquitectura}

```
mediconnect/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   ← Esquema completo + RLS
│   └── seeds/
│       └── 001_seed_data.sql        ← Datos de prueba
│
└── src/
    ├── components/
    │   ├── ui/          ← Componentes reutilizables (Button, Card, Modal…)
    │   └── layout/      ← Sidebar, TopBar, MainLayout, AuthLayout
    ├── hooks/           ← Custom hooks (useDebounce, etc.)
    ├── lib/
    │   ├── supabase.ts  ← Cliente Supabase
    │   └── utils.ts     ← Utilidades globales
    ├── pages/
    │   ├── auth/        ← Login, ForgotPassword, ResetPassword
    │   ├── shared/      ← Dashboard, Pacientes, Citas, Chat, Video…
    │   ├── doctor/      ← Consulta médica
    │   └── admin/       ← Usuarios, Especialidades, Reportes, Auditoría
    ├── router/          ← React Router + ProtectedRoute + RoleRoute
    ├── services/        ← Capa de acceso a Supabase por módulo
    ├── store/           ← Zustand stores (auth, ui)
    ├── styles/          ← CSS global + Tailwind directives
    └── types/           ← Tipos TypeScript globales
```

**Patrón limpio:**
```
UI (pages/components)
     ↕
Services (services/*.service.ts)
     ↕
Supabase client (lib/supabase.ts)
     ↕
PostgreSQL + RLS policies
```

---

## ⚡ Instalación rápida {#instalación}

### Prerrequisitos
- Node.js 18+
- npm 9+ o pnpm 8+
- Cuenta en [supabase.com](https://supabase.com) (gratis)

### Pasos

```bash
# 1. Clonar / abrir el proyecto
cd D:\proyectos_personales\Mediconnect

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# → Editar .env con tus credenciales de Supabase

# 4. Ejecutar migraciones en Supabase
# (copiar y pegar supabase/migrations/001_initial_schema.sql
#  en el SQL Editor de tu proyecto Supabase)

# 5. Cargar datos de prueba (opcional)
# (copiar y pegar supabase/seeds/001_seed_data.sql)

# 6. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

---

## 🗄️ Configuración de Supabase {#supabase}

### 1. Crear proyecto
1. Ir a [app.supabase.com](https://app.supabase.com) → **New project**
2. Anotar la **URL** y **anon key** (Settings → API)

### 2. Ejecutar migraciones
1. En tu proyecto Supabase → **SQL Editor**
2. Copiar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Ejecutar (Run)

### 3. Configurar Storage
Crear los siguientes buckets en **Storage → New bucket**:

| Bucket         | Público |
|----------------|---------|
| `avatars`      | ✅ Sí   |
| `medical-files`| ❌ No   |

### 4. Habilitar Google Auth (opcional)
1. Supabase → **Authentication → Providers → Google**
2. Ingresar Client ID y Secret de Google Cloud Console
3. Agregar `http://localhost:5173` y tu dominio a los Redirect URLs

### 5. Crear primer usuario administrador
```sql
-- Ejecutar en SQL Editor DESPUÉS de registrar el usuario vía el formulario
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'UUID_DEL_USUARIO';
```

---

## 🔑 Variables de entorno {#variables}

Copiar `.env.example` → `.env` y rellenar:

```env
# Supabase — OBLIGATORIO
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Nombre de la app
VITE_APP_NAME=MediConnect
VITE_APP_VERSION=1.0.0

# Jitsi Meet (dominio personalizado o usar el público)
VITE_JITSI_DOMAIN=meet.jit.si

# OpenAI — para IA médica asistente (opcional)
VITE_OPENAI_API_KEY=sk-...
```

---

## 📦 Módulos implementados {#módulos}

### ✅ Completos (código funcional)
| Módulo | Descripción |
|--------|-------------|
| **Autenticación** | Login/logout, Google OAuth, recuperar contraseña, sesión persistente |
| **Dashboard** | KPIs en tiempo real, 4 gráficos (área, barra, pastel, línea), próximas citas |
| **Pacientes** | CRUD completo, búsqueda, filtros, paginación, avatar upload |
| **Citas** | Lista con tabs por estado, confirmar/cancelar, links a videollamada |
| **Chat** | Chat realtime vía Supabase Realtime, lista de contactos, indicador de no leídos |
| **Videollamadas** | Sala Jitsi embebida, controles mic/cámara/pantalla, sala de espera |
| **Recetas** | Listado con medicamentos, vigencia, exportar PDF |
| **Resultados** | Galería de archivos médicos con filtros por categoría |
| **Admin → Usuarios** | CRUD usuarios, activar/desactivar, asignar roles |
| **Admin → Especialidades** | CRUD con color picker |
| **Admin → Reportes** | Gráficos de ingresos y citas, exportar CSV |
| **Admin → Auditoría** | Log completo de acciones del sistema |
| **Admin → Configuración** | Parámetros del sistema editables |
| **Perfil** | Editar nombre/teléfono, cambiar contraseña |

### 🏗️ Esqueletos (listos para implementar)
| Módulo | Archivo |
|--------|---------|
| Historia clínica detallada | `src/pages/shared/MedicalHistoryPage.tsx` |
| Detalle de paciente | `src/pages/shared/PatientDetailPage.tsx` |
| Médicos CRUD | `src/pages/shared/DoctorsPage.tsx` |
| Nueva cita | `src/pages/shared/NewAppointmentPage.tsx` |
| Consulta médica (formulario) | `src/pages/doctor/ConsultationPage.tsx` |

---

## 👥 Roles y permisos {#roles}

| Acción | Admin | Médico | Paciente |
|--------|:-----:|:------:|:--------:|
| Dashboard completo | ✅ | ✅ | ✅ |
| Ver todos los pacientes | ✅ | ✅ | ❌ |
| Crear/editar pacientes | ✅ | ✅ | ❌ |
| Ver médicos | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver todas las citas | ✅ | 🔒 Propias | 🔒 Propias |
| Crear consultas médicas | ❌ | ✅ | ❌ |
| Ver historia clínica | ✅ | ✅ | 🔒 Propia |
| Ver recetas | ✅ | ✅ | 🔒 Propias |
| Videollamadas | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Panel de admin | ✅ | ❌ | ❌ |
| Auditoría | ✅ | ❌ | ❌ |

Seguridad implementada en dos capas:
1. **Frontend**: `RoleRoute` redirige si el rol no coincide
2. **Backend**: Políticas RLS de Supabase bloquean el acceso a nivel de base de datos

---

## 🚢 Despliegue en producción {#despliegue}

### Opción A: Vercel (recomendado)
```bash
npm install -g vercel
vercel --prod
# Configurar variables de entorno en Vercel Dashboard
```

### Opción B: Netlify
```bash
npm run build
# Arrastrar carpeta dist/ a netlify.com/drop
```

### Opción C: Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

### Variables en producción
Agregar las mismas variables de `.env` en la plataforma de despliegue.
**Nunca** commitear `.env` al repositorio.

---

## 📁 Estructura de carpetas {#carpetas}

```
src/
├── components/
│   ├── ui/
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── StatCard.tsx
│   │   └── Table.tsx
│   └── layout/
│       ├── AuthLayout.tsx
│       ├── MainLayout.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── auth/
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── admin/
│   │   ├── AdminPage.tsx
│   │   ├── AuditPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SpecialtiesPage.tsx
│   │   ├── SystemConfigPage.tsx
│   │   └── UsersAdminPage.tsx
│   ├── doctor/
│   │   └── ConsultationPage.tsx
│   └── shared/
│       ├── AppointmentsPage.tsx
│       ├── ChatPage.tsx
│       ├── DashboardPage.tsx
│       ├── DoctorsPage.tsx
│       ├── MedicalHistoryPage.tsx
│       ├── NewAppointmentPage.tsx
│       ├── NotFoundPage.tsx
│       ├── PatientDetailPage.tsx
│       ├── PatientsPage.tsx
│       ├── PrescriptionsPage.tsx
│       ├── ProfilePage.tsx
│       ├── ResultsPage.tsx
│       └── VideoCallPage.tsx
├── router/
│   ├── index.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleRoute.tsx
├── services/
│   ├── appointments.service.ts
│   ├── auth.service.ts
│   ├── chat.service.ts
│   ├── dashboard.service.ts
│   ├── doctors.service.ts
│   ├── medical.service.ts
│   ├── notifications.service.ts
│   └── patients.service.ts
├── store/
│   ├── auth.store.ts
│   └── ui.store.ts
├── styles/
│   └── global.css
├── types/
│   └── index.ts
└── main.tsx
```

---

## 🔧 Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo (localhost:5173)
npm run build     # Build de producción → dist/
npm run preview   # Previsualizar el build
npm run lint      # Lint con ESLint
```

---

## 📞 Soporte

Para dudas sobre implementación de módulos pendientes o integración de APIs adicionales (OpenAI para IA médica, Twilio para SMS, etc.), revisar la documentación de cada servicio.

---

*MediConnect v1.0.0 — Sistema Médico Profesional*
