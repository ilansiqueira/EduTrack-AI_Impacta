import type { Flashcard } from '../types/models';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const FALLBACK_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
] as const;

export interface GenerateFlashcardsOptions {
  apiKey?: string;
  model?: string;
}

function normalizeModelId(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^models\//i, '');
}

export function buildGeminiModelQueue(preferredModel?: string): string[] {
  const candidates = [normalizeModelId(preferredModel), ...FALLBACK_GEMINI_MODELS];
  const unique: string[] = [];
  for (const candidate of candidates) {
    if (candidate && !unique.includes(candidate)) {
      unique.push(candidate);
    }
  }
  return unique;
}

export function extractGeminiErrorMessage(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';
  try {
    const parsed = JSON.parse(trimmed) as { error?: { message?: unknown } };
    const msg = parsed?.error?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
  } catch {
    // Fallback to raw response text when body is not JSON
  }
  return trimmed.slice(0, 200);
}

export function extractSuggestedModels(text: string): string[] {
  const found: string[] = [];
  const regex = /models\/([a-zA-Z0-9._-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const candidate = normalizeModelId(match[1]);
    if (candidate && !found.includes(candidate)) {
      found.push(candidate);
    }
  }
  return found;
}

export function stripJsonMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function isGeminiConfigured(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return Boolean(key && typeof key === 'string' && key.trim().length > 0 && !key.includes('your-'));
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  count: number = 8,
  options?: GenerateFlashcardsOptions
): Promise<Flashcard[]> {
  const apiKey = (options?.apiKey ?? import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new Error('Chave da Gemini API não configurada. Adicione VITE_GEMINI_API_KEY ao .env.');
  }

  const prompt = `Você é um professor universitário brasileiro de "${subject}".
Gere exatamente ${count} flashcards de estudo sobre o tópico "${topic}".
Cada flashcard deve ter:
- question: uma pergunta clara e objetiva (em português)
- answer: uma resposta concisa e precisa (em português)
- hint: uma dica curta opcional (em português)

Responda APENAS com JSON válido neste formato, sem markdown:
{
  "cards": [
    { "question": "...", "answer": "...", "hint": "..." }
  ]
}`;

  const envModel = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
  const queue = buildGeminiModelQueue(options?.model ?? envModel);
  const tried = new Set<string>();
  let last404ErrorMessage = '';

  while (queue.length > 0) {
    const model = queue.shift()!;
    if (!model || tried.has(model)) continue;
    tried.add(model);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      });
    } catch (err) {
      throw new Error(
        `Falha na conexão com a Gemini API: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
      );
    }

    if (response.status === 404) {
      const text = await response.text().catch(() => '');
      const detail = extractGeminiErrorMessage(text);
      last404ErrorMessage = detail
        ? `Gemini API retornou erro 404: ${detail}`
        : 'Gemini API retornou erro 404 (modelo indisponível).';

      const suggestions = extractSuggestedModels(detail || text).filter(
        (candidate) => !tried.has(candidate) && !queue.includes(candidate)
      );
      if (suggestions.length > 0) {
        queue.unshift(...suggestions);
      }
      continue;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const detail = extractGeminiErrorMessage(text);
      throw new Error(
        `Gemini API retornou erro ${response.status}${detail ? `: ${detail}` : ''}`
      );
    }

    const json = await response.json();
    const rawContent: string = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const textContent = stripJsonMarkdownFences(rawContent);

    if (!textContent) {
      throw new Error('Gemini não retornou conteúdo. Tente novamente.');
    }

    let parsed: { cards?: Array<{ question: string; answer: string; hint?: string }> };
    try {
      parsed = JSON.parse(textContent);
    } catch {
      throw new Error('Resposta da Gemini não é JSON válido. Tente outro tópico.');
    }

    if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      throw new Error('A IA não gerou flashcards. Tente reformular o tópico.');
    }

    return parsed.cards.map((c, i) => ({
      id: `card-${Date.now()}-${i}`,
      question: c.question || '',
      answer: c.answer || '',
      hint: c.hint || undefined,
    }));
  }

  throw new Error(last404ErrorMessage || 'Nenhum modelo Gemini disponível no momento.');
}
