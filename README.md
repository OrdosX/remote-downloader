# 远程下载器

部署在服务器上的下载器，利用高带宽的优势做跳板加速本地下载，主要用于加速国内下载缓慢的国外资源。

## 特性

* 密码保护，使用了安全性较高的登录方式
* 未登录也可以查看已下载文件列表，方便分享文件
* 双击下载链接输入框可读取剪贴板中复制的下载链接（需要https）
* 自动提取文件名，还可排除http请求参数干扰（如`https://example.com/example.txt?foo=bar` => `example.txt`）
* 内置实时刷新的进度条

## 部署指南

假设你将这个项目clone到`/foo/bar/remote-downloader`下

### 编译UI

```
cd /foo/bar/remote-downloader/ui
# 安装依赖
npm i
# 编译
npm run build
```

生成的文件会出现在`/foo/bar/remote-downloader/ui/dist`中

### 配置nginx

nginx安装方法自行查找，其余软件配置相似（我也不会用😂）

首先确认默认配置文件（一般是位于`/etc/nginx/sites-enabled`的`default`文件）已经备份到其他地方并已删除

在`conf.d`文件夹（一般位于`/etc/nginx`）新建一个`dl.conf`，输入以下内容

```
server {
    listen 80;
    server_name example.com;  #此处替换为你的域名，若无域名则填下划线（如server_name _;）
    index index.html;
    root /foo/bar/remote-downloader/ui/dist;  #/foo/bar/remote-downloader是前述代码目录，下同
    gzip_static on;  #使nginx使用预压缩的gz文件
    gzip_vary on;  #客户端不支持gzip压缩时返回原文件

    location /files/ {
        alias /foo/bar/remote-downloader/server/files/;
    }

    location /api/ {
        proxy_pass http://localhost:8081/;  #此处替换为你在.env文件里PORT字段设置的端口
    }
}
```

然后重新加载配置文件

```
sudo nginx -s reload
```

### 配置服务端

将`.env.example`重命名为`.env`并填写

| 项目         | 说明                 | 示例                        |
| ------------ | -------------------- | --------------------------- |
| USE_HTTPS    | 是否使用https        | true / false                |
| SERVER_NAME  | 域名或IP地址         | example.com / 114.514.19.19 |
| PASSWORD     | 访问密码             | E-5+e6Cc,Fd2=Ac1            |
| PORT         | 服务端监听的端口     | 8081                        |
| TEMP_DIR     | 临时下载目录         | temp                        |
| DOWNLOAD_DIR | 下载完成文件存放目录 | files                       |

安装依赖

```
cd /foo/bar/remote-downloader/server
npm i
```

配置进程守护

```
# 创建存放脚本的目录
mkdir -p ~/.config/systemd/user
cd ~/.config/systemd/user
# 新建并编辑脚本，名称可以自己指定
nano dl.service
```

在打开的`dl.service`中输入以下内容。`ExecStart`处的`/usr/bin/node`是node的默认安装位置，如果不确定安装在何处可以使用`which node`命令查看

```
[Unit]
Description=Remote Download Service
After=network.target
Wants=network.target

[Service]
WorkingDirectory=/foo/bar/remote-downloader/server
ExecStart=/usr/bin/node /foo/bar/remote-downloader/server/app.js
Restart=on-failure
KillMode=mixed

[Install]
WantedBy=default.target
```

启动服务并设为自启

```
systemctl --user daemon-reload
systemctl --user start dl.service
systemctl --user enable dl.service  #取消自启则将enable改成disable
```

现在访问你的域名/IP地址，应该可以正常使用

## TODO

- [ ] 编写自动安装脚本
- [ ] 由用户决定是否在未登录状态显示已下载列表