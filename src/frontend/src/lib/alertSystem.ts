// Alert System for Smart Trade Confidence Signals
// Manages browser notifications, toast alerts, and alert preferences

export interface AlertPreferences {
  enabled: boolean;
  browserNotifications: boolean;
  toastNotifications: boolean;
  soundAlerts: boolean;
  thresholds: {
    entry: number; // Default 70%
    exit: number; // Default 70%
    strongBuy: number; // Default 85%
    strongSell: number; // Default 85%
    shortEntry: number; // Default 70%
    coverExit: number; // Default 70%
  };
  categories: {
    entry: boolean;
    exit: boolean;
    strongBuy: boolean;
    strongSell: boolean;
    shortEntry: boolean;
    coverExit: boolean;
  };
  cooldownMinutes: number; // Default 5 minutes
}

export interface AlertHistory {
  id: string;
  symbol: string;
  name: string;
  type: 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit';
  confidence: number;
  timestamp: number;
  price: number;
  dismissed: boolean;
}

const STORAGE_KEY_PREFERENCES = 'alert_preferences';
const STORAGE_KEY_HISTORY = 'alert_history';
const STORAGE_KEY_COOLDOWNS = 'alert_cooldowns';
const MAX_HISTORY_DAYS = 7;

// Default preferences
const DEFAULT_PREFERENCES: AlertPreferences = {
  enabled: true,
  browserNotifications: true,
  toastNotifications: true,
  soundAlerts: false,
  thresholds: {
    entry: 70,
    exit: 70,
    strongBuy: 85,
    strongSell: 85,
    shortEntry: 70,
    coverExit: 70,
  },
  categories: {
    entry: true,
    exit: true,
    strongBuy: true,
    strongSell: true,
    shortEntry: true,
    coverExit: true,
  },
  cooldownMinutes: 5,
};

// Get alert preferences from localStorage
export function getAlertPreferences(): AlertPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (!stored) return DEFAULT_PREFERENCES;
    
    const preferences = JSON.parse(stored);
    console.log('[Alert System] 📋 Loaded preferences:', preferences);
    return { ...DEFAULT_PREFERENCES, ...preferences };
  } catch (error) {
    console.error('[Alert System] ❌ Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save alert preferences to localStorage
export function saveAlertPreferences(preferences: AlertPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(preferences));
    console.log('[Alert System] 💾 Saved preferences:', preferences);
  } catch (error) {
    console.error('[Alert System] ❌ Error saving preferences:', error);
  }
}

// Get alert history from localStorage
export function getAlertHistory(): AlertHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!stored) return [];
    
    const history: AlertHistory[] = JSON.parse(stored);
    
    // Clean old history
    const cutoffTime = Date.now() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const cleaned = history.filter(h => h.timestamp > cutoffTime);
    
    if (cleaned.length !== history.length) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(cleaned));
    }
    
    return cleaned;
  } catch (error) {
    console.error('[Alert System] ❌ Error loading history:', error);
    return [];
  }
}

// Add alert to history
export function addAlertToHistory(alert: Omit<AlertHistory, 'id' | 'dismissed'>): void {
  try {
    const history = getAlertHistory();
    const newAlert: AlertHistory = {
      ...alert,
      id: `${alert.symbol}-${alert.timestamp}`,
      dismissed: false,
    };
    
    history.push(newAlert);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    console.log('[Alert System] 📝 Added to history:', newAlert);
  } catch (error) {
    console.error('[Alert System] ❌ Error adding to history:', error);
  }
}

// Mark alert as dismissed
export function dismissAlert(alertId: string): void {
  try {
    const history = getAlertHistory();
    const updated = history.map(alert =>
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    );
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    console.log('[Alert System] ✅ Dismissed alert:', alertId);
  } catch (error) {
    console.error('[Alert System] ❌ Error dismissing alert:', error);
  }
}

// Check if symbol is in cooldown
export function isInCooldown(symbol: string, type: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COOLDOWNS);
    if (!stored) return false;
    
    const cooldowns: Record<string, number> = JSON.parse(stored);
    const key = `${symbol}-${type}`;
    const lastAlert = cooldowns[key];
    
    if (!lastAlert) return false;
    
    const preferences = getAlertPreferences();
    const cooldownMs = preferences.cooldownMinutes * 60 * 1000;
    const isInCooldown = Date.now() - lastAlert < cooldownMs;
    
    if (isInCooldown) {
      const remainingMs = cooldownMs - (Date.now() - lastAlert);
      const remainingMin = Math.ceil(remainingMs / 60000);
      console.log(`[Alert System] ⏳ ${symbol} ${type} in cooldown for ${remainingMin} more minutes`);
    }
    
    return isInCooldown;
  } catch (error) {
    console.error('[Alert System] ❌ Error checking cooldown:', error);
    return false;
  }
}

