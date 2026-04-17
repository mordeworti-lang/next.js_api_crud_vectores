import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { ZodError } from "zod";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }
  

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details: issues,
      },
      { status: 400 }
    );
  }

  console.error("[API Error]", error);

  return NextResponse.json(
    {
      error: "UNKNOWN_ERROR",
      message: "Error interno del servidor",
    },
    { status: 500 }
  );
}
