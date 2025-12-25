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
  DEFAULT_STORAGE_CONFIG
} from './storageTypes';

// 导出现有的 Gemini 服务
export { generateProjectSuggestions } from './geminiService';