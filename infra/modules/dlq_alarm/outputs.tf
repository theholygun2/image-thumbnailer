output "topic_arn" {
  value = aws_sns_topic.this.arn
}

output "alarm_name" {
  value = aws_cloudwatch_metric_alarm.dlq_not_empty.alarm_name
}