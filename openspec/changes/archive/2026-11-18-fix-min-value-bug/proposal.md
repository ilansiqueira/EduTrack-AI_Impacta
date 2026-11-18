# Fix: Erro "Value is less than the minimum value of 1" + Sugestões de Novas Features

## Problema Identificado

### Bug: "Value is less than the minimum value of 1"

**Causa Raiz:** A API Xano retorna este erro quando o frontend tenta buscar/manipular tarefas acadêmicas e não existe nenhuma disciplina ativa (ou o `subject_id` não é válido). A API do Xano valida que `subject_id >= 1`, e quando o contexto acadêmico carrega simultaneamente subjects e tasks via `Promise.all()`, se a lista de subjects estiver vazia, qualquer operação subsequente que referencie `subject_id` dispara esse erro de validação do backend.

**Fluxo do Bug:**
1. Usuário loga → `AcademicContext.refreshAll()` chama `fetchSubjectsApi()` + `fetchAcademicTasksApi()` em paralelo
2. Se existem tasks com `subject_id` inválido (disciplina excluída), ou se a API de tasks faz validação interna sobre subjects existentes, o Xano retorna: `"Value is less than the minimum value of 1"`
3. O erro é capturado pelo `apiRequest()` e exibido como toast ou `error` state no Dashboard
4. O usuário vê a mensagem de erro genérica sem contexto útil

### Correções Necessárias

#### 1. Tratamento defensivo no `AcademicContext`
- Capturar erros específicos do Xano na chamada de tasks e degradar graciosamente (mostrar tasks = [] ao invés de error)
- Separar as chamadas: buscar subjects primeiro, e só buscar tasks se houver subjects

#### 2. Tratamento no `api.ts` 
- Detectar mensagens de erro de validação do Xano e traduzir para mensagens amigáveis em português
- Silenciar erros de validação não-críticos (como "minimum value") quando o estado é esperado (sem disciplinas)

#### 3. Guard no frontend
- Já existe um "Zero Subjects Guard Banner" no TasksPage. Garantir que o error state global não sobrescreva a UI informativa quando o cenário é "sem disciplinas"

---

## Sugestões de Novas Implementações

### 🔥 Prioridade Alta (Alto Impacto, Baixo Esforço)

#### 1. Notificações de Prazo (Deadline Alerts)
- Badge/banner no Dashboard mostrando tarefas vencendo nos próximos 3 dias
- Destaque visual diferenciado para tarefas "urgentes" vs "atrasadas"
- Contagem regressiva visual ("Faltam 2 dias")

#### 2. Notas e Avaliações por Tarefa
- Campo `grade` (nota) opcional em cada tarefa concluída
- Média ponderada por disciplina no card de disciplina
- Barra de progresso complementar mostrando desempenho acadêmico (não só conclusão)

#### 3. Onboarding / Wizard de Primeiro Uso
- Tour guiado para novos usuários: "Crie sua primeira disciplina → Adicione uma tarefa → Arraste no Kanban"
- Melhora retenção e reduz confusão como o bug atual

### 🟡 Prioridade Média (Bom Impacto, Esforço Moderado)

#### 4. Filtro por Semestre / Período
- Agrupar disciplinas por semestre (2026.1, 2026.2)
- Histórico de semestres anteriores
- Arquivar disciplinas finalizadas

#### 5. Calendário Visual de Entregas
- View de calendário mensal com dots coloridos por disciplina
- Clique no dia para ver tarefas do prazo
- Integração visual com o sistema de badges de status

#### 6. Dashboard Analytics Avançado
- Gráfico de progresso semanal (quantas tarefas concluídas por semana)
- Heatmap de produtividade (dias da semana com mais entregas)
- Comparação entre disciplinas (qual tem mais tarefas pendentes/atrasadas)

### 🟢 Prioridade Baixa (Nice-to-have)

#### 7. Modo Pomodoro Integrado
- Timer Pomodoro vinculado a uma tarefa específica
- Registro de horas estudadas por disciplina

#### 8. Compartilhamento / Exportação
- Compartilhar link do relatório de progresso (read-only)
- Exportação para Google Calendar / iCal

#### 9. IA para Recomendações
- Sugestões automáticas de prioridade baseadas em prazo + carga de trabalho
- Detecção de "sobrecarga" (muitas entregas na mesma semana)
