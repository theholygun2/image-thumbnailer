resource "aws_sns_topic" "this" {
  name = var.name
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = var.email
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name        = var.name
  alarm_description = "A message is in the dead-letter queue: the worker failed on an upload repeatedly. Check the worker's CloudWatch logs."

  namespace   = "AWS/SQS"
  metric_name = "ApproximateNumberOfMessagesVisible"
  dimensions = {
    QueueName = var.queue_name
  }

  statistic           = "Maximum"
  period              = var.period_seconds
  evaluation_periods  = 1
  threshold           = var.threshold
  comparison_operator = "GreaterThanThreshold"

  # An idle SQS queue publishes no data points. Treat that as healthy
  # instead of INSUFFICIENT_DATA.
  treat_missing_data = "notBreaching"

  alarm_actions = [aws_sns_topic.this.arn]
  ok_actions    = [aws_sns_topic.this.arn] # also email when the queue is cleared

  tags = var.tags
}