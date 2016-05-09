var config = require('../config.js')
  , exec = require('child-process-promise').exec

module.exports = {
  updateToOrigin: function (msg) {
    if (!config.useGit) return Promise.resolve()

    var options = { cwd: config.diskPath }
    var log = ''
    return exec('git add . && git commit -m "' + msg + '"', options)
    .then(function (result) {
      log += (result.stdout + result.stderr)
    })
    .then(function () {
      return exec('git push', options)
    })
    .then(function (result) {
      log += (result.stdout + result.stderr)
      return log
    })
  }
}


