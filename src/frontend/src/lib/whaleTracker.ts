import type { CryptoData } from './coinRankingApi';

export interface WhaleMovement {
  symbol: string;
  name: string;
  timestamp: number;
  type: 'accumulation' | 'distribution';
  magnitude: number; // 0-100 scale
  volumeChange: number; // Percentage change
  priceImpact: number; // Estimated price impact
  confidence: 'Low' | 'Medium' | 'High';
  timeframe: '1h' | '4h' | '1d' | '7d';
}

export interface WhaleActivity {
  symbol: string;
  name: string;
  accumulationScore: number; // 0-100
  distributionScore: number; // 0-100
  netFlow: 'accumulation' | 'distribution' | 'neutral';
  recentMovements: WhaleMovement[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

const STORAGE_KEY = 'whale_tracker_history';
const WHALE_THRESHOLD = 2.5; // Volume spike threshold (2.5x average)

// Detect whale movements based on volume analysis
export function detectWhaleMovements(
  crypto: CryptoData,
  sparklinePrices: number[],
  timeframe: '1h' | '4h' | '1d' | '7d' = '1d'
): WhaleMovement | null {
  console.log(`[Whale Tracker] 🐋 Analyzing ${crypto.symbol} for whale activity...`);
  
  if (sparklinePrices.length < 10) {
    return null;
  }
  
  // Calculate average volume from recent data
  const recentPrices = sparklinePrices.slice(-10);
  const avgVolume = crypto.volume;
  
  // Detect volume spikes
  const volumeChange = crypto.percentChange;
  const isVolumeSpike = Math.abs(volumeChange) > 5; // 5% threshold
  
  if (!isVolumeSpike) {
    return null;
  }
  
  // Determine accumulation vs distribution
  const priceDirection = crypto.percentChange > 0 ? 'up' : 'down';
  const volumeDirection = volumeChange > 0 ? 'up' : 'down';
  
  let type: 'accumulation' | 'distribution';
  let confidence: 'Low' | 'Medium' | 'High';
  
  // Accumulation: Price up + Volume up OR Price down + Volume up (buying dip)
  // Distribution: Price down + Volume up (selling pressure) OR Price up + Volume down
  if (priceDirection === 'up' && volumeDirection === 'up') {
    type = 'accumulation';
    confidence = 'High';
  } else if (priceDirection === 'down' && volumeDirection === 'up') {
    type = 'distribution';
    confidence = 'High';
  } else if (priceDirection === 'down' && volumeDirection === 'down') {
    type = 'distribution';
    confidence = 'Medium';
  } else {
    type = 'accumulation';
    confidence = 'Medium';
  }
  
  // Calculate magnitude (0-100)
  const magnitude = Math.min(100, Math.abs(volumeChange) * 10);
  
  // Estimate price impact
  const priceImpact = Math.abs(crypto.percentChange);
  
  const movement: WhaleMovement = {
    symbol: crypto.symbol,
    name: crypto.name,
    timestamp: Date.now(),
    type,
    magnitude,
    volumeChange,
    priceImpact,
    confidence,
    timeframe
  };
  
  console.log(`[Whale Tracker] ✅ Whale movement detected for ${crypto.symbol}:`, {
    type,
    magnitude: magnitude.toFixed(1),
    confidence
  });
  
  return movement;
}

// Analyze whale activity for a cryptocurrency
export function analyzeWhaleActivity(
  crypto: CryptoData,
  sparklinePrices: number[]
): WhaleActivity {
  const recentMovements = getRecentWhaleMovements(crypto.symbol);
  
  // Calculate accumulation and distribution scores
  let accumulationScore = 0;
  let distributionScore = 0;
  
  recentMovements.forEach(movement => {
    if (movement.type === 'accumulation') {
      accumulationScore += movement.magnitude * (movement.confidence === 'High' ? 1 : 0.5);
    } else {
      distributionScore += movement.magnitude * (movement.confidence === 'High' ? 1 : 0.5);
    }
  });
  
  // Normalize scores to 0-100
  const totalScore = accumulationScore + distributionScore;
  if (totalScore > 0) {
    accumulationScore = (accumulationScore / totalScore) * 100;
    distributionScore = (distributionScore / totalScore) * 100;
  }
  
  // Determine net flow
  let netFlow: 'accumulation' | 'distribution' | 'neutral';
  if (accumulationScore > distributionScore + 20) {
    netFlow = 'accumulation';
  } else if (distributionScore > accumulationScore + 20) {
    netFlow = 'distribution';
  } else {
    netFlow = 'neutral';
  }
  
  // Determine trend
  const trend = determineTrend(recentMovements);
  
  return {
    symbol: crypto.symbol,
    name: crypto.name,
    accumulationScore,
    distributionScore,
    netFlow,
    recentMovements,
    trend
  };
}

// Determine trend from recent movements
function determineTrend(movements: WhaleMovement[]): 'increasing' | 'decreasing' | 'stable' {
  if (movements.length < 2) return 'stable';
  
  const recent = movements.slice(-3);
  const accumulationCount = recent.filter(m => m.type === 'accumulation').length;
  const distributionCount = recent.filter(m => m.type === 'distribution').length;
  
  if (accumulationCount > distributionCount) {
    return 'increasing';
  } else if (distributionCount > accumulationCount) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

// Store whale movement
export function storeWhaleMovement(movement: WhaleMovement): void {
  try {
    const stored = getWhaleMovementHistory();
    stored.push(movement);
    
    // Keep only last 7 days
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const cleaned = stored.filter(m => m.timestamp > cutoffTime);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    console.log(`[Whale Tracker] 💾 Stored whale movement for ${movement.symbol}`);
  } catch (error) {
    console.error('[Whale Tracker] ❌ Error storing movement:', error);
  }
}

// Get whale movement history
export function getWhaleMovementHistory(symbol?: string): WhaleMovement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    let history: WhaleMovement[] = JSON.parse(stored);
    
    if (symbol) {
      history = history.filter(m => m.symbol === symbol);
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[Whale Tracker] ❌ Error retrieving history:', error);
    return [];
  }
}

// Get recent whale movements for a symbol
export function getRecentWhaleMovements(symbol: string, days: number = 7): WhaleMovement[] {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  return getWhaleMovementHistory(symbol).filter(m => m.timestamp > cutoffTime);
}

// Get top whale activity cryptocurrencies
export function getTopWhaleActivity(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>,
  limit: number = 10
): WhaleActivity[] {
  const activities: WhaleActivity[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline) continue;
    
    const activity = analyzeWhaleActivity(crypto, sparkline);
    if (activity.recentMovements.length > 0) {
      activities.push(activity);
    }
  }
  
  // Sort by total activity (accumulation + distribution)
  return activities
    .sort((a, b) => {
      const aTotal = a.accumulationScore + a.distributionScore;
      const bTotal = b.accumulationScore + b.distributionScore;
      return bTotal - aTotal;
    })
    .slice(0, limit);
}
