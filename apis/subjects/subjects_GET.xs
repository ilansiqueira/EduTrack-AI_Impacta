// List all subjects belonging to the authenticated user
query subjects verb=GET {
  api_group = "Subjects"
  auth = "user"
  description = "Returns all subjects belonging to the authenticated user"

  input {
  }

  stack {
    db.query subjects {
      where = $db.subjects.user_id == $auth.id
      sort = {subjects.name: "asc"}
      return = {type: "list"}
    } as $user_subjects
  }

  response = $user_subjects
  guid = "QBwBWxzuq0KGDdaDxSQYyIZ4fOg"
}

