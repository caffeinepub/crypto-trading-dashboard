// High-Performance Mode
// Optimizes application performance during volatile markets

export interface PerformanceModeSettings {
  enabled: boolean;
  reducedAnimations: boolean;
  increasedCaching: boolean;
  reducedPolling: boolean;
  simplifiedCharts: boolean;
}

const STORAGE_KEY = 'performance_mode_settings';
const DEFAULT_SETTINGS: PerformanceModeSettings = {
  enabled: false,
  reducedAnimations: false,
  increasedCaching: true,
  reducedPolling: false,
  simplifiedCharts: false,
};

// Get performance mode settings
export function getPerformanceModeSettings(): PerformanceModeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[Performance Mode] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save performance mode settings
export function savePerformanceModeSettings(settings: PerformanceModeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('[Performance Mode] Saved settings:', settings);
    
    // Apply CSS class for reduced animations
    if (settings.enabled && settings.reducedAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  } catch (error) {
    console.error('[Performance Mode] Error saving settings:', error);
  }
}

// Toggle performance mode
export function togglePerformanceMode(enabled: boolean): void {
  const settings = getPerformanceModeSettings();
  const newSettings: PerformanceModeSettings = {
    ...settings,
    enabled,
    reducedAnimations: enabled,
    increasedCaching: enabled,
    reducedPolling: enabled,
    simplifiedCharts: enabled,
  };
  savePerformanceModeSettings(newSettings);
}

// Get refresh interval based on performance mode
export function getRefreshInterval(): number {
  const settings = getPerformanceModeSettings();
  return settings.enabled && settings.reducedPolling ? 120000 : 60000; // 2 min vs 1 min
}

// Get cache time based on performance mode
export function getCacheTime(): number {
  const settings = getPerformanceModeSettings();
  return settings.enabled && settings.increasedCaching ? 120000 : 60000; // 2 min vs 1 min
}

// Check if animations should be reduced
export function shouldReduceAnimations(): boolean {
  const settings = getPerformanceModeSettings();
  return settings.enabled && settings.reducedAnimations;
}

// Check if charts should be simplified
export function shouldSimplifyCharts(): boolean {
  const settings = getPerformanceModeSettings();
  return settings.enabled && settings.simplifiedCharts;
}
