import { generateEmbedding } from "./iaService";
import * as WordRepo from "@/repository/word.repository";
import * as EmbeddingRepo from "@/repository/embedding.repository";
import type { Word, Embedding, WordWithEmbedding, SaveResult, SearchResult } from "@/types";

export type { Word, Embedding, WordWithEmbedding, SaveResult };

function getMessageForStatus(status: SaveResult): string {
  const messages = {
    created: "Palabra guardada",
    exists: "Palabra ya existe",
  };
  return messages[status];
}

function buildSuccessResponse(
  query: string,
  status: SaveResult,
  dimensions: number
) {
  return {
    query,
    status,
    message: getMessageForStatus(status),
    dimensions,
  };
}

export async function processAndSaveWord(query: string): Promise<{
  query: string;
  status: SaveResult;
  message: string;
  dimensions: number;
}> {

  const existing = await WordRepo.findByText(query);
  if (existing) {
    return buildSuccessResponse(query, "exists", 1536);
  }

  const vector = await generateEmbedding(query);

  const word = await WordRepo.create(query);
  await EmbeddingRepo.create(word.id, vector);

  return buildSuccessResponse(query, "created", vector.length);
}

async function findWordByCriteria(
  text?: string,
  id?: number
): Promise<Word | null> {
  if (text) return WordRepo.findByText(text);
  if (id) return WordRepo.findById(id);
  return null;
}

async function enrichWithEmbedding(word: Word): Promise<WordWithEmbedding> {
  const embedding = await EmbeddingRepo.findByWordId(word.id);
  return { ...word, embedding };
}

export async function findWord(
  text?: string,
  id?: number
): Promise<WordWithEmbedding | null> {
  const word = await findWordByCriteria(text, id);
  if (!word) return null;
  return enrichWithEmbedding(word);
}

export async function deleteWord(id: number): Promise<void> {
  await EmbeddingRepo.deleteByWordId(id);
  await WordRepo.deleteById(id);
}

export async function updateWord(id: number, newText: string): Promise<WordWithEmbedding> {
  const updatedWord = await WordRepo.update(id, newText);
  const newVector = await generateEmbedding(newText);
  await EmbeddingRepo.update(id, newVector);
  const embedding = await EmbeddingRepo.findByWordId(id);
  return { ...updatedWord, embedding };
}

export interface SearchResultWithWord extends SearchResult {
  word: Word;
}

export async function searchSimilarWords(
  query: string,
  limit: number = 5
): Promise<SearchResultWithWord[]> {
  const queryVector = await generateEmbedding(query);
  const results = await EmbeddingRepo.searchSimilar(queryVector, limit);
  
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      const word = await WordRepo.findById(result.wordId);
      return { ...result, word: word! };
    })
  );
  
  return enrichedResults;
}
