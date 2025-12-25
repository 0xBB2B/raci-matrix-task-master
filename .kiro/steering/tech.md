# 技术栈

## 构建系统和框架

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 6.2.0
- **测试框架**：Vitest（支持 UI 界面）
- **样式**：Tailwind CSS（通过类名实现）
- **包管理器**：pnpm
- **AI 集成**：Google GenAI SDK (Gemini)
- **图标**：Heroicons（作为 React 组件实现）

## 开发环境配置

### 环境变量
项目需要在根目录创建 `.env.local` 文件：
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 3000）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview

# 运行测试
pnpm run test

# 运行测试（监视模式）
pnpm run test:watch

# 运行测试（UI 界面）
pnpm run test:ui
```

## 技术架构特点

### 状态管理
- 使用 React Hooks（useState, useEffect）进行本地状态管理
- 数据持久化通过浏览器 localStorage 实现
- 无外部状态管理库依赖

### 数据存储
- **任务数据**：存储在 `localStorage` 的 `raci_tasks` 键
- **团队名册**：存储在 `localStorage` 的 `raci_roster` 键  
- **主题设置**：存储在 `localStorage` 的 `theme` 键

### TypeScript 配置
- 目标：ES2022
- 模块系统：ESNext
- JSX：react-jsx
- 路径别名：`@/*` 映射到项目根目录

### 样式系统
- 使用 Tailwind CSS 实用类
- 支持深色模式（`dark:` 前缀）
- 响应式设计（`sm:`, `md:`, `lg:` 断点）

### AI 服务集成
- 使用 Google Gemini 3 Flash Preview 模型
- 结构化 JSON 输出用于任务生成
- 错误处理和降级机制