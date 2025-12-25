// 存储服务的属性测试
// 功能：localStorage-compression，属性 1：完整的存储服务功能

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageService, CompressionStats, GlobalCompressionStats } from './storageService';

describe('StorageService 属性测试', () => {
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storageService = StorageService.getInstance();
    // 清理存储服务的内部状态
    storageService.clear();
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

  /**
   * 属性 2：压缩统计和监控完整性
   * 验证：需求 5.1, 5.2, 5.3, 5.5
   * 
   * 对于任何存储操作，系统应该准确计算和提供压缩统计信息
   * （原始大小、压缩大小、压缩比率），并提供完整的统计查询 API
   */
  it('属性 2：压缩统计和监控完整性 - 统计信息准确性', () => {
    const arbitraryKeyValuePairs = fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 20 }),
        value: fc.oneof(
          fc.string({ minLength: 10, maxLength: 1000 }),
          fc.record({
            id: fc.string(),
            data: fc.string({ minLength: 50, maxLength: 500 }),
            items: fc.array(fc.string(), { minLength: 5, maxLength: 20 })
          })
        )
      }),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.property(arbitraryKeyValuePairs, (pairs) => {
        // 在每次属性测试开始时清理状态
        storageService.clear();
        
        // 确保键名唯一
        const uniquePairs = pairs.filter((pair, index, arr) => 
          arr.findIndex(p => p.key === pair.key) === index
        );
        
        if (uniquePairs.length === 0) return;
        
        // 存储所有键值对
        uniquePairs.forEach(({ key, value }) => {
          storageService.setItem(key, value);
        });
        
        // 验证每个键的统计信息
        uniquePairs.forEach(({ key, value }) => {
          const stats = storageService.getCompressionStats(key) as CompressionStats;
          
          // 验证统计信息的基本属性
          expect(stats.originalSize).toBeGreaterThan(0);
          expect(stats.compressedSize).toBeGreaterThan(0);
          expect(stats.compressionRatio).toBeGreaterThan(0);
          expect(stats.timestamp).toBeDefined();
          
          // 验证压缩比率的合理性
          expect(stats.compressionRatio).toBe(stats.originalSize / stats.compressedSize);
          
          // 验证原始大小与 JSON 序列化后的大小一致
          const expectedOriginalSize = JSON.stringify(value).length;
          expect(stats.originalSize).toBe(expectedOriginalSize);
        });
        
        // 验证全局统计信息
        const globalStats = storageService.getCompressionStats() as GlobalCompressionStats;
        
        expect(globalStats.totalOriginalSize).toBeGreaterThan(0);
        expect(globalStats.totalCompressedSize).toBeGreaterThan(0);
        expect(globalStats.averageCompressionRatio).toBeGreaterThan(0);
        
        // 验证键统计信息的数量应该等于实际存储的唯一键数量
        const actualStoredKeys = Object.keys(globalStats.keyStats);
        expect(actualStoredKeys).toHaveLength(uniquePairs.length);
        
        // 验证全局统计的计算正确性
        const expectedTotalOriginal = uniquePairs.reduce((sum, { value }) => 
          sum + JSON.stringify(value).length, 0);
        expect(globalStats.totalOriginalSize).toBe(expectedTotalOriginal);
        
        // 验证平均压缩比率的计算
        const expectedAvgRatio = globalStats.totalOriginalSize / globalStats.totalCompressedSize;
        expect(Math.abs(globalStats.averageCompressionRatio - expectedAvgRatio)).toBeLessThan(0.001);
      }),
      { numRuns: 100 }
    );
  });

  it('属性 2：压缩统计和监控完整性 - 统计信息更新', () => {
    const arbitraryKey = fc.string({ minLength: 1, maxLength: 20 });
    const arbitraryValues = fc.array(
      fc.string({ minLength: 10, maxLength: 500 }),
      { minLength: 2, maxLength: 5 }
    );

    fc.assert(
      fc.property(arbitraryKey, arbitraryValues, (key, values) => {
        // 在每次属性测试开始时清理状态
        storageService.clear();
        
        // 依次存储不同的值
        values.forEach((value, index) => {
          storageService.setItem(key, value);
          
          const stats = storageService.getCompressionStats(key) as CompressionStats;
          const expectedOriginalSize = JSON.stringify(value).length;
          
          // 验证统计信息已更新
          expect(stats.originalSize).toBe(expectedOriginalSize);
          expect(stats.compressionRatio).toBe(stats.originalSize / stats.compressedSize);
        });
        
        // 删除键后，统计信息应该被清除
        storageService.removeItem(key);
        const statsAfterRemoval = storageService.getCompressionStats(key) as CompressionStats;
        
        expect(statsAfterRemoval.originalSize).toBe(0);
        expect(statsAfterRemoval.compressedSize).toBe(0);
        expect(statsAfterRemoval.compressionRatio).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('属性 2：压缩统计和监控完整性 - clear 操作统计重置', () => {
    const arbitraryKeyValuePairs = fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 20 }),
        value: fc.string({ minLength: 10, maxLength: 200 })
      }),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.property(arbitraryKeyValuePairs, (pairs) => {
        // 在每次属性测试开始时清理状态
        storageService.clear();
        
        // 确保键名唯一
        const uniquePairs = pairs.filter((pair, index, arr) => 
          arr.findIndex(p => p.key === pair.key) === index
        );
        
        if (uniquePairs.length === 0) return;
        
        // 存储所有键值对
        uniquePairs.forEach(({ key, value }) => {
          storageService.setItem(key, value);
        });
        
        // 验证存储后有统计信息
        const globalStatsBefore = storageService.getCompressionStats() as GlobalCompressionStats;
        expect(globalStatsBefore.totalOriginalSize).toBeGreaterThan(0);
        expect(Object.keys(globalStatsBefore.keyStats)).toHaveLength(uniquePairs.length);
        
        // 清空所有数据
        storageService.clear();
        
        // 验证统计信息被重置
        const globalStatsAfter = storageService.getCompressionStats() as GlobalCompressionStats;
        expect(globalStatsAfter.totalOriginalSize).toBe(0);
        expect(globalStatsAfter.totalCompressedSize).toBe(0);
        expect(globalStatsAfter.averageCompressionRatio).toBe(1);
        expect(Object.keys(globalStatsAfter.keyStats)).toHaveLength(0);
        
        // 验证单个键的统计信息也被重置
        uniquePairs.forEach(({ key }) => {
          const keyStats = storageService.getCompressionStats(key) as CompressionStats;
          expect(keyStats.originalSize).toBe(0);
          expect(keyStats.compressedSize).toBe(0);
          expect(keyStats.compressionRatio).toBe(1);
        });
      }),
      { numRuns: 100 }
    );
  });
});