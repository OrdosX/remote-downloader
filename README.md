# 远程下载器

部署在外网云服务器上的下载器，主要用于加速国内下载缓慢的国外资源。

__原理__：你的互联网服务提供商（ISP）连接到目标网站服务器的网络可能不够稳定。但是，ISP到云服务器机房的连接非常稳定，而云服务器机房连接到目标网站服务器的连接也很稳定。因此，即使需要通过中间节点传输数据，也可以提高传输速度。

## 特性

* 密码保护。登录方式安全性高。
* 未登录状态下也可以查看已下载的文件列表，方便分享文件。
* 双击下载链接输入框可以读取剪贴板中复制的下载链接（本下载器需使用https）。
* 工具可以自动提取文件名，同时排除http请求参数的干扰。例如，`https://example.com/example.txt?foo=bar`会被提取为`example.txt`。
* 工具内置实时刷新的进度条。

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
# 新建并编辑脚本，名称可以自己指定
nano /etc/systemd/system/dl.service
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
sudo systemctl daemon-reload
sudo systemctl start dl.service
sudo systemctl enable dl.service  #取消自启则将enable改成disable
```

现在访问你的域名/IP地址，应该可以正常使用

## 基于nginx调试的指南

nginx.conf（或者单独的文件）配置如下，输入后保存并启动nginx服务。

```
server {
    listen 80;
    server_name _;  #此处改为下划线以便通过localhost访问
    index index.html;
    # root /foo/bar/remote-downloader/ui/dist;  #root字段注释掉或者删除
    gzip_static on;
    gzip_vary on;

    location /files/ {
        alias /foo/bar/remote-downloader/server/files/;
    }

    location /api/ {
        proxy_pass http://localhost:8081/;
    }

    location / {  #将未匹配到/files和/api的请求转发给vue-cli的开发服务器
        proxy_pass http://localhost:8080/;
    }
}
```

然后同时开两个命令行，一个切换到`ui`目录下输入`npm run serve`，另一个切换到`server`目录下输入`npm run start`，即可通过[http://localhost](http://localhost)访问本地网站。

## TODO

- [ ] 制作演示站点