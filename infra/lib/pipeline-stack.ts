import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

/**
 * Storage + messaging in ONE stack on purpose.
 * Splitting bucket and queue across stacks while wiring the S3 notification
 * creates a cyclic cross-stack reference in CDK (the queue policy needs the
 * bucket ARN, the bucket notification needs the queue ARN).
 *
 * Later stacks (worker, API host) can take `queue` / `bucket` as props.
 */
export class PipelineStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "ImagesBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Dev-friendly: `cdk destroy` removes the bucket and its objects.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Needed for browser uploads via presigned POST. Tighten origins later.
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    this.deadLetterQueue = new sqs.Queue(this, "ThumbnailDlq", {
      retentionPeriod: cdk.Duration.days(14),
      enforceSSL: true,
    });

    this.queue = new sqs.Queue(this, "ThumbnailQueue", {
      // Keep >= 6x the worker Lambda timeout (assumes a 30s timeout).
      visibilityTimeout: cdk.Duration.seconds(180),
      enforceSSL: true,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    // Only objects under uploads/ trigger the pipeline, so writing
    // thumbnails/ never retriggers the worker.
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.queue),
      { prefix: "uploads/" },
    );

    new cdk.CfnOutput(this, "BucketName", { value: this.bucket.bucketName });
    new cdk.CfnOutput(this, "QueueUrl", { value: this.queue.queueUrl });
    new cdk.CfnOutput(this, "DlqUrl", { value: this.deadLetterQueue.queueUrl });
  }
}