import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireClient } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";

const createChatSchema = z.object({
  title: z.string().optional(),
});

// GET /api/chats - Listar mis chats
export async function GET(req: NextRequest) {
  try {
    const user = requireClient(req);

    const chats = await prisma.chat.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/chats - Crear nuevo chat
export async function POST(req: NextRequest) {
  try {
    const user = requireClient(req);
    const body = await req.json();
    const validated = createChatSchema.parse(body);

    const chat = await prisma.chat.create({
      data: {
        title: validated.title || "Nueva conversación",
        userId: user.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: chat,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
