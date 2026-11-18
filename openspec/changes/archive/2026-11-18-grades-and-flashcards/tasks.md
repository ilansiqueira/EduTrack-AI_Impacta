# Tasks — Notas por Tarefa + Quiz Flashcards IA

## Feature 1: Notas por Tarefa

- [x] 1. `models.ts` — Adicionar `grade`, `weight` em `AcademicTask` + tipos `GradeMetrics`
- [x] 2. `progress.ts` — Implementar `computeGradeMetrics()` e `getGradeBadgeTone()`
- [x] 3. `api.ts` — Incluir `grade`/`weight` nos payloads de create/update task
- [x] 4. `GradeInput.tsx` — Componente inline compacto de nota (0–10) + peso
- [x] 5. `AcademicContext.tsx` — Helper `gradeTask()` que faz PATCH com nota
- [x] 6. `TasksPage.tsx` — Integrar GradeInput no fluxo de conclusão + modal de edição
- [x] 7. `SubjectsPage.tsx` — Badge de média ponderada nos cards de disciplina
- [x] 8. `DashboardPage.tsx` — Novo KPI "Média Geral" + badges de desempenho por disciplina

## Feature 2: Quiz de Flashcards com IA

- [x] 9. `models.ts` — Tipos `Flashcard`, `FlashcardDeck`, `FlashcardSession`
- [x] 10. `services/gemini.ts` — Cliente Gemini API (generateFlashcards)
- [x] 11. `services/flashcardStorage.ts` — CRUD localStorage para decks e sessões
- [x] 12. `FlashcardCard.tsx` — Componente flip card com animação CSS 3D
- [x] 13. `FlashcardsPage.tsx` — Página completa (gerador + quiz + resultado + decks salvos)
- [x] 14. `App.tsx` — Rota `/flashcards`
- [x] 15. `AppShell.tsx` — Item "Flashcards" na sidebar com ícone ✨
- [x] 16. `.env.example` — Variável `VITE_GEMINI_API_KEY`
- [x] 17. Testes: `progress.test.ts` (grade metrics, 3 novos) + `tsc -b` ✅ + `npm test` 13/13 ✅ + `npm run build` ✅
