// Delete Practicing record.
query "practicing/{practicing_id}" verb=DELETE {
  api_group = "Event Logs"

  input {
    int practicing_id? filters=min:1
  }

  stack {
    db.del Practicing {
      field_name = "id"
      field_value = $input.practicing_id
    }
  }

  response = null
  guid = "cQhyxVtXJtjS_vlw2257GE9VCmE"
}