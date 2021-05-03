import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { NotificationSystem } from './notification-system';

export class NotificationAPIIntegration extends cdk.Construct {

    public readonly integration: apigateway.AwsIntegration;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
    
        const notificationSystem = new NotificationSystem(this, 'NotificationSystem');

        const credentialsRole = new iam.Role(this, "notificationsRole", {
        assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        });
        
        credentialsRole.attachInlinePolicy(
        new iam.Policy(this, "notificationsPolicy", {
            statements: [
            new iam.PolicyStatement({
                actions: ["states:StartExecution"],
                effect: iam.Effect.ALLOW,
                resources: [notificationSystem.stateMachine.stateMachineArn],
            }),
            ],
        })
        );
        

        this.integration = new apigateway.AwsIntegration({
            service: "states",
            action: "StartExecution",
            integrationHttpMethod: "POST",
            options: {
                credentialsRole,
                integrationResponses: [
                {
                    statusCode: "200",
                    responseTemplates: {
                    "application/json": `{"done": true}`,
                    },
                },
                ],
                requestTemplates: {
                "application/json": `{
                    "stateMachineArn": "${notificationSystem.stateMachine.stateMachineArn}"
                    }`,
                },
            },
        });
    }
}