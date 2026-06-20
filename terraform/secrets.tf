# ── Secrets Manager: Twilio credentials ─────────────────────────────────────
resource "aws_secretsmanager_secret" "twilio" {
  name                    = "${var.app_name}/twilio"
  description             = "Twilio API credentials for WhatsApp integration"
  recovery_window_in_days = 7

  tags = { Name = "${var.app_name}-twilio-secret" }
}

resource "aws_secretsmanager_secret_version" "twilio" {
  secret_id = aws_secretsmanager_secret.twilio.id
  secret_string = jsonencode({
    TWILIO_ACCOUNT_SID   = var.twilio_account_sid
    TWILIO_AUTH_TOKEN    = var.twilio_auth_token
    TWILIO_WHATSAPP_FROM = var.twilio_whatsapp_from
    WHATSAPP_TO          = var.whatsapp_to
  })

  # Only create if credentials are provided
  count = (var.twilio_account_sid != "" && var.twilio_auth_token != "") ? 1 : 0
}