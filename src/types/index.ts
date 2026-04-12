// Domain Models - Interfaces centralizadas

export interface Word {
  id: number;
  text: string;
  createdAt: Date;
}

export interface Embedding {
  id: number;
  wordId: number;
  vector: number[];
  createdAt: Date;
}

export interface WordWithEmbedding extends Word {
  embedding: Embedding | null;
}

export type SaveResult = "created" | "exists";

export interface ProcessWordResult {
  query: string;
  status: SaveResult;
  message: string;
  dimensions: number;
}

export interface SearchResult {
  wordId: number;
  vector: number[];
  similarity: number;
}