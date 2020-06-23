const { DownloaderHelper } = require('node-downloader-helper');
const sha256 = require("js-sha256").sha256
const express = require('express');
const uuid = require('uuid/v1');
const logger = require('./log');
const fs = require('fs');
const app = express();

// 在这里储存任务信息
const tasks = new Map();

// 读取配置文件，设置常量
require('dotenv').config();
var prefix;
if(process.env.USE_HTTPS === "true") {
    prefix = "https://" + process.env.SERVER_NAME + "/";
} else {
    prefix = "http://" + process.env.SERVER_NAME + "/";
}
const passphrase = sha256(process.env.PASSWORD);
const tempDir = __dirname+'/temp'
const downloadDir = __dirname+'/files';
const CODE_SUCCESS = 0;
const CODE_DOWNLOADING = 1;
const CODE_CANCELING = 2;
const CODE_DOWNLOAD_FAIL = -1;
const CODE_NOT_FOUND = -2;
const CODE_WRONG_INPUT = -3;

// 接口：新建任务
// 示例：{URL: "https://example.com/xxx", name: "xxx"}
app.post('/tasks', (req, res) => {
    var jsonString = '';
    req.on("data", (chunk) => {
        jsonString += chunk;
    })
    req.on("end", () => {
        try {
            var body = JSON.parse(jsonString);
        } catch (error) {
            console.log(jsonString);
            res.json({ code: CODE_WRONG_INPUT, errmsg: error.message});
            return;
        }
        if(body.URL === '' || body.name == '' || body.URL === undefined || body.name == undefined) {
            res.json({ code: CODE_WRONG_INPUT, errmsg: 'URL与文件名不能为空'});
            return;
        }
        var downloader = new DownloaderHelper(body.URL, tempDir, {fileName: body.name});
        var id = uuid();
        tasks.set(id, {code: CODE_DOWNLOADING, progress: 0, errmsg: "", downloader: downloader});
        downloader.on("progress", (status) => {
            let t = tasks.get(id);
            t.progress = Number(status.progress).toFixed(1);
            tasks.set(id, t);
        })
        downloader.on("error", (err) => {
            tasks.set(id, {code: CODE_DOWNLOAD_FAIL, progress: 0, errmsg: err.message, downloader: null});
            logger.fail(body.name, body.URL, err.message);
        })
        downloader.on("end", () => {
            let t = tasks.get(id);
            if(t.code == CODE_CANCELING) {
                tasks.delete(req.params.id);
                fs.unlinkSync(tempDir+'/'+body.name);
                logger.fail(body.name, body.URL, 'Canceled.');
            } else {
                fs.rename(tempDir+'/'+body.name, downloadDir+'/'+body.name, ()=>{});
                tasks.set(id, {code: CODE_SUCCESS, progress: 100, errmsg: "", downloader: null});
                logger.succ(body.name, body.URL);
            }
        })
        res.json({code:CODE_SUCCESS, ID:id});
        downloader.start().catch(()=>{});
    })
})

// 接口：查询任务信息
app.get('/tasks/:id', (req, res) => {
    if(tasks.has(req.params.id)) {
        let t = tasks.get(req.params.id);
        if(t.progress == 100) {
            setTimeout(() => {
                tasks.delete(req.params.id);
            }, 20000);
        }
        res.json({code: t.code, progress: t.progress, errmsg: t.errmsg});
    } else {
        res.json({code: CODE_NOT_FOUND, progress: 0, errmsg: "任务不存在"});
    }
})

// 接口：删除任务
app.delete('/tasks/:id', (req, res) => {
    if(tasks.has(req.params.id)) {
        let t = tasks.get(req.params.id);
        t.code = CODE_CANCELING;
        tasks.set(req.params.id, t)
        t.downloader.stop().catch(()=>{});
    }
    res.json({code: CODE_SUCCESS, errmsg: ""});
})

// 接口：获取文件及其链接的列表
app.get('/files', (_req, res) => {
    fs.readdir(downloadDir, (_err, fileName) => {
        let files = [];
        for(let i = 0; i < fileName.length; i++) {
            files.push({name: fileName[i], URL: prefix+fileName[i]});
        }
        res.json(files);
    })
})

// 接口：删除已下载文件
app.delete('/files/:name', (req, res) => {
    fs.exists(downloadDir+'/'+req.params.name, (exists) => {
        if(exists) {
            fs.unlinkSync(downloadDir+'/'+req.params.name);
            res.json({ code: CODE_SUCCESS, errmsg: "" });
        } else {
            res.json({ code: CODE_NOT_FOUND, errmsg: "文件不存在"});
        }
    })
})

app.listen(Number.parseInt(process.env.PORT), ()=>{
    logger.init();
});