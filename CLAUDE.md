# CLAUDE.md

Guía de trabajo para Claude Code (y cualquier colaborador humano) en este repositorio.

## Qué es este proyecto

Sistema de recomendación de películas para la prueba técnica de Instant (ver [CONSIGNA.md](./CONSIGNA.md)). Permite crear cuenta, loguearse, listar películas desde TMDB, marcar "me gusta", y pedir recomendaciones generadas por un LLM (Groq) a partir del perfil de gustos del usuario. Las recomendaciones se generan de forma asíncrona respetando el rate-limit del modelo.

## Stack y justificación

| Componente | Tecnología | Por qué |
|---|---|---|
| Backend | **NestJS** (TypeScript) | Estructura por módulos/capas (controllers, services, providers) que mapea 1:1 con el diagrama de arquitectura (API Gateway / Business logic). DI nativo, fácil de testear. |
| ORM | **Prisma** | Migraciones simples, cliente tipado, schema legible en un solo archivo. |
| Base de datos | **PostgreSQL** | Datos relacionales claros (usuarios, likes, recomendaciones) con relaciones e integridad referencial. |
| Message Queue | **RabbitMQ** | Cola dedicada, desacopla la solicitud de recomendación del consumo por parte del worker. Corresponde 1:1 con el "Message Q" del diagrama. |
| Worker asíncrono | **NestJS microservice (transporte RMQ)**, app separada dentro del mismo monorepo | Reutiliza módulos compartidos (DB, Groq, TMDB) sin levantar un servidor HTTP innecesario. Corre como su propio contenedor. |
| Rate limiting | **`bottleneck`** (in-memory, dentro del worker) | El worker corre como instancia única, así que no hace falta un limitador distribuido (Redis). Se configura directo contra el rate-limit de la API de Groq (requests/min). |
| Auth | **JWT** (`passport-jwt`) + `bcrypt` | Stateless, simple de implementar y de validar en cada request sin estado compartido. |
| Frontend | **React + Vite** (TypeScript) | SPA liviana, corre en cualquier navegador sobre UNIX. Sin foco en diseño ni responsive mobile, tal como indica la consigna. |
| Contenedores | **Docker Compose** | Un solo `docker compose up --build` levanta todo: frontend, api, worker, postgres, rabbitmq. |

## Arquitectura

```
Frontend (React) → API (NestJS, HTTP) → PostgreSQL
                         │
                         ├──→ TMDB API (listar películas)
                         │
                         └──→ RabbitMQ (al pedir una recomendación)
                                   │
                                   ▼
                              Worker (NestJS microservice, RMQ)
                                   │
                                   ├──→ bottleneck (rate limit)
                                   ├──→ Groq API (inferencia)
                                   └──→ PostgreSQL (persiste la recomendación)
```

Dentro de la app `api`, los Controllers cumplen el rol de "API Gateway" del diagrama y los Services el de "Business logic" — no se agrega un gateway como pieza de infraestructura separada porque no aporta valor a esta escala.

## Estructura del proyecto

```
prueba-instant/
├── CLAUDE.md
├── CONSIGNA.md
├── docker-compose.yml
├── .env.example
├── docs/
│   └── ARCHITECTURE.md        # Entregable: endpoints, diagrama final, justificación
├── assets/
│   └── arq.webp                # Diagrama de arquitectura provisto en la consigna
├── backend/
│   ├── nest-cli.json            # Monorepo: define los proyectos "api" y "worker"
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma        # User, Like, Recommendation
│   ├── apps/
│   │   ├── api/
│   │   │   ├── Dockerfile
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── app.module.ts
│   │   │       ├── auth/            # registro, login, guards JWT
│   │   │       ├── movies/          # listado desde TMDB
│   │   │       ├── likes/           # marcar / listar / quitar "me gusta"
│   │   │       └── recommendations/ # solicitar (encola) y listar recomendaciones
│   │   └── worker/
│   │       ├── Dockerfile
│   │       └── src/
│   │           ├── main.ts
│   │           ├── worker.module.ts
│   │           └── recommendation/  # consumer RMQ + rate limiter + llamada a Groq
│   └── libs/                    # código compartido entre api y worker
│       ├── database/            # PrismaModule / PrismaService
│       ├── groq/                # cliente Groq
│       └── tmdb/                # cliente TMDB
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/                # Login, Register, Movies, Likes, Recommendations
        ├── components/
        ├── services/             # cliente HTTP hacia la API
        └── context/              # AuthContext (JWT en memoria/localStorage)
```

## Modelo de datos (resumen)

- **User**: `id, username (unique), passwordHash, createdAt`
- **Like**: `id, userId, tmdbMovieId, title, posterPath, createdAt` (único por `userId + tmdbMovieId`)
- **Recommendation**: `id, userId, status (pending|completed|failed), tmdbMovieId?, title?, reason?, createdAt, completedAt?`

## Flujo de recomendación (el corazón de la prueba)

1. Usuario pide una recomendación → `POST /recommendations`.
2. La API crea un registro `Recommendation` en estado `pending` y publica un mensaje en RabbitMQ con `recommendationId` + `userId`.
3. El worker consume el mensaje, respetando el rate-limit configurado en `bottleneck`.
4. El worker arma el prompt con el perfil del usuario + su lista de likes, llama a Groq.
5. El worker persiste el resultado en el registro `Recommendation` (`status: completed`, `title`, `reason`).
6. El usuario puede listar sus recomendaciones vía `GET /recommendations` en cualquier momento (polling simple desde el frontend, sin WebSockets — no lo pide la consigna).

## Convenciones de código

- Sin comentarios salvo que expliquen un *por qué* no obvio (nunca *qué* hace el código).
- Nombres autoexplicativos: preferir claridad sobre brevedad.
- Cada módulo de Nest sigue: `controller` (HTTP) → `service` (lógica) → `repository/Prisma` (datos). No mezclar capas.
- DTOs con `class-validator` para toda entrada de la API.
- Errores de dominio con excepciones HTTP explícitas de Nest (`NotFoundException`, `UnauthorizedException`, etc.), no manejo genérico.
- No agregar abstracciones, flags ni fallbacks para casos que no pide la consigna.

## Variables de entorno

Ver `.env.example`. Nunca commitear `.env` (ya está en `.gitignore`). Requeridas:

- `DATABASE_URL` (Postgres)
- `RABBITMQ_URL`
- `JWT_SECRET`
- `TMDB_API_KEY`
- `GROQ_API_KEY`
- `GROQ_RATE_LIMIT_PER_MINUTE`

## Cómo correr el proyecto

```bash
docker compose up --build
```

Levanta: `frontend`, `api`, `worker`, `postgres`, `rabbitmq`. Sin pasos manuales adicionales.

## Git / commits

- Commits en español, en modo imperativo, describiendo el *por qué* cuando no sea obvio.
- No hacer commits directos de artefactos generados (`node_modules`, `dist`, `.env`).
