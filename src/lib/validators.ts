export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

export function isValidText(text: string): boolean {
  return text.length > 0 && text.length <= 255;
}

export function isPrismaError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
