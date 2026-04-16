# Multi-Tenant Chatbot Backend

Backend completo con arquitectura multi-tenant y chatbot inteligente

## Arquitectura

- Framework: Next.js 16 con App Router
- Base de Datos: PostgreSQL + pgvector (Supabase)
- ORM: Prisma 7
- Autenticación: JWT con roles (Admin, Abogado, Cliente)
- IA: OpenAI GPT-4o-mini
- Validación: Zod
- Testing: Script automatizado incluido

## Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Configurar base de datos
npx prisma migrate dev
# O ejecutar database.sql en Supabase

# 4. Generar Prisma Client
npx prisma generate

# 5. Iniciar servidor
npm run dev

# 6. Probar API
npm run test:api
```

## Variables de Entorno

```env
# Base de datos (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY="sk-..."

# JWT
JWT_SECRET="tu-secreto-super-seguro"

NODE_ENV="development"
```

## Roles y Permisos

| Rol     | Permisos                                            |
| ------- | --------------------------------------------------- |
| ADMIN   | Aprobar/rechazar abogados, ver todos los usuarios   |
| ABOGADO | Generar claves de cliente, ver sus clientes y chats |
| CLIENTE | Crear chats, enviar mensajes, gestionar su cuenta   |

## API Endpoints

### Autenticación

- `POST /api/auth` - Login de usuarios
- `DELETE /api/user` - Eliminar cuenta (cascade delete)

### Registro

- `POST /api/register/lawyer` - Registro de abogado (requiere aprobación)
- `POST /api/register/client` - Registro de cliente (requiere clave)

### Admin

- `GET /api/admin/lawyers` - Listar abogados pendientes
- `PUT /api/admin/lawyers/[id]` - Aprobar/rechazar abogado

### Abogado

- `GET /api/client-keys` - Listar claves generadas
- `POST /api/client-keys` - Generar nueva clave
- `GET /api/lawyer/clients` - Ver mis clientes
- `GET /api/lawyer/clients/[id]/chats` - Ver chats de cliente

### Chats

- `GET /api/chats` - Listar chats del usuario
- `POST /api/chats` - Crear nuevo chat
- `GET /api/chats/[id]` - Ver chat específico
- `PUT /api/chats/[id]` - Renombrar chat
- `DELETE /api/chats/[id]` - Eliminar chat (con mensajes)
- `POST /api/chats/[id]/messages` - Enviar mensaje

### Búsqueda Semántica (Legacy)

- `POST /api/embed` - Crear embedding
- `GET /api/word` - Buscar palabra
- `PUT /api/word` - Actualizar palabra
- `DELETE /api/word` - Eliminar palabra
- `POST /api/search` - Búsqueda semántica

## Testing

```bash
# Ejecutar tests automatizados
npm run test:api

# Verificar tipos
npx tsc --noEmit

# Build de producción
npm run build
```

## Estructura del Proyecto

```
src/
|-- app/api/           # Endpoints de la API
|-- lib/
|   |-- auth/         # Middleware de autenticación
|   |-- db/           # Conexión a base de datos
|   |-- errors/        # Manejo centralizado de errores
|   -- validation/    # Schemas con Zod
|-- repository/         # Capa de datos (Prisma)
|-- servicio/          # Lógica de negocio
-- types/             # Interfaces TypeScript
```

## Seguridad

- Autenticación JWT con expiración
- Validación de entrada con Zod
- Inyección SQL prevenida con Prisma
- Variables de entorno protegidas
- CORS configurado

## Características

Multi-tenant con roles definidos
Aprobación de abogados por admin
Claves de acceso para clientes
Chatbot con contexto y memoria
Filtrado de temas fuera de contexto
Eliminación en cascada de datos
Respuestas con personalidad profesional
Búsqueda semántica con embeddings
Testing automatizado completo

---

Status: Backend Completo y Funcional
Versión: 1.0.0
Última actualización: 12 de Abril, 2026
