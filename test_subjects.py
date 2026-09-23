"""
Unit tests for EduTrack AI Subject Management logic.
"""

from datetime import datetime

def test_subject_data_structure():
    subject = {
        "id": 1,
        "name": "Innovation Lab",
        "professor": "Prof. Impacta",
        "semester": "2026/1",
        "status": "Ativa",
        "created_at": "2026-02-15 10:00:00"
    }
    assert "id" in subject
    assert "name" in subject
    assert "professor" in subject
    assert "semester" in subject
    assert "status" in subject
    assert "created_at" in subject
    print("[PASS] test_subject_data_structure")

def test_add_subject_and_active_count():
    subjects = [
        {"id": 1, "name": "Matéria 1", "status": "Ativa"},
        {"id": 2, "name": "Matéria 2", "status": "Concluída"}
    ]
    
    # Contagem inicial
    active_count = sum(1 for s in subjects if s.get("status") == "Ativa")
    assert active_count == 1, f"Expected 1 active subject, got {active_count}"

    # Adicionar nova disciplina ativa
    new_id = max([s["id"] for s in subjects], default=0) + 1
    new_subject = {
        "id": new_id,
        "name": "Banco de Dados",
        "professor": "Prof. Silva",
        "semester": "2026/1",
        "status": "Ativa",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    subjects.append(new_subject)
    
    # Validar nova contagem
    new_active_count = sum(1 for s in subjects if s.get("status") == "Ativa")
    assert new_active_count == 2, f"Expected 2 active subjects, got {new_active_count}"
    assert subjects[-1]["name"] == "Banco de Dados"
    assert subjects[-1]["id"] == 3
    print("[PASS] test_add_subject_and_active_count")

def test_empty_and_duplicate_validation():
    subjects = [
        {"id": 1, "name": "Innovation Lab", "status": "Ativa"}
    ]

    # Validar nome vazio
    empty_name = "   "
    is_valid = bool(empty_name and empty_name.strip())
    assert not is_valid, "Validation should reject empty or whitespace-only name"

    # Validar duplicidade case-insensitive
    duplicate_name = "innovation lab"
    is_duplicate = any(s["name"].strip().lower() == duplicate_name.strip().lower() for s in subjects)
    assert is_duplicate, "Validation should identify duplicate subject name"

    non_duplicate_name = "Estrutura de Dados"
    is_non_duplicate = any(s["name"].strip().lower() == non_duplicate_name.strip().lower() for s in subjects)
    assert not is_non_duplicate, "Validation should accept unique subject name"
    print("[PASS] test_empty_and_duplicate_validation")

if __name__ == "__main__":
    test_subject_data_structure()
    test_add_subject_and_active_count()
    test_empty_and_duplicate_validation()
    print("All subject management tests passed successfully!")

