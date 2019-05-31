const { merge } = require('lodash');
const { readFileSync } = require('fs');
const { parse } = require('json5');

const defaultConfig = require('../../src/config/default-config');
const testDefaults = parse(readFileSync('./test/config/defaults.json5', 'utf8'));
const localConfig = parse(readFileSync('./test/config/COPY.json5', 'utf8'));

module.exports = () => merge({}, defaultConfig, testDefaults, localConfig);
