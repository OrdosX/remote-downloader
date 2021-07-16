const { DownloaderHelper } = require('node-downloader-helper')
const sha256 = require('js-sha256').sha256
const express = require('express')
const session = require('express-session')
const rateLimit = require('express-rate-limit')
const sanitize = require('sanitize-filename')
const uuid = require('uuid/v4')
const logger = require('./log')
const fs = require('fs')
const app = express()
const path = require('path')
const axios = require('axios').default
const {decode} = require('urlencode')

// 在这里储存任务信息
const tasks = new Map()
// 在这里储存盐
const salts = new Map()
// 在这里储存access key
let keys = []

// 读取配置文件，设置常量
require('dotenv').config()
let prefix
if (process.env.USE_HTTPS === 'true') {
  prefix = 'https://' + process.env.SERVER_NAME
} else {
  prefix = 'http://' + process.env.SERVER_NAME
}
const tempDir = path.join(__dirname, process.env.TEMP_DIR)
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
const downloadDir = path.join(__dirname, process.env.DOWNLOAD_DIR)
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir)
const CODE_SUCCESS = 0
const CODE_DOWNLOADING = 1
const CODE_CANCELING = 2
const CODE_DOWNLOAD_FAIL = -1
const CODE_NOT_FOUND = -2
const CODE_WRONG_INPUT = -3
const CODE_UNAUTHORIZED = -4
const CODE_WRONG_PASSWORD = -5

app.use(session({
  secret: process.env.PASSWORD,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000
  }
}))
app.use((req, res, next) => {
  // 未登录用户可以登录和查看文件列表
  if (req.path === '/session' && req.method === 'POST') {
    next()
  } else if (req.path === '/salt' && req.method === 'GET') {
    next()
  } else if (req.path === '/files' && req.method === 'GET') {
    next()
  } else {
    // session中没有key则返回未登录
    if (!req.session.key) {
      res.json({ code: CODE_UNAUTHORIZED, errmsg: '未登录' })
      return
    }
    // session中的key不是由此次启动时间生成则返回登录过期
    if (!keys.find(e => { return e === req.session.key })) {
      res.json({ code: CODE_UNAUTHORIZED, errmsg: '登录过期' })
      return
    }
    next()
  }
})

// 限流文件操作（读取列表、删除文件）十分钟十次
const fileOperationLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10
})
app.use('/files', fileOperationLimit)

// 接口：通过header获取文件名
// 示例：/filename?url=xxx
app.get('/filename', (req, res) => {
  axios.head(decode(req.query['url'])).then(result => {
    if (result.headers['content-disposition']) {
      res.json({name: result.headers['content-disposition'].match(/filename=(.+)/)[1]})
    } else {
      res.json({name: ''})
    }
  }).catch(err => {
    res.json({name:''})
  })
})

// 接口：新建任务
// 示例：{URL: "https://example.com/xxx", name: "xxx"}
app.post('/tasks', (req, res) => {
  let jsonString = ''
  req.on('data', (chunk) => {
    jsonString += chunk
  })
  req.on('end', () => {
    let body
    try {
      body = JSON.parse(jsonString)
    } catch (error) {
      console.error(jsonString)
      res.json({ code: CODE_WRONG_INPUT, errmsg: error.message })
      return
    }
    if (body.URL === '' || body.name === '' || body.URL === undefined || body.name === undefined) {
      res.json({ code: CODE_WRONG_INPUT, errmsg: 'URL与文件名不能为空' })
      return
    }
    const downloader = new DownloaderHelper(body.URL, tempDir, { fileName: body.name })
    const id = uuid()
    tasks.set(id, { code: CODE_DOWNLOADING, progress: 0, errmsg: '', downloader: downloader })
    downloader.on('progress', (status) => {
      const t = tasks.get(id)
      t.progress = Number(status.progress).toFixed(1)
      tasks.set(id, t)
    })
    downloader.on('error', (err) => {
      tasks.set(id, { code: CODE_DOWNLOAD_FAIL, progress: 0, errmsg: err.message, downloader: null })
      logger.fail(body.name, body.URL, err.message)
    })
    downloader.on('end', () => {
      const t = tasks.get(id)
      if (t.code === CODE_CANCELING) {
        tasks.delete(req.params.id)
        fs.unlinkSync(tempDir + '/' + body.name)
        logger.fail(body.name, body.URL, 'Canceled.')
      } else {
        fs.rename(tempDir + '/' + body.name, downloadDir + '/' + body.name, () => {})
        tasks.set(id, { code: CODE_SUCCESS, progress: 100, errmsg: '', downloader: null })
        logger.succ(body.name, body.URL)
      }
    })
    res.json({ code: CODE_SUCCESS, ID: id })
    downloader.start().catch(() => {})
  })
})

