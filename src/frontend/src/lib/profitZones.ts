import type { CryptoData } from './coinRankingApi';

export interface ProfitZone {
  symbol: string;
  name: string;
  currentPrice: number;
  zones: {
    support: number[];
    resistance: number[];
  };
  roiProbability: {
    short: number; // 1-7 days
    medium: number; // 7-30 days
    long: number; // 30+ days
  };
  expectedProfitRange: {
    low: number;
    mid: number;
    high: number;
  };
  riskRewardRatio: number;
  successProbability: number; // 0-100
  historicalAccuracy: number; // 0-100
}

// Calculate support and resistance levels using pivot points
function calculatePivotLevels(sparklinePrices: number[]): {
  support: number[];
  resistance: number[];
} {
  if (sparklinePrices.length < 3) {
    return { support: [], resistance: [] };
  }
  
  const high = Math.max(...sparklinePrices);
  const low = Math.min(...sparklinePrices);
  const close = sparklinePrices[sparklinePrices.length - 1];
  
  // Calculate pivot point
  const pivot = (high + low + close) / 3;
  
  // Calculate support and resistance levels
  const r1 = (2 * pivot) - low;
  const r2 = pivot + (high - low);
  const r3 = high + 2 * (pivot - low);
  
  const s1 = (2 * pivot) - high;
  const s2 = pivot - (high - low);
  const s3 = low - 2 * (high - pivot);
  
  return {
    resistance: [r1, r2, r3].filter(r => r > close),
    support: [s1, s2, s3].filter(s => s < close)
  };
}

// Calculate ROI probability based on technical indicators
function calculateROIProbability(
  crypto: CryptoData,
  sparklinePrices: number[]
): {
  short: number;
  medium: number;
  long: number;
} {
  const { rsi, emaSignal, percentChange } = crypto;
  
  let shortProb = 50;
  let mediumProb = 50;
  let longProb = 50;
  
  // RSI influence
  if (rsi < 30) {
    shortProb += 20;
    mediumProb += 15;
    longProb += 10;
  } else if (rsi > 70) {
    shortProb -= 15;
    mediumProb -= 10;
    longProb -= 5;
  }
  
  // EMA signal influence
  if (emaSignal === 'Bullish') {
    shortProb += 15;
    mediumProb += 20;
    longProb += 25;
  } else {
    shortProb -= 10;
    mediumProb -= 15;
    longProb -= 20;
  }
  
  // Recent momentum influence
  if (percentChange > 5) {
    shortProb += 10;
    mediumProb += 5;
  } else if (percentChange < -5) {
    shortProb -= 10;
    mediumProb -= 5;
  }
  
  // Clamp values to 0-100
  shortProb = Math.max(0, Math.min(100, shortProb));
  mediumProb = Math.max(0, Math.min(100, mediumProb));
  longProb = Math.max(0, Math.min(100, longProb));
  
  return { short: shortProb, medium: mediumProb, long: longProb };
}

// Calculate expected profit range
function calculateExpectedProfitRange(
  currentPrice: number,
  resistance: number[],
  roiProbability: { short: number; medium: number; long: number }
): {
  low: number;
  mid: number;
  high: number;
} {
  const avgProbability = (roiProbability.short + roiProbability.medium + roiProbability.long) / 3;
  
  // Calculate profit targets based on resistance levels
  const nearestResistance = resistance.length > 0 ? resistance[0] : currentPrice * 1.05;
  const midResistance = resistance.length > 1 ? resistance[1] : currentPrice * 1.10;
  const farResistance = resistance.length > 2 ? resistance[2] : currentPrice * 1.15;
  
  const lowProfit = ((nearestResistance - currentPrice) / currentPrice) * 100;
  const midProfit = ((midResistance - currentPrice) / currentPrice) * 100;
  const highProfit = ((farResistance - currentPrice) / currentPrice) * 100;
  
  // Adjust by probability
  const probabilityFactor = avgProbability / 100;
  
  return {
    low: lowProfit * probabilityFactor,
    mid: midProfit * probabilityFactor,
    high: highProfit * probabilityFactor
  };
}

// Calculate risk-reward ratio
function calculateRiskRewardRatio(
  currentPrice: number,
  support: number[],
  resistance: number[]
): number {
  if (support.length === 0 || resistance.length === 0) {
    return 1.0;
  }
  
  const nearestSupport = support[support.length - 1]; // Closest support below
  const nearestResistance = resistance[0]; // Closest resistance above
  
  const potentialLoss = currentPrice - nearestSupport;
  const potentialGain = nearestResistance - currentPrice;
  
  if (potentialLoss === 0) return 10.0; // Very favorable
  
  return potentialGain / potentialLoss;
}

// Calculate success probability
function calculateSuccessProbability(
  roiProbability: { short: number; medium: number; long: number },
  riskRewardRatio: number
): number {
  const avgROI = (roiProbability.short + roiProbability.medium + roiProbability.long) / 3;
  
  // Weight ROI probability (70%) and risk-reward ratio (30%)
  const rrFactor = Math.min(100, riskRewardRatio * 20); // Scale RR to 0-100
  const successProb = (avgROI * 0.7) + (rrFactor * 0.3);
  
  return Math.max(0, Math.min(100, successProb));
}

// Analyze profit zones for a cryptocurrency
export function analyzeProfitZones(
  crypto: CryptoData,
  sparklinePrices: number[]
): ProfitZone {
  console.log(`[Profit Zones] 💰 Analyzing profit zones for ${crypto.symbol}...`);
  
  const zones = calculatePivotLevels(sparklinePrices);
  const roiProbability = calculateROIProbability(crypto, sparklinePrices);
  const expectedProfitRange = calculateExpectedProfitRange(crypto.price, zones.resistance, roiProbability);
  const riskRewardRatio = calculateRiskRewardRatio(crypto.price, zones.support, zones.resistance);
  const successProbability = calculateSuccessProbability(roiProbability, riskRewardRatio);
  
  // Historical accuracy (simplified - would need actual historical data)
  const historicalAccuracy = Math.min(100, successProbability * 0.9 + 10);
  
  console.log(`[Profit Zones] ✅ ${crypto.symbol} analysis complete:`, {
    successProbability: successProbability.toFixed(1),
    riskRewardRatio: riskRewardRatio.toFixed(2)
  });
  
  return {
    symbol: crypto.symbol,
    name: crypto.name,
    currentPrice: crypto.price,
    zones,
    roiProbability,
    expectedProfitRange,
    riskRewardRatio,
    successProbability,
    historicalAccuracy
  };
}

// Get top profit opportunities
export function getTopProfitOpportunities(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>,
  limit: number = 10
): ProfitZone[] {
  const profitZones: ProfitZone[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 10) continue;
    
    const zone = analyzeProfitZones(crypto, sparkline);
    profitZones.push(zone);
  }
  
  // Sort by success probability
  return profitZones
    .sort((a, b) => b.successProbability - a.successProbability)
    .slice(0, limit);
}
