# Design Técnico — Notas por Tarefa + Quiz Flashcards IA

## Arquitetura

```
src/
├── types/models.ts            ← + grade, weight em AcademicTask; + Flashcard types
├── utils/progress.ts          ← + computeGradeMetrics()
├── services/api.ts            ← + grade/weight no payload de task
├── services/gemini.ts         ← NEW: cliente Gemini API para gerar flashcards
├── context/AcademicContext.tsx ← + gradeTask() helper
├── pages/
│   ├── TasksPage.tsx          ← + GradeInput inline no fluxo de conclusão
│   ├── SubjectsPage.tsx       ← + Badge de média por disciplina
│   ├── DashboardPage.tsx      ← + KPI "Média Geral" + badges desempenho
│   └── FlashcardsPage.tsx     ← NEW: página completa de flashcards
├── components/
│   ├── GradeInput.tsx         ← NEW: mini inline de nota (0–10) + peso
│   └── FlashcardCard.tsx      ← NEW: card com flip animation
└── App.tsx                    ← + rota /flashcards
    AppShell.tsx               ← + item "Flashcards" na sidebar
```

---

## Feature 1: Notas — Design Detalhado

### 1.1 Tipos (`models.ts`)

```typescript
export interface AcademicTask {
  // ... campos existentes
  grade?: number | null;      // 0.0 – 10.0, null = não avaliada
  weight?: number | null;     // peso da atividade, default 1.0
}

export interface GradeMetrics {
  gradedTasks: number;        // quantas tarefas têm nota
  weightedAverage: number;    // média ponderada (0–10)
  totalWeight: number;        // soma dos pesos
}
```

### 1.2 Cálculo (`progress.ts`)

```typescript
export function computeGradeMetrics(tasks: AcademicTask[]): GradeMetrics {
  const graded = tasks.filter(t => 
    normalizeTaskStatus(t.status) === 'completed' && 
    t.grade !== null && t.grade !== undefined
  );
  
  if (graded.length === 0) {
    return { gradedTasks: 0, weightedAverage: 0, totalWeight: 0 };
  }
  
  let sumWeightedGrades = 0;
  let sumWeights = 0;
  for (const t of graded) {
    const w = t.weight ?? 1;
    sumWeightedGrades += (t.grade ?? 0) * w;
    sumWeights += w;
  }
  
  return {
    gradedTasks: graded.length,
    weightedAverage: sumWeights > 0 ? sumWeightedGrades / sumWeights : 0,
    totalWeight: sumWeights,
  };
}

export function getGradeBadgeTone(avg: number): 'emerald' | 'amber' | 'rose' {
  if (avg >= 7) return 'emerald';
  if (avg >= 5) return 'amber';
  return 'rose';
}
```

### 1.3 API (`api.ts`)

Adicionar `grade` e `weight` nos payloads de create/update de task:

```typescript
export interface AcademicTaskInput {
  // ... existentes
  grade?: number | null;
  weight?: number | null;
}
```

No `createAcademicTaskApi` e `updateAcademicTaskApi`, incluir os campos no payload se definidos.

### 1.4 Componente `GradeInput.tsx`

Componente inline compacto que aparece:
- Automaticamente quando o usuário conclui uma tarefa (via setTaskStatus → 'completed')
- Como campo no modal de edição de tarefa

```
┌────────────────────────────────────────┐
│  📊 Qual foi sua nota?                 │
│  [  8.5  ] / 10    Peso: [ 1.0 ]      │
│  [Pular]  [Salvar Nota]               │
└────────────────────────────────────────┘
```

### 1.5 UI de Disciplinas e Dashboard

**SubjectsPage.tsx — Card de disciplina:**
```
Engenharia de Software
Prof. Dr. Silva • 80h
━━━━━━━━━━━━━━━━━━━━━━━━━
3 de 5 tarefas concluídas · 60%
Média: 8.2  🟢  (3 avaliadas)
```

**DashboardPage.tsx — Novo KPI card:**
```
┌──────────────────┐
│ Média Geral   📊 │
│    7.8           │
│ ████████░░ 🟢    │
│ 12 tarefas aval. │
└──────────────────┘
```

