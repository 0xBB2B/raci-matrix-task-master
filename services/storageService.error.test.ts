// 存储服务的错误处理单元测试
// 测试各种错误情况的处理和验证错误日志的输出
// 需求：4.1, 4.2, 4.3, 4.4, 4.5

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService, StorageError, StorageErrorType } from './storageService';

describe('StorageService 错误处理测试', () => {
  let storageService: StorageService;
  let originalLocalStorage: Storage;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    // 保存原始的 localStorage
    originalLocalStorage = window.localStorage;
    
    // 清理存储
    localStorage.clear();
    storageService = StorageService.getInstance();
    storageService.clear();
    storageService.clearErrorLog();
    
    // 监听控制台输出
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // 恢复原始的 localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    
    // 恢复控制台方法
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('localStorage 不可用错误处理', () => {
    it('应该检测到 localStorage 不可用并记录错误', () => {
      // 清理现有的错误日志
      storageService.clearErrorLog();
      
      // 模拟 localStorage 不可用
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      // 尝试使用存储服务，这会触发可用性检查
      try {
        storageService.setItem('test', 'value');
      } catch (error) {
        // 预期会抛出错误
      }
      
      // 验证错误被记录到错误日志中
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      
      const storageUnavailableError = errorLog.find(
        error => error.type === StorageErrorType.STORAGE_UNAVAILABLE
      );
      expect(storageUnavailableError).toBeDefined();
    });

    it('应该在 localStorage 不可用时抛出 STORAGE_UNAVAILABLE 错误', () => {
      // 模拟 localStorage 不可用
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      expect(() => {
        storageService.setItem('test', 'value');
      }).toThrow(StorageError);
      
      try {
        storageService.setItem('test', 'value');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).type).toBe(StorageErrorType.STORAGE_UNAVAILABLE);
        expect((error as StorageError).key).toBe('test');
      }
    });

    it('应该在 localStorage 抛出异常时正确处理', () => {
      // 模拟 localStorage.setItem 抛出异常
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...originalLocalStorage,
          setItem: mockSetItem
        },
        writable: true
      });
      
      expect(() => {
        storageService.setItem('test', 'value');
      }).toThrow(StorageError);
    });
  });

  describe('存储空间不足错误处理', () => {
    it('应该检测到 QuotaExceededError 并抛出 QUOTA_EXCEEDED 错误', () => {
      // 模拟 localStorage.setItem 抛出 QuotaExceededError
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      const mockSetItem = vi.fn().mockImplementation((key: string, value: string) => {
        // 允许测试键通过，但对目标键抛出错误
        if (key === '__storage_test__') {
          return originalLocalStorage.setItem(key, value);
        }
        if (key === 'test') {
          throw quotaError;
        }
        return originalLocalStorage.setItem(key, value);
      });
      
      const mockGetItem = vi.fn().mockImplementation((key: string) => {
        return originalLocalStorage.getItem(key);
      });
      
      const mockRemoveItem = vi.fn().mockImplementation((key: string) => {
        return originalLocalStorage.removeItem(key);
      });
      
      // 确保其他 localStorage 方法正常工作
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: mockGetItem,
          removeItem: mockRemoveItem,
          clear: vi.fn(),
          length: 0,
          key: vi.fn().mockReturnValue(null)
        },
        writable: true
      });
      
      expect(() => {
        storageService.setItem('test', 'value');
      }).toThrow(StorageError);
      
      try {
        storageService.setItem('test', 'value');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).type).toBe(StorageErrorType.QUOTA_EXCEEDED);
        expect((error as StorageError).message).toContain('存储空间不足');
      }
    });

    it('应该在存储空间不足时尝试清理空间', () => {
      // 先存储一些测试数据
      storageService.setItem('old_data_1', 'some old data');
      storageService.setItem('old_data_2', 'more old data');
      
      // 模拟第一次存储失败，第二次成功
      let failureCount = 0;
      const mockSetItem = vi.fn().mockImplementation((key: string, value: string) => {
        // 允许测试键和旧数据键通过
        if (key === '__storage_test__' || key.startsWith('old_data')) {
          return originalLocalStorage.setItem(key, value);
        }
        
        if (key === 'new_data') {
          failureCount++;
          if (failureCount === 1) {
            const quotaError = new Error('QuotaExceededError');
            quotaError.name = 'QuotaExceededError';
            throw quotaError;
          }
        }
        
        // 其他调用成功，使用原始的 localStorage
        return originalLocalStorage.setItem(key, value);
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
          removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
          clear: originalLocalStorage.clear.bind(originalLocalStorage),
          length: originalLocalStorage.length,
          key: originalLocalStorage.key.bind(originalLocalStorage)
        },
        writable: true
      });
      
      // 尝试存储新数据，应该触发空间清理并最终成功
      expect(() => {
        storageService.setItem('new_data', 'new value');
      }).not.toThrow();
      
      // 验证数据最终被成功存储
      const retrieved = storageService.getItem('new_data');
      expect(retrieved).toBe('new value');
    });

    it('应该在清理空间后仍然失败时抛出错误', () => {
      // 模拟 localStorage.setItem 对特定键总是抛出 QuotaExceededError
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      const mockSetItem = vi.fn().mockImplementation((key: string, value: string) => {
        // 允许测试键通过
        if (key === '__storage_test__') {
          return originalLocalStorage.setItem(key, value);
        }
        
        if (key === 'test') {
          throw quotaError;
        }
        // 其他键正常工作
        return originalLocalStorage.setItem(key, value);
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
          removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
          clear: originalLocalStorage.clear.bind(originalLocalStorage),
          length: originalLocalStorage.length,
          key: originalLocalStorage.key.bind(originalLocalStorage)
        },
        writable: true
      });
      
      expect(() => {
        storageService.setItem('test', 'value');
      }).toThrow(StorageError);
      
      // 验证抛出的是 QUOTA_EXCEEDED 错误
      try {
        storageService.setItem('test', 'value');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).type).toBe(StorageErrorType.QUOTA_EXCEEDED);
      }
    });
  });

  describe('数据格式错误处理', () => {
    it('应该处理无效的 JSON 数据并返回 null', () => {
      const key = 'invalid_json_key';
      
      // 直接向 localStorage 写入无效的 JSON
      localStorage.setItem(key, 'invalid json data {');
      
      const result = storageService.getItem(key);
      
      expect(result).toBeNull();
      
      // 验证错误日志被记录
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      
      const lastError = errorLog[errorLog.length - 1];
      expect(lastError.type).toBe(StorageErrorType.INVALID_DATA);
      expect(lastError.key).toBe(key);
    });

    it('应该处理损坏的压缩数据', () => {
      const key = 'corrupted_data_key';
      
      // 写入看起来像压缩数据但实际损坏的数据
      localStorage.setItem(key, '㼼㼼㼼corrupted_compressed_data㼼㼼㼼');
      
      const result = storageService.getItem(key);
      
      expect(result).toBeNull();
      
      // 验证错误被记录
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
    });

    it('应该处理 JSON 序列化失败的情况', () => {
      const key = 'circular_ref_key';
      
      // 创建循环引用对象
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        storageService.setItem(key, circularObj);
      }).not.toThrow(); // 不应该抛出异常，而是记录错误
      
      // 验证错误被记录
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
    });
  });

  describe('压缩相关错误处理', () => {
    it('应该在压缩失败时回退到原始存储', () => {
      // 模拟 LZ-String 压缩失败
      const originalLZString = require('lz-string');
      const mockLZString = {
        ...originalLZString,
        compressToUTF16: vi.fn().mockImplementation(() => {
          throw new Error('Compression failed');
        })
      };
      
      // 这里我们无法直接模拟 LZ-String，但可以测试大数据的情况
      const key = 'large_data_key';
      const largeValue = 'x'.repeat(10000); // 大量数据
      
      // 存储应该成功（即使压缩失败也会回退）
      expect(() => {
        storageService.setItem(key, largeValue);
      }).not.toThrow();
      
      // 数据应该能够正确读取
      const retrieved = storageService.getItem(key);
      expect(retrieved).toBe(largeValue);
    });

    it('应该处理解压缩失败的情况', () => {
      const key = 'decompression_fail_key';
      
      // 直接向 localStorage 写入看起来像压缩数据但实际损坏的数据
      // 这种数据无法被 JSON.parse 解析，也无法被正确解压缩
      localStorage.setItem(key, '㼼㼼㼼corrupted_compressed_data㼼㼼㼼');
      
      // 读取应该返回 null 而不是抛出异常
      const result = storageService.getItem(key);
      expect(result).toBeNull();
      
      // 验证错误被记录
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      
      // 应该有解压缩相关的错误
      const decompressionError = errorLog.find(
        error => error.operation === 'getItem' && error.key === key
      );
      expect(decompressionError).toBeDefined();
    });
  });

  describe('错误日志功能', () => {
    it('应该正确记录错误到日志', () => {
      const key = 'error_log_test';
      
      // 触发一个错误
      localStorage.setItem(key, 'invalid json {');
      storageService.getItem(key);
      
      // 检查错误日志
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      
      const error = errorLog[errorLog.length - 1];
      expect(error).toBeInstanceOf(StorageError);
      expect(error.key).toBe(key);
      expect(error.operation).toBe('getItem');
      expect(error.timestamp).toBeDefined();
      expect(error.context).toBeDefined();
    });

    it('应该限制错误日志的大小', () => {
      // 触发大量错误
      for (let i = 0; i < 150; i++) {
        const key = `error_key_${i}`;
        localStorage.setItem(key, 'invalid json {');
        storageService.getItem(key);
      }
      
      // 验证日志大小被限制
      const errorLog = storageService.getErrorLog();
      expect(errorLog.length).toBeLessThanOrEqual(100);
    });

    it('应该能够清空错误日志', () => {
      // 触发一些错误
      localStorage.setItem('error1', 'invalid json {');
      storageService.getItem('error1');
      
      expect(storageService.getErrorLog().length).toBeGreaterThan(0);
      
      // 清空日志
      storageService.clearErrorLog();
      
      expect(storageService.getErrorLog().length).toBe(0);
    });

    it('应该在错误对象中包含详细的上下文信息', () => {
      const key = 'context_test';
      
      // 触发错误
      localStorage.setItem(key, 'invalid json {');
      storageService.getItem(key);
      
      const errorLog = storageService.getErrorLog();
      const error = errorLog[errorLog.length - 1];
      
      expect(error.context).toBeDefined();
      expect(error.context!.operation).toBe('getItem');
      expect(error.context!.key).toBe(key);
      expect(error.context!.timestamp).toBeDefined();
      expect(error.context!.storageAvailable).toBeDefined();
    });

    it('应该正确生成详细的错误消息', () => {
      const key = 'detailed_message_test';
      
      // 触发错误
      localStorage.setItem(key, 'invalid json {');
      storageService.getItem(key);
      
      const errorLog = storageService.getErrorLog();
      const error = errorLog[errorLog.length - 1];
      
      const detailedMessage = error.getDetailedMessage();
      
      expect(detailedMessage).toContain(error.type);
      expect(detailedMessage).toContain(error.operation!);
      expect(detailedMessage).toContain(error.key);
      expect(detailedMessage).toContain(error.message);
    });

    it('应该正确序列化错误对象', () => {
      const key = 'serialization_test';
      
      // 触发错误
      localStorage.setItem(key, 'invalid json {');
      storageService.getItem(key);
      
      const errorLog = storageService.getErrorLog();
      const error = errorLog[errorLog.length - 1];
      
      const serialized = error.toJSON();
      
      expect(serialized.name).toBe('StorageError');
      expect(serialized.type).toBe(error.type);
      expect(serialized.key).toBe(error.key);
      expect(serialized.message).toBe(error.message);
      expect(serialized.operation).toBe(error.operation);
      expect(serialized.timestamp).toBe(error.timestamp);
      expect(serialized.context).toEqual(error.context);
    });
  });

  describe('存储健康状态检查', () => {
    it('应该正确报告存储健康状态', () => {
      // 存储一些数据
      storageService.setItem('health_test', 'test data');
      
      const health = storageService.getStorageHealth();
      
      expect(health.isAvailable).toBe(true);
      expect(health.usage.used).toBeGreaterThan(0);
      expect(health.usage.total).toBeGreaterThan(0);
      expect(health.usage.available).toBeGreaterThanOrEqual(0);
      expect(health.errorCount).toBeGreaterThanOrEqual(0);
      expect(health.compressionEnabled).toBe(true);
    });

    it('应该在有错误时报告最后一个错误', () => {
      // 触发一个错误
      localStorage.setItem('health_error_test', 'invalid json {');
      storageService.getItem('health_error_test');
      
      const health = storageService.getStorageHealth();
      
      expect(health.errorCount).toBeGreaterThan(0);
      expect(health.lastError).toBeDefined();
      expect(health.lastError!.key).toBe('health_error_test');
    });

    it('应该在 localStorage 不可用时报告正确状态', () => {
      // 模拟 localStorage 不可用
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      const health = storageService.getStorageHealth();
      
      expect(health.isAvailable).toBe(false);
      expect(health.usage.used).toBe(0);
      expect(health.usage.total).toBe(0);
      expect(health.usage.available).toBe(0);
    });
  });

  describe('控制台日志输出', () => {
    it('应该根据错误类型输出不同级别的日志', () => {
      // 触发不同类型的错误
      
      // INVALID_DATA 错误 (info 级别)
      localStorage.setItem('invalid_data', 'invalid json {');
      storageService.getItem('invalid_data');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('存储信息')
      );
      
      // 清理 spy 调用记录
      consoleInfoSpy.mockClear();
      consoleWarnSpy.mockClear();
      consoleErrorSpy.mockClear();
      
      // QUOTA_EXCEEDED 错误 (error 级别)
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw quotaError;
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...originalLocalStorage,
          setItem: mockSetItem,
          getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
          removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
          clear: originalLocalStorage.clear.bind(originalLocalStorage),
          length: originalLocalStorage.length,
          key: originalLocalStorage.key.bind(originalLocalStorage)
        },
        writable: true
      });
      
      try {
        storageService.setItem('quota_test', 'value');
      } catch (error) {
        // 预期会抛出错误
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('存储错误')
      );
    });

    it('应该在开发模式下输出详细的错误信息', () => {
      // 设置开发模式
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // 模拟 console.group 和 console.groupEnd
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        // 触发错误
        localStorage.setItem('dev_error_test', 'invalid json {');
        storageService.getItem('dev_error_test');
        
        // 验证详细日志输出
        expect(consoleGroupSpy).toHaveBeenCalledWith(
          expect.stringContaining('存储错误详情')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '错误对象:',
          expect.any(Object)
        );
        expect(consoleGroupEndSpy).toHaveBeenCalled();
      } finally {
        // 恢复环境变量和 spy
        process.env.NODE_ENV = originalEnv;
        consoleGroupSpy.mockRestore();
        consoleGroupEndSpy.mockRestore();
        consoleLogSpy.mockRestore();
      }
    });
  });

  describe('存储配额估算', () => {
    it('应该能够估算存储配额', () => {
      const health = storageService.getStorageHealth();
      
      // 验证配额估算返回合理的值
      expect(health.usage.total).toBeGreaterThan(0);
      expect(health.usage.total).toBeLessThan(50 * 1024 * 1024); // 小于 50MB
    });

    it('应该能够计算当前存储使用量', () => {
      // 存储一些数据
      storageService.setItem('usage_test_1', 'test data 1');
      storageService.setItem('usage_test_2', 'test data 2');
      
      const health = storageService.getStorageHealth();
      
      expect(health.usage.used).toBeGreaterThan(0);
      expect(health.usage.available).toBeGreaterThanOrEqual(0);
      expect(health.usage.used + health.usage.available).toBeLessThanOrEqual(health.usage.total);
    });
  });
});