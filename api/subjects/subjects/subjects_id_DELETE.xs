// Delete a subject owned by the authenticated user
query "subjects/{id}" verb=DELETE {
  api_group = "Subjects"
  auth = "user"
  description = "Delete a specific subject owned by the authenticated user"

  input {
    int id filters=min:1 {
      description = "ID of the subject to delete"
    }
  }

  stack {
    db.get subjects {
      field_name = "id"
      field_value = $input.id
    } as $existing_subject

    precondition ($existing_subject != null && $existing_subject.user_id == $auth.id) {
      error_type = "accessdenied"
      error = "Subject not found or access denied."
    }

    db.del subjects {
      field_name = "id"
      field_value = $input.id
    }
  }

  response = {
    success: true
  }
}

