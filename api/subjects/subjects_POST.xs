// Create a new subject for the authenticated user
query subjects verb=POST {
  api_group = "Subjects"
  auth = "user"
  description = "Create a new subject associated with the authenticated user"

  input {
    text name filters=trim {
      description = "Name of the subject"
    }

    text teacher? filters=trim {
      description = "Teacher name"
    }

    int hours? {
      description = "Total hours for the subject"
    }
  }

  stack {
    precondition (($input.name|strlen) > 0) {
      error_type = "inputerror"
      error = "Subject name is required."
    }

    db.add subjects {
      data = {
        name      : $input.name
        teacher   : $input.teacher
        hours     : $input.hours
        user_id   : $auth.id
        created_at: "now"
      }
    } as $new_subject
  }

  response = $new_subject
}

