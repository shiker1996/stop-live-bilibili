# Stop Live · B站直播屏蔽

一个 Chrome / Edge MV3 浏览器扩展，用于屏蔽 B 站直播间，并从 B 站页面的推荐流中隐藏链接到直播间的卡片。

## 功能

- **屏蔽直播间**：启用时阻止导航到 `live.bilibili.com`，包括其子域名和内嵌页面，并隐藏导航栏直播入口。
- **过滤推荐卡片**：隐藏首页及其他 B 站页面中指向直播间的推荐卡片，支持页面滚动后动态载入的内容。
- **一键开关**：点击工具栏图标即可启用或停用；停用后直播间可正常访问，已隐藏卡片恢复显示。

## 安装

1. 下载 / 克隆本仓库。
2. 打开 Chrome（或 Edge）扩展管理页：`chrome://extensions/`（Edge 为 `edge://extensions/`）。
3. 打开「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择本目录（含 `manifest.json` 的根目录）。
5. 刷新已打开的 B 站页面，让扩展脚本生效。

## 工作原理

后台通过 `declarativeNetRequest` 阻止 `live.bilibili.com` 的主页面和内嵌页面请求。内容脚本拦截链接点击、隐藏导航栏入口和推荐流直播卡片，并通过 `MutationObserver` 处理动态加载的内容。

## 目录结构

```
stop-pay/
├── manifest.json        # MV3 清单
├── background.js        # 直播域名网络拦截规则
├── content/content.js   # 推荐流直播卡片过滤
├── popup.html / popup.js
├── options.html / options.js
└── icons/               # 扩展图标
```

与 B 站无任何关联。
