import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { UnauthorizedError, ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";
import crypto from "crypto";

const generateKeySchema = z.object({
  clientEmail: z.string().email("Email del cliente inválido"),
});

function generateClientKey(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase(); // 16 caracteres hex
}

// POST /api/client-keys - Generar clave de cliente (solo abogados autenticados)
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de autenticación requerido");
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // Solo abogados pueden generar claves
    if (payload.role !== "ABOGADO") {
      throw new UnauthorizedError("Solo abogados pueden generar claves de cliente");
    }

    // Verificar que el abogado esté activo
    if (payload.status !== "ACTIVO") {
      throw new UnauthorizedError("Tu cuenta debe estar activa para generar claves");
    }

    const body = await req.json();
    const { clientEmail } = generateKeySchema.parse(body);

    // Generar clave única
    const key = generateClientKey();

    // Crear clave en la BD
    const clientKey = await prisma.clientKey.create({
      data: {
        key,
        lawyerId: payload.userId,
        clientEmail,
        used: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        key: clientKey.key,
        clientEmail: clientKey.clientEmail,
        createdAt: clientKey.createdAt,
        message: `Clave generada: ${key}. Esta clave solo puede usarse con el email ${clientEmail}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/client-keys - Listar claves generadas por el abogado
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de autenticación requerido");
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.role !== "ABOGADO") {
      throw new UnauthorizedError("Solo abogados pueden ver sus claves");
    }

    const keys = await prisma.clientKey.findMany({
      where: { lawyerId: payload.userId },
      include: {
        usedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
