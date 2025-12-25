// 存储相关的 TypeScript 类型定义

import { Task } from '../types';

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