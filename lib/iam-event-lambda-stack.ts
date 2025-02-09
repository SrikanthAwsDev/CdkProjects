import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as fs from 'fs';

interface ProjectConfig {
  iamUserName: string;
  inboundFolderPath: string;
  lambdaCodePath: string;
  rawBucketFolderPath: string;
}

export class IamEventLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Load the configuration file
    const projectConfig: { [key: string]: ProjectConfig } = JSON.parse(
      fs.readFileSync('data/project-config.json', 'utf-8')
    );

    for (const projectName in projectConfig) {
      const config = projectConfig[projectName];

      // Import the buckets
      const inboundBucket = s3.Bucket.fromBucketName(this, `${projectName}-InboundBucket`, 'InboundBucket');
      const rawBucket = s3.Bucket.fromBucketName(this, `${projectName}-RawBucket`, 'RawBucket');
      const scriptsBucket = s3.Bucket.fromBucketName(this, `${projectName}-ScriptsBucket`, 'ScriptsBucket');

      // IAM User creation
      const iamUser = new iam.User(this, `${config.iamUserName}`, {
        userName: config.iamUserName,
      });

      // Policy for inbound folder put access
      const putPolicy = new iam.Policy(this, `${projectName}-PutPolicy`, {
        statements: [
          new iam.PolicyStatement({
            actions: ['s3:PutObject'],
            resources: [`${inboundBucket.bucketArn}/${config.inboundFolderPath}*`],
          }),
        ],
      });

      iamUser.attachInlinePolicy(putPolicy);

      // Lambda function creation
      const lambdaFunction = new lambda.Function(this, `${projectName}-LambdaHandler`, {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
      import boto3
      import os
      import urllib.parse
      
      s3_client = boto3.client('s3')
      
      def lambda_handler(event, context):
          try:
              # Extract bucket name and object key from the S3 event
              source_bucket = event['Records'][0]['s3']['bucket']['name']
              source_key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
      
              # Extract folder path from environment variables
              inbound_folder_path = os.environ['INBOUND_FOLDER_PATH']
              raw_bucket_name = os.environ['RAW_BUCKET_NAME']
              raw_folder_path = os.environ['RAW_FOLDER_PATH']
      
              # Skip if the object is not in the inbound folder
              if not source_key.startswith(inbound_folder_path):
                  print(f"Object {source_key} is outside the designated folder.")
                  return
      
              # Define the destination key by transforming the path to the raw folder
              object_name = source_key[len(inbound_folder_path):]
              destination_key = f"{raw_folder_path}{object_name}"
      
              # Copy object from Inbound to Raw bucket
              s3_client.copy_object(
                  CopySource={'Bucket': source_bucket, 'Key': source_key},
                  Bucket=raw_bucket_name,
                  Key=destination_key
              )
      
              print(f"Copied {source_key} from {source_bucket} to {destination_key} in {raw_bucket_name}")
      
          except Exception as e:
              print(f"Error processing S3 event: {str(e)}")
        `),
        environment: {
          INBOUND_FOLDER_PATH: config.inboundFolderPath,
          RAW_BUCKET_NAME: rawBucket.bucketName,
          RAW_FOLDER_PATH: config.rawBucketFolderPath,
        },
      });
      

      // S3 Event Notification for Inbound Folder
      inboundBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3Notifications.LambdaDestination(lambdaFunction),
        {
          prefix: config.inboundFolderPath,
        }
      );
    }
  }
}
