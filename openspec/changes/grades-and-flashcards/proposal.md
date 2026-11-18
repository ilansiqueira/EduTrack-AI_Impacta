# Feature: Notas por Tarefa + Quiz de Flashcards com IA

## Visão Geral

Duas novas features que transformam o EduTrack AI de um simples organizador de tarefas em uma **plataforma completa de desempenho acadêmico + estudo ativo**.

---

## Feature 1: Notas por Tarefa + Média por Disciplina

### Problema
Atualmente o progresso é binário (concluída/não concluída). O aluno não tem visão do **desempenho acadêmico real** — apenas sabe se entregou ou não.

### Solução
- Campo `grade` (nota de 0 a 10) opcional em cada tarefa concluída
- Campo `weight` (peso da atividade, default 1) para cálculo de média ponderada
- **Média ponderada automática** por disciplina: exibida nos cards de disciplina e no Dashboard
- Badge de desempenho por disciplina: 🟢 ≥ 7.0 | 🟡 5.0–6.9 | 🔴 < 5.0
- Novo KPI no Dashboard: **Média Geral** (média das médias ponderadas de todas as disciplinas)

### Fluxo do Usuário
1. Tarefa é concluída (via Kanban drag, botão ou dropdown)
2. Um mini-modal ou inline input aparece: "Qual foi sua nota? (opcional)"
3. Usuário digita a nota (0–10) e opcionalmente o peso
4. Card de disciplina mostra "Média: 8.2 · 3/5 tarefas avaliadas"
5. Dashboard KPI atualiza instantaneamente

### Armazenamento
**Abordagem client-side (sem alterar Xano):** Os campos `grade` e `weight` serão salvos dentro do campo `description` da task como JSON metadata no final, usando um separador (`---GRADES---`), OU se o Xano aceitar campos extras no PATCH, enviaremos `grade` e `weight` diretamente.

**Abordagem preferida:** Adicionar colunas `grade` (decimal nullable) e `weight` (decimal default 1) na tabela `academic_tasks` do Xano. Isso é simples — basta ir no Xano Database e adicionar as colunas.

---

## Feature 2: Quiz de Flashcards com IA (Gemini)

### Problema
O aluno só usa o EduTrack AI para **organizar** tarefas, mas não para **estudar**. Não há ferramenta de estudo ativo integrada.

### Solução
- Nova página **`/flashcards`** com seção na sidebar
- O aluno seleciona uma disciplina e o tema/assunto
- A **Gemini API** gera um deck de 5–10 flashcards (pergunta/resposta) baseado no tema
- Interface de quiz interativo: card flipa ao clicar, botões "Acertei" / "Errei"
- Resultado final com score e sugestão de revisão
- Flashcards podem ser **salvos em localStorage** para revisão futura (sem backend)

### Fluxo do Usuário
1. Sidebar → "Flashcards" (ícone 🃏)
2. Seleciona disciplina + digita o tópico: "Árvores Binárias", "Lei de Ohm"
3. Clica "Gerar Flashcards" → spinner → Gemini retorna JSON com cards
4. UI mostra card com pergunta. Clique/tap para flipar e ver resposta
5. Botões "✅ Acertei" / "❌ Errei" avançam para próximo card
6. Tela final: "Você acertou 7/10! 🎉" + botão para novo quiz ou revisão dos erros

### IA / Gemini
- **Sem backend proxy** — chamada direta à Gemini API via `VITE_GEMINI_API_KEY`
- Prompt estruturado que gera JSON: `{ cards: [{ question, answer, hint? }] }`
- Fallback: se a API falhar ou key não configurada, sugerir ao aluno criar cards manualmente
- Modelo: `gemini-2.0-flash` (rápido e barato)

### Dados Locais
- Decks gerados salvos em `localStorage` com key `edutrack_flashcard_decks`
- Histórico de scores por sessão
- Sem dependência do Xano para flashcards

---

## Escopo

### Incluso
- Novo tipo `grade` e `weight` no model `AcademicTask`
- Cálculo de média ponderada no `progress.ts`
- UI de nota inline no fluxo de conclusão de tarefa
- Badges de desempenho nos cards de disciplina + dashboard
- Nova rota `/flashcards` com página completa
- Integração Gemini API para geração de flashcards
- Persistência localStorage para decks
- Componente de card flip com animação CSS

### Excluído
- Alterações no backend Xano (apenas adição de colunas, feita pelo aluno no dashboard Xano)
- SRS (Spaced Repetition System) avançado — pode vir futuramente
- Multiplas tentativas com histórico de evolução por deck
