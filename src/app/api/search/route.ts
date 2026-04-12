import { NextResponse } from "next/server";
import { searchSimilarWords } from "@/servicio/embedding.service";
import { handleApiError } from "@/lib/errors/error-handler";
import { semanticSearchSchema } from "@/lib/validation/schemas";

function formatSearchResponse(results: Awaited<ReturnType<typeof searchSimilarWords>>) {
  return results.map((result) => ({
    wordId: result.wordId,
    text: result.word.text,
    similarity: Math.round(result.similarity * 100) / 100,
    vectorPreview: result.vector.slice(0, 3).map((n) => n.toFixed(3)).join(", ") + "...",
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, limit } = semanticSearchSchema.parse(body);

    const results = await searchSimilarWords(query, limit);

    return NextResponse.json({
      query,
      count: results.length,
      results: formatSearchResponse(results),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
