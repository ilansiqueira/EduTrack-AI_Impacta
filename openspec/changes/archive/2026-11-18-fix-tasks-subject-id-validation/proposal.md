# Proposal

## Why

Ao testar a tela de Tarefas Acadêmicas e entregar/concluir atividades, os usuários recebem o erro `"Valor inválido: o campo requer um número maior que zero."` (tradução do HTTP `400` `"Value is less than the minimum value of 1"` do Xano para o parâmetro `subject_id`). Isso ocorre porque os endpoints publicados no Xano `GET /academic_tasks` (`apis/academic_tasks/academic_tasks_GET.xs`) e `PATCH /academic_tasks/{id}` (`apis/academic_tasks/academic_tasks_id_PATCH.xs`) declaram `int subject_id? filters=min:1` como não-nulável: sempre que `subject_id` é omitido, o Xano assume `0` antes mesmo da execução da stack/autenticação e rejeita a requisição — quebrando a listagem de tarefas quando há disciplinas ativas, a entrega/conclusão de atividades (`setTaskStatus`) e o lançamento de notas (`gradeTask`).

## What Changes

- **Consultas de tarefas sempre escopadas por `subject_id >= 1`**: substituir a chamada sem filtro `GET /academic_tasks` por buscas por disciplina ativa (`GET /academic_tasks?subject_id={id}`) combinadas e ordenadas no frontend, eliminando o HTTP `400` tanto com zero disciplinas quanto com uma ou mais disciplinas cadastradas.
- **Envio obrigatório de `subject_id >= 1` no `PATCH /academic_tasks/{id}`**: garantir que todas as atualizações parciais de tarefa (`setTaskStatus`, `editTask`, `gradeTask`) incluam o `subject_id` válido da tarefa e omitam valores `null` incompatíveis com filtros não-nuláveis do Xano.
- **Preservação do erro bruto e contexto de parâmetro no cliente HTTP**: armazenar `rawMessage` e `param` em `ApiError` para que diagnósticos de erro traduzido e `isNonCriticalValidationError` funcionem corretamente após a tradução para português.
- **Correção do fluxo de conclusão de atividade e modal de nota**: aguardar a conclusão real de `setTaskStatus` antes de abrir o modal de nota, evitar `PATCH` desnecessário ao clicar em "Pular" e validar intervalo de nota (`0–10`) e peso (`> 0`).
- **Persistência híbrida local de notas e pesos (`localStorage`)**: armazenar notas e pesos localmente em `edutrack_task_grades` como fallback/hidratação caso o backend Xano ainda não retorne ou persista as colunas `grade` e `weight`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `web-academic-workspace`: Ensure all task list queries and task status/grade updates pass a valid positive `subject_id` to satisfy Xano input filters, fix the task completion + grade modal workflow, and provide hybrid local grade persistence.

## Impact

- **Frontend Services (`frontend/src/services/`)**: `api.ts` (nova função `fetchAllAcademicTasksForSubjectsApi`, ajuste em `updateAcademicTaskApi`, `ApiError.rawMessage`/`param` e `isNonCriticalValidationError`), novo módulo `taskGradesStorage.ts` e novos testes em `api.test.ts`.
- **State Management (`frontend/src/context/`)**: `AcademicContext.tsx` (`refreshAll`, `setTaskStatus`, `editTask`, `gradeTask`, `removeTask` e `addTask`).
- **UI Components & Pages (`frontend/src/components/`, `frontend/src/pages/`)**: `GradeInput.tsx` e `TasksPage.tsx`.
- **Backend Xano**: Nenhuma mudança obrigatória ou breaking change no backend Xano publicado; o frontend adapta-se estritamente ao contrato `filters=min:1` já existente.
