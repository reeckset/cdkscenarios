import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as cdk from '@aws-cdk/core';

import * as path from 'path';
import { QueueEncryption } from '@aws-cdk/aws-sqs';

export class LambdaExecuter extends cdk.Construct {

  queue: sqs.Queue;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    const fn = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      initialPolicy: [ new iam.PolicyStatement({
        resources: ['*'],
        actions: ['sqs:SendMessage'],
      })]
    });

    fn.addEventSource(new SqsEventSource(this.queue));
  }
}