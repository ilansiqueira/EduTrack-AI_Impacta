"""
Xano API Adapter for Subjects (Disciplinas) and Academic Tasks (Tarefas) in EduTrack AI.
Provides functions to interface Streamlit with Xano authenticated REST endpoints.
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

def get_subjects_base_url() -> str:
    """Retorna a URL base específica para o grupo de API de subjects."""
    url = get_secret("XANO_SUBJECTS_BASE_URL", "").rstrip("/")
    if not url:
        url = get_secret("XANO_API_BASE_URL", "").rstrip("/")
    return url

def get_tasks_base_url() -> str:
    """Retorna a URL base específica para o grupo de API de academic_tasks."""
    url = get_secret("XANO_TASKS_BASE_URL", "").rstrip("/")
    if not url:
        url = get_secret("XANO_API_BASE_URL", "").rstrip("/")
    return url

def get_api_base_url() -> str:
    """Fallback genérico para URL de API Xano."""
    return get_secret("XANO_API_BASE_URL", "").rstrip("/")

def get_auth_headers(token=None):
    """Retorna os cabeçalhos HTTP com Content-Type, Accept e Bearer token se informado."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def _make_request(url: str, method: str = "GET", payload: dict = None, auth_token: str = None, timeout: int = 10):
    """Executa requisição HTTP e retorna tupla (sucesso: bool, dados_ou_erro: any)."""
    if not url or "api:example" in url:
        return False, "URL da API Xano não configurada nos secrets do Streamlit (.streamlit/secrets.toml)."

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=get_auth_headers(auth_token), method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status in (200, 201):
                body = response.read().decode("utf-8")
                if not body:
                    return True, None
                return True, json.loads(body)
            elif response.status == 204:
                return True, None
            else:
                return False, f"Resposta com status inesperado: {response.status}"
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


# ==============================================================================
# SUBJECTS (DISCIPLINAS)
# ==============================================================================

def _format_subjects_url(path: str = "") -> str:
    base = get_subjects_base_url()
    if not base:
        return ""
    clean_base = base.rstrip("/")
    clean_path = path.strip("/")
    
    # Se a base já terminar com /subjects, não duplica
    if clean_base.endswith("/subjects"):
        return f"{clean_base}/{clean_path}" if clean_path else clean_base
    return f"{clean_base}/subjects/{clean_path}" if clean_path else f"{clean_base}/subjects"

def fetch_subjects(auth_token=None):
    """
    Recupera a lista de disciplinas da API Xano do usuário autenticado.
    Retorna tupla: (sucesso: bool, lista_de_disciplinas | mensagem_erro).
    """
    url = _format_subjects_url()
    if not url:
        return False, "URL da API de subjects não configurada nos secrets do Streamlit (XANO_SUBJECTS_BASE_URL)"
    return _make_request(url, method="GET", auth_token=auth_token)

def create_subject(name: str, teacher: str = None, hours: int = None, auth_token=None):
    """
    Cria uma nova disciplina vinculada ao usuário autenticado.
    Retorna tupla: (sucesso: bool, disciplina_criada | mensagem_erro).
    """
    url = _format_subjects_url()
    if not url:
        return False, "URL da API de subjects não configurada nos secrets do Streamlit (XANO_SUBJECTS_BASE_URL)"
    
    payload = {
        "name": name.strip()
    }
    if teacher:
        payload["teacher"] = teacher.strip()
    if hours is not None:
        try:
            payload["hours"] = int(hours)
        except (ValueError, TypeError):
            pass

    return _make_request(url, method="POST", payload=payload, auth_token=auth_token)

def update_subject(subject_id: int, fields: dict, auth_token=None):
    """Atualiza dados de uma disciplina existente do usuário autenticado."""
    url = _format_subjects_url(str(subject_id))
    if not url:
        return False, "URL da API de subjects não configurada nos secrets do Streamlit (XANO_SUBJECTS_BASE_URL)"
    return _make_request(url, method="PATCH", payload=fields, auth_token=auth_token)

def delete_subject(subject_id: int, auth_token=None):
    """Remove uma disciplina do usuário autenticado."""
    url = _format_subjects_url(str(subject_id))
    if not url:
        return False, "URL da API de subjects não configurada nos secrets do Streamlit (XANO_SUBJECTS_BASE_URL)"
    return _make_request(url, method="DELETE", auth_token=auth_token)


# ==============================================================================
# ACADEMIC TASKS (TAREFAS ACADÊMICAS)
# ==============================================================================

def _format_tasks_url(path: str = "") -> str:
    base = get_tasks_base_url()
    if not base:
        return ""
    clean_base = base.rstrip("/")
    clean_path = path.strip("/")
    
    # Se a base já terminar com /academic_tasks, não duplica
    if clean_base.endswith("/academic_tasks"):
        return f"{clean_base}/{clean_path}" if clean_path else clean_base
    return f"{clean_base}/academic_tasks/{clean_path}" if clean_path else f"{clean_base}/academic_tasks"

def fetch_academic_tasks(subject_id=None, auth_token=None):
    """
    Recupera as tarefas acadêmicas do usuário autenticado, com filtro opcional por subject_id.
    Retorna tupla: (sucesso: bool, lista_de_tarefas | mensagem_erro).
    """
    url = _format_tasks_url()
    if not url:
        return False, "URL da API de academic_tasks não configurada nos secrets do Streamlit (XANO_TASKS_BASE_URL)"
    
    if subject_id:
        url += f"?subject_id={subject_id}"
        
    return _make_request(url, method="GET", auth_token=auth_token)

def create_academic_task(title: str, subject_id: int, description: str = None, due_date: str = None, status: str = "pending", auth_token=None):
    """
    Cria uma nova tarefa acadêmica vinculada a uma disciplina do usuário autenticado.
    Retorna tupla: (sucesso: bool, tarefa_criada | mensagem_erro).
    """
    url = _format_tasks_url()
    if not url:
        return False, "URL da API de academic_tasks não configurada nos secrets do Streamlit (XANO_TASKS_BASE_URL)"
    
    payload = {
        "title": title.strip(),
        "subject_id": int(subject_id),
        "status": status.strip() if status else "pending"
    }
    if description:
        payload["description"] = description.strip()
    if due_date:
        payload["due_date"] = str(due_date)

    return _make_request(url, method="POST", payload=payload, auth_token=auth_token)

def update_academic_task(task_id: int, fields: dict, auth_token=None):
    """Atualiza campos de uma tarefa acadêmica (ex: status, title, due_date)."""
    url = _format_tasks_url(str(task_id))
    if not url:
        return False, "URL da API de academic_tasks não configurada nos secrets do Streamlit (XANO_TASKS_BASE_URL)"
    return _make_request(url, method="PATCH", payload=fields, auth_token=auth_token)

def delete_academic_task(task_id: int, auth_token=None):
    """Exclui uma tarefa acadêmica do usuário autenticado."""
    url = _format_tasks_url(str(task_id))
    if not url:
        return False, "URL da API de academic_tasks não configurada nos secrets do Streamlit (XANO_TASKS_BASE_URL)"
    return _make_request(url, method="DELETE", auth_token=auth_token)
