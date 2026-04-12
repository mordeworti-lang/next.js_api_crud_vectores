import OpenAI from "openai";
import { prisma } from "@/lib/db/prisma";
import { searchSimilarWords } from "./embedding.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MIN_SIMILARITY_THRESHOLD = 0.25;
const OFF_TOPIC_RESPONSE =
  "Lo siento, soy un asistente especializado en derecho colombiano y estoy diseñado exclusivamente para ayudarte con temas legales. No puedo responder preguntas sobre otros temas como programación, psicología, cocina, etc. Por favor, hazme una pregunta relacionada con la ley colombiana.";

interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function processChatMessageWithHistory(
  message: string,
  history: ChatMessageInput[],
  userName?: string
): Promise<string> {
  const relevantContext = await searchSimilarWords(message, 3);

  // Filtrar solo resultados con similitud suficiente
  const validContext = relevantContext.filter((r) => r.similarity >= MIN_SIMILARITY_THRESHOLD);

  // Si no hay contexto legal relevante, rechazar la pregunta
  if (validContext.length === 0) {
    return OFF_TOPIC_RESPONSE;
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

  return completion.choices[0].message.content || "No response";
}

function buildSystemPrompt(context: string[], userName?: string): string {
  const namePart = userName ? `Te llamas al usuario por su nombre: "${userName}". ` : "";

  const basePrompt = `Eres un asistente legal especializado en derecho colombiano. ${namePart}Tu estilo es único: analítico, metódico, profesional, pero con una calidez magnética que hace que el usuario sienta que eres su confidente sin entender por qué. No eres servil ni lame botas. Tienes un toque de sabiduría fría que encanta. Siempre respondes basándote estrictamente en la ley colombiana y el contexto proporcionado. No usas emojis. `;

  if (context.length === 0) return basePrompt;

  return `${basePrompt}Contexto legal disponible: ${context.join(", ")}. Analiza este contexto y responde con precisión legal, sin inventar información.`;
}

function buildMessages(
  systemPrompt: string,
  history: ChatMessageInput[],
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