// Set cooldown for symbol
export function setCooldown(symbol: string, type: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COOLDOWNS);
    const cooldowns: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    const key = `${symbol}-${type}`;
    cooldowns[key] = Date.now();
    
    localStorage.setItem(STORAGE_KEY_COOLDOWNS, JSON.stringify(cooldowns));
    console.log('[Alert System] ⏰ Set cooldown for:', key);
  } catch (error) {
    console.error('[Alert System] ❌ Error setting cooldown:', error);
  }
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Alert System] ⚠️ Browser notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('[Alert System] ✅ Notification permission already granted');
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('[Alert System] ❌ Notification permission denied');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    console.log('[Alert System] 🔔 Notification permission:', permission);
    return granted;
  } catch (error) {
    console.error('[Alert System] ❌ Error requesting notification permission:', error);
    return false;
  }
}

// Show browser notification
export function showBrowserNotification(
  symbol: string,
  name: string,
  type: 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit',
  confidence: number
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('[Alert System] ⚠️ Cannot show browser notification');
    return;
  }
  
  try {
    const titles = {
      entry: '🎯 Smart Entry Signal (LONG)',
      exit: '⚠️ Dynamic Exit Signal (LONG)',
      strongBuy: '🚀 Strong Buy Signal (LONG)',
      strongSell: '🔴 Strong Sell Signal (LONG)',
      shortEntry: '🔻 Short Entry Signal',
      coverExit: '✅ Cover Exit Signal',
    };
    
    const bodies = {
      entry: `${symbol} (${name}) - LONG entry opportunity with ${confidence}% confidence`,
      exit: `${symbol} (${name}) - LONG exit recommended with ${confidence}% confidence`,
      strongBuy: `${symbol} (${name}) - Strong LONG buy signal with ${confidence}% confidence`,
      strongSell: `${symbol} (${name}) - Strong LONG sell signal with ${confidence}% confidence`,
      shortEntry: `${symbol} (${name}) - SHORT entry opportunity with ${confidence}% confidence`,
      coverExit: `${symbol} (${name}) - COVER exit recommended with ${confidence}% confidence`,
    };
    
    const notification = new Notification(titles[type], {
      body: bodies[type],
      icon: '/assets/generated/alert-notification-icon-transparent.dim_32x32.png',
      badge: '/assets/generated/confidence-indicator-transparent.dim_32x32.png',
      tag: `${symbol}-${type}`,
      requireInteraction: false,
      silent: false,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    console.log('[Alert System] 🔔 Browser notification shown:', symbol, type);
  } catch (error) {
    console.error('[Alert System] ❌ Error showing browser notification:', error);
  }
}

// Play alert sound
export function playAlertSound(): void {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log('[Alert System] 🔊 Alert sound played');
  } catch (error) {
    console.error('[Alert System] ❌ Error playing alert sound:', error);
  }
}

// Determine alert type based on confidence
export function determineAlertType(
  isEntry: boolean,
  confidence: number,
  thresholds: AlertPreferences['thresholds'],
  isShort: boolean = false
): 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit' | null {
  if (isShort) {
    if (isEntry) {
      // Short entry
      if (confidence >= thresholds.strongSell) {
        return 'shortEntry';
      } else if (confidence >= thresholds.shortEntry) {
        return 'shortEntry';
      }
    } else {
      // Cover exit
      if (confidence >= thresholds.strongBuy) {
        return 'coverExit';
      } else if (confidence >= thresholds.coverExit) {
        return 'coverExit';
      }
    }
  } else {
    if (isEntry) {
      // Long entry
      if (confidence >= thresholds.strongBuy) {
        return 'strongBuy';
      } else if (confidence >= thresholds.entry) {
        return 'entry';
      }
    } else {
      // Long exit
      if (confidence >= thresholds.strongSell) {
        return 'strongSell';
      } else if (confidence >= thresholds.exit) {
        return 'exit';
      }
    }
  }
  
  return null;
}

// Check if alert should be triggered
export function shouldTriggerAlert(
  symbol: string,
  type: 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit',
  preferences: AlertPreferences
): boolean {
  if (!preferences.enabled) {
    return false;
  }
  
  if (!preferences.categories[type]) {
    return false;
  }
  
  if (isInCooldown(symbol, type)) {
    return false;
  }
  
  return true;
}

// Calculate alert statistics
export function calculateAlertStatistics(days: number = 7): {
  totalAlerts: number;
  byType: Record<string, number>;
  accuracy: number;
  mostAlerted: Array<{ symbol: string; count: number }>;
} {
  const history = getAlertHistory();
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  const recentHistory = history.filter(h => h.timestamp > cutoffTime);
  
  const byType: Record<string, number> = {
    entry: 0,
    exit: 0,
    strongBuy: 0,
    strongSell: 0,
    shortEntry: 0,
    coverExit: 0,
  };
  
  const symbolCounts: Record<string, number> = {};
  
  recentHistory.forEach(alert => {
    byType[alert.type]++;
    symbolCounts[alert.symbol] = (symbolCounts[alert.symbol] || 0) + 1;
  });
  
  const mostAlerted = Object.entries(symbolCounts)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate accuracy (simplified - would need actual price tracking)
  const accuracy = recentHistory.length > 0
    ? recentHistory.reduce((sum, alert) => sum + alert.confidence, 0) / recentHistory.length
    : 0;
  
  return {
    totalAlerts: recentHistory.length,
    byType,
    accuracy,
    mostAlerted,
  };
}

