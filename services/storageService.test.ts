// 存储服务的属性测试
// 功能：localStorage-compression，属性 1：完整的存储服务功能

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageService } from './storageService';

describe('StorageService 属性测试', () => {
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storageService = StorageService.getInstance();
  });

  /**
   * 属性 1：完整的存储服务功能
   * 验证：需求 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5
   * 
   * 对于任何可序列化的数据对象和任何标准 localStorage 操作，
   * StorageService 应该提供完全兼容的 API 接口，自动处理压缩存储，
   * 并保证数据往返的完整一致性
   */
  it('属性 1：完整的存储服务功能 - 数据往返一致性', () => {
    // 生成各种类型的测试数据
    const arbitraryData = fc.oneof(
      // 基本类型
      fc.string(),
      fc.integer(),
      fc.float(),
      fc.boolean(),
      fc.constant(null),
      
      // 数组类型
      fc.array(fc.string()),
      fc.array(fc.integer()),
      fc.array(fc.boolean()),
      
      // 对象类型
      fc.record({
        id: fc.string(),
        name: fc.string(),
        count: fc.integer(),
        active: fc.boolean(),
        tags: fc.array(fc.string())
      }),
      
      // 复杂嵌套对象
      fc.record({
        tasks: fc.array(fc.record({
          id: fc.string(),
          title: fc.string(),
          description: fc.string(),
          status: fc.constantFrom('TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'),
          roles: fc.record({
            responsible: fc.array(fc.string()),
            accountable: fc.string(),
            consulted: fc.array(fc.string()),
            informed: fc.array(fc.string())
          })
        })),
        roster: fc.array(fc.string()),
        theme: fc.constantFrom('light', 'dark')
      })
    );

    const arbitraryKey = fc.string({ minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(arbitraryKey, arbitraryData, (key, data) => {
        // 存储数据
        storageService.setItem(key, data);
        
        // 读取数据
        const retrieved = storageService.getItem(key);
        
        // 验证数据一致性
        expect(retrieved).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });

  it('属性 1：完整的存储服务功能 - API 兼容性', () => {
    const arbitraryKey = fc.string({ minLength: 1, maxLength: 50 });
    const arbitraryValue = fc.string();

    fc.assert(
      fc.property(arbitraryKey, arbitraryValue, (key, value) => {
        // 测试 setItem/getItem 基本功能
        storageService.setItem(key, value);
        expect(storageService.getItem(key)).toBe(value);
        
        // 测试 removeItem 功能
        storageService.removeItem(key);
        expect(storageService.getItem(key)).toBeNull();
        
        // 测试重复存储
        storageService.setItem(key, value);
        storageService.setItem(key, value + '_updated');
        expect(storageService.getItem(key)).toBe(value + '_updated');
      }),
      { numRuns: 100 }
    );
  });

  it('属性 1：完整的存储服务功能 - 多键存储隔离', () => {
    const arbitraryKeyValuePairs = fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 20 }),
        value: fc.string()
      }),
      { minLength: 2, maxLength: 10 }
    );

    fc.assert(
      fc.property(arbitraryKeyValuePairs, (pairs) => {
        // 确保键名唯一
        const uniquePairs = pairs.filter((pair, index, arr) => 
          arr.findIndex(p => p.key === pair.key) === index
        );
        
        if (uniquePairs.length < 2) return; // 跳过键不够的情况
        
        // 存储所有键值对
        uniquePairs.forEach(({ key, value }) => {
          storageService.setItem(key, value);
        });
        
        // 验证每个键的值都正确
        uniquePairs.forEach(({ key, value }) => {
          expect(storageService.getItem(key)).toBe(value);
        });
        
        // 删除一个键，验证其他键不受影响
        const keyToRemove = uniquePairs[0].key;
        storageService.removeItem(keyToRemove);
        
        expect(storageService.getItem(keyToRemove)).toBeNull();
        uniquePairs.slice(1).forEach(({ key, value }) => {
          expect(storageService.getItem(key)).toBe(value);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('属性 1：完整的存储服务功能 - clear 方法', () => {
    const arbitraryKeyValuePairs = fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 20 }),
        value: fc.string()
      }),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.property(arbitraryKeyValuePairs, (pairs) => {
        // 存储所有键值对
        pairs.forEach(({ key, value }) => {
          storageService.setItem(key, value);
        });
        
        // 清空所有数据
        storageService.clear();
        
        // 验证所有键都被清空
        pairs.forEach(({ key }) => {
          expect(storageService.getItem(key)).toBeNull();
        });
      }),
      { numRuns: 100 }
    );
  });
});