# Semantic Search API with OpenAI Embeddings

A production-ready semantic search backend built with Next.js, OpenAI, and PostgreSQL with pgvector. Designed for high-performance similarity search using vector embeddings.

**Author:** Jhon Stiven Zuluaga Jaramillo

---

## Features

- **AI-Powered Embeddings**: Generate text embeddings using OpenAI's `text-embedding-3-small` model (1536 dimensions)
- **Vector Search**: High-performance similarity search with PostgreSQL + pgvector + HNSW index
- **Type-Safe ORM**: Prisma 7 with strict TypeScript types
- **Modular Architecture**: Repository pattern with clean separation of concerns
- **Production Ready**: Error handling, transactions, and input validation
- **Code Quality**: ESLint, Prettier, and strict TypeScript configuration

---

## Tech Stack

### Backend (Current)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript 5
- **AI**: OpenAI API (Embeddings)
- **Database**: PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) extension
- **ORM**: Prisma 7
- **Validation**: Custom validator functions with type guards

### Frontend (Planned)
- **Framework**: React 19 + Next.js
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **State Management**: TBD

### Testing (Planned)
- **Framework**: Vitest
- **Approach**: TDD (Test-Driven Development)
- **Coverage**: Unit tests for repositories, services, and utilities

---

## Architecture

### System Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Client        │      │   Next.js API    │      │   PostgreSQL    │
│   (Postman/     │──────▶│   (App Router)   │──────▶│   + pgvector    │
│   Frontend)     │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │   OpenAI API     │
                         │   (Embeddings)   │
                         └──────────────────┘
```

### Database Schema (ER Diagram)

```
┌─────────────┐       ┌─────────────────┐
│    Word     │       │    Embedding    │
├─────────────┤       ├─────────────────┤
│ id (PK)     │◄──────│ word_id (FK, UK)│
│ text (UK)   │  1:1  │ vector          │
│ created_at  │       │ created_at      │
└─────────────┘       └─────────────────┘
```

**Relationships:**
- `Word` 1:1 `Embedding` (One word has one embedding vector)
- Foreign Key: `Embedding.word_id` → `Word.id`
- Unique constraints: `Word.text`, `Embedding.word_id`
- Index: HNSW on `Embedding.vector` for fast similarity search

### Project Structure

```
src/
├── app/
│   └── api/
│       └── embed/
│           └── route.ts          # API endpoint (POST /api/embed)
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── validators.ts             # Input validation & sanitization
│   ├── errors.ts                 # Custom error classes
│   └── utils.ts                  # Utility functions (cosine similarity)
├── repository/
│   └── embedding.repository.ts   # CRUD operations for embeddings
└── servicio/
    └── iaService.ts              # OpenAI integration

prisma/
├── schema.prisma                 # Database schema (Word + Embedding)
└── prisma.config.ts              # Prisma 7 configuration

database.sql                      # PostgreSQL schema with pgvector
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ with pgvector extension
- OpenAI API key

---

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
   OPENAI_API_KEY="sk-..."
   ```

4. **Set up the database**
   - Execute `database.sql` in your PostgreSQL/Superbase SQL Editor
   - Or run migrations:
     ```bash
     npx prisma migrate dev
     ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## API Documentation

### POST /api/embed

Generate embedding for a text query and store it in the database.

**Request:**
```json
{
  "query": "pescado"
}
```

**Response:**
```json
{
  "query": "pescado",
  "result": "created"
}
```

**Status Codes:**
- `200 OK` - Word created or already exists
- `400 Bad Request` - Missing query parameter
- `500 Internal Server Error` - Database or OpenAI error

---

## Repository Pattern

### saveWordWithEmbedding

Creates or checks existence of a word with its vector embedding.

```typescript
import { saveWordWithEmbedding } from "@/repository/embedding.repository";

const result = await saveWordWithEmbedding("pescado", [0.123, 0.456, ...]);
// Returns: "created" | "exists"
```

**Features:**
- Text normalization (lowercase + trim)
- Duplicate detection
- Atomic transactions (Word + Embedding)
- Proper error handling with P2002 (unique constraint)

---

## Planned Features

### Phase 2: Frontend Integration
- [ ] React + TypeScript frontend
- [ ] Tailwind CSS styling
- [ ] Search interface with real-time results
- [ ] Vector visualization component

### Phase 3: Advanced Search
- [ ] Similarity search endpoint using `<=>` operator
- [ ] Top-k nearest neighbors query
- [ ] Distance threshold filtering

### Phase 4: Testing
- [ ] Vitest setup with TDD approach
- [ ] Repository unit tests
- [ ] API integration tests
- [ ] Mock OpenAI client for testing

---

## Code Quality

### Formatting
```bash
# Format all files
npx prettier --write .
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## Security

- Environment variables excluded from Git (`.env*` in `.gitignore`)
- API keys stored only in `.env.local`
- Input sanitization with `normalizeText()`
- Type-safe SQL queries with Prisma `$executeRaw`

---

## License

MIT License - Jhon Stiven Zuluaga Jaramillo

---

## Contact

For questions or contributions, please contact the author.

**Project Status:** Backend API ready for frontend consumption 🚀
