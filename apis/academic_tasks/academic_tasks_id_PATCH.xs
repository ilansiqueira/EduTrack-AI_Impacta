// Update an academic task owned by the authenticated user
query "academic_tasks/{id}" verb=PATCH {
  api_group = "Academic Tasks"
  auth = "user"
  description = "Update an academic task owned by the authenticated user"

  input {
    int id filters=min:1 {
      description = "ID of the task to update"
    }

    text title? filters=trim {
      description = "Updated title"
    }

    text description? filters=trim {
      description = "Updated description"
    }

    date due_date? {
      description = "Updated due date"
    }

    text status? filters=trim {
      description = "Updated status"
    }

    int subject_id? filters=min:1 {
      description = "Updated subject ID"
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

    conditional {
      if ($input.subject_id != null) {
        db.get subjects {
          field_name = "id"
          field_value = $input.subject_id
        } as $new_subject

        precondition ($new_subject != null && $new_subject.user_id == $auth.id) {
          error_type = "inputerror"
          error = "Invalid subject_id or access denied."
        }
      }
    }

    util.get_raw_input {
      encoding = "json"
      exclude_middleware = false
    } as $raw_input

    db.patch academic_tasks {
      field_name = "id"
      field_value = $input.id
      data = `$input|pick:($raw_input|keys)`|filter_null|filter_empty_text
    } as $updated_task
  }

  response = $updated_task
  guid = "Oui-4kIP8hxbTI3VBv3uH2YX0pU"
}

