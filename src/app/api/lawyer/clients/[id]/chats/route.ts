import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireLawyer } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";
import { NotFoundError } from "@/lib/errors/errors";

// GET /api/lawyer/clients/{id}/chats - Ver chats de un cliente
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const lawyer = requireLawyer(req);
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { success: false, error: "ID de cliente inválido" },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a este abogado
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        lawyerId: lawyer.userId,
        role: "CLIENTE",
      },
    });

    if (!client) {
      throw new NotFoundError("Cliente", id);
    }

    // Obtener chats con mensajes
    const chats = await prisma.chat.findMany({
      where: {
        userId: clientId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      data: chats,
      count: chats.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
