resource "ibm_database" "mongodb" {
  resource_group_id = ibm_resource_group.resource_group.id
  name              = "mongodbee-tutorial"
  service           = "databases-for-mongodb"
  plan              = "enterprise"
  location          = var.region
  version           = "4.4"
  adminpassword = var.admin_password

  group {
    group_id = "member"

    members {
      allocation_count = 3
    }

    memory {
      allocation_mb = 14336
    }

    disk {
      allocation_mb = 20480
    }

    cpu {
      allocation_count = 6
    }
  }

  group {
    group_id = "analytics"

    members {
      allocation_count = 1
    }
  }

  group {
    group_id = "bi_connector"

    members {
      allocation_count = 1
    }
  }
  timeouts {
    create = "120m"
    update = "120m"
    delete = "15m"
  }
}


data "ibm_database_connection" "icd_conn" {
  deployment_id = ibm_database.mongodb.id
  user_type     = "database"
  user_id       = "admin"
  endpoint_type = "public"
}

output "analytics" {
  description = "Analytics Node connection string"
  value       = data.ibm_database_connection.icd_conn.analytics
  sensitive = true
}

output "bi_connector" {
  description = "BI Connector connection string"
  value       = data.ibm_database_connection.icd_conn.bi_connector
  sensitive = true
}
