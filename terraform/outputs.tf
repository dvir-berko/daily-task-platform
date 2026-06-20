output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer (your app URL)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_server_url" {
  description = "ECR repository URL for the server image"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_client_url" {
  description = "ECR repository URL for the client image"
  value       = aws_ecr_repository.client.repository_url
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "efs_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.db.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "push_commands" {
  description = "Commands to build and push Docker images to ECR"
  value = <<-EOT
    # Authenticate Docker to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com

    # Build & push server
    docker build -t ${aws_ecr_repository.server.repository_url}:latest ./server
    docker push ${aws_ecr_repository.server.repository_url}:latest

    # Build & push client
    docker build -t ${aws_ecr_repository.client.repository_url}:latest ./client
    docker push ${aws_ecr_repository.client.repository_url}:latest

    # Force new deployment after push
    aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.server.name} --force-new-deployment --region ${var.aws_region}
    aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.client.name} --force-new-deployment --region ${var.aws_region}
  EOT
}