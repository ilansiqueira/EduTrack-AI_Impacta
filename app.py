import streamlit as st
from datetime import datetime

# Configuração da Página (Título na aba do navegador)
st.set_page_config(page_title="EduTrack AI", page_icon="🎓", layout="wide")

# Inicialização do Estado (Data Model & State Setup)
if "subjects" not in st.session_state:
    st.session_state.subjects = [
        {
            "id": 1,
            "name": "Innovation Lab",
            "professor": "Prof. Impacta",
            "semester": "2026/1",
            "status": "Ativa",
            "created_at": "2026-02-15 10:00:00"
        },
        {
            "id": 2,
            "name": "Inteligência Artificial Aplicada",
            "professor": "Dra. Santos",
            "semester": "2026/1",
            "status": "Ativa",
            "created_at": "2026-02-16 14:30:00"
        }
    ]

def get_active_subjects_count():
    """Retorna a contagem de disciplinas com status 'Ativa'."""
    return sum(1 for s in st.session_state.subjects if s.get("status") == "Ativa")

def add_subject(name, professor, semester, status="Ativa"):
    """Adiciona uma nova disciplina ao estado."""
    new_id = max([s["id"] for s in st.session_state.subjects], default=0) + 1
    new_subject = {
        "id": new_id,
        "name": name.strip(),
        "professor": professor.strip() if professor else "Não informado",
        "semester": semester.strip() if semester else "Atual",
        "status": status,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    st.session_state.subjects.append(new_subject)
    return new_subject

# Título Principal
st.title("🎓 EduTrack AI")

# Sidebar (Menu Lateral)
st.sidebar.header("Menu")
menu_option = st.sidebar.radio("Navegar", ["Dashboard", "Disciplinas", "Tarefas"])

# Conteúdo Dinâmico
if menu_option == "Dashboard":
    st.write("Bem-vindo ao seu assistente acadêmico!")
    st.info("Conectado ao ambiente local (sincronizável com o backend Xano).")
    
    active_count = get_active_subjects_count()
    total_subjects = len(st.session_state.subjects)
    
    col1, col2 = st.columns(2)
    col1.metric("Disciplinas Ativas", str(active_count), help=f"Total de {total_subjects} cadastradas")
    col2.metric("Tarefas Pendentes", "0")

elif menu_option == "Disciplinas":
    st.subheader("📚 Minhas Disciplinas")
    
    # Formulário de Cadastro de Disciplinas
    with st.expander("➕ Cadastrar Nova Disciplina", expanded=False):
        with st.form("form_add_subject", clear_on_submit=True):
            col_f1, col_f2 = st.columns(2)
            name_input = col_f1.text_input("Nome da Disciplina *", placeholder="Ex: Banco de Dados")
            prof_input = col_f2.text_input("Professor(a)", placeholder="Ex: Prof. Silva")
            
            col_f3, col_f4 = st.columns(2)
            semester_input = col_f3.text_input("Semestre / Período", placeholder="Ex: 2026/1")
            status_input = col_f4.selectbox("Status", ["Ativa", "Concluída", "Trancada"])
            
            submit_button = st.form_submit_button("Salvar Disciplina")
            
            if submit_button:
                if not name_input or not name_input.strip():
                    st.error("O nome da disciplina é obrigatório!")
                else:
                    # Checagem de duplicidade
                    exists = any(s["name"].strip().lower() == name_input.strip().lower() for s in st.session_state.subjects)
                    if exists:
                        st.warning(f"A disciplina '{name_input.strip()}' já está cadastrada.")
                    else:
                        add_subject(name_input, prof_input, semester_input, status_input)
                        st.success(f"Disciplina '{name_input.strip()}' cadastrada com sucesso!")
                        st.rerun()

    # Listagem de Disciplinas
    if not st.session_state.subjects:
        st.info("Nenhuma disciplina cadastrada ainda. Utilize o formulário acima para adicionar sua primeira matéria.")
    else:
        st.write(f"Total de disciplinas: **{len(st.session_state.subjects)}**")
        for subj in st.session_state.subjects:
            with st.container(border=True):
                col_s1, col_s2, col_s3 = st.columns([3, 2, 1])
                col_s1.markdown(f"### {subj['name']}")
                col_s1.caption(f"Professor: {subj['professor']} | Semestre: {subj['semester']}")
                col_s2.write(f"Cadastrada em: {subj.get('created_at', 'N/A')}")
                badge_color = "green" if subj["status"] == "Ativa" else "gray"
                col_s3.markdown(f":{badge_color}[**{subj['status']}**]")

elif menu_option == "Tarefas":
    st.subheader("Gerenciamento de Tarefas")
    st.checkbox("Exemplo: Estudar Streamlit")