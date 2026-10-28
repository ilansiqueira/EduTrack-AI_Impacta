// List all academic tasks belonging to the authenticated user with optional subject filter
query academic_tasks verb=GET {
  api_group = "Academic Tasks"
  auth = "user"
  description = "Returns all academic tasks belonging to the authenticated user, optionally filtered by subject_id"

  input {
    int subject_id? filters=min:1 {
      description = "Optional subject ID to filter tasks"
    }
  }

  stack {
    conditional {
      if ($input.subject_id != null) {
        db.query academic_tasks {
          where = $db.academic_tasks.user_id == $auth.id && $db.academic_tasks.subject_id == $input.subject_id
          sort = {academic_tasks.due_date: "asc"}
          return = {type: "list"}
        } as $tasks
      }
      else {
        db.query academic_tasks {
          where = $db.academic_tasks.user_id == $auth.id
          sort = {academic_tasks.due_date: "asc"}
          return = {type: "list"}
        } as $tasks
      }
    }
  }

  response = $tasks
}

