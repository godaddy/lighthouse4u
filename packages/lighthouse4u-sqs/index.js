const AWS = require('aws-sdk');

module.exports = class QueueSQS {
  constructor({ region, queueUrl } = {}) {
    if (region) {
      AWS.config.update({ region });
    }
    this.sqs = new AWS.SQS({ });
    this.QueueUrl = queueUrl;
  }

  initialize() {
    // no special initialization support
    return Promise.resolve();
  }

  async dequeue() {
    const { QueueUrl } = this;
    const params = { QueueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 1 };
    return new Promise((resolve, reject) => {
      this.sqs.receiveMessage(params, (err, data) => {
        if (err) return void reject(err);

        if (!data.Messages) return resolve();

        data.Messages.forEach(msg => {
          // msg.data is only required LH4U property
          msg.data = JSON.parse(msg.Body);
        });

        resolve(data.Messages[0]); // first only
      });
    });
  }

  ack({ ReceiptHandle }) {
    const { QueueUrl } = this;
    const params = {
      QueueUrl,
      ReceiptHandle
    };

    return new Promise((resolve, reject) => {
      this.sqs.deleteMessage(params, (err) => {
        if (err) return void reject(err);

        resolve();
      })
    });
  }

  nack({ ReceiptHandle }) {
    const { QueueUrl } = this;
    const params = {
      QueueUrl,
      ReceiptHandle,
      VisibilityTimeout: 0 // make available for re-processing immediately
    };

    return new Promise((resolve, reject) => {
      this.sqs.changeMessageVisibility(params, (err) => {
        if (err) return void reject(err);

        resolve();
      })
    });
  }

  enqueue(data) {
    const { QueueUrl } = this;
    const MessageBody = JSON.stringify(data, null, 2);
    const params = {
      QueueUrl,
      MessageBody,
      DelaySeconds: 0
    };

    return new Promise((resolve, reject) => {
      this.sqs.sendMessage(params, (err, data) => {
        if (err) return void reject(err);

        resolve(data);
      })
    });
  }
}
