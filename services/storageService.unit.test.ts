// 存储服务的单元测试
// 测试 setItem 和 getItem 方法的具体功能

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, StorageError, StorageErrorType } from './storageService';

describe('StorageService 单元测试', () => {
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storageService = StorageService.getInstance();
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
});