<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo/workboard-simbolo-oscuro.svg" />
    <img src="brand/logo/workboard-simbolo-claro.svg" alt="WorkBoard" width="120" />
  </picture>
  <h1>WorkBoard</h1>
</div>
<div align="center">
  <p><b>WorkBoard</b> es una aplicación de gestión de proyectos basada en tableros. Organiza tu trabajo en <b>tableros</b>, <b>listas</b> y <b>tareas</b>, y ten todo a la vista en un espacio de trabajo limpio y visual.</p>
</div>

Disponible como app nativa para **macOS**, con versión **web** en camino.

> 🚧 En desarrollo activo.

## Características

- **Cuentas de usuario**: registro con correo y contraseña, e inicio de sesión con correo o nickname.
- **Sesión persistente**: la sesión sigue abierta entre aperturas de la app.
- **Multicuenta**: cambia entre las últimas cuentas usadas en el dispositivo sin volver a escribir la contraseña.
- **Tableros**: cada uno con su descripción y su fondo, de color o con una cuadrícula de puntos animada. Márcalos como favoritos ⭐ para que aparezcan primero.
- **Listas y tareas**: listas en horizontal y tareas con nombre, descripción y color.
- **Borrado seguro**: cualquier eliminación definitiva pide confirmación antes de ejecutarse.
- **Búsqueda**: encuentra cualquier tablero al instante.
- **Próximamente**: Notas y Planificador integrados en cada tablero.

## Plataformas

| Plataforma | Estado |
| --- | --- |
| macOS | 🚧 En desarrollo |
| Web | 🗓️ Planificada |

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| App macOS | Swift · SwiftUI |
| Backend | [Supabase](https://supabase.com): PostgreSQL, Auth y Row Level Security |
| Web | Por definir |

## Arquitectura

Monorepo con un único backend compartido entre plataformas:

```
workboard/
├── apps/
│   ├── macOS/      # App nativa (Xcode · SwiftUI)
│   └── web/        # App web
├── brand/logo/     # Logo y sus variantes
└── supabase/       # Esquema de base de datos y migraciones SQL
```

## Desarrollo local

### Requisitos

- macOS 27.2 o superior
- Xcode 27 o superior
- Una cuenta de [Supabase](https://supabase.com) (el plan Free es suficiente)
- [Supabase CLI](https://supabase.com/docs/guides/cli) 3.x: `brew install supabase`

No hace falta Docker: el backend se despliega directamente en un proyecto de Supabase en la nube.

### 1. Backend (Supabase)

1. Crea un proyecto en el [dashboard de Supabase](https://supabase.com/dashboard).
2. En **Authentication → Sign In / Providers**:
   - Desactiva **Confirm email**.
   - En **Email**, pon **Minimum password length** en 8.
3. Desde la raíz del repositorio, enlaza la CLI con tu proyecto. Hazlo en una terminal interactiva, porque `supabase link` pide la contraseña de la base de datos:

   ```sh
   supabase login
   supabase link <project-ref>
   ```

4. Aplica las migraciones y despliega las Edge Functions:

   ```sh
   supabase db push --remote
   supabase functions deploy --use-api --remote
   ```

| Pieza | Qué contiene |
| --- | --- |
| `supabase/migrations/` | Esquema (perfiles, tableros, listas y tareas), Row Level Security y funciones de registro |
| `supabase/functions/sign-in` | Inicio de sesión con correo o nickname; el correo de un nickname se resuelve en el servidor |
| `supabase/functions/delete-account` | Elimina la cuenta del usuario y todos sus datos |

### 2. App macOS

1. Copia `apps/macOS/WorkBoard/Secrets.example.plist` a `apps/macOS/WorkBoard/WorkBoard/Config/Secrets.plist` y rellena:
   - `SupabaseURL`: la URL de tu proyecto (`https://<project-ref>.supabase.co`).
   - `SupabasePublishableKey`: la *publishable key* (`sb_publishable_…`) de **Project Settings → API Keys**.

   `Secrets.plist` no se sube al repositorio. Nunca uses la *secret key* en la app.
2. Abre `apps/macOS/WorkBoard/WorkBoard.xcodeproj` en Xcode y selecciona tu equipo en *Signing & Capabilities*.
3. Compila y ejecuta (⌘R). Xcode descarga automáticamente las dependencias (Swift Package Manager).
