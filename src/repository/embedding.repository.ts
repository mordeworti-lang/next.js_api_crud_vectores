import { prisma } from "@/lib/prisma";
import { normalizeText, isPrismaError } from "@/lib/validators";
import { DatabaseError } from "@/lib/errors";
import { Pool } from "pg";

export type SaveResult = "created" | "exists";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createWordAndEmbedding(text: string, vector: number[]): Promise<void> {
  const word = await prisma.word.create({ data: { text } });

  const vectorString = `[${vector.join(",")}]`;
  await pool.query(
    `INSERT INTO "Embedding" ("word_id", "vector") VALUES ($1, $2::vector)`,
    [word.id, vectorString]
  );
}

export async function saveWordWithEmbedding(query: string, queryVector: number[]): Promise<SaveResult> {
  const text = normalizeText(query);

  try {
    await createWordAndEmbedding(text, queryVector);
    return "created";
  } catch (error: unknown) {
    console.error("Repository Error:", error);
    if (isPrismaError(error) && error.code === "P2002") return "exists";
    throw new DatabaseError("Failed to save word");
  }
}
