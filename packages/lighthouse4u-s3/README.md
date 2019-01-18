# Lighthouse4u-s3

An AWS S3 storage client for [Lighthouse4u](https://github.com/godaddy/lighthouse4u).

```
{  
  store: {
    module: 'lighthouse4u-s3', options: {
      region: 'us-east-1',
      bucket: 'my-lh4u-bucket'
    }
  }
}
```


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| module | `string` | **required** | Set this to `lighthouse4u-s3` |
| options | `object` | **required** | S3 storage options |
| ->.region | `string` | **required** | AWS Region |
| ->.bucket | `string` | **required** | AWS S3 Bucket |
