import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireClient } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";
import { NotFoundError, ValidationError } from "@/lib/errors/errors";
import { z } from "zod";
import { processChatMessageWithHistory } from "@/servicio/chat-message.service";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Mensaje requerido"),
  userName: z.string().optional(),
});

// POST /api/chats/{id}/messages - Enviar mensaje y recibir respuesta del bot
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      include: {
        user: {
          select: {
            name: true,
            nickname: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10, // Contexto de los últimos 10 mensajes
          select: {
            role: true,
            content: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundError("Chat", chatId.toString());
    }

    const body = await req.json();
    const validated = sendMessageSchema.parse(body);

    // Guardar mensaje del usuario
    const userMessage = await prisma.chatMessage.create({
      data: {
        role: "user",
        content: validated.content,
        chatId: chatId,
      },
    });

    // Preparar historial para el bot (orden cronológico)
    const history = [...chat.messages].reverse().map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Usar nombre del usuario
    const userName = validated.userName || chat.user.nickname || chat.user.name;

    // Procesar con el servicio de IA
    const botResponse = await processChatMessageWithHistory(validated.content, history, userName);

    // Guardar respuesta del bot
    const botMessage = await prisma.chatMessage.create({
      data: {
        role: "assistant",
        content: botResponse,
        chatId: chatId,
        metadata: { source: "ai" },
      },
    });

    // Actualizar timestamp del chat
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        botMessage,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/chats/{id}/messages - Listar mensajes de un chat
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
