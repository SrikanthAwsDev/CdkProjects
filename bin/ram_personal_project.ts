#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3InfraStack } from '../lib/s3-infra-stack';
import { IamEventLambdaStack } from '../lib/iam-event-lambda-stack';

const app = new cdk.App();

// Create S3 Infrastructure Stack
const s3InfraStack = new S3InfraStack(app, 'S3InfraStack');

// Create IAM, Event, and Lambda Stack
new IamEventLambdaStack(app, 'IamEventLambdaStack');
