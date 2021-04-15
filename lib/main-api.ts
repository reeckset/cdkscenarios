import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

export interface Props {
    bucket: s3.Bucket,
    queues: {[endpointName: string]: sqs.Queue}
}

export class MainApi extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const gatewayRole = new iam.Role(this, "role", {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      path: "/service-role/"
    });

    props.bucket.grantReadWrite(gatewayRole);

    const api = new apigateway.RestApi(this, 'api');

    const s3Integration = new apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: "GET",
      path: props.bucket.bucketName,
      options : {
        credentialsRole: gatewayRole,      
      }
    })

    const queueIntegrations = Object.fromEntries(
      Object.entries(props.queues).map(
        ([_, queue]): [string, apigateway.AwsIntegration] => [
          _,
          new apigateway.AwsIntegration({
            service: 'sqs',
            path: queue.queueName
          })
        ]
      )
    );

    api.root.addResource("{folder}").addMethod("POST", s3Integration, {
      methodResponses: [
        {
          statusCode: "200"
        }
    ]});

    Object.entries(queueIntegrations).forEach(([endpointName, integration]) => api.root.addResource(endpointName).addMethod("POST", integration));
  }
}