# Lighthouse4u-amqp

An [AMQP](https://www.npmjs.com/package/amqplib) queue client for [Lighthouse4u](https://github.com/godaddy/lighthouse4u).

```
{  
  store: {
    module: 'lighthouse4u-amqp', options: {
      connect: {
        options: {
          url: 'amqp://user:password@host:5672/lh4u'
        }
      }
      queue: {
        name: 'lh4u'
      }
    }
  }
}
```


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| module | `string` | **required** | Set this to `lighthouse4u-s3` |
| options | `object` | **required** | S3 storage options |
| ->.connect | `object` | **required** | AWS Region |
| ->.connect.options | `object` | **required** | [Options](http://www.squaremobius.net/amqp.node/channel_api.html#connect) to connect to AMQP-compatible queue |
| ->.connect.options.url | `string` | **required** | URL of AMQP-compatible queue |
| ->.queue | `object` | **required** | Queue info |
| ->.queue.name | `string` | **required** | Name of the queue |
| ->.queue.options | `object` | optional | [Options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) to initialize channel |
