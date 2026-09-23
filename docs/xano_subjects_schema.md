# Especificação do Schema e Endpoints Xano: Disciplinas (`subjects`)

Este documento especifica o contrato de dados e os endpoints REST da tabela `subjects` no backend Xano para o projeto **EduTrack AI**.

---

## 1. Schema da Tabela `subjects`

| Campo | Tipo Xano | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | integer (PK) | Sim | Identificador único autoincrementado |
| `created_at` | timestamp | Sim | Data e hora de criação do registro |
| `name` | text | Sim | Nome da disciplina (ex: "Innovation Lab") |
| `professor` | text | Não | Nome do(a) docente responsável |
| `semester` | text | Não | Semestre/Período letivo (ex: "2026/1") |
| `status` | text / enum | Sim | Status da disciplina: `"Ativa"`, `"Concluída"`, `"Trancada"` |
| `user_id` | integer (FK) | Opcional | Chave estrangeira referenciando a tabela `user.id` |

### Índices Recomendados
- Índice no campo `name` para busca rápida.
- Índice no campo `user_id` para filtrar disciplinas por estudante autenticado.

---

## 2. Contrato de API REST

### `GET /subjects`
- **Descrição**: Retorna a lista de disciplinas cadastradas.
- **Autenticação**: Opcional ou Bearer Token (`user_id`).
- **Resposta Sucesso (200 OK)**:
```json
[
  {
    "id": 1,
    "created_at": 1771153200000,
    "name": "Innovation Lab",
    "professor": "Prof. Impacta",
    "semester": "2026/1",
    "status": "Ativa"
  }
]
```

### `POST /subjects`
- **Descrição**: Cadastra uma nova disciplina.
- **Corpo da Requisição (JSON)**:
```json
{
  "name": "Inteligência Artificial Aplicada",
  "professor": "Dra. Santos",
  "semester": "2026/1",
  "status": "Ativa"
}
```
- **Resposta Sucesso (201 Created / 200 OK)**: Retorna o objeto criado com `id` gerado.

---

## 3. Próximos Passos de Integração no Xano
Para sincronizar este schema com o workspace Xano:
1. Utilizar o agente especializado **Xano Table Designer** para gerar/atualizar o arquivo `.xs` em `tables/`.
2. Utilizar o agente **Xano API Query Writer** para gerar os endpoints em `apis/subjects/`.
3. Executar o push de alterações para o Xano.

