import React, { useCallback, useMemo, useState } from 'react';
import {
  Sparkles,
  Trash2,
  RotateCcw,
  ChevronRight,
  Trophy,
  Layers,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import type { FlashcardDeck, FlashcardSession } from '../types/models';
import { useAcademic } from '../context/AcademicContext';
import { generateFlashcards, isGeminiConfigured } from '../services/gemini';
import { addDeck, addSession, loadDecks, removeDeck } from '../services/flashcardStorage';
import { FlashcardCard } from '../components/FlashcardCard';
import { Badge, Button, Card, EmptyState, Input, Modal } from '../components/ui/Primitives';

type PageState = 'generator' | 'quiz' | 'result';

export const FlashcardsPage: React.FC = () => {
  const { subjects } = useAcademic();

  // Generator state
  const [subjectId, setSubjectId] = useState<string>(subjects[0] ? String(subjects[0].id) : '');
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState('8');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Deck management
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>(() => loadDecks());
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null);

  // Quiz state
  const [pageState, setPageState] = useState<PageState>('generator');
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Array<{ cardId: string; correct: boolean }>>([]);

  // Session result
  const [lastSession, setLastSession] = useState<FlashcardSession | null>(null);

  const geminiReady = useMemo(() => isGeminiConfigured(), []);

  const selectedSubjectName = useMemo(() => {
    const s = subjects.find((x) => String(x.id) === subjectId);
    return s?.name || '';
  }, [subjects, subjectId]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || !subjectId) return;
    setGenError(null);
    setGenerating(true);
    try {
      const cards = await generateFlashcards(
        selectedSubjectName,
        topic.trim(),
        Math.min(15, Math.max(3, Number(cardCount) || 8))
      );
      const deck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        subjectId: Number(subjectId),
        subjectName: selectedSubjectName,
        topic: topic.trim(),
        cards,
        createdAt: new Date().toISOString(),
      };
      setSavedDecks(addDeck(deck));
      startQuiz(deck);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar flashcards.');
    } finally {
      setGenerating(false);
    }
  }, [topic, subjectId, selectedSubjectName, cardCount]);

  const startQuiz = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentIndex(0);
    setFlipped(false);
    setResults([]);
    setPageState('quiz');
  };

  const recordAnswer = (correct: boolean) => {
    if (!activeDeck) return;
    const card = activeDeck.cards[currentIndex];
    const updated = [...results, { cardId: card.id, correct }];
    setResults(updated);
    setFlipped(false);

    if (currentIndex + 1 < activeDeck.cards.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      const session: FlashcardSession = {
        deckId: activeDeck.id,
        results: updated,
        score: updated.filter((r) => r.correct).length,
        total: updated.length,
        completedAt: new Date().toISOString(),
      };
      addSession(session);
      setLastSession(session);
      setPageState('result');
    }
  };

  const handleDeleteDeck = () => {
    if (!deletingDeck) return;
    setSavedDecks(removeDeck(deletingDeck.id));
    setDeletingDeck(null);
  };

  const goBack = () => {
    setPageState('generator');
    setActiveDeck(null);
    setLastSession(null);
  };

  const reviewErrors = () => {
    if (!activeDeck || !lastSession) return;
    const wrongIds = new Set(lastSession.results.filter((r) => !r.correct).map((r) => r.cardId));
    const errorCards = activeDeck.cards.filter((c) => wrongIds.has(c.id));
    if (errorCards.length === 0) return;
    const reviewDeck: FlashcardDeck = {
      ...activeDeck,
      id: `review-${Date.now()}`,
      cards: errorCards,
    };
    startQuiz(reviewDeck);
  };

  // ── QUIZ VIEW ─────────────────────────────────────────────
  if (pageState === 'quiz' && activeDeck) {
    const card = activeDeck.cards[currentIndex];
    const correctSoFar = results.filter((r) => r.correct).length;
    const wrongSoFar = results.length - correctSoFar;

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeDeck.subjectName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{activeDeck.topic}</p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-slate-500 dark:text-slate-400">
              Card {currentIndex + 1}/{activeDeck.cards.length}
            </span>
            <Badge tone="emerald">{correctSoFar} ✅</Badge>
            <Badge tone="rose">{wrongSoFar} ❌</Badge>
          </div>
        </div>

        <FlashcardCard
          question={card.question}
          answer={card.answer}
          hint={card.hint}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        <div className="flex items-center justify-center gap-4">
          {!flipped ? (
            <Button onClick={() => setFlipped(true)} variant="secondary" size="lg">
              🔄 Virar Card
            </Button>
          ) : (
            <>
              <Button
                onClick={() => recordAnswer(false)}
                variant="secondary"
                size="lg"
                className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400"
              >
                ❌ Errei
              </Button>
              <Button onClick={() => recordAnswer(true)} size="lg">
                ✅ Acertei
              </Button>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / activeDeck.cards.length) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  // ── RESULT VIEW ───────────────────────────────────────────
  if (pageState === 'result' && lastSession) {
    const pct = lastSession.total > 0 ? (lastSession.score / lastSession.total) * 100 : 0;
    const wrongCount = lastSession.total - lastSession.score;

    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15">
            <Trophy className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Finalizado!</h1>
        </div>

        <Card className="space-y-4">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {lastSession.score}
            <span className="text-lg font-medium text-slate-400"> / {lastSession.total}</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Você acertou {pct.toFixed(0)}% das perguntas
          </p>
          <div className="mx-auto h-2.5 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 70
                  ? 'bg-emerald-500'
                  : pct >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <Badge tone={pct >= 70 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'}>
            {pct >= 70 ? '🎉 Excelente!' : pct >= 50 ? '👍 Bom trabalho' : '📚 Continue estudando'}
          </Badge>
        </Card>

        <div className="flex flex-wrap justify-center gap-3">
          {wrongCount > 0 && (
            <Button variant="secondary" onClick={reviewErrors} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Revisar {wrongCount} erro(s)
            </Button>
          )}
          <Button onClick={() => { goBack(); }} leftIcon={<Sparkles className="h-4 w-4" />}>
            Novo Quiz
          </Button>
        </div>
      </div>
    );
  }

  // ── GENERATOR VIEW ────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Flashcards com IA
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gere quizzes inteligentes a partir de qualquer tópico e teste seus conhecimentos.
        </p>
      </div>

      {!geminiReady && (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Gemini API não configurada
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              Adicione <code className="rounded bg-amber-100 px-1 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">VITE_GEMINI_API_KEY</code> ao seu arquivo <code>.env.local</code> para gerar flashcards com IA.
              Enquanto isso, você pode usar os decks salvos abaixo.
            </p>
          </div>
        </Card>
      )}

      {/* Generator Card */}
      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Gerar Novo Deck
        </h2>

        {subjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Cadastre uma disciplina primeiro"
            description="Flashcards são gerados com base na disciplina. Adicione ao menos uma matéria."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Disciplina
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <Input
                label="Tópico / Assunto"
                placeholder="Ex: Árvores Binárias, Lei de Ohm..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Qtd. Cards"
                type="number"
                min={3}
                max={15}
                value={cardCount}
                onChange={(e) => setCardCount(e.target.value)}
              />
            </div>
          </div>
        )}

        {genError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {genError}
          </div>
        )}

        {subjects.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={!geminiReady || !topic.trim() || !subjectId}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Gerar Flashcards
            </Button>
          </div>
        )}
      </Card>

      {/* Saved Decks */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Layers className="h-5 w-5 text-slate-400" />
          Decks Salvos
          {savedDecks.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {savedDecks.length}
            </span>
          )}
        </h2>

        {savedDecks.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title="Nenhum deck salvo"
            description="Gere flashcards com IA acima e eles aparecerão aqui para revisão."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {savedDecks.map((deck) => (
              <Card
                key={deck.id}
                className="group flex cursor-pointer flex-col justify-between transition hover:-translate-y-0.5 hover:border-brand-300 dark:hover:border-brand-500/40"
              >
                <div onClick={() => startQuiz(deck)}>
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="brand">{deck.subjectName}</Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {deck.cards.length} cards
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {deck.topic}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Criado em {new Date(deck.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingDeck(deck);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                    title="Excluir deck"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startQuiz(deck)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Iniciar Quiz
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Deck Modal */}
      <Modal
        open={Boolean(deletingDeck)}
        onClose={() => setDeletingDeck(null)}
        title="Excluir Deck"
        description={`Remover "${deletingDeck?.topic || ''}"? O deck será excluído permanentemente.`}
      >
        <div className="flex justify-end gap-2.5 pt-3">
          <Button variant="secondary" onClick={() => setDeletingDeck(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteDeck}>
            Excluir Deck
          </Button>
        </div>
      </Modal>
    </div>
  );
};
