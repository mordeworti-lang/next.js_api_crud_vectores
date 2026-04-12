# Semantic Search API with OpenAI Embeddings

[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript%205.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma%207-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2015-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

Production-ready semantic search backend with vector embeddings. Built with Next.js 16, Prisma 7, PostgreSQL + pgvector, following Clean Architecture principles and modern TypeScript best practices.

**Author:** Jhon Stiven Zuluaga Jaramillo  
**Version:** 1.2.0  
**License:** MIT

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Code Standards](#code-standards)
- [Design Decisions](#design-decisions)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Performance](#performance)
- [Security](#security)

---

## Features

- **Vector Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Semantic Search**: PostgreSQL + pgvector with HNSW index for sub-millisecond similarity queries
- **Prisma 7**: Type-safe ORM with driver adapters and connection pooling
- **Clean Architecture**: Repository pattern, service layer, strict separation of concerns
- **Production-Grade**: Structured error handling, input validation (Zod), connection management
- **Code Quality**: All functions <15 lines, pure functions, comprehensive type safety

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐  ┌─────────────────────────┐              │
│  │ POST /embed │  │ GET/PUT/DELETE /word    │  Next.js API  │
│  │   route.ts  │  │       route.ts          │  Routes       │
│  └──────┬──────┘  └───────────┬───────────┘  (< 15 líneas) │
└─────────┼──────────────────────┼──────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                         │
│         embedding.service.ts (composición de repos)          │
│  - processAndSaveWord()  - findWord()  - updateWord()       │
│  - deleteWord()                                            │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  word.repository│    │embedding.repository              │
│  │  (Prisma ORM)  │    │  (pg Pool raw)  │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                    │
│  PostgreSQL + pgvector ── Singleton Pool ── OpenAI API     │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request
    ↓
Zod Validation (schemas.ts)
    ↓
API Route (error boundary)
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
PostgreSQL / OpenAI
    ↓
Structured Response (error | success)
```

---

## Project Structure

```
src/
├── app/
│   └── api/
│       ├── embed/route.ts          # POST /api/embed - Create embedding
│       └── word/route.ts           # GET/PUT/DELETE /api/word - CRUD operations
│
├── lib/
│   ├── db/
│   │   ├── prisma.ts               # PrismaClient singleton + adapter
│   │   └── pool.ts                 # PostgreSQL Pool singleton
│   │
│   ├── validation/
│   │   ├── schemas.ts              # Zod validation schemas
│   │   └── validators.ts           # normalizeText, isPrismaError
│   │
│   ├── errors/
│   │   ├── errors.ts               # AppError hierarchy
│   │   └── error-handler.ts        # Centralized error handler
│   │
│   └── utils.ts                    # cosineSimilarity (future use)
│
├── repository/
│   ├── word.repository.ts          # Word CRUD (Prisma ORM)
│   └── embedding.repository.ts     # Embedding CRUD (pg Pool raw SQL)
│
├── servicio/
│   ├── embedding.service.ts        # Business logic orchestration
│   └── iaService.ts                # OpenAI integration
│
└── types/
    └── index.ts                    # Domain models (Word, Embedding)

prisma/
├── schema.prisma                   # Database schema
└── prisma.config.ts                # Prisma 7 configuration
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | API Routes, Server Components |
| **Language** | TypeScript 5.4 | Strict type safety |
| **ORM** | Prisma 7 | Type-safe DB access with driver adapters |
| **Database** | PostgreSQL 15 + pgvector | Vector storage + similarity search |
| **Validation** | Zod 3.x | Schema validation with TypeScript inference |
| **AI** | OpenAI API | text-embedding-3-small (1536d) |
| **Utilities** | pg (node-postgres) | Raw SQL for vector operations |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ with pgvector extension enabled
- OpenAI API key

### Installation

```bash
# Clone repository
git clone <repository-url>
cd my-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database (choose one)
npx prisma migrate dev        # Option A: Prisma migrations
# OR execute database.sql     # Option B: Raw SQL in Supabase

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables

```env
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY="sk-..."

# Optional
NODE_ENV="development"
```

---

## API Reference

### POST `/api/embed`

Generate and store embedding for a text.

**Request:**
```bash
curl -X POST http://localhost:3000/api/embed \
  -H "Content-Type: application/json" \
  -d '{"query": "inteligencia artificial"}'
```

**Success Response (200):**
```json
{
  "query": "inteligencia artificial",
  "status": "created",
  "message": "Palabra guardada",
  "dimensions": 1536
}
```

**Error Response (400):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Datos de entrada inválidos",
  "details": [
    { "field": "query", "message": "El texto no puede estar vacío" }
  ]
}
```

---

### GET `/api/word`

Retrieve word with its embedding.

**By Text:**
```bash
curl "http://localhost:3000/api/word?text=perro"
```

**By ID:**
```bash
curl "http://localhost:3000/api/word?id=1"
```

**Success Response (200):**
```json
{
  "id": 1,
  "text": "perro",
  "createdAt": "2025-04-11T05:22:19.123Z",
  "hasEmbedding": true,
  "vectorPreview": "0.023, -0.015, 0.008... (1536 dims)"
}
```

**Not Found (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Palabra no encontrada: gato"
}
```

---

### PUT `/api/word?id={id}`

Update a word and regenerate its embedding.

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/word?id=1" \
  -H "Content-Type: application/json" \
  -d '{"text": "gato"}'
```

**Success Response (200):**
```json
{
  "message": "Palabra actualizada",
  "word": {
    "id": 1,
    "text": "gato",
    "createdAt": "2025-04-11T05:22:19.123Z",
    "hasEmbedding": true,
    "vectorPreview": "0.012, 0.045, -0.033... (1536 dims)"
  }
}
```

**Not Found (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Palabra con id 1 no encontrada"
}
```

---

### DELETE `/api/word?id={id}`

Delete a word and its embedding.

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/word?id=1"
```

**Success Response (200):**
```json
{
  "message": "Palabra eliminada",
  "id": 1
}
```

**Not Found (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Palabra con id 1 no encontrada"
}
```

---

### POST `/api/search`

Semantic similarity search across all stored embeddings.

**Request:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "inteligencia artificial", "limit": 5}'
```

**Success Response (200):**
```json
{
  "query": "inteligencia artificial",
  "count": 5,
  "results": [
    {
      "wordId": 10,
      "text": "machine learning",
      "similarity": 0.55,
      "vectorPreview": "-0.012, -0.011, 0.003..."
    },
    {
      "wordId": 11,
      "text": "deep learning",
      "similarity": 0.44,
      "vectorPreview": "0.018, -0.038, 0.018..."
    }
  ]
}
```

---

## Code Standards

### Function Size
All functions are **< 15 lines** following Clean Code principles:

```typescript
// Good - Single responsibility
function buildVectorPreview(vector: number[]): string {
  const preview = vector.slice(0, 3).join(", ");
  return `${preview}... (${vector.length} dims)`;
}

// Good - Composed of helpers
export async function findWord(text?: string, id?: number) {
  const word = await findWordByCriteria(text, id);
  if (!word) return null;
  return enrichWithEmbedding(word);
}
```

### Error Handling
Structured error hierarchy with context:

```typescript
// Usage
throw new NotFoundError("Palabra", "perro");
throw new DatabaseError("Connection failed", { retryCount: 3 });
throw new ValidationError("Invalid input", { field: "query" });
```

### Type Safety
Domain-driven types in `@/types`:

```typescript
export interface Word {
  id: number;
  text: string;
  createdAt: Date;
}

export interface WordWithEmbedding extends Word {
  embedding: Embedding | null;
}
```

---

## Design Decisions

### 1. **Dual Repository Pattern**
- `word.repository.ts`: Uses Prisma ORM for Word entity
- `embedding.repository.ts`: Uses `pg` Pool raw queries for vector operations
- **Why**: pgvector requires raw SQL for vector type casting (`::vector`)

### 2. **Singleton Pool with Cleanup**
```typescript
const pool = globalForPool.pgPool ?? createPool();
process.on("SIGTERM", () => pool.end());
```
- Prevents connection leaks on hot reloads
- Graceful shutdown on server termination

### 3. **Zod for Runtime Validation**
- Type-safe input validation
- Automatic error formatting
- Infer TypeScript types from schemas

### 4. **Centralized Error Handler**
All API routes use `handleApiError()`:
- Converts AppError → JSON response with correct status code
- Converts ZodError → 400 with field-level details
- Logs unknown errors → 500 generic response

---

## Testing

```bash
# Run type checker
npx tsc --noEmit

# Run linter
npm run lint

# Format code
npx prettier --write .

# Manual testing with curl/Postman
# (See API Reference section above)
```

---

## Roadmap

### Phase 2: Semantic Search
- [x] `POST /api/search` - Similarity search with `<=>` operator
- [ ] `POST /api/compare` - Compare two words similarity
- [ ] Top-k nearest neighbors query
- [ ] Cosine distance threshold filtering

### Phase 3: Frontend
- [ ] React 19 + Next.js frontend
- [ ] Tailwind CSS 4 UI
- [ ] Real-time search interface

### Phase 4: Production Hardening
- [ ] Vitest test suite
- [ ] Rate limiting middleware
- [ ] Redis caching layer
- [ ] API documentation (OpenAPI/Swagger)

---

## Performance

| Operation | Avg Response Time |
|-----------|-------------------|
| POST /api/embed | ~2.5s (includes OpenAI API call) |
| GET /api/word | ~50ms (cached by Prisma) |
| Vector storage | 1536 dimensions per embedding |
| Database index | HNSW (cosine similarity optimized) |

---

## Security

- Environment variables excluded from Git (`.env*` in `.gitignore`)
- API keys isolated in `.env.local`
- Input sanitization via Zod schemas
- SQL injection prevention via parameterized queries
- Connection pooling with limits (max: 20)

---

## License

MIT License - Copyright 2025 Jhon Stiven Zuluaga Jaramillo

---

**Status:** Production Ready - CRUD + Semantic Search Complete  
**Version:** 1.2.0  
**Last Updated:** April 12, 2026
