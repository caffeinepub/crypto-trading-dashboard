// Sensitivity Control System for Smart Trade Confidence
// Manages adjustable sensitivity thresholds and opportunity filtering

export interface SensitivitySettings {
  threshold: number; // 50-90%
  mode: 'aggressive' | 'balanced' | 'conservative';
  lastUpdated: number;
}

export interface SensitivityStats {
  activeOpportunities: number;
  entryOpportunities: number;
  exitOpportunities: number;
  averageConfidence: number;
  threshold: number;
}

const STORAGE_KEY = 'sensitivity_settings';

// Default sensitivity settings
const DEFAULT_SETTINGS: SensitivitySettings = {
  threshold: 70,
  mode: 'balanced',
  lastUpdated: Date.now(),
};

// Get sensitivity settings from localStorage
export function getSensitivitySettings(): SensitivitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(stored);
    console.log('[Sensitivity Control] 📋 Loaded settings:', settings);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('[Sensitivity Control] ❌ Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save sensitivity settings to localStorage
export function saveSensitivitySettings(settings: SensitivitySettings): void {
  try {
    const updated = { ...settings, lastUpdated: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[Sensitivity Control] 💾 Saved settings:', updated);
  } catch (error) {
    console.error('[Sensitivity Control] ❌ Error saving settings:', error);
  }
}

// Determine sensitivity mode based on threshold
export function determineSensitivityMode(threshold: number): 'aggressive' | 'balanced' | 'conservative' {
  if (threshold >= 70) {
    return 'conservative';
  } else if (threshold >= 60) {
    return 'balanced';
  } else {
    return 'aggressive';
  }
}

// Get sensitivity mode description
export function getSensitivityModeDescription(mode: 'aggressive' | 'balanced' | 'conservative'): string {
  const descriptions = {
    aggressive: 'Shows more frequent, lower-confidence signals (50-65%). Higher risk, more opportunities.',
    balanced: 'Moderate confidence signals (60-75%). Balanced risk-reward ratio.',
    conservative: 'High confidence signals only (70-90%). Lower risk, fewer opportunities.',
  };
  return descriptions[mode];
}

// Get sensitivity mode color
export function getSensitivityModeColor(mode: 'aggressive' | 'balanced' | 'conservative'): string {
  const colors = {
    aggressive: 'text-orange-600 dark:text-orange-400',
    balanced: 'text-blue-600 dark:text-blue-400',
    conservative: 'text-green-600 dark:text-green-400',
  };
  return colors[mode];
}

// Get sensitivity mode badge class
export function getSensitivityModeBadgeClass(mode: 'aggressive' | 'balanced' | 'conservative'): string {
  const classes = {
    aggressive: 'bg-orange-600 hover:bg-orange-700 text-white',
    balanced: 'bg-blue-600 hover:bg-blue-700 text-white',
    conservative: 'bg-green-600 hover:bg-green-700 text-white',
  };
  return classes[mode];
}

// Filter opportunities based on sensitivity threshold
export function filterOpportunitiesByThreshold<T extends { tradeSuccessProbability: number }>(
  opportunities: T[],
  threshold: number
): T[] {
  const filtered = opportunities.filter(opp => opp.tradeSuccessProbability >= threshold);
  console.log(`[Sensitivity Control] 🔍 Filtered ${opportunities.length} opportunities to ${filtered.length} at ${threshold}% threshold`);
  return filtered;
}

// Calculate sensitivity statistics - accepts both entry and exit zones
export function calculateSensitivityStats(
  entryOpportunities: Array<{ tradeSuccessProbability: number }>,
  exitOpportunities: Array<{ tradeSuccessProbability: number }>,
  threshold: number
): SensitivityStats {
  const filteredEntry = filterOpportunitiesByThreshold(entryOpportunities, threshold);
  const filteredExit = filterOpportunitiesByThreshold(exitOpportunities, threshold);
  
  const allFiltered = [...filteredEntry, ...filteredExit];
  const averageConfidence = allFiltered.length > 0
    ? allFiltered.reduce((sum, opp) => sum + opp.tradeSuccessProbability, 0) / allFiltered.length
    : 0;
  
  return {
    activeOpportunities: allFiltered.length,
    entryOpportunities: filteredEntry.length,
    exitOpportunities: filteredExit.length,
    averageConfidence,
    threshold,
  };
}

// Get confidence color based on threshold
export function getConfidenceColorByThreshold(confidence: number, threshold: number): string {
  if (confidence >= threshold) {
    return 'text-green-600 dark:text-green-400';
  } else if (confidence >= threshold - 20) {
    return 'text-yellow-600 dark:text-yellow-400';
  } else {
    return 'text-red-600 dark:text-red-400';
  }
}

// Get confidence badge class based on threshold
export function getConfidenceBadgeClassByThreshold(confidence: number, threshold: number): string {
  if (confidence >= threshold) {
    return 'bg-green-600 hover:bg-green-700 text-white border-green-500';
  } else if (confidence >= threshold - 20) {
    return 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500';
  } else {
    return 'bg-red-600 hover:bg-red-700 text-white border-red-500';
  }
}

// Validate sensitivity threshold
export function validateSensitivityThreshold(threshold: number): number {
  const validated = Math.max(50, Math.min(90, threshold));
  if (validated !== threshold) {
    console.warn(`[Sensitivity Control] ⚠️ Threshold ${threshold} adjusted to ${validated}`);
  }
  return validated;
}

// Get preset thresholds
export function getPresetThresholds(): Array<{ label: string; value: number; mode: 'aggressive' | 'balanced' | 'conservative' }> {
  return [
    { label: 'Aggressive', value: 55, mode: 'aggressive' },
    { label: 'Balanced', value: 65, mode: 'balanced' },
    { label: 'Conservative', value: 75, mode: 'conservative' },
  ];
}

// Track sensitivity performance history
export interface SensitivityPerformanceEntry {
  timestamp: number;
  threshold: number;
  opportunities: number;
  averageConfidence: number;
}

const PERFORMANCE_STORAGE_KEY = 'sensitivity_performance_history';
const MAX_PERFORMANCE_ENTRIES = 100;

export function trackSensitivityPerformance(stats: SensitivityStats): void {
  try {
    const stored = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
    const history: SensitivityPerformanceEntry[] = stored ? JSON.parse(stored) : [];
    
    const entry: SensitivityPerformanceEntry = {
      timestamp: Date.now(),
      threshold: stats.threshold,
      opportunities: stats.activeOpportunities,
      averageConfidence: stats.averageConfidence,
    };
    
    history.push(entry);
    
    // Keep only recent entries
    const trimmed = history.slice(-MAX_PERFORMANCE_ENTRIES);
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(trimmed));
    
    console.log('[Sensitivity Control] 📊 Tracked performance:', entry);
  } catch (error) {
    console.error('[Sensitivity Control] ❌ Error tracking performance:', error);
  }
}

export function getSensitivityPerformanceHistory(): SensitivityPerformanceEntry[] {
  try {
    const stored = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Sensitivity Control] ❌ Error loading performance history:', error);
    return [];
  }
}