// 接口：查询任务信息
app.get('/tasks/:id', (req, res) => {
  if (tasks.has(req.params.id)) {
    const t = tasks.get(req.params.id)
    if (t.progress == 100) {
      setTimeout(() => {
        tasks.delete(req.params.id)
      }, 20000)
    }
    res.json({ code: t.code, progress: t.progress, errmsg: t.errmsg })
  } else {
    res.json({ code: CODE_NOT_FOUND, progress: 0, errmsg: '任务不存在' })
  }
})

// 接口：删除任务
app.delete('/tasks/:id', (req, res) => {
  if (tasks.has(req.params.id)) {
    const t = tasks.get(req.params.id)
    t.code = CODE_CANCELING
    tasks.set(req.params.id, t)
    t.downloader.stop().catch(() => {})
  }
  res.json({ code: CODE_SUCCESS, errmsg: '' })
})

// 接口：获取文件及其链接的列表
app.get('/files', (req, res) => {
  const isLogin = keys.find(e => { return e == req.session.key })
  if (!isLogin && process.env.PRIVATE_FILELIST === 'true') {
    res.json({ code: CODE_UNAUTHORIZED, files: [] })
    return
  }
  fs.readdir(downloadDir, (_err, fileNames) => {
    const sortedFileNames = fileNames.sort((a, b) => {
      // 倒序排列，后来居上
      return (fs.statSync(downloadDir + '/' + b).mtimeMs - fs.statSync(downloadDir + '/' + a).mtimeMs)
    })
    const files = []
    for (let i = 0; i < sortedFileNames.length; i++) {
      const fileInfo = fs.statSync(downloadDir + '/' + sortedFileNames[i])
      const modified = fileInfo.mtime.getTime()
      const size = (() => {
        const sizeInByte = fs.statSync(downloadDir + '/' + sortedFileNames[i]).size
        if (sizeInByte == 0) return '0B'
        const t = Math.floor(Math.log(sizeInByte) / Math.log(1024))
        return (sizeInByte / Math.pow(1024, t)).toFixed(2) * 1 + ['B', 'kB', 'MB', 'GB', 'TB'][t]
      })()
      files.push({
        name: sortedFileNames[i],
        URL: prefix + '/' + process.env.DOWNLOAD_DIR + '/' + sortedFileNames[i],
        modified,
        size
      })
    }
    res.json({ code: CODE_SUCCESS, files })
  })
})

// 接口：删除已下载文件
app.delete('/files/:name', (req, res) => {
  const sanitizedName = sanitize(req.params.name)
  if (sanitizedName != req.params.name) {
    res.json({ code: CODE_NOT_FOUND, errmsg: '文件不存在' })
    return
  }
  fs.access(downloadDir + '/' + sanitizedName, (err) => {
    if (err) {
      res.json({ code: CODE_NOT_FOUND, errmsg: '文件不存在' })
    } else {
      fs.unlinkSync(downloadDir + '/' + sanitizedName)
      res.json({ code: CODE_SUCCESS, errmsg: '' })
    }
  })
})

app.get('/salt', (req, res) => {
  const saltID = uuid().slice(0, 7)
  const salt = sha256(saltID).slice(5, 9)
  salts.set(saltID, salt)
  res.json({ saltID: saltID, salt: salt })
})

// 接口：是否登录
app.get('/session', (req, res) => {
  const isLogin = keys.find(e => { return e == req.session.key })
  if (!isLogin) {
    res.json({ code: CODE_UNAUTHORIZED })
  } else {
    res.json({ code: CODE_SUCCESS })
  }
})

// 接口：登录
app.post('/session', (req, res) => {
  let jsonString = ''
  req.on('data', (chunk) => {
    jsonString += chunk
  })
  req.on('end', () => {
    let body
    try {
      body = JSON.parse(jsonString)
    } catch (error) {
      console.error(jsonString)
      res.json({ code: CODE_WRONG_INPUT, errmsg: error.message })
      return
    }
    if (!salts.has(body.saltID)) {
      res.json({ code: CODE_WRONG_PASSWORD, errmsg: '密码错误' })
      return
    }
    if (body.password === sha256(process.env.PASSWORD + salts.get(body.saltID))) {
      const key = sha256(process.env.PASSWORD + Date.now()).slice(0, 10)
      keys.push(key)
      salts.delete(body.saltID)
      req.session.key = key
      res.json({ code: CODE_SUCCESS })
    } else {
      salts.delete(body.saltID)
      res.json({ code: CODE_WRONG_PASSWORD, errmsg: '密码错误' })
    }
  })
})

app.delete('/session', (req, res) => {
  keys = keys.filter(e => { return e != req.session.key })
  res.json({ code: CODE_SUCCESS })
})

app.listen(Number.parseInt(process.env.PORT), () => {
  logger.init()
})
