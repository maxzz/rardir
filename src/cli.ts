#!/usr/bin/env node

// const path = require('path');
// const src = path.join(path.dirname(process.argv[1]), './index.js');
// require(src);

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import path from 'path';
const src = path.join(path.dirname(process.argv[1]), './rardir.js');

require(src);
