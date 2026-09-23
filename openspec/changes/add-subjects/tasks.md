## 1. Data Model and State Setup

- [x] 1.1 Define subject data structure (id, name, professor, semester, status, created_at)
- [x] 1.2 Initialize subjects in Streamlit `st.session_state` with default sample subjects

## 2. Frontend Implementation in Streamlit (`app.py`)

- [x] 2.1 Implement subject creation form in "Disciplinas" with validation (non-empty name, uniqueness check)
- [x] 2.2 Implement subject listing view displaying status, professor, and details in "Disciplinas"
- [x] 2.3 Update Dashboard "Disciplinas Ativas" metric to dynamically compute active subjects

## 3. Backend Specifications

- [x] 3.1 Define Xano table schema and API contract for subjects persistence
- [x] 3.2 Prepare API adapter function for connecting Streamlit to Xano subjects endpoints

## 4. Verification

- [x] 4.1 Test adding new subjects and verify validation on empty input
- [x] 4.2 Verify Dashboard active subject count updates immediately upon adding a subject

