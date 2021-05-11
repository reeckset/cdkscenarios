import * as path from 'path';
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { WebpageWithAPI } from 'mock-cdk-serverless-website-construct';
import { NotificationAPIIntegration } from './notification-api-integration';

export class CdkDemoProjectStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: {}) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, 'UsersInfoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING }
    });

    const webpage = new WebpageWithAPI(this, 'Webpage', {
      pathToS3Content: './website-dist'
    });

    const userResource = webpage.api.root.addResource('user');

    const lambdaArguments = {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      initialPolicy: [ new iam.PolicyStatement({
        resources: [usersTable.tableArn],
        actions: ['dynamoDB:*'],
      })],
      environment: {
        tableName: usersTable.tableName
      }
    }

    const getUserLambda = new lambda.Function(this, 'GetUserLambda', {
      ...lambdaArguments,
      handler: 'get-user.handler',
    });

    const addUserLambda = new lambda.Function(this, 'AddUserLambda', {
      ...lambdaArguments,
      handler: 'add-user.handler',
    });

    userResource.addMethod('GET', new apigateway.LambdaIntegration(getUserLambda));
    userResource.addMethod('PUT', new apigateway.LambdaIntegration(addUserLambda));

    const notificationResource = webpage.api.root.addResource('notification');

    notificationResource.addMethod(
      'POST',
      new NotificationAPIIntegration(this, 'NotificationIntegration').integration,
      {
        methodResponses: [{ statusCode: "200" }],
      }
    );
  }
}

module.exports = { CdkDemoProjectStack }