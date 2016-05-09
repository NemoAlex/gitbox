var config = require('../config.js')

var util = {
  relativePath: function (path) {
    return path.replace(config.diskPath, '')
  }
}

module.exports = util
