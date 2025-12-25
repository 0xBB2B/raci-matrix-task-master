// 简化的集成测试 - 验证基本功能
import { describe, it, expect, beforeEach } from 'vitest';
import { Task, TaskStatus } from '../types';
import { typedStorage, StorageKeys } from './index';

describe('存储服务基本集成测试', () => {
  const testTask: Task = {
    id: '1',
    title: '测试任务',
    description: '测试描述',
    status: TaskStatus.TODO,
    roles: {
      responsible: ['张三'],
      accountable: '李四',
      consulted: ['王五'],
      informed: ['赵六']
    }
  };

  beforeEach(() => {
    // 清空存储
    localStorage.clear();
  });

  it('应该能够存储和读取任务数据', () => {
    // 存储任务
    typedStorage.setItem(StorageKeys.TASKS, [testTask]);
    
    // 读取任务
    const retrieved = typedStorage.getItem(StorageKeys.TASKS);
    
    // 验证
    expect(retrieved).toEqual([testTask]);
  });

  it('应该能够存储和读取团队名册', () => {
    const roster = ['张三', '李四', '王五'];
    
    // 存储
    typedStorage.setItem(StorageKeys.ROSTER, roster);
    
    // 读取
    const retrieved = typedStorage.getItem(StorageKeys.ROSTER);
    
    // 验证
    expect(retrieved).toEqual(roster);
  });

  it('应该能够存储和读取主题设置', () => {
    // 存储
    typedStorage.setItem(StorageKeys.THEME, 'dark');
    
    // 读取
    const retrieved = typedStorage.getItem(StorageKeys.THEME);
    
    // 验证
    expect(retrieved).toBe('dark');
  });
});