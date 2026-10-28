// Create a new academic task validating subject ownership
query academic_tasks verb=POST {
  api_group = "Academic Tasks"
  auth = "user"
  description = "Create a new academic task associated with the authenticated user and a valid subject"

  input {
    text title filters=trim {
      description = "Title of the academic task"
    }

    text description? filters=trim {
      description = "Detailed description of the task"
    }

    date due_date? {
      description = "Due date for the task"
    }

    text status?=pending filters=trim {
      description = "Task status (pending, in_progress, completed)"
    }

    int subject_id filters=min:1 {
      description = "ID of the subject this task belongs to"
    }
  }

  stack {
    precondition (($input.title|strlen) > 0) {
      error_type = "inputerror"
      error = "Task title is required."
    }

    db.get subjects {
      field_name = "id"
      field_value = $input.subject_id
    } as $subject

    precondition ($subject != null && $subject.user_id == $auth.id) {
      error_type = "inputerror"
      error = "Invalid subject_id or access denied."
    }

    db.add academic_tasks {
      data = {
        title      : $input.title
        description: $input.description
        due_date   : $input.due_date
        status     : $input.status
        subject_id : $input.subject_id
        user_id    : $auth.id
        created_at : "now"
      }
    } as $new_task
  }

  response = $new_task
  guid = "lRUKdkbttkKIRI_tWocfuHh7PIc"
}

