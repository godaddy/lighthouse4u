const URL = require('url');
const fs = require('fs');
const path = require('path');
const { ensureDir } = require('fs-extra');

module.exports = class StoreS3 {
  constructor({ dir } = {}) {
    this.dir = dir;
  }

  initialize() {
    // no special initialization support
    return Promise.resolve();
  }

  read(relPath) {
    console.log('read:', relPath);
    const absPath = path.resolve(this.dir, relPath);

    return new Promise((resolve, reject) => {
      fs.readFile(absPath, 'utf8', (err, json) => {
        if (err) return void reject(err);

        const data = JSON.parse(json);
        data.id = relPath;

        resolve(data);
      });
    });
  }

  list(url, { /*resumeKey, */maxCount = 10 } = {}) {
    const relDir = urlToDir(url);
    const absPath = path.resolve(this.dir, relDir);

    return new Promise(resolve => {
      fs.readdir(absPath, {}, (err, dirFiles) => {
        console.log('fs.readdir:', absPath, err, dirFiles);        
        if (err) return void resolve({ files: [] });

        // !!! No support for recursion or resuming (resumeKey) -- overkill for this client since it's for dev only at present

        // crazy, but sort+reverse for DESC order is faster than custom sorter
        const files = dirFiles.sort().reverse().slice(0, maxCount).map(f => ({ id: path.join(relDir, f) }));

        resolve({
          files
        });
      });
    });
  }

  async find(url, opts) {
    const ls = await this.list(url, opts);
console.log('find.ls:', ls);
    // read all docs
    await Promise.all(ls.files.map(async f => {
      const data = await this.read(f.id);
      
      // copy props
      Object.assign(f, data);

      return f; // resolve value is unused
    }));

    return ls;
  }

  write(data) {
    const relPath = data.id ? data.id : urlToKey(data.requestedUrl);
    const absPath = path.resolve(this.dir, relPath);
    const json = JSON.stringify(data, null, 2);
console.log('writing to:', absPath);
    return new Promise(async (resolve, reject) => {
      await ensureDir(path.dirname(absPath));
      fs.writeFile(absPath, json, 'utf8', err => {
        if (err) return void reject(err);

        data.id = relPath;
        data.size = json.length;

        resolve(data);
      })
    });
  }
}

function urlToDir(url) {
  const urlInfo = URL.parse(url);
  console.log('urlToDir:', url, urlInfo);
  return `${urlInfo.hostname}${urlToPath(urlInfo.pathname)}${urlInfo.pathname[urlInfo.pathname.length - 1] === '/' ? '' : `/`}`
}

function urlToKey(url) {
  // it's important that the key can be ordered by time
  const lexicalTime = new Date().toISOString();
  const urlInfo = URL.parse(url);
  return `${urlInfo.hostname}${urlToPath(urlInfo.pathname)}${urlInfo.pathname[urlInfo.pathname.length - 1] === '/' ? lexicalTime : `/${lexicalTime}`}.json`
}

function urlToPath(key) {
  // Note: replace all non-alphanumeric characters as precaution across *nix/windows
  return key.replace(/[^a-zA-Z0-9\\\/]/g, '_');
}
