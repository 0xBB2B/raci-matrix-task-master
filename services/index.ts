// 存储服务模块导出

// 导出存储服务类和接口
export {
  StorageService,
  type IStorageService,
  type CompressionStats,
  type GlobalCompressionStats,
  StorageError,
  StorageErrorType
} from './storageService';

// 导出存储类型定义
export {
  StorageKeys,
  type StorageData,
  type TypedStorageService,
  type StorageConfig,
  DEFAULT_STORAGE_CONFIG,
  TypedStorageWrapper
} from './storageTypes';

// 导出现有的 Gemini 服务
export { generateRaciPlan } from './geminiService';

// 创建全局存储服务实例
import { StorageService } from './storageService';
import { TypedStorageWrapper } from './storageTypes';

export const storageService = StorageService.getInstance();
export const typedStorage = new TypedStorageWrapper(storageService);