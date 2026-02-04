// Dynamic Risk Management & Position Sizing
// Calculates optimal position sizes and risk-reward ratios

import type { CryptoData } from './coinRankingApi';

export interface RiskParameters {
  accountSize: number;
  riskPercentage: number; // % of account to risk per trade
  maxPositionSize: number; // % of account per position
  maxDrawdown: number; // % maximum acceptable drawdown
}

export interface PositionSizeRecommendation {
  symbol: string;
  recommendedSize: number; // In USD
  recommendedQuantity: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  riskAmount: number;
  potentialProfit: number;
  confidence: number;
}

export interface RiskMetrics {
  currentRisk: number;
  maxRisk: number;
  availableRisk: number;
  portfolioHeatLevel: 'low' | 'medium' | 'high' | 'critical';
}

const STORAGE_KEY_PARAMS = 'risk_management_params';
const DEFAULT_PARAMS: RiskParameters = {
  accountSize: 10000,
  riskPercentage: 2,
  maxPositionSize: 10,
  maxDrawdown: 20,
};

// Get risk parameters
export function getRiskParameters(): RiskParameters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PARAMS);
    return stored ? JSON.parse(stored) : DEFAULT_PARAMS;
  } catch (error) {
    console.error('[Risk Management] Error loading parameters:', error);
    return DEFAULT_PARAMS;
  }
}

// Save risk parameters
export function saveRiskParameters(params: RiskParameters): void {
  try {
    localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(params));
    console.log('[Risk Management] Saved parameters:', params);
  } catch (error) {
    console.error('[Risk Management] Error saving parameters:', error);
  }
}

// Calculate support and resistance levels
export function calculateSupportResistance(prices: number[]): {
  support: number;
  resistance: number;
} {
  if (prices.length < 10) {
    const current = prices[prices.length - 1];
    return {
      support: current * 0.95,
      resistance: current * 1.05,
    };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const support = sorted[Math.floor(sorted.length * 0.2)];
  const resistance = sorted[Math.floor(sorted.length * 0.8)];

  return { support, resistance };
}

// Calculate dynamic stop loss
export function calculateDynamicStopLoss(
  crypto: CryptoData,
  sparkline: number[],
  signalType: 'long' | 'short'
): number {
  const { support, resistance } = calculateSupportResistance(sparkline);
  const atr = calculateATR(sparkline);
  
  if (signalType === 'long') {
    // For long positions, stop loss below support
    return Math.min(support * 0.98, crypto.price - (atr * 2));
  } else {
    // For short positions, stop loss above resistance
    return Math.max(resistance * 1.02, crypto.price + (atr * 2));
  }
}

// Calculate dynamic take profit
export function calculateDynamicTakeProfit(
  crypto: CryptoData,
  sparkline: number[],
  signalType: 'long' | 'short',
  confidence: number
): number {
  const { support, resistance } = calculateSupportResistance(sparkline);
  const atr = calculateATR(sparkline);
  const confidenceMultiplier = 1 + (confidence / 100);
  
  if (signalType === 'long') {
    // For long positions, take profit near resistance
    return Math.max(resistance * 1.02, crypto.price + (atr * 3 * confidenceMultiplier));
  } else {
    // For short positions, take profit near support
    return Math.min(support * 0.98, crypto.price - (atr * 3 * confidenceMultiplier));
  }
}

// Calculate Average True Range (ATR)
function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    return (high - low) / prices.length;
  }

  let atr = 0;
  for (let i = 1; i < period + 1; i++) {
    atr += Math.abs(prices[i] - prices[i - 1]);
  }
  return atr / period;
}

// Calculate position size recommendation
export function calculatePositionSize(
  crypto: CryptoData,
  sparkline: number[],
  signalType: 'long' | 'short',
  confidence: number
): PositionSizeRecommendation {
  const params = getRiskParameters();
  const stopLoss = calculateDynamicStopLoss(crypto, sparkline, signalType);
  const takeProfit = calculateDynamicTakeProfit(crypto, sparkline, signalType, confidence);
  
  // Calculate risk per share
  const riskPerShare = signalType === 'long' 
    ? crypto.price - stopLoss 
    : stopLoss - crypto.price;
  
  // Calculate position size based on risk
  const riskAmount = params.accountSize * (params.riskPercentage / 100);
  const recommendedQuantity = riskPerShare > 0 ? riskAmount / riskPerShare : 0;
  const recommendedSize = recommendedQuantity * crypto.price;
  
  // Apply max position size constraint
  const maxSize = params.accountSize * (params.maxPositionSize / 100);
  const finalSize = Math.min(recommendedSize, maxSize);
  const finalQuantity = finalSize / crypto.price;
  
  // Calculate risk-reward ratio
  const potentialProfit = signalType === 'long'
    ? (takeProfit - crypto.price) * finalQuantity
    : (crypto.price - takeProfit) * finalQuantity;
  const actualRisk = riskPerShare * finalQuantity;
  const riskRewardRatio = actualRisk > 0 ? potentialProfit / actualRisk : 0;
  
  return {
    symbol: crypto.symbol,
    recommendedSize: finalSize,
    recommendedQuantity: finalQuantity,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    riskAmount: actualRisk,
    potentialProfit,
    confidence,
  };
}

// Calculate portfolio risk metrics
export function calculateRiskMetrics(
  activePositions: Array<{ symbol: string; quantity: number; entryPrice: number; stopLoss?: number }>,
  cryptoData: CryptoData[]
): RiskMetrics {
  const params = getRiskParameters();
  const priceMap = new Map(cryptoData.map(c => [c.symbol, c.price]));
  
  let currentRisk = 0;
  activePositions.forEach(position => {
    const currentPrice = priceMap.get(position.symbol) || position.entryPrice;
    const stopLoss = position.stopLoss || currentPrice * 0.95;
    const riskPerShare = Math.abs(currentPrice - stopLoss);
    currentRisk += riskPerShare * position.quantity;
  });
  
  const maxRisk = params.accountSize * (params.maxDrawdown / 100);
  const availableRisk = maxRisk - currentRisk;
  const riskPercentage = (currentRisk / maxRisk) * 100;
  
  let portfolioHeatLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskPercentage < 25) portfolioHeatLevel = 'low';
  else if (riskPercentage < 50) portfolioHeatLevel = 'medium';
  else if (riskPercentage < 75) portfolioHeatLevel = 'high';
  else portfolioHeatLevel = 'critical';
  
  return {
    currentRisk,
    maxRisk,
    availableRisk,
    portfolioHeatLevel,
  };
}
