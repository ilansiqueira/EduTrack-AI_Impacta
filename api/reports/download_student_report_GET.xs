// Download student performance report
query "reports/student_performance" verb=GET {
  api_group = "Reports"
  auth = "user"
  description = "Generate and download the student performance report"

  input {
  }

  stack {
    // Retrieve authenticated student profile
    db.get user {
      field_name = "id"
      field_value = $auth.id
      output = ["id", "name", "email", "created_at"]
    } as $user

    // Retrieve subjects owned by authenticated user
    db.query subjects {
      where = $db.subjects.user_id == $auth.id
      sort = {subjects.name: "asc"}
      return = {type: "list"}
    } as $subjects

    // Retrieve academic tasks owned by authenticated user
    db.query academic_tasks {
      where = $db.academic_tasks.user_id == $auth.id
      sort = {academic_tasks.due_date: "asc"}
      return = {type: "list"}
    } as $tasks

    // Set download response headers
    util.set_header {
      value = "Content-Type: application/pdf"
      duplicates = "replace"
    }

    util.set_header {
      value = "Content-Disposition: attachment; filename=\"relatorio_desempenho.pdf\""
      duplicates = "replace"
    }

    var $report {
      value = {
        student : $user
        subjects: $subjects
        tasks   : $tasks
      }
    }
  }

  response = $report
}

