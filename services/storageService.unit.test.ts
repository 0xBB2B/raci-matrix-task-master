// 存储服务的单元测试
// 测试 setItem 和 getItem 方法的具体功能

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, StorageError, StorageErrorType, CompressionStats, GlobalCompressionStats } from './storageService';

describe('StorageService 单元测试', () => {
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storageService = StorageService.getInstance();
    // 清理存储服务的内部状态
    storageService.clear();
  });

  describe('setItem 方法', () => {
    it('应该能够存储字符串数据', () => {
      const key = 'test_string';
      const value = 'Hello, World!';
      
      storageService.setItem(key, value);
      
      // 验证数据已存储到 localStorage
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够存储数字数据', () => {
      const key = 'test_number';
      const value = 42;
      
      storageService.setItem(key, value);
      
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够存储布尔值数据', () => {
      const key = 'test_boolean';
      const value = true;
      
      storageService.setItem(key, value);
      
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够存储对象数据', () => {
      const key = 'test_object';
      const value = {
        id: '123',
        name: 'Test Task',
        completed: false,
        tags: ['work', 'urgent']
      };
      
      storageService.setItem(key, value);
      
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够存储数组数据', () => {
      const key = 'test_array';
      const value = ['apple', 'banana', 'cherry'];
      
      storageService.setItem(key, value);
      
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够存储 null 值', () => {
      const key = 'test_null';
      const value = null;
      
      storageService.setItem(key, value);
      
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('应该能够覆盖已存在的键', () => {
      const key = 'test_overwrite';
      const value1 = 'first value';
      const value2 = 'second value';
      
      storageService.setItem(key, value1);
      storageService.setItem(key, value2);
      
      const retrieved = storageService.getItem(key);
      expect(retrieved).toBe(value2);
    });
  });

  describe('getItem 方法', () => {
    it('应该能够读取字符串数据', () => {
      const key = 'test_string';
      const value = 'Hello, World!';
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('应该能够读取数字数据', () => {
      const key = 'test_number';
      const value = 42;
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('应该能够读取布尔值数据', () => {
      const key = 'test_boolean';
      const value = true;
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('应该能够读取对象数据', () => {
      const key = 'test_object';
      const value = {
        id: '123',
        name: 'Test Task',
        completed: false,
        tags: ['work', 'urgent']
      };
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toEqual(value);
    });

    it('应该能够读取数组数据', () => {
      const key = 'test_array';
      const value = ['apple', 'banana', 'cherry'];
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toEqual(value);
    });

    it('应该能够读取 null 值', () => {
      const key = 'test_null';
      const value = null;
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('对于不存在的键应该返回 null', () => {
      const key = 'non_existent_key';
      
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBeNull();
    });
  });

  describe('数据往返一致性', () => {
    it('复杂对象数据往返应该保持一致', () => {
      const key = 'complex_object';
      const value = {
        tasks: [
          {
            id: 'task-1',
            title: '完成项目设计',
            description: '设计系统架构和数据模型',
            status: 'IN_PROGRESS',
            roles: {
              responsible: ['张三', '李四'],
              accountable: '王五',
              consulted: ['赵六'],
              informed: ['钱七', '孙八']
            },
            dueDate: '2024-01-15',
            priority: 'high'
          }
        ],
        roster: ['张三', '李四', '王五', '赵六', '钱七', '孙八'],
        theme: 'dark',
        settings: {
          notifications: true,
          autoSave: true,
          compressionEnabled: true
        }
      };
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toEqual(value);
    });

    it('特殊字符数据往返应该保持一致', () => {
      const key = 'special_chars';
      const value = {
        text: '这是包含特殊字符的文本：!@#$%^&*()_+-=[]{}|;:,.<>?',
        unicode: '🚀 Unicode 字符测试 🎉',
        quotes: 'Single \'quotes\' and "double quotes"',
        newlines: 'Line 1\nLine 2\r\nLine 3'
      };
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toEqual(value);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的 JSON 数据', () => {
      const key = 'invalid_json';
      
      // 直接向 localStorage 写入无效的 JSON
      localStorage.setItem(key, 'invalid json data {');
      
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBeNull();
    });

    it('应该处理空字符串', () => {
      const key = 'empty_string';
      const value = '';
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('应该处理大型数据对象', () => {
      const key = 'large_data';
      const value = {
        largeArray: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} with some additional text to make it larger`
        }))
      };
      
      storageService.setItem(key, value);
      const retrieved = storageService.getItem(key);
      
      expect(retrieved).toEqual(value);
    });
  });

  describe('压缩回退机制', () => {
    it('应该正确处理压缩和解压缩', () => {
      const key = 'compression_test';
      const value = { message: 'test data', numbers: [1, 2, 3] };
      
      // 存储数据
      storageService.setItem(key, value);
      
      // 读取数据
      const retrieved = storageService.getItem(key);
      
      // 验证数据一致性
      expect(retrieved).toEqual(value);
    });
  });

  describe('removeItem 方法', () => {
    it('应该能够删除指定的键', () => {
      const key = 'test_remove';
      const value = 'test value';
      
      // 先存储数据
      storageService.setItem(key, value);
      expect(storageService.getItem(key)).toBe(value);
      
      // 删除数据
      storageService.removeItem(key);
      expect(storageService.getItem(key)).toBeNull();
    });

    it('应该能够删除不存在的键而不报错', () => {
      const key = 'non_existent_key';
      
      // 删除不存在的键应该不报错
      expect(() => storageService.removeItem(key)).not.toThrow();
      expect(storageService.getItem(key)).toBeNull();
    });

    it('删除键后应该清除对应的压缩统计信息', () => {
      const key = 'test_stats_remove';
      const value = { data: 'test data for stats' };
      
      // 存储数据
      storageService.setItem(key, value);
      
      // 验证统计信息存在
      const statsBefore = storageService.getCompressionStats(key) as CompressionStats;
      expect(statsBefore.originalSize).toBeGreaterThan(0);
      
      // 删除数据
      storageService.removeItem(key);
      
      // 验证统计信息被清除
      const statsAfter = storageService.getCompressionStats(key) as CompressionStats;
      expect(statsAfter.originalSize).toBe(0);
      expect(statsAfter.compressedSize).toBe(0);
      expect(statsAfter.compressionRatio).toBe(1);
    });

    it('删除一个键不应该影响其他键的数据和统计', () => {
      const key1 = 'test_key_1';
      const key2 = 'test_key_2';
      const value1 = 'value 1';
      const value2 = 'value 2';
      
      // 存储两个键值对
      storageService.setItem(key1, value1);
      storageService.setItem(key2, value2);
      
      // 删除第一个键
      storageService.removeItem(key1);
      
      // 验证第一个键被删除
      expect(storageService.getItem(key1)).toBeNull();
      
      // 验证第二个键不受影响
      expect(storageService.getItem(key2)).toBe(value2);
      
      // 验证第二个键的统计信息不受影响
      const stats2 = storageService.getCompressionStats(key2) as CompressionStats;
      expect(stats2.originalSize).toBeGreaterThan(0);
    });
  });

  describe('clear 方法', () => {
    it('应该能够清空所有数据', () => {
      const testData = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: { data: 'object value' } },
        { key: 'key3', value: [1, 2, 3] }
      ];
      
      // 存储多个键值对
      testData.forEach(({ key, value }) => {
        storageService.setItem(key, value);
      });
      
      // 验证数据已存储
      testData.forEach(({ key, value }) => {
        expect(storageService.getItem(key)).toEqual(value);
      });
      
      // 清空所有数据
      storageService.clear();
      
      // 验证所有数据都被清空
      testData.forEach(({ key }) => {
        expect(storageService.getItem(key)).toBeNull();
      });
    });

    it('清空数据后应该重置所有压缩统计信息', () => {
      const testData = [
        { key: 'stats_key1', value: 'some test data' },
        { key: 'stats_key2', value: { complex: 'object data' } }
      ];
      
      // 存储数据
      testData.forEach(({ key, value }) => {
        storageService.setItem(key, value);
      });
      
      // 验证全局统计信息存在
      const globalStatsBefore = storageService.getCompressionStats() as GlobalCompressionStats;
      expect(globalStatsBefore.totalOriginalSize).toBeGreaterThan(0);
      expect(Object.keys(globalStatsBefore.keyStats)).toHaveLength(testData.length);
      
      // 清空所有数据
      storageService.clear();
      
      // 验证全局统计信息被重置
      const globalStatsAfter = storageService.getCompressionStats() as GlobalCompressionStats;
      expect(globalStatsAfter.totalOriginalSize).toBe(0);
      expect(globalStatsAfter.totalCompressedSize).toBe(0);
      expect(globalStatsAfter.averageCompressionRatio).toBe(1);
      expect(Object.keys(globalStatsAfter.keyStats)).toHaveLength(0);
      
      // 验证单个键的统计信息也被重置
      testData.forEach(({ key }) => {
        const keyStats = storageService.getCompressionStats(key) as CompressionStats;
        expect(keyStats.originalSize).toBe(0);
        expect(keyStats.compressedSize).toBe(0);
        expect(keyStats.compressionRatio).toBe(1);
      });
    });

    it('对空的存储调用 clear 应该不报错', () => {
      // 确保存储是空的
      storageService.clear();
      
      // 再次调用 clear 应该不报错
      expect(() => storageService.clear()).not.toThrow();
      
      // 验证全局统计信息为初始状态
      const globalStats = storageService.getCompressionStats() as GlobalCompressionStats;
      expect(globalStats.totalOriginalSize).toBe(0);
      expect(globalStats.totalCompressedSize).toBe(0);
      expect(globalStats.averageCompressionRatio).toBe(1);
    });
  });

  describe('压缩统计功能', () => {
    it('应该正确计算单个键的压缩统计信息', () => {
      const key = 'stats_test';
      const value = { message: 'test data', numbers: [1, 2, 3, 4, 5] };
      
      // 存储数据
      storageService.setItem(key, value);
      
      // 获取统计信息
      const stats = storageService.getCompressionStats(key) as CompressionStats;
      
      // 验证统计信息的基本属性
      expect(stats.originalSize).toBeGreaterThan(0);
      expect(stats.compressedSize).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.timestamp).toBeDefined();
      
      // 验证原始大小与 JSON 序列化后的大小一致
      const expectedOriginalSize = JSON.stringify(value).length;
      expect(stats.originalSize).toBe(expectedOriginalSize);
      
      // 验证压缩比率的计算
      expect(stats.compressionRatio).toBe(stats.originalSize / stats.compressedSize);
    });

    it('应该正确计算全局压缩统计信息', () => {
      const testData = [
        { key: 'global_stats_1', value: 'short text' },
        { key: 'global_stats_2', value: { data: 'longer text data for better compression' } },
        { key: 'global_stats_3', value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
      ];
      
      // 存储所有数据
      testData.forEach(({ key, value }) => {
        storageService.setItem(key, value);
      });
      
      // 获取全局统计信息
      const globalStats = storageService.getCompressionStats() as GlobalCompressionStats;
      
      // 验证全局统计信息
      expect(globalStats.totalOriginalSize).toBeGreaterThan(0);
      expect(globalStats.totalCompressedSize).toBeGreaterThan(0);
      expect(globalStats.averageCompressionRatio).toBeGreaterThan(0);
      expect(Object.keys(globalStats.keyStats)).toHaveLength(testData.length);
      
      // 验证总大小的计算
      const expectedTotalOriginal = testData.reduce((sum, { value }) => 
        sum + JSON.stringify(value).length, 0);
      expect(globalStats.totalOriginalSize).toBe(expectedTotalOriginal);
      
      // 验证平均压缩比率的计算
      const expectedAvgRatio = globalStats.totalOriginalSize / globalStats.totalCompressedSize;
      expect(Math.abs(globalStats.averageCompressionRatio - expectedAvgRatio)).toBeLessThan(0.001);
      
      // 验证每个键的统计信息都包含在全局统计中
      testData.forEach(({ key }) => {
        expect(globalStats.keyStats[key]).toBeDefined();
        expect(globalStats.keyStats[key].originalSize).toBeGreaterThan(0);
      });
    });

    it('对于不存在的键应该返回默认统计信息', () => {
      const key = 'non_existent_stats_key';
      
      const stats = storageService.getCompressionStats(key) as CompressionStats;
      
      expect(stats.originalSize).toBe(0);
      expect(stats.compressedSize).toBe(0);
      expect(stats.compressionRatio).toBe(1);
      expect(stats.timestamp).toBeDefined();
    });

    it('统计信息应该在数据更新时正确更新', () => {
      const key = 'update_stats_test';
      const value1 = 'short';
      const value2 = 'much longer text that should have different compression stats';
      
      // 存储第一个值
      storageService.setItem(key, value1);
      const stats1 = storageService.getCompressionStats(key) as CompressionStats;
      
      // 存储第二个值
      storageService.setItem(key, value2);
      const stats2 = storageService.getCompressionStats(key) as CompressionStats;
      
      // 验证统计信息已更新
      expect(stats2.originalSize).not.toBe(stats1.originalSize);
      expect(stats2.originalSize).toBe(JSON.stringify(value2).length);
      expect(stats2.timestamp).toBeGreaterThanOrEqual(stats1.timestamp!);
    });
  });
});