// Query all Practicing records
query practicing verb=GET {
  api_group = "Event Logs"

  input {
  }

  stack {
    db.query Practicing {
      return = {type: "list"}
    } as $practicing
  }

  response = $practicing
}