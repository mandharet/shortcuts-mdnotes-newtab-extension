chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG') {
    switch (message.level) {
      case 'info':
        console.log(`[INFO] ${message.message}`, message.data);
        break;
      case 'warn':
        console.warn(`[WARN] ${message.message}`, message.data);
        break;
      case 'error':
        console.error(`[ERROR] ${message.message}`, message.error);
        break;
    }
  }
}); 