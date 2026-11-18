import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEFAULT_GEMINI_MODEL,
  buildGeminiModelQueue,
  extractGeminiErrorMessage,
  extractSuggestedModels,
  generateFlashcards,
  stripJsonMarkdownFences,
} from './gemini';

describe('Gemini flashcards client & 404 fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses gemini-3.8-flash as the default primary model and parses markdown-fenced JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"cards":[{"question":"O que é Big-O?","answer":"Complexidade assintótica.","hint":"Notação"}]}\n```',
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const cards = await generateFlashcards('Algoritmos', 'Big-O', 1, { apiKey: 'test-key' });

    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.8-flash');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'models/gemini-3.8-flash:generateContent?key=test-key'
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]?.question).toBe('O que é Big-O?');
    expect(cards[0]?.answer).toBe('Complexidade assintótica.');
    expect(cards[0]?.hint).toBe('Notação');
  });

  it('automatically falls back on HTTP 404 using suggested replacement model or fallback queue', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            error: {
              code: 404,
              message:
                'This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features and improvements.',
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      cards: [{ question: 'Pergunta', answer: 'Resposta' }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const cards = await generateFlashcards('Banco de Dados', 'Índices', 1, {
      apiKey: 'test-key',
      model: 'models/gemini-2.0-flash',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('models/gemini-2.0-flash:generateContent');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('models/gemini-3.8-flash:generateContent');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.answer).toBe('Resposta');
  });

  it('tries custom model override first and falls through fallback chain on generic 404s', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { message: 'Model not found' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { message: 'Model not found' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ cards: [{ question: 'Q', answer: 'A' }] }) }],
              },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const cards = await generateFlashcards('SO', 'Processos', 1, {
      apiKey: 'test-key',
      model: 'gemini-custom-test',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('models/gemini-custom-test:generateContent');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('models/gemini-3.8-flash:generateContent');
    expect(fetchMock.mock.calls[2]?.[0]).toContain('models/gemini-flash-latest:generateContent');
    expect(cards).toHaveLength(1);
  });

  it('surfaces clean error.message and stops immediately on non-404 errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () =>
        JSON.stringify({
          error: {
            code: 429,
            message: 'Quota exceeded for quota metric.',
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      generateFlashcards('Redes', 'TCP/IP', 3, { apiKey: 'test-key' })
    ).rejects.toThrow('Gemini API retornou erro 429: Quota exceeded for quota metric.');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes model queues, error extraction, and markdown fence stripping', () => {
    expect(buildGeminiModelQueue('models/gemini-3.8-flash')).toEqual([
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
    ]);
    expect(
      extractSuggestedModels(
        'This model models/gemini-2.0-flash is gone. Use models/gemini-3.8-flash instead.'
      )
    ).toEqual(['gemini-2.0-flash', 'gemini-3.8-flash']);
    expect(extractGeminiErrorMessage('{"error":{"message":"Bad key"}}')).toBe('Bad key');
    expect(stripJsonMarkdownFences('```json\n{"cards":[]}\n```')).toBe('{"cards":[]}');
  });
});
