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
    """Carrega as variáveis do arquivo .env na raiz do projeto."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

load_env()

def get_api_base_url() -> str:
    """Retorna a URL base dos endpoints de API Xano."""
    load_env()
    url = os.getenv("XANO_API_BASE_URL", "").strip().rstrip("/")
    if not url:
        # Fallback para XANO_AUTH_BASE_URL se XANO_API_BASE_URL não estiver configurado
        url = os.getenv("XANO_AUTH_BASE_URL", "").strip().rstrip("/")
    return url

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
        return False, "URL da API Xano não configurada no arquivo .env."

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

def fetch_subjects(auth_token=None):
    """
    Recupera a lista de disciplinas da API Xano do usuário autenticado.
    Retorna tupla: (sucesso: bool, lista_de_disciplinas | mensagem_erro).
    """
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/subjects"
    return _make_request(url, method="GET", auth_token=auth_token)

def create_subject(name: str, teacher: str = None, hours: int = None, auth_token=None):
    """
    Cria uma nova disciplina vinculada ao usuário autenticado.
    Retorna tupla: (sucesso: bool, disciplina_criada | mensagem_erro).
    """
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
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

    url = f"{base_url}/subjects"
    return _make_request(url, method="POST", payload=payload, auth_token=auth_token)

def update_subject(subject_id: int, fields: dict, auth_token=None):
    """Atualiza dados de uma disciplina existente do usuário autenticado."""
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/subjects/{subject_id}"
    return _make_request(url, method="PATCH", payload=fields, auth_token=auth_token)

def delete_subject(subject_id: int, auth_token=None):
    """Remove uma disciplina do usuário autenticado."""
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/subjects/{subject_id}"
    return _make_request(url, method="DELETE", auth_token=auth_token)


# ==============================================================================
# ACADEMIC TASKS (TAREFAS ACADÊMICAS)
# ==============================================================================

def fetch_academic_tasks(subject_id=None, auth_token=None):
    """
    Recupera as tarefas acadêmicas do usuário autenticado, com filtro opcional por subject_id.
    Retorna tupla: (sucesso: bool, lista_de_tarefas | mensagem_erro).
    """
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/academic_tasks"
    if subject_id:
        url += f"?subject_id={subject_id}"
        
    return _make_request(url, method="GET", auth_token=auth_token)

def create_academic_task(title: str, subject_id: int, description: str = None, due_date: str = None, status: str = "pending", auth_token=None):
    """
    Cria uma nova tarefa acadêmica vinculada a uma disciplina do usuário autenticado.
    Retorna tupla: (sucesso: bool, tarefa_criada | mensagem_erro).
    """
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    payload = {
        "title": title.strip(),
        "subject_id": int(subject_id),
        "status": status.strip() if status else "pending"
    }
    if description:
        payload["description"] = description.strip()
    if due_date:
        payload["due_date"] = str(due_date)

    url = f"{base_url}/academic_tasks"
    return _make_request(url, method="POST", payload=payload, auth_token=auth_token)

def update_academic_task(task_id: int, fields: dict, auth_token=None):
    """Atualiza campos de uma tarefa acadêmica (ex: status, title, due_date)."""
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/academic_tasks/{task_id}"
    return _make_request(url, method="PATCH", payload=fields, auth_token=auth_token)

def delete_academic_task(task_id: int, auth_token=None):
    """Exclui uma tarefa acadêmica do usuário autenticado."""
    base_url = get_api_base_url()
    if not base_url:
        return False, "URL da API Xano não configurada no .env"
    
    url = f"{base_url}/academic_tasks/{task_id}"
    return _make_request(url, method="DELETE", auth_token=auth_token)
