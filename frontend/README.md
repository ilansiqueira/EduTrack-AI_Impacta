# EduTrack AI — Web Frontend (React + Vite + Tailwind CSS)

Interface web moderna do **EduTrack AI**, construída com **React**, **TypeScript**, **Vite**, **Tailwind CSS** e tipografia principal **Google Sans**, integrada diretamente aos endpoints REST do **Xano**.

## Funcionalidades

- **Autenticação & Sessão Persistente (`/login`, `/cadastro`, `/perfil`)**: Login e cadastro em tela dividida com persistência de sessão no navegador e hidratação automática via `GET auth/me`.
- **Dashboard ao Vivo (`/`)**: Indicadores em tempo real (disciplinas ativas, tarefas concluídas, pendentes/atrasadas, progresso geral e por disciplina) e próximas entregas.
- **Gestão Completa de Disciplinas (`/disciplinas`)**: Criação, edição (`PATCH`), exclusão com alerta de tarefas vinculadas e busca instantânea.
- **Workspace de Tarefas (`/tarefas`)**: Alternância entre **Quadro Kanban** (arrastar e soltar entre *Pendente*, *Em Andamento* e *Concluída*) e **Lista**, filtros combinados e CRUD completo.
- **Relatório Executivo em PDF**: Exportação instantânea no navegador (`relatorio_desempenho.pdf`) com paginação automática.
- **Modo Claro & Modo Escuro**: Alternância imediata com preferência salva localmente.

## Como Executar Localmente

1. Acesse a pasta do frontend e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```

2. Crie o arquivo `.env.local` a partir do `.env.example` com suas URLs reais do Xano:
   ```env
   VITE_XANO_AUTH_BASE_URL=https://sua-instancia.xano.io/api:seu_grupo_auth
   VITE_XANO_SUBJECTS_BASE_URL=https://sua-instancia.xano.io/api:seu_grupo_subjects
   VITE_XANO_TASKS_BASE_URL=https://sua-instancia.xano.io/api:seu_grupo_tasks
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Scripts adicionais (`package.json`):
   - `npm test`: Executa a suíte de testes unitários com Vitest.
   - `npm run build`: Valida TypeScript (`tsc -b`) e gera o pacote de produção em `dist/`.
   - `npm run preview`: Visualiza localmente o build de produção.

## Como Fazer Deploy na Vercel

1. Suba as alterações para o seu repositório no GitHub (`git push`).
2. No painel da [Vercel](https://vercel.com/new), importe o repositório **`EduTrack-AI_Impacta`**.
3. Em **Root Directory**, clique em **Edit** e selecione **`frontend`** (o `vercel.json` já está configurado para rotas SPA).
4. Em **Environment Variables**, adicione:
   - `VITE_XANO_AUTH_BASE_URL`
   - `VITE_XANO_SUBJECTS_BASE_URL`
   - `VITE_XANO_TASKS_BASE_URL`
5. Clique em **Deploy**.
