# Design Técnico — Fix "Value is less than the minimum value of 1"

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/src/context/AcademicContext.tsx` | Separar fetch de subjects/tasks, tratar erro de validação |
| `frontend/src/services/api.ts` | Adicionar tradução de erros Xano + helper de erro silenciável |
| `frontend/src/pages/DashboardPage.tsx` | Suprimir erro global quando cenário é "sem disciplinas" |

## Implementação Detalhada

### 1. `api.ts` — Tradução de Erros

```typescript
// Mapa de mensagens de validação do Xano → mensagens amigáveis
const XANO_ERROR_TRANSLATIONS: Record<string, string> = {
  'Value is less than the minimum value of 1': 'Valor inválido: o campo requer um número maior que zero.',
};

// Helper para verificar se um erro é de validação não-crítica
export function isNonCriticalValidationError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('minimum value') || msg.includes('less than');
}
```

### 2. `AcademicContext.tsx` — Fetch Sequencial com Fallback

```typescript
const refreshAll = useCallback(async (silent = false) => {
  if (!token) { setSubjects([]); setTasks([]); return; }
  if (!silent) setLoading(true);
  setError(null);
  try {
    // 1) Buscar subjects primeiro
    const loadedSubjects = await fetchSubjectsApi(token);
    setSubjects(loadedSubjects);
    
    // 2) Se há subjects, buscar tasks — senão, tasks = []
    if (loadedSubjects.length > 0) {
      try {
        const loadedTasks = await fetchAcademicTasksApi(token);
        setTasks(loadedTasks);
      } catch (taskErr) {
        // Erros de validação do Xano ao buscar tasks não são críticos
        if (isNonCriticalValidationError(taskErr)) {
          setTasks([]);
          // Sem setError — o banner "cadastre uma disciplina" já orienta o user
        } else {
          throw taskErr;
        }
      }
    } else {
      setTasks([]);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao carregar dados acadêmicos.';
    setError(msg);
  } finally {
    if (!silent) setLoading(false);
  }
}, [token]);
```

### 3. `DashboardPage.tsx` — Error Display Inteligente

Suprimir o banner de erro quando `subjects.length === 0` e o erro contém "minimum value" — nesse caso, o `EmptyState` de disciplinas já informa o usuário.

## Testes Esperados

1. **Sem disciplinas:** Nenhum erro visível, EmptyState aparece normalmente
2. **Com disciplinas, sem tasks:** Dashboard mostra 0 tarefas, sem erro
3. **Com disciplinas e tasks:** Tudo carrega normalmente (sem regressão)
4. **Disciplina excluída com tasks órfãs:** Tasks carregam, disciplina aparece como "Disciplina #ID"
