import { prisma } from "@/lib/db/prisma";
import { normalizeText } from "@/lib/validation/validators";
import type { Word } from "@/types";
import { NotFoundError } from "@/lib/errors/errors";
import { handleNotFoundError } from "@/lib/errors/error-handler";
import { deleteWord } from "@/servicio/embedding.service";

// Usamos el tipo PrismaWord como en user.repository
type PrismaWord = {
  id: number;
  text: string;
  createdAt: Date;
};

function mapToWord(dbWord: PrismaWord): Word {
  return {
    id: dbWord.id,
    text: dbWord.text,
    createdAt: dbWord.createdAt,
  };
}


export async function findByText(text: string): Promise<Word | null> {
  const normalized = normalizeText(text);
  const word = await prisma.word.findUnique({ where: { text: normalized } });
  return word ? mapToWord(word) : null;
}

export async function findById(id: number): Promise<Word | null> {
  const word = await prisma.word.findUnique({ where: { id } });
  return word ? mapToWord(word) : null;
}

export async function create(text: string): Promise<Word> {
  const normalized = normalizeText(text);
  const word = await prisma.word.create({ data: { text: normalized } });
  return mapToWord(word);
}

export async function deleteById(id: number): Promise<Word | null> {

  const deletedWord = await handleNotFoundError(() =>
  prisma.word.delete({ where: { id } }), 
  id.toString()
  );
  
  console.log(`[Word Repository]: Usuario con email ${deleteWord.text} eliminado.`);
  return deletedWord ? mapToWord(deletedWord) : null;
}



export async function update(id: number, text: string): Promise<Word> {
  const normalized = normalizeText(text);
  const word = await handleNotFoundError(
    prisma.word.update({
      where: { id },
      data: { text: normalized },
    }),
    id.toString()
  );
  return mapToWord(word);
}

