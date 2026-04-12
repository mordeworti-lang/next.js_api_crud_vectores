import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/errors/error-handler";
import * as ChatService from "@/servicio/chat.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, chatId, userName } = chatRequestSchema.parse(body);

    const response = await ChatService.processChatMessage(message, chatId, userName);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