---

## Feature 2: Flashcards IA — Design Detalhado

### 2.1 Tipos (`models.ts`)

```typescript
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface FlashcardDeck {
  id: string;
  subjectId: number;
  subjectName: string;
  topic: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface FlashcardSession {
  deckId: string;
  results: Array<{ cardId: string; correct: boolean }>;
  score: number;
  total: number;
  completedAt: string;
}
```

### 2.2 Serviço Gemini (`services/gemini.ts`)

```typescript
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateFlashcards(
  subject: string,
  topic: string,
  count: number = 8
): Promise<Flashcard[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chave da Gemini API não configurada.');

  const prompt = `Você é um professor universitário de "${subject}".
Gere exatamente ${count} flashcards sobre o tópico "${topic}".
Cada flashcard deve ter uma pergunta clara e objetiva, e uma resposta concisa.
Opcionalmente inclua uma dica (hint) curta.

Responda APENAS com JSON válido neste formato:
{
  "cards": [
    { "question": "...", "answer": "...", "hint": "..." }
  ]
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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

  // Parse response → extract cards JSON → return Flashcard[]
}
```

### 2.3 Persistência localStorage

```typescript
const STORAGE_KEY = 'edutrack_flashcard_decks';
const SESSION_KEY = 'edutrack_flashcard_sessions';

export function saveDecks(decks: FlashcardDeck[]): void { ... }
export function loadDecks(): FlashcardDeck[] { ... }
export function saveSessions(sessions: FlashcardSession[]): void { ... }
export function loadSessions(): FlashcardSession[] { ... }
```

### 2.4 Página `FlashcardsPage.tsx`

**3 estados da página:**

**Estado 1 — Gerador:**
```
┌──────────────────────────────────────────────┐
│  🃏 Flashcards com IA                        │
│                                              │
│  Disciplina: [Eng. de Software ▼]            │
│  Tópico:     [Padrões de Projeto      ]      │
│  Qtd. Cards: [8]                             │
│                                              │
│  [✨ Gerar Flashcards]                       │
│                                              │
│  ── Decks Salvos ─────────────────────       │
│  📦 Árvores Binárias (EDD) · 10 cards       │
│  📦 Lei de Ohm (Física) · 6 cards            │
└──────────────────────────────────────────────┘
```

**Estado 2 — Quiz ativo (flip card):**
```
┌──────────────────────────────────────────────┐
│  Eng. Software · Padrões de Projeto          │
│  Card 3/8                 Score: 2 ✅ 0 ❌    │
│                                              │
│  ┌────────────────────────────────────┐      │
│  │                                    │      │
│  │   O que é o padrão Observer?       │      │
│  │                                    │      │
│  │        💡 Dica: Pub/Sub            │      │
│  │                                    │      │
│  │      [ 🔄 Virar Card ]            │      │
│  └────────────────────────────────────┘      │
│                                              │
│       [❌ Errei]      [✅ Acertei]           │
└──────────────────────────────────────────────┘
```

**Estado 3 — Resultado:**
```
┌──────────────────────────────────────────────┐
│          🎉 Quiz Finalizado!                 │
│                                              │
│          Acertos: 7 / 10 (70%)               │
│          ████████░░░                         │
│                                              │
│  [🔄 Revisar Erros]  [✨ Novo Quiz]         │
│  [💾 Salvar Deck]    [🏠 Voltar]            │
└──────────────────────────────────────────────┘
```

### 2.5 Componente `FlashcardCard.tsx`

Card com **CSS 3D flip animation** (`transform: rotateY(180deg)` + `perspective`):
- Frente: pergunta + hint (se houver)
- Verso: resposta completa
- Clique ou botão "Virar" para flip
- Animação suave 0.6s ease-in-out

### 2.6 Configuração de Ambiente

Adicionar no `.env.example` e `.env.local`:
```
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

---

## Dependências Novas

Nenhuma. A Gemini API é chamada via `fetch()` nativo. Flashcards usam CSS puro para animação.
