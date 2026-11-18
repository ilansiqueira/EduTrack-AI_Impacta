# Design

## Context

Veja `proposal.md` — **Why**.

Em `frontend/src/services/gemini.ts`, `GEMINI_MODEL` estava fixo como `'gemini-2.0-flash'`. Como a API Gemini encerrou esse identificador e passou a sugerir `models/gemini-3.8-flash`, todas as chamadas em `FlashcardsPage.tsx` passaram a falhar com HTTP `404` e a exibir JSON bruto truncado em `200` caracteres.

## Goals / Non-Goals

**Goals:**
- Atualizar o modelo padrão de geração de flashcards para `gemini-3.8-flash`.
- Permitir troca rápida via variável de ambiente `VITE_GEMINI_MODEL` sem novo build/edição de código quando deployado.
- Evitar indisponibilidade imediata caso um modelo seja aposentado futuramente, usando cadeia de fallback em HTTP `404`.
- Tornar mensagens de erro e parsing JSON da Gemini API mais resilientes (removendo eventuais blocos ```` ```json ... ``` ```` e extraindo `error.message`).

**Non-Goals:**
- Criar proxy backend para a Gemini API ou alterar fluxo/UI da `FlashcardsPage.tsx`.
- Alterar persistência local de decks (`flashcardStorage.ts`).

## Decisions

### 1. Seleção de Modelo e Cadeia de Fallback (`frontend/src/services/gemini.ts`)
- **Modelo padrão**: `'gemini-3.8-flash'`.
- **Override via ambiente**: ler `import.meta.env.VITE_GEMINI_MODEL` (quando não vazio); caso configurado, colocá-lo como primeira tentativa na fila de modelos.
- **Lista de fallback ordenada em HTTP 404**:
  - Construir lista deduplicada a partir de `[configuredModel, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash']` (filtrando vazios).
  - Se uma resposta HTTP `404` mencionar um modelo substituto no formato `models/([a-zA-Z0-9._-]+)` (regex), inseri-lo dinamicamente como próxima tentativa caso ainda não tenha sido testado.
  - Em erros não-`404` (ex.: `400` key inválida, `401`/`403`, `429` quota, falha de rede), **não** insistir em outros modelos — falhar imediatamente com erro legível.
- *Alternativa considerada*: apenas trocar a string `'gemini-2.0-flash'` por `'gemini-3.8-flash'`. Rejeitada como única mudança porque deixaria o app vulnerável à próxima rotação de versões do Gemini.

### 2. Extração de Erro Legível e Limpeza de JSON
- Ao receber `!response.ok`, tentar extrair `parsed?.error?.message` do corpo JSON para exibir mensagem clara ao usuário (sem JSON truncado).
- Antes do `JSON.parse(textContent)` dos flashcards retornados, remover cercas opcionais ```` ```json ```` / ```` ``` ```` com regex caso algum modelo alternativo retorne Markdown envolvendo o JSON.

### 3. Documentação de Ambiente (`frontend/.env.example`)
- Adicionar `# VITE_GEMINI_MODEL=gemini-3.8-flash` logo abaixo de `VITE_GEMINI_API_KEY`.

### 4. Testes Unitários (`frontend/src/services/gemini.test.ts`)
- Mockar `globalThis.fetch` para validar:
  1. Requisição padrão usando `gemini-3.8-flash:generateContent`.
  2. Retry automático em HTTP `404` para modelo de fallback (e detecção de sugestão `models/...` no payload de erro).
  3. Override via parâmetro/env de modelo customizado.
  4. Extração limpa de `error.message` e parsing de JSON mesmo quando envolvido em cercas markdown.

## Risks / Trade-offs

- **[Risk]** Latência adicional em caso de 404 do primeiro modelo → **Mitigation**: `gemini-3.8-flash` é o modelo principal recomendado pela própria API, então no caminho feliz ocorre apenas 1 requisição.
- **[Risk]** Limite de requisições (`429`) ou chave sem permissão (`403`) → **Mitigation**: fallback dispara exclusivamente em HTTP `404`, evitando amplificar erros de cota ou autenticação.
