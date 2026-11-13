# CRM Customer Prototype

React 19 + TypeScript + Ant Design 6 CRM customer business demo prototype. The supplied local IconPark React icon library is included in `src/shared/icons/`.

## Online demo

After the first GitHub Pages deployment completes, open https://lsy991029-design.github.io/dingdingCRM-prototype/.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

The standard static build is written to `dist/`.

## Offline sharing

```bash
npm run build:offline
```

This produces one self-contained HTML file at `offline/index.html`. It contains the app code, Ant Design styles, and the required local icons, with no CDN or backend dependency, so it can be shared and opened directly in a browser.

All customer data is demonstration data held in browser memory and resets after a page refresh.

## 高德地图

外勤轨迹页面已接入高德地图 Web JS API 2.0。复制 `.env.example` 为 `.env.local`，填写以下值后重启 Vite：

```bash
VITE_AMAP_KEY=你的高德地图Web端Key
VITE_AMAP_SECURITY_JS_CODE=你的安全密钥
```

`VITE_AMAP_SECURITY_JS_CODE` 仅在高德控制台为该 Key 启用安全密钥时需要。Key 必须配置对应的访问域名白名单；未配置 Key 时，地图区域会显示配置提示而不会加载模拟底图。当前地图上的轨迹与定位点为原型演示坐标，后续可替换为外勤轨迹服务返回的数据。
