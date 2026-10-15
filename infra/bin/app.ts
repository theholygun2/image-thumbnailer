import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";
import { WorkerStack } from "../lib/worker-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const pipeline = new PipelineStack(app, "ThumbnailerPipeline", { env });

new WorkerStack(app, "ThumbnailerWorker", {
  env,
  bucket: pipeline.bucket,
  queue: pipeline.queue,
});