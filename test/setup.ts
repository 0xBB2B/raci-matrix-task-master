// 测试环境设置文件
import { beforeEach } from 'vitest';

// 在每个测试前清理 localStorage
beforeEach(() => {
  localStorage.clear();
});