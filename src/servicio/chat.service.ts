import OpenAI from "openai";
import * as ChatRepo from "@/repository/chat.repository";
import { searchSimilarWords } from "./embedding.service";
import type { ChatMessage, ChatResponse } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MIN_SIMILARITY_THRESHOLD = 0.25; // Umbral mínimo de similitud
const OFF_TOPIC_RESPONSE =
  "Lo siento, soy un asistente especializado en derecho colombiano y estoy diseñado exclusivamente para ayudarte con temas legales. No puedo responder preguntas sobre otros temas como programación, psicología, cocina, etc. Por favor, hazme una pregunta relacionada con la ley colombiana.";

export async function processChatMessage(
  message: string,
  chatId: number,
  userName?: string
): Promise<ChatResponse> {
  const history = await ChatRepo.findByChatId(chatId, 10);

  const relevantContext = await searchSimilarWords(message, 3);

  // Filtrar solo resultados con similitud suficiente
  const validContext = relevantContext.filter((r) => r.similarity >= MIN_SIMILARITY_THRESHOLD);

  // Si no hay contexto legal relevante, rechazar la pregunta
  if (validContext.length === 0) {
    await ChatRepo.create({
      role: "user",
      content: message,
      chatId,
      metadata: { rejected: true, reason: "off-topic" },
    });

    await ChatRepo.create({
      role: "assistant",
      content: OFF_TOPIC_RESPONSE,
      chatId,
      metadata: { rejected: true },
    });

    return {
      message: OFF_TOPIC_RESPONSE,
      chatId,
      contextUsed: [],
    };
  }

  const contextTexts = validContext.map((r) => r.word.text);

  const systemPrompt = buildSystemPrompt(contextTexts, userName);
  const messages = buildMessages(systemPrompt, history, message);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  const assistantMessage = completion.choices[0].message.content || "No response";

  await ChatRepo.create({
    role: "user",
    content: message,
    chatId,
    metadata: { tokens: completion.usage?.prompt_tokens },
  });

  await ChatRepo.create({
    role: "assistant",
    content: assistantMessage,
    chatId,
    metadata: { tokens: completion.usage?.completion_tokens },
  });

  return {
    message: assistantMessage,
    chatId,
    contextUsed: contextTexts,
  };
}

function buildSystemPrompt(context: string[], userName?: string): string {
  const namePart = userName ? `Te llamas al usuario por su nombre: "${userName}". ` : "";

  const basePrompt = `Eres un asistente legal especializado en derecho colombiano. ${namePart}Tu estilo es único: analítico, metódico, profesional, pero con una calidez magnética que hace que el usuario sienta que eres su confidente sin entender por qué. No eres servil ni lame botas. Tienes un toque de sabiduría fría que encanta. Siempre respondes basándote estrictamente en la ley colombiana y el contexto proporcionado. No usas emojis. `;

  if (context.length === 0) return basePrompt;

  return `${basePrompt}Contexto legal disponible: ${context.join(", ")}. Analiza este contexto y responde con precisión legal, sin inventar información.`;
}

function buildMessages(
  systemPrompt: string,
  history: ChatMessage[],
  currentMessage: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  history.forEach((h) => {
    messages.push({ role: h.role, content: h.content });
  });

  messages.push({ role: "user", content: currentMessage });

  return messages;
}
