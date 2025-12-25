// 存储相关的 TypeScript 类型定义

import { Task } from '../types';
import { IStorageService } from './storageService';

// 存储键枚举
export enum StorageKeys {
  TASKS = 'raci_tasks',
  ROSTER = 'raci_roster',
  THEME = 'theme'
}

// 存储数据接口映射
export interface StorageData {
  [StorageKeys.TASKS]: Task[];
  [StorageKeys.ROSTER]: string[];
  [StorageKeys.THEME]: 'light' | 'dark';
}

// 类型安全的存储接口
export interface TypedStorageService {
  setItem<K extends StorageKeys>(key: K, value: StorageData[K]): void;
  getItem<K extends StorageKeys>(key: K): StorageData[K] | null;
  removeItem(key: StorageKeys): void;
  clear(): void;
}

// 存储配置接口
export interface StorageConfig {
  compressionEnabled?: boolean;
  enableLogging?: boolean;
  enableStats?: boolean;
}

// 导出默认存储配置
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  compressionEnabled: true,
  enableLogging: process.env.NODE_ENV === 'development',
  enableStats: true
};

// 类型安全的存储服务包装器
export class TypedStorageWrapper implements TypedStorageService {
  constructor(private storageService: IStorageService) {}

  setItem<K extends StorageKeys>(key: K, value: StorageData[K]): void {
    this.storageService.setItem(key, value);
  }

  getItem<K extends StorageKeys>(key: K): StorageData[K] | null {
    return this.storageService.getItem<StorageData[K]>(key);
  }

  removeItem(key: StorageKeys): void {
    this.storageService.removeItem(key);
  }

  clear(): void {
    this.storageService.clear();
  }

  // 提供对底层存储服务的访问，用于获取压缩统计等高级功能
  getStorageService(): IStorageService {
    return this.storageService;
  }
}