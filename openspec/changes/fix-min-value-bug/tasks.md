# Tasks — Fix "Value is less than the minimum value of 1"

## Tarefas

- [x] 1. `api.ts` — Adicionar helper `isNonCriticalValidationError()`, `translateXanoError()` e mapa de tradução de erros Xano
- [x] 2. `AcademicContext.tsx` — Refatorar `refreshAll()` para fetch sequencial (subjects → tasks) com fallback gracioso
- [x] 3. `DashboardPage.tsx` — Suprimir banner de erro global quando o cenário é "sem disciplinas cadastradas"
- [x] 4. Testar cenários: `tsc -b` ✅ | `npm test` 10/10 ✅ | `npm run build` ✅
