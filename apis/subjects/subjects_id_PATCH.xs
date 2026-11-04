// Update a subject owned by the authenticated user
query "subjects/{id}" verb=PATCH {
  api_group = "Subjects"
  auth = "user"
  description = "Update subject fields for a subject owned by the authenticated user"

  input {
    int id filters=min:1 {
      description = "ID of the subject to update"
    }

    text name? filters=trim {
      description = "Updated name of the subject"
    }

    text teacher? filters=trim {
      description = "Updated teacher name"
    }

    int hours? {
      description = "Updated total hours"
    }
  }

  stack {
    db.get subjects {
      field_name = "id"
      field_value = $input.id
    } as $existing_subject

    precondition ($existing_subject != null && $existing_subject.user_id == $auth.id) {
      error_type = "accessdenied"
      error = "Subject not found or access denied."
    }

    util.get_raw_input {
      encoding = "json"
      exclude_middleware = false
    } as $raw_input

    db.patch subjects {
      field_name = "id"
      field_value = $input.id
      data = `$input|pick:($raw_input|keys)`|filter_null|filter_empty_text
    } as $updated_subject
  }

  response = $updated_subject
  guid = "c_6iFrVHfQbl3YV3LfT-9p_3O"
}

