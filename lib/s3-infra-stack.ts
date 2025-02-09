import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class S3InfraStack extends cdk.Stack {
  public readonly inboundBucket: s3.Bucket;
  public readonly rawBucket: s3.Bucket;
  public readonly scriptsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.inboundBucket = new s3.Bucket(this, 'InboundBucket', {
      versioned: true,
      bucketName:"cdkdemo-ram-datalake-inbound"
    });

    this.rawBucket = new s3.Bucket(this, 'RawBucket', {
      versioned: true,
      bucketName:"cdkdemo-ram-datalake-raw"
    });

    this.scriptsBucket = new s3.Bucket(this, 'ScriptsBucket', {
      versioned: true,
      bucketName:"cdkdemo-ram-scripts"
    });

    new cdk.CfnOutput(this, 'InboundBucketName', {
      value: this.inboundBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'RawBucketName', {
      value: this.rawBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'ScriptsBucketName', {
      value: this.scriptsBucket.bucketName,
    });
  }
}
