## 1. Configuração do Streamlit Secrets

- [x] 1.1 Configurar chaves no arquivo `.streamlit/secrets.toml` e garantir `.gitignore`

## 2. Migração dos Serviços para Streamlit Secrets

- [x] 2.1 Migrar a leitura de variáveis de ambiente para `st.secrets` em `services/auth_service.py`
- [x] 2.2 Migrar a leitura de variáveis de ambiente para `st.secrets` em `services/xano_adapter.py`

## 3. Migração dos Scripts para Streamlit Secrets

- [x] 3.1 Migrar a leitura de variáveis de ambiente para `st.secrets` em `scripts/calculate_progress.py`
- [x] 3.2 Migrar a leitura de variáveis de ambiente para `st.secrets` em `scripts/generate_student_report.py`
