# Proposal

## Why

O serviço [gemini.ts](file:///C:/Users/winter/.gemini/antigravity/scratch/EduTrack-AI_Impacta/frontend/src/services/gemini.ts#L3) fixa o modelo `gemini-2.0-flash`, que foi descontinuado na API Google Generative Language e passou a retornar HTTP `404` (`"This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features and improvements."`). Atualizar o modelo padrão para `gemini-3.8-flash` com suporte a override de ambiente e fallback automático em `404` restaura imediatamente a geração de flashcards por IA e protege contra futuras descontinuações de modelos.

## What Changes

- Atualizar o modelo padrão em `frontend/src/services/gemini.ts` de `gemini-2.0-flash` para `gemini-3.8-flash`.
- Suportar override opcional via variável de ambiente `VITE_GEMINI_MODEL` (documentada como comentário em `frontend/.env.example`) e cadeia automática de fallback em erro `404` (`['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash']`, além de extração dinâmica caso o erro 404 sugira `models/<id>`).
- Melhorar a formatação de mensagens de erro da Gemini API (extraindo `error.message` de forma limpa do JSON) e remover eventuais cercas markdown antes de fazer `JSON.parse` dos flashcards.
- Adicionar testes unitários em `frontend/src/services/gemini.test.ts`.

## Capabilities

### New Capabilities
- `ai-flashcards`: Client-side AI flashcard generation via Google Gemini API using supported Flash models with configurable model override and automatic 404 model fallback.

### Modified Capabilities

## Impact

- **AI Service (`frontend/src/services/gemini.ts`)**: atualização do modelo padrão, fallback automático em HTTP `404`, parser resiliente de resposta e extração de erro.
- **Unit Tests (`frontend/src/services/gemini.test.ts`)**: novo arquivo de testes unitários cobrindo seleção de modelo, fallback em `404`, override e tratamento de erro.
- **Environment Docs (`frontend/.env.example`)**: documentação comentada da variável opcional `VITE_GEMINI_MODEL`.
