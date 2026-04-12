import { NextResponse } from "next/server";
import { findWord, deleteWord, updateWord } from "@/servicio/embedding.service";
import { searchWordSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { NotFoundError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";

const deleteWordSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número válido")
    .transform((val) => parseInt(val, 10)),
});

const updateWordSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número válido")
    .transform((val) => parseInt(val, 10)),
  text: z.string().min(1, "El texto es requerido").max(500, "Texto demasiado largo"),
});

function buildVectorPreview(vector: number[]): string {
  const preview = vector.slice(0, 3).join(", ");
  return `${preview}... (${vector.length} dims)`;
}

function formatWordResponse(word: {
  id: number;
  text: string;
  createdAt: Date;
  embedding: { vector: number[] } | null;
}) {
  return {
    id: word.id,
    text: word.text,
    createdAt: word.createdAt,
    hasEmbedding: word.embedding !== null,
    vectorPreview: word.embedding ? buildVectorPreview(word.embedding.vector) : null,
  };
}

function parseSearchParams(req: Request) {
  const { searchParams } = new URL(req.url);
  return Object.fromEntries(searchParams.entries());
}

function ensureHasSearchCriteria(text: string | undefined, id: number | undefined) {
  if (!text && !id) {
    throw new NotFoundError("Parámetros", "text o id requeridos");
  }
}

async function fetchWord(text: string | undefined, id: number | undefined) {
  const word = await findWord(text, id);
  if (!word) {
    throw new NotFoundError("Palabra", text || String(id));
  }
  return word;
}

export async function GET(req: Request) {
  try {
    const params = parseSearchParams(req);
    const { text, id } = searchWordSchema.parse(params);

    ensureHasSearchCriteria(text, id);
    const word = await fetchWord(text, id);

    return NextResponse.json(formatWordResponse(word));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const params = parseSearchParams(req);
    const { id } = deleteWordSchema.parse(params);

    const word = await findWord(undefined, id);
    if (!word) {
      throw new NotFoundError("Palabra", String(id));
    }

    await deleteWord(id);

    return NextResponse.json({ message: "Palabra eliminada", id }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const urlParams = parseSearchParams(req);
    const body = await req.json();

    const { id, text } = updateWordSchema.parse({ ...urlParams, ...body });

    const existingWord = await findWord(undefined, id);
    if (!existingWord) {
      throw new NotFoundError("Palabra", String(id));
    }

    const updatedWord = await updateWord(id, text);

    return NextResponse.json({
      message: "Palabra actualizada",
      word: formatWordResponse(updatedWord),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
