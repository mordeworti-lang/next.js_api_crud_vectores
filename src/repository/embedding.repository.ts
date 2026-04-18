import { pool } from "@/lib/db/pool";
import { NotFoundError, ConflictError, DatabaseError } from "@/lib/errors/errors";
import type { Embedding, PgEmbeddingRow } from "@/types";

function parseVector(vectorStr: string): number[] {
  return vectorStr
  /* mira  /^\[ esto dicebuca corchete al inicio y borralo o si esta al final 
  |\]$ y borralo y /g que esta busque da es global  aunque est solo toca inicio y fin 
   */
    .replace(/^\[|\]$/g, "")
    .split(",")// separa en , donde encuentra ,
    .map(v => parseFloat(v));
    // recorre el array de numero y combierte cada uno en decimal 
}

function mapToEmbedding(row: PgEmbeddingRow ): Embedding {
  return {
    id: row.id,
    wordId: row.word_id,
    vector: parseVector(row.vector),
    createdAt: row.created_at,
  };
}

async function handlePgNotFound<T>(promise: Promise<{rows: T[]}>, resource: string, id: PropertyKey,
): Promise<T> {
  try{
  const result = await promise;
  if (result.rows.length === 0) {
    //tranformamos en estring el id
    throw new NotFoundError(resource, id.toString());
  }
  return result.rows[0];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      throw error;
    }
    throw new DatabaseError("Error al buscar embedding", {
      message: error instanceof Error ? error.message : String(error)
    });}
}


export async function create(wordId: number, vector: number[]): Promise<void> {
  const vectorString = `[${vector.join(",")}]`;
  await pool.query(`INSERT INTO "Embedding" ("word_id", "vector") VALUES ($1, $2::vector)`, [
    wordId,
    vectorString,
  ]);
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

export async function deleteByWordId(wordId: number): Promise<Embedding> {
  const row = await handlePgNotFound( 
    pool.query<PgEmbeddingRow>(`DELETE FROM "Embedding" 
      WHERE word_id = $1`, 
      [wordId]),
      "Embedding",
      wordId,
    );
    return mapToEmbedding(row);
}

export async function update(wordId: number, vector: number[]): Promise<Embedding> {
  const vectorString = `[${vector.join(",")}]`;
  const row = await handlePgNotFound(
    //aca no ponemos await ya que la funcion que creamos
    //  anterior mente espera una promesa y 
    // si ponemos await le estariamos danod el resultado 
    pool.query<PgEmbeddingRow>(
      `UPDATE "Embedding" SET "vector" = $1::vector 
       WHERE "word_id" = $2 
       RETURNING *`,
      [vectorString, wordId],  // <-- Orden corregido
    ),
    "Embedding",
    wordId
  );
  return mapToEmbedding(row);
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
