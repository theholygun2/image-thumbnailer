import * as fs from "node:fs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

interface WorkerStackProps extends cdk.StackProps {
  bucket: s3.IBucket;
  queue: sqs.IQueue;
}

/**
 * Compute side of the pipeline: the Python Lambda, its SQS trigger, and the
 * IAM permissions it needs. Depends on PipelineStack (never the other way round).
 */
export class WorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WorkerStackProps) {
    super(scope, id, props);

    const { bucket, queue } = props;

    // Produced by apps/worker/scripts/build.sh
    const zipPath = path.join(__dirname, "../../apps/worker/dist/worker.zip");
    if (!fs.existsSync(zipPath)) {
      throw new Error(
        `Missing ${zipPath}. Run apps/worker/scripts/build.sh before synth/deploy.`,
      );
    }

    const fn = new lambda.Function(this, "ThumbnailWorker", {
      runtime: lambda.Runtime.PYTHON_3_12,
      // Must match the platform used in build.sh (manylinux2014_x86_64).
      architecture: lambda.Architecture.X86_64,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset(zipPath),
      // 30s x 6 = the 180s queue visibility timeout in PipelineStack.
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logGroup: new logs.LogGroup(this, "WorkerLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Least privilege: read originals, write thumbnails, nothing else.
    bucket.grantRead(fn, "uploads/*");
    bucket.grantPut(fn, "thumbnails/*");

    fn.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 1,
        // Required for the handler's batchItemFailures response to take effect.
        reportBatchItemFailures: true,
        // Cost/safety cap on parallel Lambdas (minimum allowed value is 2).
        maxConcurrency: 5,
      }),
    );

    new cdk.CfnOutput(this, "WorkerFunctionName", { value: fn.functionName });
  }
}