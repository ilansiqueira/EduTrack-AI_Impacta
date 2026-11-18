# Design

## Context

Veja `proposal.md` — **Why**.

A inspeção empírica dos arquivos XanoScript (`apis/academic_tasks/academic_tasks_GET.xs` e `apis/academic_tasks/academic_tasks_id_PATCH.xs`) e chamadas reais à API publicada (`https://x8ki-letl-twmt.n7.xano.io/api:8O4izkGb/academic_tasks`) confirmou dois pontos críticos de validação:

1. **`GET /academic_tasks`**: declara `int subject_id? filters=min:1` (opcional, porém **não nulável**, sem `int?`). Quando `subject_id` não é enviado na query string, o Xano assume `0` e falha antes da autenticação com `400 {"code":"ERROR_CODE_INPUT_ERROR","message":"Value is less than the minimum value of 1","payload":{"param":"subject_id"}}`. Quando `subject_id >= 1` é enviado (`?subject_id=1`), a validação de entrada passa normalmente.
2. **`PATCH /academic_tasks/{id}`**: também declara `int subject_id? filters=min:1` como não-nulável. Qualquer `PATCH` enviado sem `subject_id` (ex.: `{ "status": "completed" }` ou `{ "grade": 8.5, "weight": 1 }`) retorna o mesmo `400 Value is less than the minimum value of 1`.
3. **Ordem de tradução de erros em `api.ts`**: `apiRequest` traduzia `rawMessage` para português (`"Valor inválido: o campo requer um número maior que zero."`) antes de instanciar `ApiError`, fazendo `isNonCriticalValidationError` falhar porque inspecionava `error.message` buscando `"minimum value"` em inglês.
4. **Fluxo de conclusão e notas**: ao clicar em "Concluir" no Kanban, `TasksPage.tsx` disparava `void setTaskStatus(...)` sem `await` e abria o modal de nota mesmo se a requisição falhasse; ao clicar em "Pular" no `GradeInput.tsx`, chamava `onSubmit(null, 1)` disparando um `PATCH` desnecessário. Além disso, o schema publicado de `academic_tasks` pode ainda não incluir/retornar `grade` e `weight`.

## Goals / Non-Goals

**Goals:**
- Eliminar completamente o erro `"Valor inválido: o campo requer um número maior que zero."` ao carregar, filtrar, entregar/concluir ou avaliar tarefas acadêmicas, sem exigir alterações manuais imediatas no Xano publicado.
- Garantir que toda busca de tarefas utilize `?subject_id={id}` com `id >= 1` e que toda atualização (`PATCH`) inclua `subject_id >= 1`.
- Preservar `rawMessage` e `param` em `ApiError` para diagnóstico e tradução contextuais.
- Tornar o fluxo de conclusão + registro/pulo de nota determinístico e seguro (`await`, sem `PATCH` ao pular, validação inline `0..10` e peso `> 0`).
- Garantir persistência híbrida local (`localStorage`) de notas e pesos caso a resposta do Xano omita ou retorne `grade: null`.

**Non-Goals:**
- Modificar ou fazer push de schemas/endpoints Xano (`.xs`) ou código Python/Streamlit legado (`app.py`, `pages/`, `services/`).
- Alterar o comportamento de autenticação (`auth/login`, `auth/signup`, `auth/me`) ou flashcards.

## Decisions

### 1. API Client (`frontend/src/services/api.ts`)
- **`ApiError` estendido**: adicionar `rawMessage: string` e `param?: string` extraído de `parsed.payload?.param` do Xano.
- **Tradução e detecção**: atualizar `translateXanoError(rawMessage, param)` preservando contexto do parâmetro quando disponível, e atualizar `isNonCriticalValidationError(error)` para verificar `error.rawMessage` além de `error.message`.
- **Busca por disciplina ativa (`fetchAllAcademicTasksForSubjectsApi`)**:
  - Receber `(token: string, subjectIds: number[]): Promise<AcademicTask[]>`.
  - Filtrar inteiros positivos únicos `>= 1`; se vazio, retornar `[]` sem chamadas de rede.
  - Executar `Promise.all(validIds.map((id) => fetchAcademicTasksApi(token, id)))`, achatar resultados, deduplicar por `task.id` e ordenar por `due_date` ascendente (nulos por último).
  - *Alternativa considerada*: corrigir apenas o backend Xano (`int? subject_id?`); descartada como dependência única porque o usuário está testando contra o backend já publicado e não devemos alterar/pushar XanoScript.
