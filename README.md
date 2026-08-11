# 🌤️ 天气查询 Weather App

一个简约风格的天气查询单页应用，基于纯前端技术栈，可直接部署到 GitHub Pages。

## ✨ 功能特性

- 🌍 **自动定位** - 基于浏览器 Geolocation API 自动获取当前位置天气
- 🔍 **手动搜索** - 支持中文/英文城市名全球搜索
- 🌡️ **实时天气** - 显示当前温度、体感、湿度、风向风力、云量、气压
- 📅 **7日预报** - 未来一周天气趋势、温度范围、风向预报
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **简约界面** - 毛玻璃卡片 + 渐变背景，清新现代
- ⚡ **零依赖** - 纯原生 HTML/CSS/JS，加载快速
- 🆓 **完全免费** - 基于 Open-Meteo 免费 API，无需 Key，无调用限制

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 | 语义化标签，移动端适配 |
| CSS3 | CSS 变量、Flexbox/Grid、响应式媒体查询 |
| Vanilla JavaScript (ES6+) | 原生 JS，Promise/async-await |
| Open-Meteo API | 完全免费的全球天气数据服务 |
| Emoji 图标 | 使用系统原生 Emoji 作为天气图标 |

## 📁 项目结构

```
weather/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式表（含响应式设计）
├── js/
│   ├── config.js           # 全局配置（API 地址等）
│   ├── api.js              # Open-Meteo API 封装
│   ├── ui.js               # UI 渲染逻辑
│   └── app.js              # 应用主逻辑（定位、搜索、初始化）
└── README.md               # 开发文档
```

## 🚀 快速开始

### 1. 无需注册、无需 API Key！

本项目使用 [Open-Meteo](https://open-meteo.com) 免费天气 API，完全免费、无需注册、无需 API Key、无调用次数限制。

### 2. 本地运行

由于浏览器对 `file://` 协议下的定位和 API 请求有限制，建议使用本地 HTTP 服务器：

**方式一：Python**
```bash
# Python 3
python -m http.server 8000
```

**方式二：Node.js**
```bash
# 使用 npx
npx serve .

# 或使用全局安装的 serve
npm install -g serve
serve .
```

**方式三：VS Code**
- 安装 "Live Server" 插件
- 右键 `index.html` → "Open with Live Server"

然后访问 `http://localhost:8000` 即可。

### 3. 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 在仓库设置中启用 Pages：
   - **Settings** → **Pages**
   - Source 选择 `main` 分支 / `root` 目录
3. 等待几分钟，通过 `https://你的用户名.github.io/仓库名/` 访问

> 💡 **提示**：GitHub Pages 提供 HTTPS 协议，Geolocation API 需要安全上下文才能使用。

## 📖 代码架构说明

### 模块依赖关系

```
index.html
  └── js/config.js    (配置文件，被所有模块依赖)
  └── js/api.js       (API 封装，被 app.js 调用)
  └── js/ui.js        (UI 渲染，被 app.js 调用)
  └── js/app.js       (主逻辑，DOM 就绪后执行)
```

### 各模块职责

#### `config.js` - 配置中心
- 存储 Open-Meteo API 地址、超时时间、温度单位等全局配置
- 提供主题色变量供后续扩展

#### `api.js` - API 层
- **fetchAPI()**：通用请求封装，包含超时控制、错误处理
- **searchCity()**：基于 Open-Meteo 地理编码 API 的城市搜索，支持全球城市
- **getWeatherAll()**：一次请求获取当前天气 + 7日预报
- **getWeatherEmoji()**：天气代码 → Emoji 图标映射
- **getWeatherDescription()**：天气代码 → 中文描述映射
- **getWindLevel()**：风速 → 风力等级估算
- **getWindDirection()**：风向角度 → 中文方位转换

#### `ui.js` - 视图层
- **DOM**：所有 DOM 元素的引用缓存
- **renderCurrentWeather()**：渲染当前天气卡片（温度、图标、详细信息）
- **renderForecast()**：渲染 7 日预报列表
- **showLoading/Weather/Error()**：状态显示控制
- **formatTime()**：时间格式化工具
- **formatDate()**：日期格式化工具

#### `app.js` - 业务逻辑层
- **initApp()**：应用入口，绑定事件 → 尝试定位
- **bindEvents()**：绑定所有 UI 事件（搜索、定位、重试）
- **autoLocate()**：浏览器 Geolocation API 调用
- **checkGeoPermission()**：权限检查（Permissions API）
- **handleSearch()**：城市搜索处理
- **loadWeather()**：天气数据加载与渲染
- **formatCityName()**：城市名称格式化

### 执行流程

```
页面加载
  │
  ▼
initApp()
  │
  ├── 绑定 UI 事件
  │     ├── 搜索按钮 / 回车
  │     ├── 定位按钮
  │     └── 重试按钮
  │
  └── 检查定位权限
        │
        ├── granted/prompt → autoLocate()
        │     │
        │     ├── 成功 → loadWeather() → 渲染
        │     └── 失败 → 提示手动搜索
        │
        └── denied/不支持 → 提示手动搜索
```

## 🔌 API 文档参考

| 接口 | 文档地址 |
|------|---------|
| 天气数据 | https://open-meteo.com/en/docs |
| 地理编码 | https://open-meteo.com/en/docs/geocoding-api |

## 🎨 界面预览

### 当前天气卡片
- 城市名 + 更新时间
- 大温度数字 + Emoji 天气图标 + 描述
- 六格详情：体感温度、湿度、风向、风力、云量、气压

### 7 日预报列表
- 日期（今天/星期/月日）
- Emoji 天气图标 + 天气描述
- 最高/最低温度
- 风向风力

## 🔧 自定义扩展

### 修改主题色
编辑 `style.css` 顶部 CSS 变量：
```css
:root {
    --primary: #3b82f6;           /* 主色调 */
    --bg-gradient-start: #e0e7ff; /* 渐变起始 */
    --bg-gradient-end: #f0f9ff;   /* 渐变结束 */
}
```

### 启用空气质量数据
Open-Meteo 支持空气质量 API，编辑 `config.js`：
```javascript
ENABLE_AIR_QUALITY: true
```
然后在 `api.js` 的 `getWeatherAll()` 中添加 `airquality` 参数。

### 添加更多天气信息
在 `ui.js` 的 `renderCurrentWeather()` 中添加字段：
```javascript
// 例如添加降水量
DOM.precipitation.textContent = `${current.precipitation || 0}mm`;
```

对应更新 `index.html` 添加显示元素。

## ⚠️ 常见问题

### Q: 定位失败怎么办？
A: 可能原因：
1. 浏览器未授权定位权限 → 在浏览器地址栏点击锁图标开启
2. HTTP 协议下 Geolocation 不可用 → 使用 HTTPS 或本地服务器
3. 信号/GPS 不可用 → 使用城市搜索功能

### Q: 城市搜索返回空结果？
A: Open-Meteo 地理编码支持全球城市，试试：
- 使用中文名称（如"北京"、"上海"）
- 使用英文名称（如"Beijing"、"Shanghai"）
- 使用更精确的名称（如"北京市"而非"北京"）

### Q: 数据不准确？
A: Open-Meteo 提供的是全球通用天气数据，精度可能不如国内服务商。如需更精确的国内天气数据，可考虑接入和风天气、彩云天气等 API。

## 📄 许可证

本项目仅供学习交流使用，天气数据版权归 [Open-Meteo](https://open-meteo.com) 所有。