import streamlit as st
import sys
from pathlib import Path

# Garante importação dos módulos locais
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from services.xano_adapter import fetch_subjects, create_subject, delete_subject

st.set_page_config(page_title="Disciplinas - EduTrack AI", page_icon="📚", layout="wide")

st.title("📚 Gestão de Disciplinas")

# Inicialização de autenticação
auth_token = st.session_state.get("auth_token")

if not auth_token:
    st.warning("🔒 **Acesso restrito:** Você precisa estar autenticado para visualizar e cadastrar suas disciplinas.")
    st.info("👉 Acesse a página **Perfil** para efetuar login ou criar uma conta.")
    st.stop()

tab_lista, tab_novo = st.tabs(["📋 Minhas Disciplinas", "➕ Nova Disciplina"])

with tab_lista:
    st.subheader("Disciplinas Cadastradas")
    
    col_ref, _ = st.columns([1, 5])
    with col_ref:
        if st.button("🔄 Atualizar Lista"):
            st.rerun()

    with st.spinner("Carregando disciplinas..."):
        success, response = fetch_subjects(auth_token=auth_token)

    if not success:
        st.error(f"Erro ao carregar disciplinas: {response}")
    else:
        subjects = response if isinstance(response, list) else []
        if not subjects:
            st.info("Nenhuma disciplina encontrada. Cadastre sua primeira matéria na aba ao lado!")
        else:
            # Exibir resumo e tabela
            table_data = []
            for s in subjects:
                table_data.append({
                    "ID": s.get("id"),
                    "Disciplina": s.get("name"),
                    "Professor(a)": s.get("teacher") or "-",
                    "Carga Horária (h)": s.get("hours") if s.get("hours") is not None else "-"
                })
            
            st.dataframe(table_data, use_container_width=True)

            # Opção de exclusão
            with st.expander("🗑️ Excluir Disciplina"):
                subject_options = {f"{s.get('name')} (ID: {s.get('id')})": s.get('id') for s in subjects}
                selected_label = st.selectbox("Selecione a disciplina para remover", list(subject_options.keys()))
                
                if st.button("Confirmar Exclusão", type="primary"):
                    del_id = subject_options[selected_label]
                    del_ok, del_resp = delete_subject(del_id, auth_token=auth_token)
                    if del_ok:
                        st.success("Disciplina excluída com sucesso!")
                        st.rerun()
                    else:
                        st.error(f"Não foi possível excluir: {del_resp}")

with tab_novo:
    st.subheader("Cadastrar Nova Disciplina")
    
    with st.form("form_disciplina", clear_on_submit=True):
        nome = st.text_input("Nome da Disciplina *", placeholder="Ex: Engenharia de Software")
        professor = st.text_input("Nome do Professor(a)", placeholder="Ex: Prof. Dr. Silva")
        horas = st.number_input("Carga Horária (horas)", min_value=0, max_value=500, value=60, step=10)
        
        submitted = st.form_submit_button("Salvar Disciplina", use_container_width=True)
        
        if submitted:
            if not nome.strip():
                st.error("O nome da disciplina é obrigatório.")
            else:
                with st.spinner("Salvando disciplina no Xano..."):
                    created_ok, created_resp = create_subject(
                        name=nome,
                        teacher=professor if professor.strip() else None,
                        hours=int(horas) if horas > 0 else None,
                        auth_token=auth_token
                    )
                    
                    if created_ok:
                        st.success(f"Disciplina '{nome}' cadastrada com sucesso!")
                        st.rerun()
                    else:
                        st.error(f"Erro ao salvar disciplina: {created_resp}")
