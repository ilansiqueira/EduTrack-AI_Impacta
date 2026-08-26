// Add Practicing record
query practicing verb=POST {
  api_group = "Event Logs"

  input {
    dblink {
      table = "Practicing"
    }
  }

  stack {
    db.add Practicing {
      enforce_hidden_fields = false
      data = {created_at: "now"}
    } as $practicing
  }

  response = $practicing
}