// Debug flag - set to true to enable debug logging
const DEBUG_ENABLED = false;

export function debugLog(...args: any[]) {
  if (DEBUG_ENABLED) {
    console.log('[DEBUG]', ...args);
  }
}

export function debugWarn(...args: any[]) {
  if (DEBUG_ENABLED) {
    console.warn('[DEBUG]', ...args);
  }
}

export function debugError(...args: any[]) {
  if (DEBUG_ENABLED) {
    console.error('[DEBUG]', ...args);
  }
}
