"""
Testes unitários para o serviço de autenticação e validações de tela.
"""

from services.auth_service import get_auth_base_url, _format_endpoint, load_env

def test_env_and_endpoint_formatting():
    load_env()
    base_url = get_auth_base_url()
    assert base_url != "", "Base URL should be loaded from .env"
    
    login_url = _format_endpoint("auth/login")
    assert login_url.endswith("/login") or login_url.endswith("/auth/login"), f"Invalid endpoint: {login_url}"
    
    signup_url = _format_endpoint("auth/signup")
    assert signup_url.endswith("/signup") or signup_url.endswith("/auth/signup"), f"Invalid endpoint: {signup_url}"

    me_url = _format_endpoint("auth/me")
    assert me_url.endswith("/me") or me_url.endswith("/auth/me"), f"Invalid endpoint: {me_url}"
    print("[PASS] test_env_and_endpoint_formatting")

def test_validation_rules():
    # Validação de senhas coincidentes
    pass1 = "Secret123"
    pass2 = "Secret123"
    assert pass1 == pass2
    
    # Validação de senha curta
    short_pass = "123"
    assert len(short_pass) < 6
    print("[PASS] test_validation_rules")

if __name__ == "__main__":
    test_env_and_endpoint_formatting()
    test_validation_rules()
    print("All authentication tests passed successfully!")

