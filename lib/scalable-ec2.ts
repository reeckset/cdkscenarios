import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2'
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { groupArrayBy } from './utils';
import { DynamoAccessType, getDynamoActionsForAccessType } from './dynamo-permissions';


type DynamoDBTableSpec = {table: dynamodb.Table, accessType: DynamoAccessType};

export interface Props {
  dynamoDBTables: DynamoDBTableSpec[],
  allowSSH: boolean,
  targetRequestsPerSecond?: number,
  vpc: ec2.Vpc,
}

export class ScalableEC2 extends cdk.Construct {

  private dynamoDbEndpoint: ec2.GatewayVpcEndpoint;
  public vpc: ec2.Vpc;
  public autoScalingGroup: autoscaling.AutoScalingGroup;
  public loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    this.vpc = props.vpc;

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc: this.vpc,
      internetFacing: true
    });

    this.configureAutoScalingGroup(props.allowSSH);
    
    this.configureLoadBalancer();

    this.autoScalingGroup.scaleOnRequestCount('AModestLoad', {
      targetRequestsPerSecond: props.targetRequestsPerSecond ?? 1
    });

    this.dynamoDbEndpoint = this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });
    
    this.addDynamoDBPermissions(props.dynamoDBTables);

  }

  addDynamoDBPermissions(tableSpecs: DynamoDBTableSpec[]){
    [...groupArrayBy(tableSpecs, s => s.accessType).entries()]
      .forEach(([accessType, specs]) => {
        this.dynamoDbEndpoint.addToPolicy(this.createDynamoDBPolicyStatement(accessType, specs.map(s => s.table)))
      });

    this.dynamoDbEndpoint.addToPolicy(
      new iam.PolicyStatement({
        principals: [new iam.AnyPrincipal()],
        actions: ['dynamodb:DescribeTable', 'dynamodb:ListTables'],
        resources: tableSpecs.map(t => t.table.tableArn),
      }));
  }

  createDynamoDBPolicyStatement(accessType: DynamoAccessType, tables: dynamodb.Table[]){
    const actions = getDynamoActionsForAccessType(accessType);
 
    return new PolicyStatement({
      principals: [new iam.AnyPrincipal()],
      actions,
      resources: tables.map(t => t.tableArn),
    });
  }

  configureAutoScalingGroup(noSSH: boolean){
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
    });

    if(!noSSH)
      this.autoScalingGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world')
  }

  configureLoadBalancer() {
    const listener = this.loadBalancer.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('Target', {
      port: 80,
      targets: [this.autoScalingGroup]
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');
  }
}