import type { EntryZoneSignal, ExitZoneSignal, ShortEntrySignal, CoverExitSignal } from './tradeEntryZone';

export interface SignalOutcome {
  symbol: string;
  signalType: 'entry' | 'exit' | 'shortEntry' | 'coverExit';
  timestamp: number;
  predictedDirection: 'up' | 'down';
  predictedConfidence: number;
  actualOutcome: 'success' | 'failure' | 'pending';
  actualPriceChange: number;
  timeframe: '1h' | '4h' | '1d';
}

export interface OptimizerMetrics {
  totalSignals: number;
  successfulSignals: number;
  failedSignals: number;
  pendingSignals: number;
  accuracyRate: number;
  averageConfidence: number;
  optimizationScore: number; // 0-100
}

export interface ThresholdAdjustment {
  signalType: 'entry' | 'exit' | 'shortEntry' | 'coverExit';
  currentThreshold: number;
  suggestedThreshold: number;
  reason: string;
  expectedImprovement: number; // Percentage
}

const STORAGE_KEY = 'ai_optimizer_outcomes';
const LEARNING_RATE = 0.1; // How quickly to adapt thresholds

// Track signal outcome
export function trackSignalOutcome(
  signal: EntryZoneSignal | ExitZoneSignal | ShortEntrySignal | CoverExitSignal,
  signalType: 'entry' | 'exit' | 'shortEntry' | 'coverExit',
  timeframe: '1h' | '4h' | '1d' = '1d'
): void {
  const outcome: SignalOutcome = {
    symbol: signal.symbol,
    signalType,
    timestamp: Date.now(),
    predictedDirection: signalType === 'entry' || signalType === 'coverExit' ? 'up' : 'down',
    predictedConfidence: signal.tradeSuccessProbability,
    actualOutcome: 'pending',
    actualPriceChange: 0,
    timeframe
  };
  
  storeSignalOutcome(outcome);
  console.log(`[AI Optimizer] 📊 Tracking signal outcome for ${signal.symbol}`);
}

// Update signal outcome with actual result
export function updateSignalOutcome(
  symbol: string,
  signalType: 'entry' | 'exit' | 'shortEntry' | 'coverExit',
  actualPriceChange: number
): void {
  const outcomes = getSignalOutcomes();
  const pendingOutcome = outcomes.find(
    o => o.symbol === symbol && 
         o.signalType === signalType && 
         o.actualOutcome === 'pending'
  );
  
  if (!pendingOutcome) return;
  
  // Determine if prediction was successful
  const isSuccess = 
    (pendingOutcome.predictedDirection === 'up' && actualPriceChange > 0) ||
    (pendingOutcome.predictedDirection === 'down' && actualPriceChange < 0);
  
  pendingOutcome.actualOutcome = isSuccess ? 'success' : 'failure';
  pendingOutcome.actualPriceChange = actualPriceChange;
  
  // Update storage
  const updatedOutcomes = outcomes.map(o => 
    o.symbol === symbol && o.signalType === signalType && o.timestamp === pendingOutcome.timestamp
      ? pendingOutcome
      : o
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOutcomes));
  console.log(`[AI Optimizer] ✅ Updated outcome for ${symbol}: ${isSuccess ? 'SUCCESS' : 'FAILURE'}`);
}

// Calculate optimizer metrics
export function calculateOptimizerMetrics(): OptimizerMetrics {
  const outcomes = getSignalOutcomes();
  
  const totalSignals = outcomes.length;
  const successfulSignals = outcomes.filter(o => o.actualOutcome === 'success').length;
  const failedSignals = outcomes.filter(o => o.actualOutcome === 'failure').length;
  const pendingSignals = outcomes.filter(o => o.actualOutcome === 'pending').length;
  
  const completedSignals = successfulSignals + failedSignals;
  const accuracyRate = completedSignals > 0 ? (successfulSignals / completedSignals) * 100 : 0;
  
  const averageConfidence = outcomes.length > 0
    ? outcomes.reduce((sum, o) => sum + o.predictedConfidence, 0) / outcomes.length
    : 0;
  
  // Optimization score based on accuracy and confidence alignment
  const optimizationScore = Math.min(100, accuracyRate * 0.7 + averageConfidence * 0.3);
  
  return {
    totalSignals,
    successfulSignals,
    failedSignals,
    pendingSignals,
    accuracyRate,
    averageConfidence,
    optimizationScore
  };
}