- **Atualização segura (`updateAcademicTaskApi`)**:
  - Incluir obrigatoriamente `payload.subject_id = Number(fields.subject_id)` (`>= 1`).
  - Omitir `grade`/`weight` quando `null` ou não informados para não acionar filtros não-nuláveis em endpoints Xano.

### 2. Persistência Híbrida Local de Notas (`frontend/src/services/taskGradesStorage.ts`)
- Novo módulo persistindo `Record<string, { grade: number; weight: number }>` em `localStorage` na chave `edutrack_task_grades`:
  - `loadTaskGrades()`, `saveTaskGrade(taskId, grade, weight)`, `removeTaskGrade(taskId)` e `mergeTaskWithStoredGrade(task)`.
  - Se o Xano retornar `task.grade` numérico não-nulo, sincronizar/preferir o valor do servidor; se o Xano omitir `grade` ou retornar `null` enquanto existir nota salva localmente, hidratar `{ grade, weight }` a partir do `localStorage` (exceto quando explicitamente removida pelo usuário no modal de edição ou exclusão da tarefa).
  - *Rationale*: evita perda visual de notas recém-lançadas caso o aluno ainda não tenha adicionado as colunas/mapeamentos `grade` e `weight` nos endpoints Xano.

### 3. Contexto Acadêmico (`frontend/src/context/AcademicContext.tsx`)
- **`refreshAll`**: buscar `loadedSubjects` via `fetchSubjectsApi(token)`, em seguida chamar `fetchAllAcademicTasksForSubjectsApi(token, loadedSubjects.map((s) => s.id))` e hidratar cada tarefa com `mergeTaskWithStoredGrade`.
- **Mutações (`addTask`, `editTask`, `setTaskStatus`, `gradeTask`, `removeTask`)**:
  - Em `editTask`, `setTaskStatus` e `gradeTask`, localizar `existingTask = tasks.find((t) => t.id === id)` e passar sempre `subject_id: fields.subject_id ?? existingTask.subject_id` para `updateAcademicTaskApi`.
  - Sincronizar `taskGradesStorage` via `saveTaskGrade` (quando houver nota definida) ou `removeTaskGrade` (quando a nota for explicitamente limpa na edição ou na exclusão em `removeTask`).

### 4. Fluxo de Conclusão e Modal de Nota (`frontend/src/components/GradeInput.tsx` & `frontend/src/pages/TasksPage.tsx`)
- **`GradeInput.tsx`**:
  - Adicionar prop opcional `onSkip?: () => void`.
  - Exibir validação inline quando a nota estiver fora do intervalo `0..10` ou peso `<= 0`.
  - Ao clicar em "Pular", chamar `onSkip?.()` (ou fechar sem disparar requisição `PATCH`).
- **`TasksPage.tsx`**:
  - Criar `handleCompleteTask(task: AcademicTask)` que faz `await setTaskStatus(task.id, 'completed')` **antes** de chamar `setGradingTaskId(task.id)`.
  - Reutilizar `handleCompleteTask` no drag-and-drop do Kanban, no botão "Concluir" do Kanban, no botão circular da Lista e no `<select>` de status da Lista.
  - Ao pular no modal (`onSkip` ou `g === null`), fechar o modal sem chamar `gradeTask`.

### 5. Testes Unitários (`frontend/src/services/api.test.ts`)
- Cobrir `fetchAllAcademicTasksForSubjectsApi` (array vazio retorna `[]` com 0 `fetch`; múltiplos IDs geram chamadas `?subject_id=1`, `?subject_id=2` e deduplicam resultados).
- Cobrir `updateAcademicTaskApi` verificando que `subject_id` sempre é serializado no payload `PATCH`.
- Cobrir `ApiError.rawMessage` e `isNonCriticalValidationError` mesmo após tradução para português.

## Risks / Trade-offs

- **[Risk]** Múltiplas chamadas paralelas (`GET /academic_tasks?subject_id={id}`) quando o aluno tem muitas disciplinas → **Mitigation**: lista de disciplinas por aluno tipicamente tem de 1 a 10 matérias e `Promise.all` executa em paralelo com deduplicação por `task.id`.
- **[Risk]** Divergência entre notas locais (`localStorage`) e outro navegador caso o Xano ainda não persista `grade`/`weight` → **Mitigation**: comportamento híbrido sincroniza automaticamente com `task.grade` assim que as colunas/inputs existirem no Xano, mantendo experiência fluida no dispositivo atual até lá.
- **[Risk]** Tarefa editada sem `existingTask` em memória → **Mitigation**: validar existência de `subject_id >= 1` antes de enviar `PATCH` e exibir erro amigável se ausente.
