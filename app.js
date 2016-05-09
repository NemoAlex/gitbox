var express = require('express')
  , multer  = require('multer')
  , fs = require('fs')
  , app = express()
  , Path = require('path')
  , dirTree = require('./lib/file-tree')
  , config = require('./config')
  , bodyParser = require('body-parser')
  , rimraf = require('rimraf')
  , util = require('./lib/util')
  , git = require('./lib/git')

app.use(express.static(Path.join(__dirname, 'static')));

app.set('view engine', 'jade')

app.get('/', (req, res) => {
  res.render('index.jade', {
    projectName: config.projectName
  })
});

app.get('/tree', (req, res) => {
  var root = config.diskPath;
  var tree = dirTree(root, ['^[_|.]']);
  res.json({root, tree})
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.diskPath + req.body.path)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

app.post('/upload', upload.any(), (req, res) => {
  res.end()
});

app.post('/create_folder', bodyParser.json(), (req, res) => {
  var path = req.body.path
  fs.mkdirSync(config.diskPath + path)
  res.end()
})

app.post('/rename', bodyParser.json(), (req, res) => {
  var path = config.diskPath + req.body.path
  var newname = req.body.newname
  var arr = path.split('/')
  arr[arr.length - 1] = newname
  var newPath = arr.join('/')

  fs.renameSync(path, newPath)
  res.end()
})

app.post('/remove', bodyParser.json(), (req, res) => {
  var path = config.diskPath + req.body.path
  rimraf(path, function () {
    res.end()
  })
})

app.get('/commit_and_push', (req, res) => {
  git.updateToOrigin('Update by Nemo')
  .then(function (log) {
    res.json(log)
  })
  .catch(function (err) {
    res.status(403).send(err)
  })
})

app.listen(4500, function () {
  console.log('gitbox listening on port 4500!')
});
