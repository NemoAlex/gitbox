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
  , AV = require('leancloud-storage')
  , githubhook = require('githubhook')
  , cookieParser = require('cookie-parser')
  , ignore = require('ignore')

app.use(express.static(Path.join(__dirname, 'static')))
app.use(cookieParser())
app.post('*', bodyParser.json(), bodyParser.urlencoded({ extended: false }))

app.set('view engine', 'jade')

if (config.enableRegister) {
  app.get('/sign_up', (req, res) => {
    res.render('sign_up.jade', {
      projectName: config.projectName
    })
  })

  app.post('/sign_up', (req, res) => {
    var user = new AV.User()
    user.setUsername(req.body.username)
    user.setPassword(req.body.password)
    user.signUp().then(function (loginedUser) {
      return res.redirect('/')
    }, function (error) {
      return res.redirect('/sign_up')
    })
  })
}

if (config.requireLogin) {
  AV.init(config.leancloud)

  app.get('/login', (req, res) => {
    res.render('login.jade', {
      config
    })
  })

  app.post('/login', (req, res) => {
    AV.User.logIn(req.body.username, req.body.password)
    .then(result => {
      res.cookie('authentication', result._sessionToken, { maxAge: 900000, httpOnly: true })
      return res.redirect('/')
    })
    .catch(err => {
      return res.redirect('/login')
    })
  })

  app.get('/logout', (req, res) => {
    res.cookie('authentication', '')
    res.redirect('/')
  })

  app.use((req, res, next) => {
    var token = req.cookies.authentication
    if (!token) return res.redirect('/login')
    AV.User.become(token)
    .then(loginedUser => {
      req.authentication = { user: loginedUser.get('username') }
      next()
    }).catch(err => {
      req.redirect('/login')
    })
  })
}

app.get('/', (req, res) => {
  res.render('index.jade', {
    config,
    username: req.authentication ? req.authentication.user : '匿名用户'
  })
})

var ig = ignore()
if (fs.existsSync(config.diskPath + '/.gitignore')) {
  ig.add(fs.readFileSync(config.diskPath + '/.gitignore').toString())
}
if (fs.existsSync('.gitboxignore')) {
  ig.add(fs.readFileSync('.gitboxignore').toString())
}
app.get('/tree', (req, res) => {
  var root = config.diskPath
  var tree = dirTree(root, ig)
  res.json({root, tree})
})

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
  git.updateToOrigin('Update by ' + req.authentication ? req.authentication.user : '匿名用户')
})

app.post('/create_folder', (req, res) => {
  var path = req.body.path
  fs.mkdirSync(config.diskPath + path)

  res.end()
})

app.post('/write_file', (req, res) => {
  var path = req.body.path
    , content = req.body.content

  fs.writeFileSync(config.diskPath + path, content)
  res.end()
  git.updateToOrigin('Update by ' + req.authentication ? req.authentication.user : '匿名用户')
})

app.get('/read_file', (req, res) => {
  var path = req.query.path

  var content = fs.readFileSync(config.diskPath + path, 'UTF-8')
  res.end(content)
})

app.post('/rename', (req, res) => {
  var path = config.diskPath + req.body.path
  var newname = req.body.newname
  var arr = path.split('/')
  arr[arr.length - 1] = newname
  var newPath = arr.join('/')

  fs.renameSync(path, newPath)

  res.end()
  git.updateToOrigin('Update by ' + req.authentication ? req.authentication.user : '匿名用户')
})

app.post('/remove', (req, res) => {
  var path = config.diskPath + req.body.path
  rimraf(path, function () {
    res.end()
    git.updateToOrigin('Update by ' + req.authentication ? req.authentication.user : '匿名用户')
  })
})

app.get('/commit_and_push', (req, res) => {
  git.updateToOrigin('Update by ' + req.authentication ? req.authentication.user : '匿名用户')
  .then(function (log) {
    res.json(log)
  })
  .catch(function (err) {
    res.status(403).send(err)
  })
})

app.listen(config.ports.app, function () {
  console.log('gitbox listening on port ' + config.ports.app)
})

var  github = githubhook({ port: config.ports.webhook })

github.on('*', function () {
  git.pull()
})

github.listen()
