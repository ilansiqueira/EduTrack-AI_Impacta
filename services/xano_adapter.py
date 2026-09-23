"""
Xano API Adapter for Subjects (Disciplinas) in EduTrack AI.
Provides functions to interface Streamlit with Xano REST endpoints.
"""

import os
import json
import urllib.request
import urllib.error

# Configuração do Endpoint do Xano (obtido de variável de ambiente ou fallback)
XANO_API_BASE_URL = os.getenv("XANO_API_BASE_URL", "")
SUBJECTS_ENDPOINT = f"{XANO_API_BASE_URL}/subjects" if XANO_API_BASE_URL else ""

def get_auth_headers(token=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def fetch_subjects(auth_token=None):
    """
    Recupera a lista de disciplinas da API Xano.
    Retorna None se a URL do Xano não estiver configurada.
    """
    if not SUBJECTS_ENDPOINT:
        return None
    
    req = urllib.request.Request(SUBJECTS_ENDPOINT, headers=get_auth_headers(auth_token), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                return data
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"Erro ao buscar disciplinas no Xano: {e}")
        return None

def create_subject(name, professor=None, semester=None, status="Ativa", auth_token=None):
    """
    Cria uma nova disciplina na API Xano.
    Retorna o objeto criado ou None se falhar/não configurado.
    """
    if not SUBJECTS_ENDPOINT:
        return None

    payload = {
        "name": name,
        "professor": professor or "",
        "semester": semester or "",
        "status": status
    }

    req = urllib.request.Request(
        SUBJECTS_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers=get_auth_headers(auth_token),
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in (200, 201):
                return json.loads(response.read().decode())
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"Erro ao criar disciplina no Xano: {e}")
        return None

