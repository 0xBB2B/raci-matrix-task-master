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
  getErrorLog(): StorageError[];
  clearErrorLog(): void;
  getStorageHealth(): {
    isAvailable: boolean;
    usage: { used: number; total: number; available: number };
    errorCount: number;
    lastError?: StorageError;
    compressionEnabled: boolean;
  };
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
  public timestamp: number;
  public operation?: string;
  public context?: Record<string, any>;

  constructor(
    public type: StorageErrorType,
    public key: string,
    message: string,
    public originalError?: Error,
    operation?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'StorageError';
    this.timestamp = Date.now();
    this.operation = operation;
    this.context = context;
  }

  // 获取详细的错误信息
  getDetailedMessage(): string {
    const parts = [
      `[${this.type}]`,
      this.operation ? `操作: ${this.operation}` : '',
      `键: "${this.key}"`,
      `消息: ${this.message}`,
      this.originalError ? `原始错误: ${this.originalError.message}` : '',
      this.context ? `上下文: ${JSON.stringify(this.context)}` : '',
      `时间: ${new Date(this.timestamp).toISOString()}`
    ].filter(Boolean);
    
    return parts.join(' | ');
  }

  // 转换为可序列化的对象
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      key: this.key,
      message: this.message,
      operation: this.operation,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

// 存储服务实现类（单例模式）
export class StorageService implements IStorageService {
  private static instance: StorageService;
  private compressionEnabled: boolean = true;
  private stats: Map<string, CompressionStats> = new Map();
  private errorLog: StorageError[] = [];
  private maxErrorLogSize: number = 100;

