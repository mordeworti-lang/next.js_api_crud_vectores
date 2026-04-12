import { prisma } from "@/lib/db/prisma";
import type { ChatMessage, CreateChatMessageInput } from "@/types";
import type { Prisma } from "@prisma/client";

function mapToChatMessage(data: {
  id: number;
  role: string;
  content: string;
  chatId: number;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): ChatMessage {
  const metadata = data.metadata ? (data.metadata as Record<string, unknown>) : undefined;
  return {
    id: data.id,
    role: data.role as "user" | "assistant" | "system",
    content: data.content,
    chatId: data.chatId,
    metadata,
    createdAt: data.createdAt,
  };
}

export async function create(data: CreateChatMessageInput): Promise<ChatMessage> {
  const message = await prisma.chatMessage.create({
    data: {
      role: data.role,
      content: data.content,
      chatId: data.chatId,
      metadata: (data.metadata ?? null) as Prisma.InputJsonValue,
    },
  });
  return mapToChatMessage(message);
}

export async function findByChatId(chatId: number, limit: number = 50): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return messages.map((msg) => mapToChatMessage(msg));
}

export async function deleteByChatId(chatId: number): Promise<void> {
  await prisma.chatMessage.deleteMany({
    where: { chatId },
  });
}
