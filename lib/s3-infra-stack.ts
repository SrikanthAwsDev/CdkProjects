import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class S3InfraStack extends Stack {
  public readonly inboundBucket: s3.Bucket;
  public readonly rawBucket: s3.Bucket;
  public readonly scriptsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create the Inbound Bucket
    this.inboundBucket = new s3.Bucket(this, 'InboundBucket', {
      versioned: true,
      bucketName: 'cdkdemo-ram-datalake-inbound'
    });

    // Create the Raw Bucket
    this.rawBucket = new s3.Bucket(this, 'RawBucket', {
      versioned: true,
      bucketName: 'cdkdemo-ram-datalake-raw'
    });

    // Create the Scripts Bucket
    this.scriptsBucket = new s3.Bucket(this, 'ScriptsBucket', {
      versioned: true,
      bucketName: 'cdk-demo-scripts'
    });

    new cdk.CfnOutput(this, 'InboundBucketName', {
      value: this.inboundBucket.bucketName,
      description: 'Inbound S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'RawBucketName', {
      value: this.rawBucket.bucketName,
      description: 'Raw S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'ScriptsBucketName', {
      value: this.scriptsBucket.bucketName,
      description: 'Scripts S3 Bucket Name',
    });
  }
}
