// localStorage 压缩存储服务
// 基于 LZ-String 的数据压缩存储包装器

import * as LZString from 'lz-string';

// 存储服务接口
export interface IStorageService {
  setItem<T>(key: string, value: T): void;
  getItem<T>(key: string): T | null;
  removeItem(key: string): void;
  clear(): void;
  getCompressionStats(key?: string): CompressionStats | GlobalCompressionStats;
}

// 压缩统计接口
export interface CompressionStats {
  originalSize: number;      // 原始数据大小（字节）
  compressedSize: number;    // 压缩后大小（字节）
  compressionRatio: number;  // 压缩比率
  timestamp?: number;        // 统计时间戳
}

// 全局压缩统计接口
export interface GlobalCompressionStats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  keyStats: Record<string, CompressionStats>;
}

// 存储错误类型枚举
export enum StorageErrorType {
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  DECOMPRESSION_FAILED = 'DECOMPRESSION_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_DATA = 'INVALID_DATA',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE'
}

// 存储错误类
export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    public key: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// 存储服务实现类（单例模式）
export class StorageService implements IStorageService {
  private static instance: StorageService;
  private compressionEnabled: boolean = true;
  private stats: Map<string, CompressionStats> = new Map();

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  // 获取单例实例
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 存储数据方法
  setItem<T>(key: string, value: T): void {
    try {
      // JSON 序列化
      const serialized = JSON.stringify(value);
      const originalSize = serialized.length;
      
      if (this.compressionEnabled) {
        try {
          // LZ-String 压缩
          const compressed = LZString.compressToUTF16(serialized);
          const compressedSize = compressed.length;
          
          // 记录压缩统计信息
          this.stats.set(key, {
            originalSize,
            compressedSize,
            compressionRatio: originalSize / compressedSize,
            timestamp: Date.now()
          });
          
          // 存储压缩数据
          localStorage.setItem(key, compressed);
          
          // 开发模式下输出压缩统计
          this.logCompressionStats(key, originalSize, compressedSize);
        } catch (compressionError) {
          // 压缩失败的回退机制：存储原始数据
          console.warn(`Compression failed for key "${key}", falling back to uncompressed storage:`, compressionError);
          localStorage.setItem(key, serialized);
          
          // 记录未压缩的统计信息
          this.stats.set(key, {
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            timestamp: Date.now()
          });
        }
      } else {
        // 压缩未启用，直接存储原始数据
        localStorage.setItem(key, serialized);
        
        // 记录未压缩的统计信息
        this.stats.set(key, {
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.handleStorageError('setItem', key, error);
    }
  }

  // 读取数据方法
  getItem<T>(key: string): T | null {
    try {
      // 从 localStorage 读取数据
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return null;
      }

      let decompressed: string;
      
      try {
        // 尝试 LZ-String 解压缩
        decompressed = LZString.decompressFromUTF16(stored);
        
        // 如果解压缩结果为空或 null，可能是原始数据
        if (!decompressed) {
          console.warn(`Decompression returned empty result for key "${key}", trying original data`);
          decompressed = stored;
        }
      } catch (decompressionError) {
        // 解压缩失败的回退机制：尝试读取原始数据
        console.warn(`Decompression failed for key "${key}", falling back to original data:`, decompressionError);
        decompressed = stored;
      }

      try {
        // JSON 反序列化
        return JSON.parse(decompressed);
      } catch (parseError) {
        // 数据格式错误处理
        console.error(`JSON parsing failed for key "${key}":`, parseError);
        this.handleStorageError('getItem', key, parseError);
        return null;
      }
    } catch (error) {
      this.handleStorageError('getItem', key, error);
      return null;
    }
  }

  // 删除数据方法
  removeItem(key: string): void {
    try {
      // 删除 localStorage 中的数据
      localStorage.removeItem(key);
      
      // 删除压缩统计信息
      this.stats.delete(key);
    } catch (error) {
      this.handleStorageError('removeItem', key, error);
    }
  }

  // 清空所有数据方法
  clear(): void {
    try {
      // 清空 localStorage
      localStorage.clear();
      
      // 清空压缩统计信息
      this.stats.clear();
    } catch (error) {
      this.handleStorageError('clear', 'all', error);
    }
  }

  // 获取压缩统计方法
  getCompressionStats(key?: string): CompressionStats | GlobalCompressionStats {
    if (key) {
      // 返回特定键的压缩统计
      const stats = this.stats.get(key);
      if (!stats) {
        return {
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 1,
          timestamp: Date.now()
        };
      }
      return stats;
    } else {
      // 返回全局压缩统计
      const allStats = Array.from(this.stats.values());
      
      if (allStats.length === 0) {
        return {
          totalOriginalSize: 0,
          totalCompressedSize: 0,
          averageCompressionRatio: 1,
          keyStats: {}
        };
      }
      
      const totalOriginalSize = allStats.reduce((sum, stat) => sum + stat.originalSize, 0);
      const totalCompressedSize = allStats.reduce((sum, stat) => sum + stat.compressedSize, 0);
      const averageCompressionRatio = totalOriginalSize / totalCompressedSize;
      
      // 构建键统计对象
      const keyStats: Record<string, CompressionStats> = {};
      this.stats.forEach((stat, key) => {
        keyStats[key] = stat;
      });
      
      return {
        totalOriginalSize,
        totalCompressedSize,
        averageCompressionRatio,
        keyStats
      };
    }
  }

  // 错误处理方法
  private handleStorageError(operation: string, key: string, error: any): void {
    let errorType: StorageErrorType;
    let errorMessage: string;

    // 判断错误类型
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      errorType = StorageErrorType.QUOTA_EXCEEDED;
      errorMessage = `localStorage 存储空间不足，无法存储键 "${key}"`;
    } else if (error instanceof SyntaxError) {
      errorType = StorageErrorType.INVALID_DATA;
      errorMessage = `数据格式无效，无法处理键 "${key}"`;
    } else if (!window.localStorage) {
      errorType = StorageErrorType.STORAGE_UNAVAILABLE;
      errorMessage = `localStorage 不可用`;
    } else {
      errorType = StorageErrorType.COMPRESSION_FAILED;
      errorMessage = `存储操作 ${operation} 失败，键 "${key}"`;
    }

    // 创建并抛出存储错误
    const storageError = new StorageError(errorType, key, errorMessage, error);
    console.error(`🚨 存储错误 [${errorType}]:`, errorMessage, error);
    
    // 对于某些错误类型，抛出异常；对于其他类型，只记录日志
    if (errorType === StorageErrorType.QUOTA_EXCEEDED || errorType === StorageErrorType.STORAGE_UNAVAILABLE) {
      throw storageError;
    }
  }

  // 压缩统计日志方法
  private logCompressionStats(key: string, originalSize: number, compressedSize: number): void {
    if (process.env.NODE_ENV === 'development') {
      const ratio = originalSize / compressedSize;
      const savedBytes = originalSize - compressedSize;
      const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(1);
      console.log(`📦 压缩统计 "${key}": ${originalSize}B → ${compressedSize}B (压缩比 ${ratio.toFixed(2)}x, 节省 ${savedPercentage}%)`);
    }
  }
}