"""
Serviço de Autenticação do EduTrack AI.
Integração com os endpoints auth/signup, auth/login e auth/me do Xano.
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path

def load_env():
    """Carrega as variáveis do arquivo .env na raiz do projeto (fallback retrocompatível)."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Carregar variáveis ao importar o módulo
load_env()

def get_secret(key: str, default: str = "") -> str:
    """Retorna configuração a partir de st.secrets do Streamlit ou fallback no os.getenv."""
    try:
        import streamlit as st
        if key in st.secrets:
            return str(st.secrets[key]).strip()
    except Exception:
        pass
    load_env()
    return os.getenv(key, default).strip()

def get_auth_base_url():
    """Retorna a URL base de autenticação configurada em st.secrets ou fallback no .env."""
    url = get_secret("XANO_AUTH_BASE_URL", "").rstrip("/")
    return url

def _format_endpoint(path: str) -> str:
    """Monta a URL completa do endpoint considerando a terminação da URL base."""
    base = get_auth_base_url()
    if not base:
        return ""
    # Se a URL base já contém /auth no final e path começa com auth/, ajusta
    clean_path = path.lstrip("/")
    if base.endswith("/auth") and clean_path.startswith("auth/"):
        clean_path = clean_path[5:]
    return f"{base}/{clean_path}"

def signup(name: str, email: str, password: str):
    """
    Cadastra um novo usuário no Xano via POST auth/signup.
    Retorna tupla: (sucesso: bool, resposta: dict | mensagem_de_erro: str)
    """
    url = _format_endpoint("auth/signup")
    if not url or "your-instance" in url or "api:example" in url:
        return False, "URL da API Xano não configurada ou inválida nos secrets do Streamlit (.streamlit/secrets.toml)."

    payload = {
        "name": name.strip(),
        "email": email.strip().lower(),
        "password": password
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return True, body
    except urllib.error.HTTPError as e:
        error_detail = e.read().decode("utf-8")
        try:
            parsed = json.loads(error_detail)
            msg = parsed.get("message", error_detail)
        except Exception:
            msg = error_detail
        return False, f"Erro {e.code}: {msg}"
    except Exception as e:
        return False, f"Falha na conexão: {str(e)}"

def login(email: str, password: str):
    """
    Autentica um usuário existente via POST auth/login.
    Retorna tupla: (sucesso: bool, resposta: dict | mensagem_de_erro: str)
    """
    url = _format_endpoint("auth/login")
    if not url or "your-instance" in url or "api:example" in url:
        return False, "URL da API Xano não configurada ou inválida nos secrets do Streamlit (.streamlit/secrets.toml)."

    payload = {
        "email": email.strip().lower(),
        "password": password
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return True, body
    except urllib.error.HTTPError as e:
        error_detail = e.read().decode("utf-8")
        try:
            parsed = json.loads(error_detail)
            msg = parsed.get("message", error_detail)
        except Exception:
            msg = error_detail
        return False, f"Erro {e.code}: {msg}"
    except Exception as e:
        return False, f"Falha na conexão: {str(e)}"

def get_current_user(auth_token: str):
    """
    Recupera os dados do usuário autenticado via GET auth/me.
    Retorna tupla: (sucesso: bool, dados_usuario: dict | mensagem_de_erro: str)
    """
    url = _format_endpoint("auth/me")
    if not url or "your-instance" in url or "api:example" in url:
        return False, "URL da API Xano não configurada ou inválida nos secrets do Streamlit (.streamlit/secrets.toml)."

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Accept": "application/json"
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return True, body
    except urllib.error.HTTPError as e:
        return False, f"Erro {e.code}: Sessão expirada ou token inválido."
    except Exception as e:
        return False, f"Falha na conexão: {str(e)}"

