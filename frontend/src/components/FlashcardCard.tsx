import React from 'react';

interface FlashcardCardProps {
  question: string;
  answer: string;
  hint?: string;
  flipped: boolean;
  onFlip: () => void;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  question,
  answer,
  hint,
  flipped,
  onFlip,
}) => {
  return (
    <div
      className="perspective-1000 mx-auto h-72 w-full max-w-lg cursor-pointer"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
      aria-label={flipped ? 'Clique para ver a pergunta' : 'Clique para ver a resposta'}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500`}
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front — Question */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pergunta
          </span>
          <p className="text-center text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
            {question}
          </p>
          {hint && (
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              💡 Dica: {hint}
            </p>
          )}
          <p className="mt-6 text-[11px] font-medium text-slate-300 dark:text-slate-600">
            Clique para virar
          </p>
        </div>

        {/* Back — Answer */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-brand-200 bg-brand-50/60 p-8 shadow-soft dark:border-brand-500/30 dark:bg-brand-950/40"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Resposta
          </span>
          <p className="text-center text-base leading-relaxed text-slate-800 dark:text-slate-100">
            {answer}
          </p>
          <p className="mt-6 text-[11px] font-medium text-slate-300 dark:text-slate-600">
            Clique para voltar
          </p>
        </div>
      </div>
    </div>
  );
};
