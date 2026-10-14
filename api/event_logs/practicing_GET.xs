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
  guid = "eXQYYd1iF6ct2E5fe3bPuPq1jw8"
}