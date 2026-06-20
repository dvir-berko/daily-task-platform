# ── EFS File System (SQLite persistence) ─────────────────────────────────────
resource "aws_efs_file_system" "db" {
  creation_token   = "${var.app_name}-db"
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  encrypted        = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = { Name = "${var.app_name}-efs" }
}

# ── Mount Targets (one per private subnet) ───────────────────────────────────
resource "aws_efs_mount_target" "db" {
  count           = length(aws_subnet.private)
  file_system_id  = aws_efs_file_system.db.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# ── Access Point ─────────────────────────────────────────────────────────────
resource "aws_efs_access_point" "db" {
  file_system_id = aws_efs_file_system.db.id

  root_directory {
    path = "/data"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  posix_user {
    gid = 1000
    uid = 1000
  }

  tags = { Name = "${var.app_name}-efs-ap" }
}