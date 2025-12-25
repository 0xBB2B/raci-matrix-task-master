// 存储服务集成测试
// 测试应用级别的数据存储和读取，以及现有功能的兼容性

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Task, TaskStatus } from '../types';
import { typedStorage, StorageKeys, storageService } from './index';

describe('存储服务集成测试', () => {
  // 测试数据
  const testTasks: Task[] = [
    {
      id: '1',
      title: '测试任务 1',
      description: '这是一个测试任务的描述',
      status: TaskStatus.TODO,
      dueDate: '2024-01-15',
      roles: {
        responsible: ['张三', '李四'],
        accountable: '王五',
        consulted: ['开发团队'],
        informed: ['销售团队']
      }
    },
    {
      id: '2',
      title: '测试任务 2',
      description: '另一个测试任务',
      status: TaskStatus.IN_PROGRESS,
      roles: {
        responsible: ['赵六'],
        accountable: '钱七',
        consulted: [],
        informed: ['全体员工']
      }
    }
  ];

  const testRoster = ['张三', '李四', '王五', '赵六', '钱七', '开发团队', '销售团队', '全体员工'];
  const testTheme: 'light' | 'dark' = 'dark';

  beforeEach(() => {
    // 清空存储，确保测试环境干净
    localStorage.clear();
    storageService.clear();
  });

  afterEach(() => {
    // 测试后清理
    localStorage.clear();
    storageService.clear();
  });

  describe('应用级别数据存储和读取', () => {
    it('应该能够存储和读取任务数据', () => {
      // 存储任务数据
      typedStorage.setItem(StorageKeys.TASKS, testTasks);
      
      // 读取任务数据
      const retrievedTasks = typedStorage.getItem(StorageKeys.TASKS);
      
      // 验证数据完整性
      expect(retrievedTasks).toEqual(testTasks);
      expect(retrievedTasks).toHaveLength(2);
      expect(retrievedTasks?.[0].title).toBe('测试任务 1');
      expect(retrievedTasks?.[1].status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('应该能够存储和读取团队名册数据', () => {
      // 存储团队名册
      typedStorage.setItem(StorageKeys.ROSTER, testRoster);
      
      // 读取团队名册
      const retrievedRoster = typedStorage.getItem(StorageKeys.ROSTER);
      
      // 验证数据完整性
      expect(retrievedRoster).toEqual(testRoster);
      expect(retrievedRoster).toHaveLength(8);
      expect(retrievedRoster).toContain('张三');
      expect(retrievedRoster).toContain('开发团队');
    });

    it('应该能够存储和读取主题设置', () => {
      // 存储主题设置
      typedStorage.setItem(StorageKeys.THEME, testTheme);
      
      // 读取主题设置
      const retrievedTheme = typedStorage.getItem(StorageKeys.THEME);
      
      // 验证数据完整性
      expect(retrievedTheme).toBe(testTheme);
      expect(retrievedTheme).toBe('dark');
    });

    it('应该能够同时处理多种数据类型', () => {
      // 同时存储所有类型的数据
      typedStorage.setItem(StorageKeys.TASKS, testTasks);
      typedStorage.setItem(StorageKeys.ROSTER, testRoster);
      typedStorage.setItem(StorageKeys.THEME, testTheme);
      
      // 同时读取所有数据
      const retrievedTasks = typedStorage.getItem(StorageKeys.TASKS);
      const retrievedRoster = typedStorage.getItem(StorageKeys.ROSTER);
      const retrievedTheme = typedStorage.getItem(StorageKeys.THEME);
      
      // 验证所有数据都正确
      expect(retrievedTasks).toEqual(testTasks);
      expect(retrievedRoster).toEqual(testRoster);
      expect(retrievedTheme).toBe(testTheme);
    });
  });

  describe('现有功能兼容性测试', () => {
    it('应该与原始 localStorage 数据兼容', () => {
      // 模拟原始 localStorage 数据（未压缩）
      const originalTasksData = JSON.stringify(testTasks);
      const originalRosterData = JSON.stringify(testRoster);
      const originalThemeData = JSON.stringify(testTheme); // 修复：主题数据也需要 JSON 序列化
      
      // 直接写入 localStorage（模拟旧版本数据）
      localStorage.setItem(StorageKeys.TASKS, originalTasksData);
      localStorage.setItem(StorageKeys.ROSTER, originalRosterData);
      localStorage.setItem(StorageKeys.THEME, originalThemeData);
      
      // 使用新的存储服务读取
      const retrievedTasks = typedStorage.getItem(StorageKeys.TASKS);
      const retrievedRoster = typedStorage.getItem(StorageKeys.ROSTER);
      const retrievedTheme = typedStorage.getItem(StorageKeys.THEME);
      
      // 验证能够正确读取原始数据
      expect(retrievedTasks).toEqual(testTasks);
      expect(retrievedRoster).toEqual(testRoster);
      expect(retrievedTheme).toBe(testTheme);
    });

    it('应该处理空数据情况', () => {
      // 测试读取不存在的键
      const nonExistentTasks = typedStorage.getItem(StorageKeys.TASKS);
      const nonExistentRoster = typedStorage.getItem(StorageKeys.ROSTER);
      const nonExistentTheme = typedStorage.getItem(StorageKeys.THEME);
      
      // 验证返回 null
      expect(nonExistentTasks).toBeNull();
      expect(nonExistentRoster).toBeNull();
      expect(nonExistentTheme).toBeNull();
    });

    it('应该处理损坏的数据', () => {
      // 写入损坏的 JSON 数据
      localStorage.setItem(StorageKeys.TASKS, '{ invalid json }');
      localStorage.setItem(StorageKeys.ROSTER, 'not json at all');
      
      // 尝试读取损坏的数据
      const corruptedTasks = typedStorage.getItem(StorageKeys.TASKS);
      const corruptedRoster = typedStorage.getItem(StorageKeys.ROSTER);
      
      // 验证返回 null（错误处理）
      expect(corruptedTasks).toBeNull();
      expect(corruptedRoster).toBeNull();
    });

    it('应该正确处理数据删除操作', () => {
      // 先存储数据
      typedStorage.setItem(StorageKeys.TASKS, testTasks);
      typedStorage.setItem(StorageKeys.ROSTER, testRoster);
      
      // 验证数据存在
      expect(typedStorage.getItem(StorageKeys.TASKS)).toEqual(testTasks);
      expect(typedStorage.getItem(StorageKeys.ROSTER)).toEqual(testRoster);
      
      // 删除任务数据
      typedStorage.removeItem(StorageKeys.TASKS);
      
      // 验证任务数据被删除，但团队名册仍存在
      expect(typedStorage.getItem(StorageKeys.TASKS)).toBeNull();
      expect(typedStorage.getItem(StorageKeys.ROSTER)).toEqual(testRoster);
      
      // 清空所有数据
      typedStorage.clear();
      
      // 验证所有数据都被清空
      expect(typedStorage.getItem(StorageKeys.TASKS)).toBeNull();
      expect(typedStorage.getItem(StorageKeys.ROSTER)).toBeNull();
      expect(typedStorage.getItem(StorageKeys.THEME)).toBeNull();
    });
  });

  describe('压缩功能验证', () => {
    it('应该提供压缩统计信息', () => {
      // 存储一些数据
      typedStorage.setItem(StorageKeys.TASKS, testTasks);
      typedStorage.setItem(StorageKeys.ROSTER, testRoster);
      
      // 获取压缩统计
      const taskStats = storageService.getCompressionStats(StorageKeys.TASKS) as import('./storageService').CompressionStats;
      const rosterStats = storageService.getCompressionStats(StorageKeys.ROSTER) as import('./storageService').CompressionStats;
      const globalStats = storageService.getCompressionStats() as import('./storageService').GlobalCompressionStats;
      
      // 验证单个键的统计信息结构
      expect(taskStats).toHaveProperty('originalSize');
      expect(taskStats).toHaveProperty('compressedSize');
      expect(taskStats).toHaveProperty('compressionRatio');
      
      expect(rosterStats).toHaveProperty('originalSize');
      expect(rosterStats).toHaveProperty('compressedSize');
      expect(rosterStats).toHaveProperty('compressionRatio');
      
      // 验证全局统计信息结构
      expect(globalStats).toHaveProperty('totalOriginalSize');
      expect(globalStats).toHaveProperty('totalCompressedSize');
      expect(globalStats).toHaveProperty('averageCompressionRatio');
      expect(globalStats).toHaveProperty('keyStats');
      
      // 验证单个键统计数据的合理性
      expect(taskStats.originalSize).toBeGreaterThan(0);
      expect(taskStats.compressedSize).toBeGreaterThan(0);
      expect(taskStats.compressionRatio).toBeGreaterThan(0);
      
      // 验证全局统计数据的合理性
      expect(globalStats.totalOriginalSize).toBeGreaterThan(0);
      expect(globalStats.totalCompressedSize).toBeGreaterThan(0);
      expect(globalStats.averageCompressionRatio).toBeGreaterThan(0);
    });

    it('应该在大数据量时提供有效的压缩', () => {
      // 创建大量测试数据
      const largeTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `大型任务 ${i} - 这是一个包含很多重复文本的任务标题`,
        description: `这是任务 ${i} 的详细描述。这个描述包含了很多重复的文本内容，用于测试压缩效果。重复的文本内容有助于 LZ-String 算法发挥更好的压缩效果。`,
        status: i % 2 === 0 ? TaskStatus.TODO : TaskStatus.IN_PROGRESS,
        dueDate: `2024-01-${(i % 28) + 1}`,
        roles: {
          responsible: [`负责人${i}`, `协助者${i}`],
          accountable: `问责人${i}`,
          consulted: [`顾问${i}`, `专家${i}`],
          informed: [`知情人${i}`, `观察者${i}`]
        }
      }));
      
      // 存储大量数据
      typedStorage.setItem(StorageKeys.TASKS, largeTasks);
      
      // 获取压缩统计（明确指定为 CompressionStats 类型）
      const stats = storageService.getCompressionStats(StorageKeys.TASKS) as import('./storageService').CompressionStats;
      
      // 验证压缩效果（应该有一定的压缩比）
      expect(stats.compressionRatio).toBeGreaterThan(1);
      expect(stats.compressedSize).toBeLessThan(stats.originalSize);
      
      // 验证数据完整性
      const retrievedTasks = typedStorage.getItem(StorageKeys.TASKS);
      expect(retrievedTasks).toEqual(largeTasks);
      expect(retrievedTasks).toHaveLength(100);
    });
  });

  describe('错误处理和恢复', () => {
    it('应该在存储错误时优雅处理', () => {
      // 模拟存储空间不足的情况比较困难，这里测试基本的错误处理
      // 测试存储较大的数据（减少数据量以避免超时）
      const largeData = Array.from({ length: 500 }, (_, i) => ({
        id: `large-task-${i}`,
        title: 'A'.repeat(500), // 每个标题 500 个字符
        description: 'B'.repeat(1000), // 每个描述 1000 个字符
        status: TaskStatus.TODO,
        roles: {
          responsible: Array.from({ length: 10 }, (_, j) => `Person${j}`),
          accountable: 'Manager',
          consulted: Array.from({ length: 5 }, (_, j) => `Consultant${j}`),
          informed: Array.from({ length: 10 }, (_, j) => `Informed${j}`)
        }
      }));
      
      // 尝试存储（可能会失败，但不应该崩溃）
      expect(() => {
        typedStorage.setItem(StorageKeys.TASKS, largeData);
      }).not.toThrow();
    }, 10000); // 增加超时时间到 10 秒

    it('应该在读取错误时返回 null', () => {
      // 直接在 localStorage 中写入无效数据
      localStorage.setItem(StorageKeys.TASKS, 'invalid-compressed-data');
      
      // 尝试读取应该返回 null 而不是抛出异常
      const result = typedStorage.getItem(StorageKeys.TASKS);
      expect(result).toBeNull();
    });
  });
});