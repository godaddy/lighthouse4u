# Lighthouse4u-sqs

An AWS Simple Queue Service queue client for [Lighthouse4u](https://github.com/godaddy/lighthouse4u).

```
{  
  queue: {
    module: 'lighthouse4u-sqs', options: {
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/897234987/lh4u'
    }
  }
}
```


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| module | `string` | **required** | Set this to `lighthouse4u-sqs` |
| options | `object` | **required** | SQS queue options |
| ->.region | `string` | **required** | AWS Region |
| ->.queueUrl | `string` | **required** | AWS SQS URL |
