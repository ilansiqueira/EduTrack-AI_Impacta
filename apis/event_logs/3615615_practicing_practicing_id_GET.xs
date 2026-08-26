// Get Practicing record
query "practicing/{practicing_id}" verb=GET {
  api_group = "Event Logs"

  input {
    int practicing_id? filters=min:1
  }

  stack {
    db.get Practicing {
      field_name = "id"
      field_value = $input.practicing_id
    } as $practicing
  
    precondition ($practicing != null) {
      error_type = "notfound"
      error = "Not Found."
    }
  }

  response = $practicing
}