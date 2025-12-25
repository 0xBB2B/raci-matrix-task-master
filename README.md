# RACI Matrix Task Master

![License](https://img.shields.io/badge/license-MIT-blue.svg)

RACI Matrix Task Master represents a modern approach to task management, specifically designed to clarify roles and responsibilities within teams. By integrating the RACI model (Responsible, Accountable, Consulted, Informed) directly into a Kanban-style board, this tool ensures that every task has clear ownership and communication lines.

Additionally, it leverages AI to help break down high-level project goals into actionable tasks with suggested role assignments.

## Features

- **🛡️ RACI Matrix Integration**: Assign Responsible, Accountable, Consulted, and Informed roles to every task to eliminate ambiguity.
- **📋 Kanban Task Management**: Visualize workflow with Todo, In Progress, Done, and Archived columns.
- **✨ AI-Powered Planning**: Use the built-in AI assistant (powered by Google Gemini) to generate project plans and automatically suggest RACI roles.
- **👥 Team Roster Management**: Easily manage your team members and assign them to roles.
- **🌓 Dark/Light Mode**: Fully supported themes for comfortable viewing in any environment.
- **💾 智能压缩存储**: 基于 LZ-String 的高级存储服务，自动压缩所有 localStorage 数据，减少存储空间占用并提升性能，包含完整的压缩统计监控功能。
- **📤 Import/Export**: Backup your data to JSON or migrate it to another device.

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (Gemini)
- **Icons**: Heroicons
- **存储**: 基于 LZ-String 的智能压缩存储，支持压缩统计监控，提供全局实例 API
- **Testing**: Vitest with UI support

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd raci-matrix-task-master
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables**

    Create a `.env.local` file in the root directory and add your Gemini API key:

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

    > **Note**: The application looks for the API key in `.env.local`. Ensure this file is not committed to version control.

4.  **Run the Development Server**

    ```bash
    pnpm run dev
    ```

    The application will be available at `http://localhost:3000`.

### 测试

运行测试套件以确保所有功能正常工作：

```bash
# 运行所有测试（包括单元测试和属性测试）
pnpm run test

# 开发模式下运行测试（监视文件变化）
pnpm run test:watch

# 使用 UI 界面运行测试
pnpm run test:ui
```

#### 测试覆盖范围

- **单元测试**: 验证特定功能和边界情况
- **属性测试**: 使用 fast-check 库进行基于属性的测试，验证存储服务的通用正确性
- **压缩统计测试**: 验证 LZ-String 压缩功能和统计信息的准确性

## 使用指南

### 创建任务

点击"新建任务"打开创建模态框。填写标题、描述、截止日期，并为团队成员分配相应的 RACI 角色。

### 使用 AI 助手

点击"AI 助手"按钮打开提示窗口。描述你的项目（例如："为新咖啡品牌规划营销发布"），AI 将生成带有建议角色的任务列表。

### 管理角色

- **负责人 (R)**: 执行工作以完成任务的人员。
- **问责人 (A)**: 对任务的正确和彻底完成最终负责的人（签字人）。
- **咨询人 (C)**: 征求意见的人员，通常是主题专家；双向沟通。
- **知情人 (I)**: 了解进展情况的人员，通常只在任务完成时；单向沟通。

### 存储优化

应用使用智能压缩存储系统：
- **自动压缩**: 所有数据在存储到 localStorage 前自动使用 LZ-String 压缩
- **透明操作**: 压缩和解压缩过程对用户完全透明
- **统计监控**: 开发模式下可查看压缩效果统计信息
- **错误恢复**: 压缩失败时自动回退到原始存储方式

#### 开发者 API

项目提供了便捷的存储服务 API：

```typescript
import { storageService, typedStorage, StorageKeys } from './services';

// 使用通用存储服务
storageService.setItem('myKey', { data: 'value' });
const data = storageService.getItem('myKey');

// 使用类型安全的存储服务（推荐）
typedStorage.setItem(StorageKeys.TASKS, tasks);
const savedTasks = typedStorage.getItem(StorageKeys.TASKS);

// 获取压缩统计信息
const stats = storageService.getCompressionStats();
console.log(`压缩比率: ${stats.compressionRatio}`);
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
