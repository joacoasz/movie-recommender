# Movie Recommender

Sistema de recomendación de películas. Permite crear una cuenta, loguearse, explorar el catálogo de [TMDB](https://www.themoviedb.org/), marcar películas como "me gusta" y pedir recomendaciones generadas por un LLM (Groq) a partir del perfil de gustos del usuario, respetando el rate-limit del modelo mediante un worker asíncrono.

## Cómo correrlo

```bash
cp .env.example .env   # completar TMDB_API_KEY y GROQ_API_KEY
docker compose up --build
```

Esto levanta `postgres`, `rabbitmq`, `api` (`localhost:3000`), `worker` y `frontend` (`localhost:5173`). El contenedor `api` corre las migraciones de Prisma (`prisma migrate deploy`) antes de arrancar, así que no hace falta ningún paso manual adicional.

## Arquitectura

```mermaid
flowchart LR
    subgraph Cliente
        FE["Frontend<br/>React + Vite"]
    end

    subgraph Backend dockerizado
        API["API<br/>NestJS HTTP"]
        MQ[("RabbitMQ<br/>cola 'recommendations'")]
        W["Worker<br/>NestJS microservice"]
    end

    DB[("PostgreSQL")]
    TMDB["TMDB API"]
    GROQ["Groq API"]

    FE -->|"REST + JWT"| API
    API --> DB
    API -->|"listar películas"| TMDB
    API -->|"encola solicitud"| MQ
    MQ -->|"consume al ritmo del rate-limit"| W
    W -->|"bottleneck"| GROQ
    W -->|"busca poster/overview"| TMDB
    W --> DB
```

El sistema está dividido en dos caminos claramente separados, cada uno con su propia forma de tratar el tiempo de respuesta:

- **Camino síncrono** (login, catálogo, likes): el frontend le habla directo a la `api` por REST, y la `api` responde en el mismo request contra Postgres o TMDB. Es la ruta de baja latencia para todo lo que el usuario espera ver al instante.
- **Camino asíncrono** (recomendaciones): la `api` no llama a Groq. Sólo dispara un evento a RabbitMQ y responde de inmediato con la recomendación en estado `PENDING`. El `worker` — un proceso Nest completamente separado — es el único que le habla a Groq, al ritmo que el rate-limit del modelo permite. El frontend se entera del resultado haciendo polling de `GET /recommendations`.

Esta división es la decisión de arquitectura central del sistema: aísla la única dependencia externa con rate-limit (Groq) en un componente que puede fallar, reintentar o demorarse sin afectar el resto de la aplicación. `api` y `worker` son dos aplicaciones Nest independientes que se despliegan como contenedores separados y se comunican únicamente a través de RabbitMQ (para encolar trabajo) y Postgres (como estado compartido) — no hay llamadas directas entre ellas, lo que permite escalarlas, actualizarlas o reiniciarlas de forma independiente.

Dentro de la `api`, los **Controllers** cumplen el rol de "API Gateway" del diagrama de la consigna (ruteo HTTP, autenticación vía `JwtAuthGuard`, validación de DTOs) y los **Services** el de "Business logic" (reglas de negocio, acceso a Postgres/TMDB, publicación de eventos). No se agregó un gateway como pieza de infraestructura separada (ej. Kong, un BFF aparte) porque a esta escala no aporta valor: NestJS ya resuelve ruteo, validación y autenticación en la misma capa sin sacrificar la separación de responsabilidades. TMDB, en cambio, es consumida tanto por la `api` (para listar el catálogo) como por el `worker` (para enriquecer la recomendación con poster/overview), por eso su cliente vive en una lib compartida en lugar de duplicarse.

### Stack tecnológico y por qué

| Componente | Tecnología | Justificación |
|---|---|---|
| Backend | **NestJS** (TypeScript) | Estructura por módulos/controllers/services que mapea 1:1 con el diagrama de arquitectura pedido, DI nativa para testabilidad, y soporte de primera clase para microservicios (usado tal cual para el worker RMQ). |
| ORM | **Prisma** | Migraciones versionadas simples, cliente tipado end-to-end, schema legible en un solo archivo compartido por `api` y `worker`. |
| Base de datos | **PostgreSQL** | Datos relacionales con integridad referencial clara (usuarios, likes únicos por película, recomendaciones) — no hay necesidad de un modelo documental. |
| Message Queue | **RabbitMQ** | Cola dedicada y durable que desacopla la solicitud HTTP del consumo por parte del worker; corresponde 1:1 con el "Message Q" del diagrama de la consigna. |
| Worker asíncrono | **NestJS microservice (transporte RMQ)** | Reutiliza los módulos compartidos (DB, Groq, TMDB) sin levantar un servidor HTTP innecesario; corre como su propio contenedor y puede escalarse independientemente de la API. |
| Rate limiting | **`bottleneck`** (en memoria) | El worker corre como instancia única, así que alcanza con un limitador local ajustado directo al rate-limit de Groq (requests/min), sin la complejidad operativa de un limitador distribuido (Redis). |
| Auth | **JWT (`passport-jwt`) + `bcrypt`** | Stateless: cualquier réplica de la API puede validar el token sin estado compartido ni pegarle a la base en cada request. |
| Frontend | **React + Vite** (TypeScript) | SPA liviana, corre en cualquier navegador sobre UNIX como pide la consigna, sin necesidad de un framework full-stack. |
| Contenedores | **Docker Compose** | Un solo `docker compose up --build` levanta todo (frontend, api, worker, postgres, rabbitmq) sin pasos manuales, tal como exige la consigna. |

### Atributos de calidad considerados

| Atributo | Cómo se aborda |
|---|---|
| **Mantenibilidad** | Separación estricta en capas (`controller → service → Prisma`), módulos de Nest por dominio (`auth`, `movies`, `likes`, `recommendations`), código cliente de TMDB/Groq/DB aislado en `libs/` compartidas entre `api` y `worker` para no duplicar lógica de integración. |
| **Escalabilidad** | El desacople vía cola de mensajes permite escalar el `worker` de forma independiente de la `api`, y absorbe picos de solicitudes de recomendación sin degradar el resto del sistema. El rate-limiting vive en el worker, no en la API, para que la experiencia de "listar/dar like" nunca dependa del rate-limit del LLM. |
| **Resiliencia** | RabbitMQ persiste las solicitudes (`durable: true`) y el worker hace `ack` manual recién después de procesar el mensaje, así una caída del worker a mitad de proceso no pierde la solicitud (RabbitMQ la redelivera). Si Groq o TMDB fallan, la recomendación se marca `FAILED` en vez de romper el consumer. |
| **Seguridad** | Contraseñas hasheadas con `bcrypt`, autenticación stateless con JWT validado en cada request (`JwtAuthGuard`), DTOs con `class-validator` + `ValidationPipe({ whitelist: true })` para rechazar payloads no esperados. |
| **Testabilidad** | Inyección de dependencias nativa de Nest en cada capa (servicios reciben sus dependencias por constructor), lo que permite mockear `PrismaService`, `TmdbService` o `GroqService` sin tocar los controllers. |
| **Simplicidad operativa (deployability)** | Todo el sistema se levanta con `docker compose up --build`, sin pasos manuales. Un único rate-limiter en memoria (`bottleneck`) es suficiente porque el worker corre como instancia única; se documenta explícitamente esta limitación abajo en vez de sobre-diseñar con Redis para un caso que no aplica hoy. |

## Estructura del código

```
prueba-instant/
├── docker-compose.yml
├── .env.example
├── backend/                      # Monorepo Nest (api + worker + libs compartidas)
│   ├── nest-cli.json              # Define los "proyectos" del monorepo
│   ├── prisma/schema.prisma       # Único schema: User, Like, Recommendation
│   ├── apps/
│   │   ├── api/src/
│   │   │   ├── main.ts             # Bootstrap HTTP, CORS, ValidationPipe global
│   │   │   ├── app.module.ts       # Ensambla los módulos de dominio
│   │   │   ├── auth/                # Registro, login, JWT strategy/guard
│   │   │   ├── movies/              # Listado/búsqueda/detalle vía TMDB
│   │   │   ├── likes/               # Marcar / listar / quitar "me gusta"
│   │   │   └── recommendations/     # Solicitar (encola) y listar recomendaciones
│   │   └── worker/src/
│   │       ├── main.ts             # Bootstrap como microservicio RMQ (no HTTP)
│   │       ├── worker.module.ts
│   │       └── recommendation/      # Consumer de la cola + rate limiter
│   └── libs/                    # Código compartido entre api y worker
│       ├── database/             # PrismaService/PrismaModule (@Global)
│       ├── groq/                 # Cliente Groq + construcción del prompt
│       └── tmdb/                 # Cliente TMDB
└── frontend/
    └── src/
        ├── pages/                # Login, Register, Movies, Likes, Recommendations
        ├── components/           # AuthLayout, NavBar, ProtectedRoute, MovieDetailModal
        ├── services/api.ts       # Cliente axios: adjunta el JWT, normaliza errores
        └── context/AuthContext.tsx  # Estado de sesión (token en localStorage)
```

`backend` es un **monorepo de Nest** (`nest-cli.json` define los proyectos `api`, `worker`, `database`, `groq`, `tmdb`) en vez de dos repos/paquetes separados, porque `api` y `worker` necesitan el mismo acceso a Postgres y a los clientes de TMDB/Groq: mantenerlos en un solo repo con libs compartidas (`@app/database`, `@app/groq`, `@app/tmdb`) evita duplicar esas integraciones y las mantiene tipadas de punta a punta.

## Responsabilidad de cada componente

### API (`backend/apps/api`)
Expone la superficie HTTP que consume el frontend. Cada módulo de dominio sigue `controller → service → Prisma/cliente externo`, sin mezclar capas:

- **`auth`**: registro y login. Hashea contraseñas con `bcrypt` (10 salt rounds), emite un JWT firmado con `sub` (userId) y `username`. `JwtStrategy` valida el token en cada request protegida y `JwtAuthGuard` se aplica a nivel de controller.
- **`movies`**: proxy de solo lectura hacia `TmdbService` (listado popular, búsqueda, detalle). No persiste nada — TMDB es la fuente de verdad del catálogo.
- **`likes`**: persiste el `like` en Postgres. `create` usa `upsert` sobre la constraint única `(userId, tmdbMovieId)` para que marcar "me gusta" dos veces sea idempotente en vez de lanzar un error de duplicado.
- **`recommendations`**: crea el registro `Recommendation` en estado `PENDING` y publica un evento `recommendation.requested` en RabbitMQ (`ClientProxy` con transporte RMQ). No llama a Groq directamente — esa responsabilidad es exclusiva del worker.

### Worker (`backend/apps/worker`)
Es una **aplicación Nest separada** que arranca como microservicio (`NestFactory.createMicroservice`, transporte RMQ) en lugar de un servidor HTTP, porque no necesita atender requests: solo consume de la cola `recommendations`. Reutiliza `PrismaModule`, `GroqModule` y `TmdbModule` de `libs/` sin duplicar código.

- **`RecommendationConsumerController`**: escucha el evento `recommendation.requested`, arma el prompt con el perfil del usuario (username + títulos que le gustaron), le pide a Groq un JSON `{title, reason}`, intenta enriquecerlo buscando el poster/overview en TMDB, y persiste el resultado (`COMPLETED` o `FAILED` si algo falla). Hace `ack` del mensaje recién al terminar, para no perder la solicitud si el proceso se cae a mitad de camino.
- **`RecommendationRateLimiterService`**: envuelve cada llamada a Groq en un `Bottleneck` configurado con un *reservoir* que se recarga a `GROQ_RATE_LIMIT_PER_MINUTE` cada 60s y `maxConcurrent: 1`. Es un limitador **en memoria**, deliberadamente — el worker corre como instancia única, así que no hace falta coordinar el límite entre procesos (ver [Limitaciones conocidas](#limitaciones-conocidas-y-posibles-mejoras)).

### Libs compartidas (`backend/libs`)
- **`database`**: `PrismaService` (extiende `PrismaClient`, conecta/desconecta con el ciclo de vida del módulo) expuesto como módulo `@Global()` para no tener que importarlo en cada módulo de dominio.
- **`groq`**: encapsula el SDK de Groq, el prompt del sistema y el parseo/validación de la respuesta JSON. Si Groq devuelve algo mal formado, lanza para que el worker marque la recomendación como `FAILED` en vez de persistir basura.
- **`tmdb`**: encapsula todas las llamadas a la API de TMDB (populares, búsqueda, detalle) y mapea la respuesta de la API (snake_case) a un modelo interno en camelCase.

### Frontend (`frontend/src`)
SPA en React que habla con la API por HTTP:

- **`services/api.ts`**: instancia única de `axios` que adjunta el JWT desde `localStorage` en cada request y normaliza los errores del backend a un mensaje legible.
- **`context/AuthContext.tsx`**: guarda el token de sesión y expone `login`/`logout`. Se eligió `localStorage` (no una cookie httpOnly) por simplicidad, dado el alcance de la prueba — ver limitaciones.
- **`components/ProtectedRoute.tsx`**: redirige a `/login` si no hay sesión, envolviendo las rutas de `movies`/`likes`/`recommendations`.
- **`pages/Recommendations.tsx`**: hace *polling* simple (cada 3s) mientras exista alguna recomendación en estado `PENDING`, en vez de WebSockets — no lo pide la consigna y agrega complejidad de infraestructura (conexiones persistentes, reconexión) que no se justifica para este volumen de datos.

## Modelo de datos

- **User**: `id, username (unique), passwordHash, createdAt`
- **Like**: `id, userId, tmdbMovieId, title, posterPath, createdAt` — único por `(userId, tmdbMovieId)`
- **Recommendation**: `id, userId, status (PENDING | COMPLETED | FAILED), tmdbMovieId?, title?, reason?, posterPath?, overview?, createdAt, completedAt?`

## Endpoints

Todos los endpoints salvo `/auth/*` requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea una cuenta y devuelve un `accessToken` |
| POST | `/auth/login` | Valida credenciales y devuelve un `accessToken` |
| GET | `/movies?page=&query=` | Lista populares o busca por título en TMDB |
| GET | `/movies/:id` | Detalle de una película (géneros, duración, rating, overview) |
| GET | `/likes` | Lista los "me gusta" del usuario autenticado |
| POST | `/likes` | Marca una película como "me gusta" (idempotente) |
| DELETE | `/likes/:tmdbMovieId` | Quita una película de "me gusta" |
| GET | `/recommendations` | Lista las recomendaciones del usuario (para hacer polling del estado) |
| POST | `/recommendations` | Encola una nueva solicitud de recomendación (devuelve el registro en `PENDING`) |

## Flujo de recomendación (asíncrono)

1. El usuario pide una recomendación → `POST /recommendations`.
2. La API crea un `Recommendation` en estado `PENDING` y publica `recommendation.requested` en RabbitMQ con `recommendationId` + `userId`. Responde inmediatamente, sin esperar al LLM.
3. El worker consume el mensaje y lo agenda en `Bottleneck`, que lo ejecuta respetando `GROQ_RATE_LIMIT_PER_MINUTE`.
4. Arma el prompt con el username y los títulos que le gustaron al usuario, y le pide a Groq un JSON `{title, reason}`.
5. Busca esa película en TMDB para completar poster/overview/id (si no la encuentra, la recomendación queda igual con `title`/`reason` pero sin poster clickeable).
6. Persiste el resultado (`COMPLETED` o `FAILED`) y recién ahí hace `ack` del mensaje.
7. El frontend hace polling de `GET /recommendations` cada 3s mientras haya alguna en `PENDING`.


## Limitaciones conocidas y posibles mejoras

- **Rate limiter en memoria**: si el worker se escalara a más de una réplica, cada una tendría su propio *reservoir* y en conjunto se superaría el rate-limit de Groq. Para escalar horizontalmente haría falta un limitador distribuido (ej. Redis + `bottleneck` con `Group`/`Redis connection`).
- **Sin reintentos ni backoff** para recomendaciones que fallan: quedan en `FAILED` y el usuario debe volver a pedir una manualmente.
- **Token JWT sin expiración corta ni refresh token**: alcanza para la duración de una sesión de prueba, pero en producción se agregaría rotación/refresh.
- **Sin tests automatizados**: dado el foco de la prueba en arquitectura y uso de agentes LLM, se priorizó la implementación funcional completa de las siete historias de usuario sobre la cobertura de tests.
