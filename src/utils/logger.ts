// Set this to false to disable all logging
const ENABLE_LOGGING = false;

export const logger = {
  info: (message: string, data?: any) => {
    if (!ENABLE_LOGGING) return;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'LOG',
          level: 'info',
          message,
          data
        }).catch(() => {
          // Fallback to console if message fails
          console.log(`[INFO] ${message}`, data);
        });
      } else {
        console.log(`[INFO] ${message}`, data);
      }
    } catch (error) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (!ENABLE_LOGGING) return;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'LOG',
          level: 'warn',
          message,
          data
        }).catch(() => {
          logger.warn(`[WARN] ${message}`, data);
        });
      } else {
        logger.warn(`[WARN] ${message}`, data);
      }
    } catch (error) {
      logger.warn(`[WARN] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (!ENABLE_LOGGING) return;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'LOG',
          level: 'error',
          message,
          error: error?.message || error
        }).catch(() => {
          logger.error(`[ERROR] ${message}`, error);
        });
      } else {
        logger.error(`[ERROR] ${message}`, error);
      }
    } catch (e) {
      logger.error(`[ERROR] ${message}`, error);
    }
  }
}; 