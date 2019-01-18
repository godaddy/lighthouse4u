# Lighthouse4u-fs

A File System storage client for [Lighthouse4u](https://github.com/godaddy/lighthouse4u). Recommended for local
testing only.

```
{  
  store: {
    module: 'lighthouse4u-fs', options: {
      dir: './my/storage'
    }
  }
}
```


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| module | `string` | **required** | Set this to `lighthouse4u-fs` |
| options | `object` | **required** | File storage options |
| ->.dir | `string` | **required** | Relative or absolute file path of storage |
