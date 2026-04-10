CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "Word" (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Embedding" (
    id SERIAL PRIMARY KEY,
    word_id INTEGER NOT NULL REFERENCES "Word"(id),
    vector VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(word_id)
);

CREATE INDEX idx_embedding_word ON "Embedding"(word_id);

CREATE INDEX embedding_vector_idx
ON "Embedding"
USING hnsw (vector vector_cosine_ops);