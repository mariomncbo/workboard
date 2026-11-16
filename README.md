# WorkBoard

**WorkBoard** es una aplicación de gestión de proyectos basada en tableros. Organiza tu trabajo en **tableros**, **listas** y **tareas**, y ten todo a la vista en un espacio de trabajo limpio y visual.

Disponible como app nativa para **macOS**, con versión **web** en camino.

> 🚧 En desarrollo activo.

## Características

- **Cuentas de usuario**: registro con correo y contraseña, e inicio de sesión con correo o nickname.
- **Sesión persistente**: la sesión sigue abierta entre aperturas de la app.
- **Multicuenta**: cambia entre las últimas cuentas usadas en el dispositivo sin volver a escribir la contraseña.
- **Tableros**: cada uno con su fondo de color. Márcalos como favoritos ⭐ para que aparezcan primero.
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
└── supabase/       # Esquema de base de datos y migraciones SQL
```

## Desarrollo local

### Requisitos

- macOS 27.2 o superior
- Xcode 27 o superior
- Un proyecto de [Supabase](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Puesta en marcha

> Las instrucciones detalladas se ampliarán a medida que avance el proyecto.

1. Clona el repositorio.
2. Crea un proyecto en Supabase y aplica las migraciones de `supabase/`.
3. Configura las claves de Supabase de la app macOS a partir del archivo de ejemplo. Los archivos con claves reales no se suben al repositorio.
4. Abre `apps/macOS/WorkBoard/WorkBoard.xcodeproj` en Xcode y selecciona tu equipo en *Signing & Capabilities*.
5. Compila y ejecuta (⌘R).
