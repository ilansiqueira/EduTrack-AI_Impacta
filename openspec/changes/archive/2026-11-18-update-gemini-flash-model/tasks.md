# Tasks

## 1. Atualização do Modelo Gemini e Fallback Resiliente

- [x] 1.1 `frontend/src/services/gemini.ts` e `frontend/.env.example` — Atualizar modelo padrão de `gemini-2.0-flash` para `gemini-3.8-flash`, suportar override opcional via `VITE_GEMINI_MODEL`, implementar fallback automático em caso de HTTP `404` (`['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash']` + sugestão dinâmica `models/<id>`) e melhorar extração de erro/JSON; verificar tipos com `npx tsc -b --noEmit`.
- [x] 1.2 `frontend/src/services/gemini.test.ts` — Criar testes unitários cobrindo chamada ao `gemini-3.8-flash`, fallback automático em erro `404`, override de modelo e tratamento de erro legível/JSON; validar com `npm test` e `npm run build` em `frontend/`.
