import type { Flashcard } from '../types/models';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function isGeminiConfigured(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return Boolean(key && typeof key === 'string' && key.trim().length > 0 && !key.includes('your-'));
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  count: number = 8
): Promise<Flashcard[]> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
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

  let response: Response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API retornou erro ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  const textContent: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
