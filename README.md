# 轻记 Finy

> 记账 · 拍照 · 换币 — Finance easy · 花了什么都清晰

一款专为效率而生的轻量级记账 PWA，支持多币种记账、实时换算、自定义汇率方案与拍照记录。安装到手机桌面后如同原生 App 般使用。

## 功能特性

- **多币种记账**：支持 CNY / USD / EUR / HKD / JPY / GBP 六种货币，记账货币可独立选择并持久化记忆
- **实时换算预览**：记账时可指定「转为」目标货币，即时预览换算结果
- **自定义汇率方案**：新建方案时只需修改关心的币种，其余自动沿用默认汇率；保存后全局生效，随时切换
- **每日币种切换**：明细页每一天可独立选择展示币种，把整天的记录统一换算
- **拍照记账**：随手拍下消费凭证，图文并存
- **统计分析**：支出环形图、每日柱状图、分类占比，周/月/年切换
- **预算管理**：日/周/月周期预算，超支提醒
- **账户管理**：储蓄 / 信用账户，信用卡额度利用率
- **数据备份**：导出 / 导入 JSON 备份，导出 Markdown 报表
- **闪屏页**：启动时展示品牌闪屏，平滑淡入淡出
- **PWA**：可安装到手机桌面，全屏沉浸式体验

## 设计风格

极简清新，薄荷奶绿色系。

| 用途 | 色值 |
|------|------|
| 主色 | `#4ECDC4` |
| 渐变 | `#7ED4C6 → #4ECDC4` |
| 背景 | `#FFFFFF` |
| 主文字 | `#333333` |
| 浅文字 | `#B0B0B0` |
| 字体 | 华文楷体加粗 |

## 技术栈

- **React 18** + **Vite 5**
- **Zustand**（状态管理 + localStorage 持久化）
- **framer-motion**（动画）
- **recharts**（图表）
- **Tailwind CSS v4**
- **lucide-react**（图标）
- Hash 路由（兼容 GitHub Pages 子路径）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

开发服务器运行在 `http://localhost:5173/`。

## 目录结构

```
src/
├── assets/          静态资源（logo.png）
├── components/      通用组件（Layout / BottomNav / NumberPad / Toast / Sheet / SplashScreen 等）
├── data/            常量 / 类型 / 图标
├── store/           Zustand 状态管理（useStore.js）
├── utils/           格式化 / 汇率换算 / 统计 / 备份
├── views/           页面（Record / Records / Stats / Accounts / Budget）
├── router.jsx       Hash 路由
├── App.jsx          应用入口（闪屏 → 主界面）
├── main.jsx         React 挂载
└── index.css        全局样式
```

## 部署到 GitHub Pages

本项目已配置 GitHub Actions 自动部署（见 `.github/workflows/deploy.yml`）。

### 首次部署步骤

1. **创建 GitHub 仓库**（任意名称，如 `finy`），不要勾选初始化 README。

2. **推送代码**：
   ```bash
   git init
   git add .
   git commit -m "feat: 轻记Finy 初始版本"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/finy.git
   git push -u origin main
   ```

3. **启用 GitHub Pages**：
   - 进入仓库 **Settings → Pages**
   - **Source** 选择 `GitHub Actions`
   - 推送后 Actions 会自动构建部署

4. **访问站点**：部署完成后，站点地址为：
   ```
   https://<你的用户名>.github.io/<仓库名>/
   ```
   首次部署约需 1-2 分钟。

> 后续每次 `push` 到 `main` 分支都会自动重新部署。

## 安装到手机桌面（PWA）

部署成功后，用手机浏览器打开站点地址，按以下步骤添加到桌面：

### Android（Chrome / Edge）

1. 打开站点 `https://<你的用户名>.github.io/<仓库名>/`
2. 点击浏览器右上角 **⋮** 菜单
3. 选择 **「添加到主屏幕」**（或「安装应用」）
4. 确认后桌面会出现「轻记Finy」图标
5. 点击图标即可全屏启动，无浏览器地址栏

### iOS（Safari）

1. 打开站点 `https://<你的用户名>.github.io/<仓库名>/`
2. 点击底部 **分享** 按钮（方框+向上箭头）
3. 选择 **「添加到主屏幕」**
4. 点击 **「添加」**
5. 桌面出现「轻记Finy」图标，点击即可全屏启动

### 桌面端（Chrome / Edge）

1. 打开站点
2. 地址栏右侧会出现 **安装** 图标（或菜单 → 「安装此应用」）
3. 确认安装

## 数据存储

所有数据通过 `localStorage` 持久化存储在本地浏览器中，storage key 为 `smart-bookkeeping-storage`。清除浏览器数据会导致记录丢失，建议定期使用「设置 → 导出备份」。

## License

MIT
