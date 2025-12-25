# 项目结构

## 文件组织

```
├── App.tsx                 # 主应用组件，包含所有状态管理和业务逻辑
├── index.tsx              # React 应用入口点
├── index.html             # HTML 模板
├── types.ts               # TypeScript 类型定义
├── constants.tsx          # 图标组件和常量定义
├── components/            # 可复用 React 组件
│   ├── Modal.tsx          # 通用模态框组件
│   ├── RaciBadge.tsx      # RACI 角色徽章显示组件
│   ├── RoleSelect.tsx     # 角色选择下拉组件
│   └── TaskCard.tsx       # 任务卡片组件
├── services/              # 外部服务集成
│   └── geminiService.ts   # Google Gemini AI 服务
├── .env.local             # 环境变量（需要手动创建）
├── package.json           # 项目依赖和脚本
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置
└── .kiro/                 # Kiro IDE 配置
    └── steering/          # 项目指导文档
```

## 核心组件架构

### App.tsx - 主应用组件
- **职责**：应用的主要状态管理中心
- **状态管理**：任务列表、团队名册、主题、模态框状态
- **功能模块**：任务 CRUD、AI 生成、导入导出、主题切换

### 组件层次结构

#### TaskCard.tsx
- **用途**：单个任务的展示和交互
- **功能**：状态切换、RACI 角色显示、到期日期管理、展开/折叠
- **交互**：编辑、归档、删除、状态变更

#### Modal.tsx
- **用途**：通用模态框容器
- **使用场景**：任务编辑、AI 助手、团队管理

#### RaciBadge.tsx
- **用途**：显示 RACI 角色分配
- **样式**：颜色编码的角色徽章

#### RoleSelect.tsx
- **用途**：团队成员角色选择
- **功能**：单选/多选支持

## 数据流架构

### 状态管理模式
1. **集中式状态**：所有状态在 App.tsx 中管理
2. **Props 传递**：通过 props 向下传递数据和回调函数
3. **事件回调**：子组件通过回调函数向上通信

### 数据持久化
- **自动保存**：使用 useEffect 监听状态变化自动保存到 localStorage
- **初始化加载**：组件挂载时从 localStorage 恢复状态
- **错误处理**：JSON 解析失败时回退到默认值

## 开发约定

### 文件命名
- **组件文件**：PascalCase（如 TaskCard.tsx）
- **服务文件**：camelCase（如 geminiService.ts）
- **类型文件**：小写（如 types.ts）

### 组件结构
- **接口定义**：每个组件都有对应的 Props 接口
- **默认导出**：使用具名导出而非默认导出
- **类型安全**：严格的 TypeScript 类型检查

### 样式约定
- **Tailwind 优先**：使用 Tailwind CSS 类名
- **响应式设计**：移动优先的响应式布局
- **深色模式**：所有组件支持深色模式变体