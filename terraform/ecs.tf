data "aws_caller_identity" "current" {}

# ── CloudWatch Log Groups ────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/${var.app_name}/server"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "client" {
  name              = "/ecs/${var.app_name}/client"
  retention_in_days = 14
}

# ── ECS Cluster ──────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.app_name}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# ── Server Task Definition ────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "server" {
  family                   = "${var.app_name}-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "server"
    image     = var.server_image != "" ? var.server_image : "${aws_ecr_repository.server.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 3001
      protocol      = "tcp"
    }]

    environment = [
      { name = "PORT",               value = "3001" },
      { name = "DATA_DIR",           value = "/app/data" },
      { name = "REMINDER_TIME",      value = var.reminder_time },
      { name = "REMINDER_TIMEZONE",  value = var.reminder_timezone },
    ]

    secrets = [
      { name = "TWILIO_ACCOUNT_SID",   valueFrom = "${aws_secretsmanager_secret.twilio.arn}:TWILIO_ACCOUNT_SID::" },
      { name = "TWILIO_AUTH_TOKEN",    valueFrom = "${aws_secretsmanager_secret.twilio.arn}:TWILIO_AUTH_TOKEN::" },
      { name = "TWILIO_WHATSAPP_FROM", valueFrom = "${aws_secretsmanager_secret.twilio.arn}:TWILIO_WHATSAPP_FROM::" },
      { name = "WHATSAPP_TO",          valueFrom = "${aws_secretsmanager_secret.twilio.arn}:WHATSAPP_TO::" },
    ]

    mountPoints = [{
      sourceVolume  = "db-data"
      containerPath = "/app/data"
      readOnly      = false
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.server.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "server"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3001/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  volume {
    name = "db-data"
    efs_volume_configuration {
      file_system_id          = aws_efs_file_system.db.id
      root_directory          = "/"
      transit_encryption      = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.db.id
        iam             = "ENABLED"
      }
    }
  }

  tags = { Name = "${var.app_name}-server-task" }
}

# ── Client Task Definition ────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "client" {
  family                   = "${var.app_name}-client"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "client"
    image     = var.client_image != "" ? var.client_image : "${aws_ecr_repository.client.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.client.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "client"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])

  tags = { Name = "${var.app_name}-client-task" }
}

# ── Server ECS Service ────────────────────────────────────────────────────────
resource "aws_ecs_service" "server" {
  name                               = "${var.app_name}-server"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.server.arn
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 120

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = 3001
  }

  depends_on = [
    aws_lb_listener.http,
    aws_efs_mount_target.db,
    aws_iam_role_policy_attachment.ecs_execution_managed,
  ]

  tags = { Name = "${var.app_name}-server-service" }
}

# ── Client ECS Service ────────────────────────────────────────────────────────
resource "aws_ecs_service" "client" {
  name             = "${var.app_name}-client"
  cluster          = aws_ecs_cluster.main.id
  task_definition  = aws_ecs_task_definition.client.arn
  desired_count    = 1
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.client.arn
    container_name   = "client"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_managed,
  ]

  tags = { Name = "${var.app_name}-client-service" }
}