// Generate threshold adjustments based on performance
export function generateThresholdAdjustments(): ThresholdAdjustment[] {
  const outcomes = getSignalOutcomes();
  const adjustments: ThresholdAdjustment[] = [];
  
  const signalTypes: Array<'entry' | 'exit' | 'shortEntry' | 'coverExit'> = 
    ['entry', 'exit', 'shortEntry', 'coverExit'];
  
  for (const signalType of signalTypes) {
    const typeOutcomes = outcomes.filter(o => o.signalType === signalType && o.actualOutcome !== 'pending');
    
    if (typeOutcomes.length < 5) continue; // Need minimum data
    
    const successRate = typeOutcomes.filter(o => o.actualOutcome === 'success').length / typeOutcomes.length;
    const avgConfidence = typeOutcomes.reduce((sum, o) => sum + o.predictedConfidence, 0) / typeOutcomes.length;
    
    // Current threshold (default 70%)
    const currentThreshold = 70;
    let suggestedThreshold = currentThreshold;
    let reason = '';
    let expectedImprovement = 0;
    
    if (successRate < 0.6) {
      // Low success rate - increase threshold
      suggestedThreshold = Math.min(90, currentThreshold + 10);
      reason = `Success rate (${(successRate * 100).toFixed(1)}%) below target. Increasing threshold to filter weaker signals.`;
      expectedImprovement = 15;
    } else if (successRate > 0.8 && avgConfidence > 75) {
      // High success rate - can lower threshold to catch more opportunities
      suggestedThreshold = Math.max(50, currentThreshold - 5);
      reason = `High success rate (${(successRate * 100).toFixed(1)}%). Lowering threshold to capture more opportunities.`;
      expectedImprovement = 10;
    } else {
      // Optimal range - minor adjustment
      suggestedThreshold = currentThreshold;
      reason = `Performance optimal. Maintaining current threshold.`;
      expectedImprovement = 0;
    }
    
    if (suggestedThreshold !== currentThreshold) {
      adjustments.push({
        signalType,
        currentThreshold,
        suggestedThreshold,
        reason,
        expectedImprovement
      });
    }
  }
  
  return adjustments;
}

// Get learning insights
export function getLearningInsights(): string[] {
  const metrics = calculateOptimizerMetrics();
  const insights: string[] = [];
  
  if (metrics.accuracyRate > 75) {
    insights.push(`🎯 Strong prediction accuracy at ${metrics.accuracyRate.toFixed(1)}%. Model performing well.`);
  } else if (metrics.accuracyRate > 60) {
    insights.push(`⚠️ Moderate accuracy at ${metrics.accuracyRate.toFixed(1)}%. Consider threshold adjustments.`);
  } else if (metrics.totalSignals > 10) {
    insights.push(`⚡ Low accuracy at ${metrics.accuracyRate.toFixed(1)}%. Significant optimization needed.`);
  }
  
  if (metrics.pendingSignals > metrics.totalSignals * 0.5) {
    insights.push(`⏳ ${metrics.pendingSignals} signals pending verification. Check back for updated metrics.`);
  }
  
  if (metrics.optimizationScore > 80) {
    insights.push(`✅ Optimization score: ${metrics.optimizationScore.toFixed(1)}/100. Excellent performance.`);
  } else if (metrics.optimizationScore > 60) {
    insights.push(`📈 Optimization score: ${metrics.optimizationScore.toFixed(1)}/100. Good progress.`);
  } else {
    insights.push(`🔧 Optimization score: ${metrics.optimizationScore.toFixed(1)}/100. Continuous learning in progress.`);
  }
  
  return insights;
}

// Store signal outcome
function storeSignalOutcome(outcome: SignalOutcome): void {
  try {
    const stored = getSignalOutcomes();
    stored.push(outcome);
    
    // Keep only last 30 days
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const cleaned = stored.filter(o => o.timestamp > cutoffTime);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error('[AI Optimizer] ❌ Error storing outcome:', error);
  }
}

// Get signal outcomes
export function getSignalOutcomes(symbol?: string): SignalOutcome[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    let outcomes: SignalOutcome[] = JSON.parse(stored);
    
    if (symbol) {
      outcomes = outcomes.filter(o => o.symbol === symbol);
    }
    
    return outcomes.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[AI Optimizer] ❌ Error retrieving outcomes:', error);
    return [];
  }
}

// Clear old outcomes
export function clearOldOutcomes(days: number = 30): void {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  const outcomes = getSignalOutcomes().filter(o => o.timestamp > cutoffTime);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
  console.log(`[AI Optimizer] 🗑️ Cleared outcomes older than ${days} days`);
}
