import * as s3 from '@aws-cdk/aws-s3'
import * as cdk from '@aws-cdk/core';
import { LambdaExecuter } from './lambda-executer';
import { MainApi } from './main-api';

export class CdkDemoProjectStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: {}) {
    super(scope, id, props);

    const lambdaExecuterQueue = new LambdaExecuter(this, "lambdaExecuter").queue;

    const bucket = new s3.Bucket(this, "bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,        
      websiteIndexDocument: "index.html"
    });

    new MainApi(this, "api", {
      bucket,
      queues: {executeLambda: lambdaExecuterQueue}
    })
  }
}

module.exports = { CdkDemoProjectStack }