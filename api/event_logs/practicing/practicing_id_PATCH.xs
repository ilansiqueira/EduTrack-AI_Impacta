// Edit Practicing record
query "practicing/{practicing_id}" verb=PATCH {
  api_group = "Event Logs"

  input {
    int practicing_id? filters=min:1
    dblink {
      table = "Practicing"
    }
  }

  stack {
    util.get_raw_input {
      encoding = "json"
      exclude_middleware = false
    } as $raw_input
  
    db.patch Practicing {
      field_name = "id"
      field_value = $input.practicing_id
      data = `$input|pick:($raw_input|keys)`|filter_null|filter_empty_text
    } as $practicing
  }

  response = $practicing
  guid = "zCLGh2ZL2iQQblg51RgleA5TNgM"
}