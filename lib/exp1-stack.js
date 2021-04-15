const sns = require('@aws-cdk/aws-sns');
const subs = require('@aws-cdk/aws-sns-subscriptions');
const sqs = require('@aws-cdk/aws-sqs');
const cdk = require('@aws-cdk/core');

class Exp1Stack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'Exp1Queue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'Exp1Topic');

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}

module.exports = { Exp1Stack }