  private constructor() {
    // 私有构造函数，确保单例模式
    this.checkStorageAvailability();
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
      // 检查存储可用性
      if (!this.isStorageAvailable()) {
        throw new Error('localStorage 不可用');
      }

      // JSON 序列化
      const serialized = JSON.stringify(value);
      const originalSize = serialized.length;
      
      // 检查数据大小是否合理
      if (originalSize > 5 * 1024 * 1024) { // 5MB
        console.warn(`⚠️ 数据大小较大 (${originalSize} 字节)，键 "${key}"`);
      }
      
      if (this.compressionEnabled) {
        try {
          // LZ-String 压缩
          const compressed = LZString.compressToUTF16(serialized);
          
          if (!compressed) {
            throw new Error('压缩返回空结果');
          }
          
          const compressedSize = compressed.length;
          
          // 检查压缩是否有效（如果压缩后更大，则使用原始数据）
          if (compressedSize >= originalSize) {
            console.info(`ℹ️ 压缩无效果，使用原始数据存储，键 "${key}"`);
            this.storeData(key, serialized, originalSize, originalSize);
          } else {
            // 尝试存储压缩数据
            this.storeData(key, compressed, originalSize, compressedSize);
          }
        } catch (compressionError) {
          // 压缩失败的回退机制：存储原始数据
          console.warn(`⚠️ 压缩失败，回退到原始存储，键 "${key}":`, compressionError);
          this.storeData(key, serialized, originalSize, originalSize);
        }
      } else {
        // 压缩未启用，直接存储原始数据
        this.storeData(key, serialized, originalSize, originalSize);
      }
    } catch (error) {
      this.handleStorageError('setItem', key, error);
    }
  }

  // 存储数据的辅助方法
  private storeData(key: string, data: string, originalSize: number, compressedSize: number): void {
    try {
      // 尝试存储数据
      localStorage.setItem(key, data);
      
      // 记录压缩统计信息
      this.stats.set(key, {
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        timestamp: Date.now()
      });
      
      // 开发模式下输出压缩统计
      this.logCompressionStats(key, originalSize, compressedSize);
    } catch (storageError) {
      // 检查是否是存储空间不足
      if (storageError?.name === 'QuotaExceededError' || storageError?.code === 22) {
        // 尝试清理一些空间
        this.attemptSpaceRecovery();
        
        // 再次尝试存储
        try {
          localStorage.setItem(key, data);
          console.info(`✅ 清理空间后成功存储，键 "${key}"`);
          
          // 记录统计信息
          this.stats.set(key, {
            originalSize,
            compressedSize,
            compressionRatio: originalSize / compressedSize,
            timestamp: Date.now()
          });
        } catch (retryError) {
          // 再次失败，抛出错误
          throw retryError;
        }
      } else {
        // 其他存储错误
        throw storageError;
      }
    }
  }

  // 尝试恢复存储空间
  private attemptSpaceRecovery(): void {
    try {
      console.info('🧹 尝试清理存储空间...');
      
      // 获取所有键并按时间戳排序（如果有的话）
      const keys = Object.keys(localStorage);
      const keysWithTimestamp: Array<{ key: string; timestamp: number }> = [];
      
      for (const key of keys) {
        // 尝试从统计信息中获取时间戳
        const stats = this.stats.get(key);
        if (stats?.timestamp) {
          keysWithTimestamp.push({ key, timestamp: stats.timestamp });
        }
      }
      
      // 按时间戳排序，最旧的在前
      keysWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);
      
      // 删除最旧的 10% 的数据（最多删除 5 个）
      const toDelete = Math.min(Math.ceil(keysWithTimestamp.length * 0.1), 5);
      let deletedCount = 0;
      
      for (let i = 0; i < toDelete && i < keysWithTimestamp.length; i++) {
        const { key } = keysWithTimestamp[i];
        // 不删除重要的系统键
        if (!key.startsWith('raci_') && !key.startsWith('theme')) {
          try {
            localStorage.removeItem(key);
            this.stats.delete(key);
            deletedCount++;
            console.info(`🗑️ 已删除旧数据，键 "${key}"`);
          } catch (deleteError) {
            console.warn(`⚠️ 删除数据失败，键 "${key}":`, deleteError);
          }
        }
      }
      
      if (deletedCount > 0) {
        console.info(`✅ 已清理 ${deletedCount} 个旧数据项`);
      } else {
        console.warn('⚠️ 无法清理更多空间');
      }
    } catch (error) {
      console.error('🚨 空间清理失败:', error);
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
      
      // 首先尝试直接解析原始数据（兼容性检查）
      try {
        const parsed = JSON.parse(stored);
        // 如果能够成功解析，说明是原始 JSON 数据
        return parsed;
      } catch (originalParseError) {
        // 原始数据解析失败，尝试解压缩
        try {
          decompressed = LZString.decompressFromUTF16(stored);
          
          // 检查解压缩结果是否有效
          if (!decompressed) {
            // 解压缩返回空，可能是损坏的数据
            throw new Error('解压缩返回空结果');
          }
          
          // 检查解压缩结果是否与原始数据相同（说明不是压缩数据）
          if (decompressed === stored) {
            throw new Error('解压缩无效果，可能不是压缩数据');
          }
        } catch (decompressionError) {
          // 解压缩失败
          console.warn(`⚠️ 解压缩失败，键 "${key}":`, decompressionError);
          this.handleStorageError('getItem', key, decompressionError);
          return null;
        }

        try {
          // JSON 反序列化解压缩后的数据
          return JSON.parse(decompressed);
        } catch (parseError) {
          // 解压缩后的数据格式错误
          console.error(`🚨 JSON 解析失败，解压缩数据格式错误，键 "${key}":`, parseError);
          this.handleStorageError('getItem', key, parseError);
          return null;
        }
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
    const context: Record<string, any> = {
      operation,
      key,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      storageAvailable: this.isStorageAvailable()
    };

    // 判断错误类型 - 优先检查具体的错误类型
    if (error?.name === 'QuotaExceededError' || error?.code === 22 || 
        (error?.message && error.message.includes('QuotaExceededError'))) {
      errorType = StorageErrorType.QUOTA_EXCEEDED;
      errorMessage = `localStorage 存储空间不足，无法存储键 "${key}"`;
      context.storageUsage = this.getStorageUsage();
    } else if (error instanceof SyntaxError) {
      errorType = StorageErrorType.INVALID_DATA;
      errorMessage = `数据格式无效，无法处理键 "${key}"`;
      context.errorDetails = error.message;
    } else if (operation === 'setItem' && error?.message?.includes('compress')) {
      errorType = StorageErrorType.COMPRESSION_FAILED;
      errorMessage = `数据压缩失败，键 "${key}"`;
      context.compressionError = error.message;
    } else if (operation === 'getItem' && error?.message?.includes('decompress')) {
      errorType = StorageErrorType.DECOMPRESSION_FAILED;
      errorMessage = `数据解压缩失败，键 "${key}"`;
      context.decompressionError = error.message;
    } else if (!this.isStorageAvailable()) {
      errorType = StorageErrorType.STORAGE_UNAVAILABLE;
      errorMessage = `localStorage 不可用`;
      context.reason = 'localStorage API 不存在或被禁用';
    } else {
      errorType = StorageErrorType.COMPRESSION_FAILED;
      errorMessage = `存储操作 ${operation} 失败，键 "${key}"`;
      context.unknownError = true;
    }

    // 创建存储错误
    const storageError = new StorageError(errorType, key, errorMessage, error, operation, context);
    
    // 记录错误到日志
    this.logError(storageError);
    
    // 对于某些错误类型，抛出异常；对于其他类型，只记录日志
    if (errorType === StorageErrorType.QUOTA_EXCEEDED || errorType === StorageErrorType.STORAGE_UNAVAILABLE) {
      throw storageError;
    }
  }

  // 检查存储可用性
  private checkStorageAvailability(): void {
    if (!this.isStorageAvailable()) {
      const error = new StorageError(
        StorageErrorType.STORAGE_UNAVAILABLE,
        'system',
        'localStorage 不可用，可能是由于隐私模式或浏览器限制',
        undefined,
        'initialization',
        {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          timestamp: Date.now()
        }
      );
      this.logError(error);
      console.warn('⚠️ localStorage 不可用，存储服务将无法正常工作');
    }
  }

  // 检查 localStorage 是否可用
  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      // 尝试写入和读取测试数据
      const testKey = '__storage_test__';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      return false;
    }
  }

  // 获取存储使用情况
  private getStorageUsage(): { used: number; total: number; available: number } {
    try {
      // 估算当前使用的存储空间
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // 尝试估算总可用空间（通过二分查找）
      const total = this.estimateStorageQuota();
      
      return {
        used,
        total,
        available: total - used
      };
    } catch (error) {
      return { used: 0, total: 0, available: 0 };
    }
  }

  // 估算存储配额
  private estimateStorageQuota(): number {
    const testKey = '__quota_test__';
    let low = 0;
    let high = 10 * 1024 * 1024; // 10MB 作为上限
    let estimate = 0;

    try {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testData = 'x'.repeat(mid);
        
        try {
          localStorage.setItem(testKey, testData);
          localStorage.removeItem(testKey);
          estimate = mid;
          low = mid + 1;
        } catch (error) {
          high = mid - 1;
        }
      }
    } catch (error) {
      // 如果估算失败，返回默认值
      estimate = 5 * 1024 * 1024; // 5MB
    }

    return estimate;
  }

  // 记录错误到日志
  private logError(error: StorageError): void {
    // 添加到错误日志
    this.errorLog.push(error);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
    }

    // 输出详细的错误日志
    const logLevel = this.getLogLevel(error.type);
    const detailedMessage = error.getDetailedMessage();
    
    switch (logLevel) {
      case 'error':
        console.error(`🚨 存储错误: ${detailedMessage}`);
        break;
      case 'warn':
        console.warn(`⚠️ 存储警告: ${detailedMessage}`);
        break;
      case 'info':
        console.info(`ℹ️ 存储信息: ${detailedMessage}`);
        break;
    }

    // 在开发模式下输出完整的错误对象
    if (process.env.NODE_ENV === 'development') {
      console.group(`📋 存储错误详情 [${error.type}]`);
      console.log('错误对象:', error.toJSON());
      if (error.originalError) {
        console.log('原始错误:', error.originalError);
      }
      console.groupEnd();
    }
  }

  // 获取错误的日志级别
  private getLogLevel(errorType: StorageErrorType): 'error' | 'warn' | 'info' {
    switch (errorType) {
      case StorageErrorType.QUOTA_EXCEEDED:
      case StorageErrorType.STORAGE_UNAVAILABLE:
        return 'error';
      case StorageErrorType.COMPRESSION_FAILED:
      case StorageErrorType.DECOMPRESSION_FAILED:
        return 'warn';
      case StorageErrorType.INVALID_DATA:
        return 'info';
      default:
        return 'warn';
    }
  }

  // 获取错误日志
  getErrorLog(): StorageError[] {
    return [...this.errorLog];
  }

  // 清空错误日志
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // 获取存储健康状态
  getStorageHealth(): {
    isAvailable: boolean;
    usage: { used: number; total: number; available: number };
    errorCount: number;
    lastError?: StorageError;
    compressionEnabled: boolean;
  } {
    const usage = this.getStorageUsage();
    const lastError = this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1] : undefined;
    
    return {
      isAvailable: this.isStorageAvailable(),
      usage,
      errorCount: this.errorLog.length,
      lastError,
      compressionEnabled: this.compressionEnabled
    };
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