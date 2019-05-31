# Lighthouse4u-es

An Elasticsearch storage client for [Lighthouse4u](https://github.com/godaddy/lighthouse4u).

```
{  
  store: {
    module: 'lighthouse4u-es', options: {
      client: {
        node: 'http://localhost:9200'
      },
      index: {
        name: 'lh4u',
        type: 'lh4u'
      }
    }
  }
}
```


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| module | `string` | **required** | Set this to `lighthouse4u-es` |
| options | `object` | **required** | [Elasticsearch driver options](https://www.npmjs.com/package/@elastic/elasticsearch) |
| ->.client | `ESOptions` | [See Defaults](./default-options.json#L2) | Options supplied to driver for connections |
| ->.index | `ESIndexOptions` | [See Defaults](./default-options.json#L12) | Options supplied to driver upon creation of ES index |
