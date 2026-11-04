import streamlit as st
import sys
from pathlib import Path

# Adiciona o diretório raiz ao sys.path para permitir import de services
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from services.auth_service import login, signup, get_current_user, get_auth_base_url

st.set_page_config(page_title="Perfil - EduTrack AI", page_icon="👤", layout="wide")

st.title("👤 Gestão de Perfil e Autenticação")

# Inicialização do estado de sessão
if "auth_token" not in st.session_state:
    st.session_state.auth_token = None
if "user" not in st.session_state:
    st.session_state.user = None

base_url = get_auth_base_url()

# Verifica se o usuário já está autenticado
if st.session_state.auth_token and st.session_state.user:
    user = st.session_state.user
    
    st.subheader(f"Bem-vindo(a), {user.get('name', 'Estudante')}!")
    
    with st.container(border=True):
        col1, col2 = st.columns(2)
        col1.write(f"**Nome:** {user.get('name', 'N/A')}")
        col1.write(f"**E-mail:** {user.get('email', 'N/A')}")
        col2.write(f"**ID de Usuário:** {user.get('id', 'N/A')}")
        col2.write(f"**Função (Role):** {user.get('role', 'Aluno')}")
        
        st.caption(f"Status da Sessão: Autenticado | Token ativo")
    
    col_act1, col_act2 = st.columns([1, 4])
    with col_act1:
        if st.button("🔄 Atualizar Dados", use_container_width=True):
            success, data = get_current_user(st.session_state.auth_token)
            if success:
                st.session_state.user = data
                st.success("Dados do perfil atualizados com sucesso!")
                st.rerun()
            else:
                st.error(f"Erro ao atualizar: {data}")
                
    with col_act2:
        if st.button("🚪 Sair da Conta (Logout)", type="secondary"):
            st.session_state.auth_token = None
            st.session_state.user = None
            st.info("Você saiu da conta.")
            st.rerun()

else:
    # Aviso informativo caso a URL ainda seja o exemplo padrão
    if not base_url or "api:example" in base_url:
        st.warning(
            "⚠️ **Atenção:** A URL dos endpoints Xano nos secrets do Streamlit está com valor de exemplo (`api:example`). "
            "Para autenticação real, configure a sua URL da API Xano em `.streamlit/secrets.toml`."
        )
    
    # Abas para alternar entre Login e Cadastro
    tab_login, tab_signup = st.tabs(["🔑 Acessar Conta (Login)", "📝 Criar Nova Conta (Cadastro)"])

    # Aba de Login
    with tab_login:
        st.subheader("Login na Plataforma")
        with st.form("form_login"):
            email_input = st.text_input("E-mail", placeholder="seu.email@exemplo.com")
            password_input = st.text_input("Senha", type="password", placeholder="Digite sua senha")
            
            btn_login = st.form_submit_button("Entrar", use_container_width=True)
            
            if btn_login:
                if not email_input or not password_input:
                    st.error("Por favor, preencha o e-mail e a senha.")
                else:
                    with st.spinner("Autenticando..."):
                        success, resp = login(email_input, password_input)
                        if success:
                            token = resp.get("authToken") or resp.get("token") or resp.get("access_token")
                            st.session_state.auth_token = token
                            
                            # Tentar carregar perfil completo via auth/me
                            if token:
                                me_ok, me_data = get_current_user(token)
                                if me_ok:
                                    st.session_state.user = me_data
                                else:
                                    st.session_state.user = {"email": email_input, "name": email_input.split("@")[0]}
                            else:
                                st.session_state.user = {"email": email_input, "name": email_input.split("@")[0]}
                            
                            st.success("Login efetuado com sucesso!")
                            st.rerun()
                        else:
                            st.error(f"Não foi possível autenticar: {resp}")

    # Aba de Cadastro
    with tab_signup:
        st.subheader("Cadastro de Novo Usuário")
        with st.form("form_signup"):
            new_name = st.text_input("Nome Completo *", placeholder="Ex: Maria Santos")
            new_email = st.text_input("E-mail *", placeholder="maria.santos@email.com")
            new_pass = st.text_input("Senha *", type="password", placeholder="Mínimo de 8 caracteres")
            new_pass_confirm = st.text_input("Confirme a Senha *", type="password", placeholder="Repita a senha")
            
            btn_signup = st.form_submit_button("Criar Conta", use_container_width=True)
            
            if btn_signup:
                if not new_name or not new_email or not new_pass:
                    st.error("Todos os campos obrigatórios (*) devem ser preenchidos.")
                elif new_pass != new_pass_confirm:
                    st.error("As senhas informadas não coincidem.")
                elif len(new_pass) < 6:
                    st.error("A senha deve ter pelo menos 6 caracteres.")
                else:
                    with st.spinner("Cadastrando usuário..."):
                        success, resp = signup(new_name, new_email, new_pass)
                        if success:
                            token = resp.get("authToken") or resp.get("token") or resp.get("access_token")
                            if token:
                                st.session_state.auth_token = token
                                me_ok, me_data = get_current_user(token)
                                if me_ok:
                                    st.session_state.user = me_data
                                else:
                                    st.session_state.user = {"name": new_name, "email": new_email}
                            st.success("Conta criada com sucesso!")
                            st.rerun()
                        else:
                            st.error(f"Erro no cadastro: {resp}")

