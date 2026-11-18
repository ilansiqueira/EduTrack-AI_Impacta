# EduTrack AI

Projeto da disciplina Innovation Lab - Faculdade Impacta  
Aluno: Ilan Silva Siqueira  
2026

## Tecnologias Utilizadas

- React + TypeScript + Vite + Tailwind CSS (`frontend/` — deploy na Vercel)
- Streamlit (`app.py` e `pages/` — interface Python legada)
- Xano (Backend REST, Autenticação e Banco de Dados)
- OpenSpec
- Node.js
- VSCode / Antigravity
- Git & GitHub

## Executando o Frontend Web (React + Vite)

```bash
cd frontend
npm install
# Configure frontend/.env.local com base em frontend/.env.example
npm run dev
```

### Testes e Build de Produção

```bash
cd frontend
npm test
npm run build
```

## Deploy na Vercel

1. Conecte este repositório na **Vercel**.
2. Defina **Root Directory** como `frontend`.
3. Configure as variáveis de ambiente:
   - `VITE_XANO_AUTH_BASE_URL`
   - `VITE_XANO_SUBJECTS_BASE_URL`
   - `VITE_XANO_TASKS_BASE_URL`
4. Clique em **Deploy** (o arquivo `frontend/vercel.json` já gerencia as rotas SPA).
