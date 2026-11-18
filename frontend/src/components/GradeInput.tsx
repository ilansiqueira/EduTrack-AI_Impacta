import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/Primitives';

interface GradeInputProps {
  /** Called when user submits a grade. `null` means "skip / no grade". */
  onSubmit: (grade: number | null, weight: number) => void;
  initialGrade?: number | null;
  initialWeight?: number | null;
  compact?: boolean;
}

export const GradeInput: React.FC<GradeInputProps> = ({
  onSubmit,
  initialGrade,
  initialWeight,
  compact = false,
}) => {
  const [grade, setGrade] = useState(
    initialGrade !== null && initialGrade !== undefined ? String(initialGrade) : ''
  );
  const [weight, setWeight] = useState(
    initialWeight !== null && initialWeight !== undefined ? String(initialWeight) : '1'
  );

  const handleSubmit = () => {
    if (!grade.trim()) {
      onSubmit(null, Number(weight) || 1);
      return;
    }
    const parsed = Number(grade);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) return;
    onSubmit(parsed, Number(weight) || 1);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Nota"
            className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <span className="text-[11px] text-slate-400">/10</span>
        <span className="text-[11px] text-slate-400">Peso:</span>
        <input
          type="number"
          min={0.1}
          max={10}
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          Qual foi sua nota?
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="0.0"
            autoFocus
            className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">/ 10</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Peso:</span>
          <input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-16 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSubmit}>
            Salvar Nota
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSubmit(null, 1)}>
            Pular
          </Button>
        </div>
      </div>
    </div>
  );
};
