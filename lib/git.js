var config = require('../config.js')
  , exec = require('child-process-promise').exec
  , queue = require('queue')()

queue.concurrency = 1

module.exports = {
  updateToOrigin: function (msg) {
    if (!config.useGit) return Promise.resolve()

    queue.push(function (cb) {
      console.log('start', msg)
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
      .catch(function (err) {
      })
      .then(function () {
        console.log('done')
        cb()
      })
    })
    queue.start()
  }
}


