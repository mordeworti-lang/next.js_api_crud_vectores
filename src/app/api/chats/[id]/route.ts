import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireClient, requireAnyRole } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";
import { NotFoundError, UnauthorizedError } from "@/lib/errors/errors";
import { z } from "zod";

const updateChatSchema = z.object({
  title: z.string().min(1, "Título requerido"),
});

// GET /api/chats/{id} - Ver un chat con mensajes
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAnyRole(req);
    const { id } = await params;
    const chatId = parseInt(id);

    if (isNaN(chatId)) {
      return NextResponse.json({ success: false, error: "ID de chat inválido" }, { status: 400 });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundError("Chat", chatId.toString());
    }

    return NextResponse.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/chats/{id} - Renombrar chat
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireClient(req);
    const { id } = await params;
    const chatId = parseInt(id);

    if (isNaN(chatId)) {
      return NextResponse.json({ success: false, error: "ID de chat inválido" }, { status: 400 });
    }

    const body = await req.json();
    const validated = updateChatSchema.parse(body);

    // Verificar que el chat pertenece al usuario
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.userId,
      },
    });

    if (!chat) {
      throw new NotFoundError("Chat", chatId.toString());
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { title: validated.title },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/chats/{id} - Eliminar chat con todos sus mensajes
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireClient(req);
    const { id } = await params;
    const chatId = parseInt(id);

    if (isNaN(chatId)) {
      return NextResponse.json({ success: false, error: "ID de chat inválido" }, { status: 400 });
    }

    // Verificar que el chat pertenece al usuario
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.userId,
      },
    });

    if (!chat) {
      throw new NotFoundError("Chat", chatId.toString());
    }

    // Cascade delete: mensajes se borran automáticamente por la relación
    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({
      success: true,
      message: "Chat eliminado correctamente",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
