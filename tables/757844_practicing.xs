table Practicing {
  auth = false

  schema {
    int id
    timestamp created_at?=now {
      visibility = "private"
    }
  
    // nome dos alunos
    text Nome? filters=trim
  
    // registro do aluno
    int RA?
  
    // contato de email do aluno
    email email? filters=trim|lower
  
    int numero_celular?
    password password? {
      sensitive = true
      visibility = "internal"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "RA", op: "asc"}]}
  ]

  tags = ["praticando", "sala de aula", "pré-projeto"]
}