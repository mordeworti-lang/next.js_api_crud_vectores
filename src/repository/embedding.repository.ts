import { pool } from "@/lib/db/pool";
import type { Embedding, SearchResult } from "@/types";

function parseVector(vectorStr: string): number[] {
  return vectorStr
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((v) => parseFloat(v));
}

export async function create(wordId: number, vector: number[]): Promise<void> {
  const vectorString = `[${vector.join(",")}]`;
  await pool.query(`INSERT INTO "Embedding" ("word_id", "vector") VALUES ($1, $2::vector)`, [
    wordId,
    vectorString,
  ]);
}

function mapToEmbedding(row: {
  id: number;
  word_id: number;
  vector: string;
  created_at: Date;
}): Embedding {
  return {
    id: row.id,
    wordId: row.word_id,
    vector: parseVector(row.vector),
    createdAt: row.created_at,
  };
}

async function queryEmbeddingByWordId(wordId: number) {
  return pool.query(
    `SELECT id, word_id, vector::text, created_at FROM "Embedding" WHERE word_id = $1`,
    [wordId]
  );
}

export async function findByWordId(wordId: number): Promise<Embedding | null> {
  const result = await queryEmbeddingByWordId(wordId);
  if (result.rows.length === 0) return null;
  return mapToEmbedding(result.rows[0]);
}

export async function deleteByWordId(wordId: number): Promise<void> {
  await pool.query(`DELETE FROM "Embedding" WHERE word_id = $1`, [wordId]);
}

export async function update(wordId: number, vector: number[]): Promise<void> {
  const vectorString = `[${vector.join(",")}]`;
  await pool.query(`UPDATE "Embedding" SET vector = $2::vector WHERE word_id = $1`, [
    wordId,
    vectorString,
  ]);
}

function mapToSearchResult(row: {
  word_id: number;
  vector: string;
  similarity: number;
}): SearchResult {
  return {
    wordId: row.word_id,
    vector: parseVector(row.vector),
    similarity: row.similarity,
  };
}

export async function searchSimilar(
  queryVector: number[],
  limit: number = 5
): Promise<SearchResult[]> {
  const vectorString = `[${queryVector.join(",")}]`;
  const result = await pool.query(
    `SELECT word_id, vector::text, 1 - (vector <=> $1::vector) as similarity
     FROM "Embedding"
     ORDER BY vector <=> $1::vector
     LIMIT $2`,
    [vectorString, limit]
  );
  return result.rows.map(mapToSearchResult);
}
