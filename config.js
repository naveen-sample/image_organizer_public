const CONFIG = {
  owner: 'naveen-sample',
  publicRepo: 'image_organizer_public',
  privateRepo: 'image_organizer',

  apiBase: 'https://api.github.com',
  apiVersion: '2022-11-28',

  features: {
    uploadEnabled: true,
    downloadEnabled: true,
    deleteEnabled: true,
    shareEnabled: true,
    darkModeEnabled: true,
    searchEnabled: true,
    lazyLoadingEnabled: true
  },

  files: {
    maxFileSize: 50 * 1024 * 1024,
    maxTotalSize: 500 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'mp4', 'mov', 'webm', 'avi', 'mkv']
  },

  upload: {
    maxConcurrentUploads: 3,
    chunkSize: 1024 * 1024,
    autoCompress: true,
    compressQuality: 0.85,
    generateThumbnails: true
  },

  cache: {
    enabled: true,
    albumsTTL: 5 * 60 * 1000,
    imagesTTL: 10 * 60 * 1000,
    metadataTTL: 30 * 60 * 1000
  },

  ui: {
    theme: 'light',
    itemsPerPage: 24,
    albumGridColumns: 3,
    imageGridColumns: 4,
    animationsEnabled: true
  },

  rateLimit: {
    checkInterval: 1000,
    warningThreshold: 100,
    retryAttempts: 3,
    retryDelay: 5000
  },

  logging: {
    enabled: true,
    level: 'info',
    logToConsole: true,
    logToLocalStorage: false
  }
};
