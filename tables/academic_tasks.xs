table academic_tasks {
  auth = false
  tags = ["tasks", "academics"]

  schema {
    int id
    timestamp created_at?=now { visibility = "private" }
    text title filters=trim
    text description? filters=trim
    date due_date?
    text status?="pending" filters=trim
    int subject_id { table = "subjects" }
    int user_id { table = "user" }
  }

  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "created_at", op: "desc"}]},
    {type: "btree", field: [{name: "user_id", op: "asc"}]},
    {type: "btree", field: [{name: "subject_id", op: "asc"}]},
    {type: "btree", field: [{name: "due_date", op: "asc"}]}
  ]
  guid = "G_R49OB6F348GZd24eMMx-20vMM"
}
