import * as ec2 from '@aws-cdk/aws-ec2'
import * as iam from '@aws-cdk/aws-iam'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as cdk from '@aws-cdk/core';
import { ScalableEC2 } from './scalable-ec2'

export class CdkDemoProjectStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: {}) {
    super(scope, id, props);

    const dynamoTable = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING }
    });

    const vpc = new ec2.Vpc(this, 'VPC');

    const scalableEC2 = new ScalableEC2(this, 'ScalableEC2', {
      dynamoDBTables: [{table: dynamoTable, accessType: 'FULL'}],
      allowSSH: true,
      targetRequestsPerSecond: 0.5,
      vpc
    })
  }
}

module.exports = { CdkDemoProjectStack }