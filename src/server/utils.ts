export function sanitizeInput(input: string): string {
  return input
    .replace(/ignore (?:all )?(?:previous|above|all) instructions/gi, "[removed]")
    .replace(/system prompt/gi, "[removed]")
    .slice(0, 2000);
}

export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    console.warn("JSON parse failed for AI output, using fallback.");
    return fallback;
  }
}
