import streamlit as st
import sys
from pathlib import Path
from datetime import date

# Garante importação dos módulos locais
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from services.xano_adapter import (
    fetch_subjects,
    fetch_academic_tasks,
    create_academic_task,
    update_academic_task,
    delete_academic_task
)
from scripts.calculate_progress import compute_progress
from scripts.generate_student_report import generate_pdf_bytes

st.set_page_config(page_title="Tarefas - EduTrack AI", page_icon="📝", layout="wide")

st.title("📝 Gestão de Tarefas Acadêmicas")

# Inicialização de autenticação
auth_token = st.session_state.get("auth_token")

if not auth_token:
    st.warning("🔒 **Acesso restrito:** Você precisa estar autenticado para visualizar e gerenciar suas tarefas.")
    st.info("👉 Acesse a página **Perfil** para efetuar login ou criar uma conta.")
    st.stop()

# Carregar disciplinas para mapeamento e criação de tarefas
with st.spinner("Carregando dados..."):
    subj_ok, subj_resp = fetch_subjects(auth_token=auth_token)

subjects = subj_resp if subj_ok and isinstance(subj_resp, list) else []
subject_map = {s.get("id"): s.get("name") for s in subjects}

tab_lista, tab_nova = st.tabs(["📋 Minhas Tarefas", "➕ Nova Tarefa"])

with tab_lista:
    # Filtros superiores
    col_search, col_subj, col_status = st.columns([2, 1, 1])
    
    with col_search:
        search_query = st.text_input("🔍 Buscar tarefa", placeholder="Digite o título da tarefa...")
    
    with col_subj:
        subject_filter_options = ["Todas"] + [f"{s.get('name')} (ID: {s.get('id')})" for s in subjects]
        selected_subject_filter = st.selectbox("Filtrar por Disciplina", subject_filter_options)
        
    with col_status:
        status_filter = st.selectbox("Status", ["Todas", "Pendente", "Concluída"])

    # Determinar se filtra por subject_id na API ou busca tudo
    filter_subject_id = None
    if selected_subject_filter != "Todas":
        for s in subjects:
            if f"{s.get('name')} (ID: {s.get('id')})" == selected_subject_filter:
                filter_subject_id = s.get("id")
                break

    # Buscar tarefas do Xano
    tasks_ok, tasks_resp = fetch_academic_tasks(subject_id=filter_subject_id, auth_token=auth_token)

    if not tasks_ok:
        st.error(f"Erro ao carregar tarefas: {tasks_resp}")
        tasks = []
    else:
        tasks = tasks_resp if isinstance(tasks_resp, list) else []

    # Filtragem em memória por texto de busca e status
    filtered_tasks = []
    for t in tasks:
        title = str(t.get("title", ""))
        desc = str(t.get("description", ""))
        status = str(t.get("status", "")).strip().lower()

        # Filtro de busca textual
        if search_query:
            q = search_query.strip().lower()
            if q not in title.lower() and q not in desc.lower():
                continue

        # Filtro de status
        if status_filter == "Pendente" and status in ("completed", "concluida", "concluída"):
            continue
        if status_filter == "Concluída" and status not in ("completed", "concluida", "concluída"):
            continue

        filtered_tasks.append(t)

    # Métricas de progresso e Exportação de Relatório
    if tasks:
        metrics = compute_progress(tasks)
        col_m1, col_m2, col_m3, col_dl = st.columns([1, 1, 1, 1.2])
        col_m1.metric("Total de Tarefas", metrics["total_tasks"])
        col_m2.metric("Tarefas Concluídas", metrics["completed_tasks"])
        col_m3.metric("Progresso Geral", f"{metrics['progress_percentage']}%")
        
        with col_dl:
            st.write("")  # Alinhamento vertical com as métricas
            student_info = st.session_state.get("user") or {}
            pdf_data = generate_pdf_bytes(student=student_info, subjects=subjects, tasks=tasks)
            st.download_button(
                label="📄 Baixar Relatório (PDF)",
                data=pdf_data,
                file_name="relatorio_desempenho.pdf",
                mime="application/pdf",
                use_container_width=True,
                help="Baixar relatório completo de desempenho acadêmico em PDF"
            )

        st.progress(metrics["progress_percentage"] / 100.0)
    else:
        # Quando não houver tarefas cadastradas ainda
        col_empty_info, col_empty_dl = st.columns([3, 1])
        with col_empty_dl:
            student_info = st.session_state.get("user") or {}
            pdf_data = generate_pdf_bytes(student=student_info, subjects=subjects, tasks=[])
            st.download_button(
                label="📄 Baixar Relatório (PDF)",
                data=pdf_data,
                file_name="relatorio_desempenho.pdf",
                mime="application/pdf",
                use_container_width=True,
                help="Baixar relatório completo de desempenho acadêmico em PDF"
            )

    st.markdown("---")

    if not filtered_tasks:
        st.info("Nenhuma tarefa encontrada para os filtros selecionados.")
    else:
        for t in filtered_tasks:
            task_id = t.get("id")
            title = t.get("title")
            desc = t.get("description") or "Sem descrição."
            due = t.get("due_date") or "Sem prazo definido"
            status = str(t.get("status", "")).strip().lower()
            is_completed = status in ("completed", "concluida", "concluída")
            subj_name = subject_map.get(t.get("subject_id"), f"Disciplina #{t.get('subject_id')}")

            with st.container(border=True):
                col_info, col_actions = st.columns([4, 1])

                with col_info:
                    st.markdown(f"### {'✅' if is_completed else '📌'} {title}")
                    st.caption(f"📚 **Disciplina:** {subj_name} | 📅 **Prazo:** {due}")
                    if desc:
                        st.write(desc)

                with col_actions:
                    btn_label = "Desmarcar" if is_completed else "Concluir"
                    new_status = "pending" if is_completed else "completed"
                    
                    if st.button(btn_label, key=f"toggle_{task_id}", use_container_width=True):
                        upd_ok, upd_resp = update_academic_task(task_id, {"status": new_status}, auth_token=auth_token)
                        if upd_ok:
                            st.rerun()
                        else:
                            st.error(f"Erro ao atualizar: {upd_resp}")

                    if st.button("🗑️ Excluir", key=f"del_{task_id}", type="secondary", use_container_width=True):
                        del_ok, del_resp = delete_academic_task(task_id, auth_token=auth_token)
                        if del_ok:
                            st.rerun()
                        else:
                            st.error(f"Erro ao excluir: {del_resp}")

