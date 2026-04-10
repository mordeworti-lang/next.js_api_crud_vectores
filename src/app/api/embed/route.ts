import { NextResponse } from "next/server";
import { generateEmbedding } from "@/servicio/iaService";
import { prisma } from "@/lib/prisma";
import { cosineSimilarity } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

    // 1. Obtener vector de la búsqueda
    const queryVector = await generateEmbedding(query);
    console.log(queryVector);

    // 2. Procesar similitudes
    const results = prisma
      .map((item) => ({
        text: item.text,
        similarity: (cosineSimilarity(queryVector, item.vector) * 100).toFixed(2) + "%",
      }))
      .sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));

    return NextResponse.json({ query, results });
  } catch (error) {
    console.error("Embedding Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
