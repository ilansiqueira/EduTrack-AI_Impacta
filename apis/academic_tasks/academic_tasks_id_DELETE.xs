// Delete an academic task owned by the authenticated user
query "academic_tasks/{id}" verb=DELETE {
  api_group = "Academic Tasks"
  auth = "user"
  description = "Delete an academic task owned by the authenticated user"

  input {
    int id filters=min:1 {
      description = "ID of the task to delete"
    }
  }

  stack {
    db.get academic_tasks {
      field_name = "id"
      field_value = $input.id
    } as $existing_task

    precondition ($existing_task != null && $existing_task.user_id == $auth.id) {
      error_type = "accessdenied"
      error = "Task not found or access denied."
    }

    db.del academic_tasks {
      field_name = "id"
      field_value = $input.id
    }
  }

  response = {
    success: true
  }
  guid = "esfva_rutE_QHboDNuIGi02K6"
}

