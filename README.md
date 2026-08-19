# Stop Pay · B站防冲动消费

> 少心疼主播，多心疼自己。你的米还在，他的舰队不会塌，你的钱包要是空了可就真的塌了。刷到这条就装上吧，付款前 10 秒，帮你按住那只想充钱的手。🚫💸

一个 Chrome / Edge 浏览器扩展，用于拦截 B 站（bilibili.com）的付费弹窗，在付款前弹出劝退提醒，防止冲动消费。

<video src="https://img.shiker.tech/project/export-1787153777383.mp4" controls=""></video>

## 功能

- **网络层拦截**：在后台通过 `declarativeNetRequest` 直接屏蔽 `pay.bilibili.com` 和下单接口 `api.money.bilibili.com`（POST），让支付弹窗内容无法加载、无法创建订单。
- **页面层拦截**：在 B 站任意页面拦截「充值 / 开通大会员 / 购买 / 充电 / 送礼物 / 打赏 / 上舰」等付费入口的点击，阻止支付弹窗弹出。
- **动态检测**：通过 `MutationObserver` 监听页面中新增的支付 iframe（如扫码支付面板），一旦出现立即移除。
- **劝退页**：拦截后弹出冷静提醒，默认 10 秒倒计时，倒计时结束可点击「放弃支付」关闭；可选购（默认关闭）显示「仍然要支付」并放行 60 秒。
- **一键开关**：点击工具栏图标可快速启用 / 停用拦截，设置页可调整冷静期时长。

## 安装

1. 下载 / 克隆本仓库。
2. 打开 Chrome（或 Edge），进入扩展管理页：地址栏输入 `chrome://extensions/`（Edge 为 `edge://extensions/`）。
3. 打开右上角「开发者模式」开关。
4. 点击「加载已解压的扩展程序」，选择本目录（含 `manifest.json` 的根目录）。
5. 打开任意 B 站页面，点击工具栏的 Stop Pay 图标确认已启用。

## 目录结构

```
stop-pay/
├── manifest.json        # MV3 清单
├── background.js        # 网络层拦截规则（declarativeNetRequest）
├── content/
│   ├── content.js       # 点击拦截 + 支付 iframe 检测 + 劝退页
│   └── overlay.css      # 劝退页样式
├── popup.html / popup.js    # 工具栏开关
├── options.html / options.js  # 设置页
└── icons/               # 扩展图标
```

## 工作原理

1. **网络层（background.js）**：安装时注册动态规则，屏蔽 `pay.bilibili.com` 的所有请求与 `api.money.bilibili.com` 的 POST 请求；关闭拦截或触发「仍然要支付」放行时移除规则。
2. **页面层（content.js）**：在 `document_start` 注入，捕获 `click` / `auxclick` / `pointerdown` 事件，命中付费关键词（充值、开通、购买、充电、礼物等）或支付域名链接时阻止默认行为并弹出劝退页；`MutationObserver` 负责清除漏网之鱼（支付 iframe / 扫码面板）。

## 注意事项

- 拦截比较激进：点击带有「大会员」「充值」等文案的入口都会被劝退。这是有意为之，以保证任何付费路径都无法直接通过。
- 启用「仍然要支付」后，放行 60 秒，期间网络层规则暂停，可正常完成一次支付；60 秒后恢复拦截。

## 免责声明

本扩展仅用于个人防冲动消费目的，请理性消费。与 B 站无任何关联。