with tab_nova:
    st.subheader("Cadastrar Nova Tarefa Acadêmica")

    if not subjects:
        st.warning("⚠️ Você precisa cadastrar ao menos uma disciplina antes de adicionar tarefas.")
        st.info("👉 Acesse a aba de **Disciplinas** para criar sua primeira matéria.")
    else:
        with st.form("form_nova_tarefa", clear_on_submit=True):
            novo_titulo = st.text_input("Título da Tarefa *", placeholder="Ex: Exercícios de Álgebra Linear")
            
            subj_choices = {f"{s.get('name')} (ID: {s.get('id')})": s.get('id') for s in subjects}
            selected_subj_label = st.selectbox("Disciplina Vinculada *", list(subj_choices.keys()))
            
            col_d1, col_d2 = st.columns(2)
            with col_d1:
                prazo = st.date_input("Prazo de Entrega", value=date.today())
            with col_d2:
                status_inicial = st.selectbox("Status Inicial", ["Pendente", "Em Andamento", "Concluída"])

            nova_descricao = st.text_area("Descrição Detalhada", placeholder="Instruções, capítulos a ler, etc.")

            submit_tarefa = st.form_submit_button("Criar Tarefa", use_container_width=True)

            if submit_tarefa:
                if not novo_titulo.strip():
                    st.error("O título da tarefa é obrigatório.")
                else:
                    status_map = {
                        "Pendente": "pending",
                        "Em Andamento": "in_progress",
                        "Concluída": "completed"
                    }
                    target_subject_id = subj_choices[selected_subj_label]
                    
                    with st.spinner("Criando tarefa no Xano..."):
                        create_ok, create_resp = create_academic_task(
                            title=novo_titulo,
                            subject_id=target_subject_id,
                            description=nova_descricao if nova_descricao.strip() else None,
                            due_date=str(prazo),
                            status=status_map.get(status_inicial, "pending"),
                            auth_token=auth_token
                        )

                        if create_ok:
                            st.success(f"Tarefa '{novo_titulo}' criada com sucesso!")
                            st.rerun()
                        else:
                            st.error(f"Erro ao criar tarefa: {create_resp}")
