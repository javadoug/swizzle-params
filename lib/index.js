'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _swizzle = require('./swizzle');

Object.defineProperty(exports, 'Swizzle', {
  enumerable: true,
  get: function get() {
    return _swizzle.Swizzle;
  }
});

var _fileSystem = require('./file-system');

Object.defineProperty(exports, 'sfs', {
  enumerable: true,
  get: function get() {
    return _fileSystem.sfs;
  }
});

var _config = require('./config');

Object.defineProperty(exports, 'SwizzleConfig', {
  enumerable: true,
  get: function get() {
    return _config.SwizzleConfig;
  }
});
//# sourceMappingURL=index.js.map