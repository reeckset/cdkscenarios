import * as path from 'path';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';

export class NotificationSystem extends cdk.Construct {

    readonly stateMachine: sfn.StateMachine;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
    
        const lambdaArguments = {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        }

        const sendEmail = new lambda.Function(this, 'EmailNotificationLambda', {
            ...lambdaArguments,
            handler: 'email-notification-sender.handler',
        });

        const sendSMS = new lambda.Function(this, 'SMSNotificationLambda', {
            ...lambdaArguments,
            handler: 'sms-notification-sender.handler',
        });

        const sendPushNotification = new lambda.Function(this, 'PushNotificationLambda', {
            ...lambdaArguments,
            handler: 'push-notification-sender.handler',
        });

        const sendEmailJob = new tasks.LambdaInvoke(this, 'SendEmailJob', {
            lambdaFunction: sendEmail,
            outputPath: '$.Payload',
        });

        const sendSMSJob = new tasks.LambdaInvoke(this, 'SendSMSJob', {
            lambdaFunction: sendSMS,
            inputPath: '$.user.notificationToken',
            outputPath: '$.Payload',
        });

        const sendPushNotifJob = new tasks.LambdaInvoke(this, 'Push Notification Job', {
            lambdaFunction: sendPushNotification,
            inputPath: '$.user.notificationToken',
            outputPath: '$.Payload',
        });

        const definition = sendEmailJob
            .next(new sfn.Choice(this, 'JobComplete?')
                .when(sfn.Condition.stringEquals('$.status', 'FAILED'),
                    sendSMSJob
                    .next(
                        new sfn.Choice(this, 'SMS Successful?')
                        .when(sfn.Condition.stringEquals('$.status', 'FAILED'),
                            sendPushNotifJob
                        )
                    )
                )
            );

        this.stateMachine = new sfn.StateMachine(this, 'StateMachine', {
            definition,
            timeout: Duration.seconds(60)
        });
    }
}