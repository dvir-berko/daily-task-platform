variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name used as a prefix for all resources"
  type        = string
  default     = "daily-task-platform"
}

variable "server_image" {
  description = "ECR image URI for the server container (set after pushing to ECR)"
  type        = string
  default     = ""
}

variable "client_image" {
  description = "ECR image URI for the client container (set after pushing to ECR)"
  type        = string
  default     = ""
}

variable "twilio_account_sid" {
  description = "Twilio Account SID (stored in Secrets Manager)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token (stored in Secrets Manager)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_whatsapp_from" {
  description = "Twilio WhatsApp sender number"
  type        = string
  default     = "whatsapp:+14155238886"
}

variable "whatsapp_to" {
  description = "WhatsApp recipient number"
  type        = string
  sensitive   = true
  default     = ""
}

variable "reminder_time" {
  description = "Daily reminder time (HH:MM)"
  type        = string
  default     = "08:00"
}

variable "reminder_timezone" {
  description = "Timezone for reminders"
  type        = string
  default     = "Asia/Jerusalem"
}