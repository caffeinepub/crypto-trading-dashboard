import type { CryptoData } from './coinRankingApi';

export interface EntryZoneSignal {
  symbol: string;
  name: string;
  isActive: boolean;
  entryPriceRange: {
    low: number;
    high: number;
  };
  confidence: 'Low' | 'Medium' | 'High';
  strength: number; // 0-100
  tradeSuccessProbability: number; // 0-100
  timestamp: number;
  indicators: {
    rsiOversold: boolean;
    emaCrossover: boolean;
    macdPositive: boolean;
  };
  consecutiveReadings: number;
  recommendation: string;
  isProjected?: boolean; // NEW: Flag for projected zones
  projectedReason?: string; // NEW: Explanation for why zone isn't active yet
}

export interface ExitZoneSignal {
  symbol: string;
  name: string;
  isActive: boolean;
  exitPriceRange: {
    low: number;
    high: number;
  };
  confidence: 'Low' | 'Medium' | 'High';
  strength: number; // 0-100
  tradeSuccessProbability: number; // 0-100
  timestamp: number;
  indicators: {
    rsiOverbought: boolean;
    emaBearishCrossover: boolean;
    macdNegative: boolean;
  };
  consecutiveReadings: number;
  recommendation: string;
  isProjected?: boolean; // NEW: Flag for projected zones
  projectedReason?: string; // NEW: Explanation for why zone isn't active yet
}

// NEW: Short trade signal types
export interface ShortEntrySignal {
  symbol: string;
  name: string;
  isActive: boolean;
  entryPriceRange: {
    low: number;
    high: number;
  };
  confidence: 'Low' | 'Medium' | 'High';
  strength: number; // 0-100
  tradeSuccessProbability: number; // 0-100
  timestamp: number;
  indicators: {
    rsiOverbought: boolean;
    emaBearishCrossover: boolean;
    macdNegative: boolean;
  };
  consecutiveReadings: number;
  recommendation: string;
  isProjected?: boolean;
  projectedReason?: string;
}

export interface CoverExitSignal {
  symbol: string;
  name: string;
  isActive: boolean;
  exitPriceRange: {
    low: number;
    high: number;
  };
  confidence: 'Low' | 'Medium' | 'High';
  strength: number; // 0-100
  tradeSuccessProbability: number; // 0-100
  timestamp: number;
  indicators: {
    rsiOversold: boolean;
    emaCrossover: boolean;
    macdPositive: boolean;
  };
  consecutiveReadings: number;
  recommendation: string;
  isProjected?: boolean;
  projectedReason?: string;
}

export type ZoneType = 'entry' | 'exit' | 'shortEntry' | 'coverExit' | 'hold';

export interface TradingZone {
  type: ZoneType;
  label: string;
  confidence: 'Low' | 'Medium' | 'High';
  tradeSuccessProbability: number;
  priceRange: {
    low: number;
    high: number;
  };
  color: string;
  isActive: boolean;
  isProjected?: boolean; // NEW: Flag for projected zones
  projectedReason?: string; // NEW: Explanation for why zone isn't active yet
}

export interface EntryZoneHistory {
  symbol: string;
  timestamp: number;
  entryPrice: number;
  exitPrice?: number;
  profitLoss?: number;
  accuracy: number;
  tradeSuccessProbability: number;
}

const STORAGE_KEY = 'trade_entry_zone_history';
const SIGNAL_HISTORY_KEY = 'trade_entry_zone_signals';
const MAX_HISTORY_DAYS = 7;
const REQUIRED_CONSECUTIVE_READINGS = 3;

// Store signal readings for consecutive confirmation
const signalReadings = new Map<string, Array<{ timestamp: number; isValid: boolean; type: 'entry' | 'exit' | 'shortEntry' | 'coverExit' }>>();

// Calculate MACD histogram value
function calculateMACDHistogram(prices: number[]): number {
  if (prices.length < 26) return 0;
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }
  
  const signalLine = calculateEMA(macdValues, 9);
  const histogram = macdLine - signalLine;
  
  return histogram;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Calculate momentum consistency
function calculateMomentumConsistency(prices: number[]): number {
  if (prices.length < 10) return 0;
  
  const recentPrices = prices.slice(-10);
  let upMoves = 0;
  let downMoves = 0;
  
  for (let i = 1; i < recentPrices.length; i++) {
    if (recentPrices[i] > recentPrices[i - 1]) {
      upMoves++;
    } else if (recentPrices[i] < recentPrices[i - 1]) {
      downMoves++;
    }
  }
  
  const consistency = Math.abs(upMoves - downMoves) / (recentPrices.length - 1);
  return consistency * 100;
}

// NEW: Generate projected reason text based on missing indicators
function generateProjectedReason(
  indicators: Record<string, boolean>,
  consecutiveReadings: number,
  type: 'entry' | 'exit' | 'shortEntry' | 'coverExit'
): string {
  const missingIndicators: string[] = [];
  
  if (type === 'entry') {
    const entryIndicators = indicators as { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean };
    if (!entryIndicators.rsiOversold) missingIndicators.push('RSI < 35 (oversold)');
    if (!entryIndicators.emaCrossover) missingIndicators.push('Bullish EMA crossover');
    if (!entryIndicators.macdPositive) missingIndicators.push('Positive MACD');
  } else if (type === 'exit') {
    const exitIndicators = indicators as { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean };
    if (!exitIndicators.rsiOverbought) missingIndicators.push('RSI > 70 (overbought)');
    if (!exitIndicators.emaBearishCrossover) missingIndicators.push('Bearish EMA crossover');
    if (!exitIndicators.macdNegative) missingIndicators.push('Negative MACD');
  } else if (type === 'shortEntry') {
    const shortIndicators = indicators as { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean };
    if (!shortIndicators.rsiOverbought) missingIndicators.push('RSI > 70 (overbought)');
    if (!shortIndicators.emaBearishCrossover) missingIndicators.push('Bearish EMA crossover');
    if (!shortIndicators.macdNegative) missingIndicators.push('Negative MACD');
  } else if (type === 'coverExit') {
    const coverIndicators = indicators as { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean };
    if (!coverIndicators.rsiOversold) missingIndicators.push('RSI < 35 (oversold)');
    if (!coverIndicators.emaCrossover) missingIndicators.push('Bullish EMA crossover');
    if (!coverIndicators.macdPositive) missingIndicators.push('Positive MACD');
  }
  
  if (consecutiveReadings > 0 && consecutiveReadings < REQUIRED_CONSECUTIVE_READINGS) {
    return `Awaiting ${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings} more confirmation${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings > 1 ? 's' : ''} (${consecutiveReadings}/${REQUIRED_CONSECUTIVE_READINGS})`;
  }
  
  if (missingIndicators.length > 0) {
    return `Awaiting: ${missingIndicators.join(', ')}`;
  }
  
  return 'Monitoring for optimal conditions';
}

// Check if entry zone conditions are met (LONG)
function checkEntryConditions(
  crypto: CryptoData,
  sparklinePrices: number[]
): {
  rsiOversold: boolean;
  emaCrossover: boolean;
  macdPositive: boolean;
} {
  console.log(`[Smart Confidence] 🔍 Checking LONG entry conditions for ${crypto.symbol}`);
  
  // RSI < 35 for oversold conditions
  const rsiOversold = crypto.rsi < 35;
  
  // EMA short crossing above EMA long for bullish momentum
  const emaCrossover = crypto.emaSignal === 'Bullish';
  
  // MACD > signal line for trend confirmation
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const macdPositive = macdHistogram > 0;
  
  console.log(`[Smart Confidence] 📊 ${crypto.symbol} LONG entry conditions:`, {
    rsi: crypto.rsi.toFixed(2),
    rsiOversold,
    emaSignal: crypto.emaSignal,
    emaCrossover,
    macdHistogram: macdHistogram.toFixed(4),
    macdPositive
  });
  
  return {
    rsiOversold,
    emaCrossover,
    macdPositive
  };
}

// Check if exit zone conditions are met (LONG)
function checkExitConditions(
  crypto: CryptoData,
  sparklinePrices: number[]
): {
  rsiOverbought: boolean;
  emaBearishCrossover: boolean;
  macdNegative: boolean;
} {
  console.log(`[Smart Confidence] 🔍 Checking LONG exit conditions for ${crypto.symbol}`);
  
  // RSI > 70 for overbought conditions
  const rsiOverbought = crypto.rsi > 70;
  
  // EMA short crossing below EMA long for bearish momentum
  const emaBearishCrossover = crypto.emaSignal === 'Bearish';
  
  // MACD < signal line for trend reversal
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const macdNegative = macdHistogram < 0;
  
  console.log(`[Smart Confidence] 📊 ${crypto.symbol} LONG exit conditions:`, {
    rsi: crypto.rsi.toFixed(2),
    rsiOverbought,
    emaSignal: crypto.emaSignal,
    emaBearishCrossover,
    macdHistogram: macdHistogram.toFixed(4),
    macdNegative
  });
  
  return {
    rsiOverbought,
    emaBearishCrossover,
    macdNegative
  };
}

// NEW: Check if short entry conditions are met
function checkShortEntryConditions(
  crypto: CryptoData,
  sparklinePrices: number[]
): {
  rsiOverbought: boolean;
  emaBearishCrossover: boolean;
  macdNegative: boolean;
} {
  console.log(`[Smart Confidence] 🔍 Checking SHORT entry conditions for ${crypto.symbol}`);
  
  // RSI > 70 for overbought conditions (short entry)
  const rsiOverbought = crypto.rsi > 70;
  
  // EMA short crossing below EMA long for bearish momentum (short entry)
  const emaBearishCrossover = crypto.emaSignal === 'Bearish';
  
  // MACD < signal line for downtrend confirmation (short entry)
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const macdNegative = macdHistogram < 0;
  
  console.log(`[Smart Confidence] 📊 ${crypto.symbol} SHORT entry conditions:`, {
    rsi: crypto.rsi.toFixed(2),
    rsiOverbought,
    emaSignal: crypto.emaSignal,
    emaBearishCrossover,
    macdHistogram: macdHistogram.toFixed(4),
    macdNegative
  });
  
  return {
    rsiOverbought,
    emaBearishCrossover,
    macdNegative
  };
}

// NEW: Check if cover exit conditions are met
function checkCoverExitConditions(
  crypto: CryptoData,
  sparklinePrices: number[]
): {
  rsiOversold: boolean;
  emaCrossover: boolean;
  macdPositive: boolean;
} {
  console.log(`[Smart Confidence] 🔍 Checking COVER exit conditions for ${crypto.symbol}`);
  
  // RSI < 35 for oversold conditions (cover exit)
  const rsiOversold = crypto.rsi < 35;
  
  // EMA short crossing above EMA long for bullish reversal (cover exit)
  const emaCrossover = crypto.emaSignal === 'Bullish';
  
  // MACD > signal line for uptrend reversal (cover exit)
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const macdPositive = macdHistogram > 0;
  
  console.log(`[Smart Confidence] 📊 ${crypto.symbol} COVER exit conditions:`, {
    rsi: crypto.rsi.toFixed(2),
    rsiOversold,
    emaSignal: crypto.emaSignal,
    emaCrossover,
    macdHistogram: macdHistogram.toFixed(4),
    macdPositive
  });
  
  return {
    rsiOversold,
    emaCrossover,
    macdPositive
  };
}

// Calculate Smart Trade Confidence Model
function calculateSmartConfidence(
  crypto: CryptoData,
  sparklinePrices: number[],
  indicators: Record<string, boolean>,
  isEntry: boolean
): {
  strength: number;
  tradeSuccessProbability: number;
  confidence: 'Low' | 'Medium' | 'High';
} {
  console.log(`[Smart Confidence] 🧠 Calculating smart confidence for ${crypto.symbol} (${isEntry ? 'entry' : 'exit'})`);
  
  let totalScore = 0;
  const weights = {
    rsi: 30,
    ema: 35,
    macd: 20,
    momentum: 15
  };
  
  // Calculate MACD histogram and momentum
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const momentumConsistency = calculateMomentumConsistency(sparklinePrices);
  
  if (isEntry) {
    const entryIndicators = indicators as { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean } | { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean };
    
    if ('rsiOversold' in entryIndicators) {
      // LONG entry
      if (entryIndicators.rsiOversold) {
        const rsiStrength = Math.max(0, (35 - crypto.rsi) / 35);
        totalScore += weights.rsi * rsiStrength;
        console.log(`[Smart Confidence] 📊 RSI contribution: ${(weights.rsi * rsiStrength).toFixed(1)}`);
      }
      
      if (entryIndicators.emaCrossover) {
        totalScore += weights.ema;
        console.log(`[Smart Confidence] 📊 EMA contribution: ${weights.ema}`);
      }
      
      if (entryIndicators.macdPositive) {
        const macdStrength = Math.min(1, Math.abs(macdHistogram) * 10);
        totalScore += weights.macd * macdStrength;
        console.log(`[Smart Confidence] 📊 MACD contribution: ${(weights.macd * macdStrength).toFixed(1)}`);
      }
    } else {
      // SHORT entry
      if (entryIndicators.rsiOverbought) {
        const rsiStrength = Math.max(0, (crypto.rsi - 70) / 30);
        totalScore += weights.rsi * rsiStrength;
        console.log(`[Smart Confidence] 📊 RSI contribution: ${(weights.rsi * rsiStrength).toFixed(1)}`);
      }
      
      if (entryIndicators.emaBearishCrossover) {
        totalScore += weights.ema;
        console.log(`[Smart Confidence] 📊 EMA contribution: ${weights.ema}`);
      }
      
      if (entryIndicators.macdNegative) {
        const macdStrength = Math.min(1, Math.abs(macdHistogram) * 10);
        totalScore += weights.macd * macdStrength;
        console.log(`[Smart Confidence] 📊 MACD contribution: ${(weights.macd * macdStrength).toFixed(1)}`);
      }
    }
    
    // Momentum consistency contribution (weighted 15%)
    totalScore += (weights.momentum * momentumConsistency) / 100;
    console.log(`[Smart Confidence] 📊 Momentum contribution: ${((weights.momentum * momentumConsistency) / 100).toFixed(1)}`);
    
  } else {
    const exitIndicators = indicators as { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean } | { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean };
    
    if ('rsiOverbought' in exitIndicators) {
      // LONG exit
      if (exitIndicators.rsiOverbought) {
        const rsiStrength = Math.max(0, (crypto.rsi - 70) / 30);
        totalScore += weights.rsi * rsiStrength;
        console.log(`[Smart Confidence] 📊 RSI contribution: ${(weights.rsi * rsiStrength).toFixed(1)}`);
      }
      
      if (exitIndicators.emaBearishCrossover) {
        totalScore += weights.ema;
        console.log(`[Smart Confidence] 📊 EMA contribution: ${weights.ema}`);
      }
      
      if (exitIndicators.macdNegative) {
        const macdStrength = Math.min(1, Math.abs(macdHistogram) * 10);
        totalScore += weights.macd * macdStrength;
        console.log(`[Smart Confidence] 📊 MACD contribution: ${(weights.macd * macdStrength).toFixed(1)}`);
      }
    } else {
      // COVER exit
      if (exitIndicators.rsiOversold) {
        const rsiStrength = Math.max(0, (35 - crypto.rsi) / 35);
        totalScore += weights.rsi * rsiStrength;
        console.log(`[Smart Confidence] 📊 RSI contribution: ${(weights.rsi * rsiStrength).toFixed(1)}`);
      }
      
      if (exitIndicators.emaCrossover) {
        totalScore += weights.ema;
        console.log(`[Smart Confidence] 📊 EMA contribution: ${weights.ema}`);
      }
      
      if (exitIndicators.macdPositive) {
        const macdStrength = Math.min(1, Math.abs(macdHistogram) * 10);
        totalScore += weights.macd * macdStrength;
        console.log(`[Smart Confidence] 📊 MACD contribution: ${(weights.macd * macdStrength).toFixed(1)}`);
      }
    }
    
    // Momentum consistency contribution (weighted 15%)
    totalScore += (weights.momentum * momentumConsistency) / 100;
    console.log(`[Smart Confidence] 📊 Momentum contribution: ${((weights.momentum * momentumConsistency) / 100).toFixed(1)}`);
  }
  
  const strength = Math.min(100, Math.round(totalScore));
  
  // Calculate Trade Success Probability based on historical accuracy
  const historicalAccuracy = calculateHistoricalAccuracy(crypto.symbol, isEntry);
  const tradeSuccessProbability = Math.round((strength * 0.7) + (historicalAccuracy * 0.3));
  
  // Determine confidence level based on probability
  let confidence: 'Low' | 'Medium' | 'High';
  if (tradeSuccessProbability >= 70) {
    confidence = 'High';
  } else if (tradeSuccessProbability >= 40) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }
  
  console.log(`[Smart Confidence] ✅ ${crypto.symbol} confidence calculated:`, {
    strength,
    tradeSuccessProbability,
    confidence,
    historicalAccuracy: historicalAccuracy.toFixed(1)
  });
  
  return {
    strength,
    tradeSuccessProbability,
    confidence
  };
}

// Calculate historical accuracy for confidence adjustment
function calculateHistoricalAccuracy(symbol: string, isEntry: boolean): number {
  try {
    const history = getEntryZoneHistory(symbol);
    if (history.length === 0) return 50; // Default 50% if no history
    
    const recentHistory = history.slice(-10); // Last 10 trades
    const successfulTrades = recentHistory.filter(h => (h.profitLoss || 0) > 0).length;
    const accuracy = (successfulTrades / recentHistory.length) * 100;
    
    return accuracy;
  } catch (error) {
    console.error('[Smart Confidence] ❌ Error calculating historical accuracy:', error);
    return 50;
  }
}

// Update consecutive readings for a symbol
function updateConsecutiveReadings(symbol: string, isValid: boolean, type: 'entry' | 'exit' | 'shortEntry' | 'coverExit'): number {
  const now = Date.now();
  const readings = signalReadings.get(symbol) || [];
  
  // Add new reading
  readings.push({ timestamp: now, isValid, type });
  
  // Keep only last 5 readings (for tracking)
  const recentReadings = readings.slice(-5);
  signalReadings.set(symbol, recentReadings);
  
  // Count consecutive valid readings of the same type
  let consecutive = 0;
  for (let i = recentReadings.length - 1; i >= 0; i--) {
    if (recentReadings[i].isValid && recentReadings[i].type === type) {
      consecutive++;
    } else {
      break;
    }
  }
  
  console.log(`[Smart Confidence] 📈 ${symbol} consecutive readings: ${consecutive}/${REQUIRED_CONSECUTIVE_READINGS}`);
  
  return consecutive;
}

// Generate entry zone signal with Smart Trade Confidence (LONG)
export function generateEntryZoneSignal(
  crypto: CryptoData,
  sparklinePrices: number[]
): EntryZoneSignal {
  console.log(`[Smart Confidence] 🎯 Generating smart LONG entry zone signal for ${crypto.symbol}`);
  
  const indicators = checkEntryConditions(crypto, sparklinePrices);
  
  // Check if at least 2 out of 3 indicators are positive
  const validIndicatorCount = Object.values(indicators).filter(Boolean).length;
  const isValidSignal = validIndicatorCount >= 2;
  
  // Update consecutive readings
  const consecutiveReadings = updateConsecutiveReadings(crypto.symbol, isValidSignal, 'entry');
  
  // Entry zone is active only if we have required consecutive readings
  const isActive = consecutiveReadings >= REQUIRED_CONSECUTIVE_READINGS;
  
  // NEW: Determine if this is a projected zone
  const isProjected = !isActive && (validIndicatorCount >= 1 || consecutiveReadings > 0);
  const projectedReason = isProjected ? generateProjectedReason(indicators, consecutiveReadings, 'entry') : undefined;
  
  // Calculate Smart Trade Confidence
  const { strength, tradeSuccessProbability, confidence } = calculateSmartConfidence(
    crypto,
    sparklinePrices,
    indicators,
    true
  );
  
  // Calculate entry price range (±2% from current price)
  const entryPriceRange = {
    low: crypto.price * 0.98,
    high: crypto.price * 1.02
  };
  
  // Generate recommendation with confidence context
  const recommendation = generateEntryRecommendation(
    crypto.symbol,
    isActive,
    confidence,
    tradeSuccessProbability,
    indicators,
    consecutiveReadings
  );
  
  const signal: EntryZoneSignal = {
    symbol: crypto.symbol,
    name: crypto.name,
    isActive,
    entryPriceRange,
    confidence,
    strength,
    tradeSuccessProbability,
    timestamp: Date.now(),
    indicators,
    consecutiveReadings,
    recommendation,
    isProjected,
    projectedReason
  };
  
  console.log(`[Smart Confidence] ✅ ${crypto.symbol} smart LONG entry signal generated:`, {
    isActive,
    isProjected,
    confidence,
    strength,
    tradeSuccessProbability,
    consecutiveReadings,
    validIndicatorCount
  });
  
  return signal;
}

// Generate exit zone signal with Smart Trade Confidence (LONG)
export function generateExitZoneSignal(
  crypto: CryptoData,
  sparklinePrices: number[]
): ExitZoneSignal {
  console.log(`[Smart Confidence] 🎯 Generating smart LONG exit zone signal for ${crypto.symbol}`);
  
  const indicators = checkExitConditions(crypto, sparklinePrices);
  
  // Check if at least 2 out of 3 indicators are positive
  const validIndicatorCount = Object.values(indicators).filter(Boolean).length;
  const isValidSignal = validIndicatorCount >= 2;
  
  // Update consecutive readings
  const consecutiveReadings = updateConsecutiveReadings(crypto.symbol, isValidSignal, 'exit');
  
  // Exit zone is active only if we have required consecutive readings
  const isActive = consecutiveReadings >= REQUIRED_CONSECUTIVE_READINGS;
  
  // NEW: Determine if this is a projected zone
  const isProjected = !isActive && (validIndicatorCount >= 1 || consecutiveReadings > 0);
  const projectedReason = isProjected ? generateProjectedReason(indicators, consecutiveReadings, 'exit') : undefined;
  
  // Calculate Smart Trade Confidence
  const { strength, tradeSuccessProbability, confidence } = calculateSmartConfidence(
    crypto,
    sparklinePrices,
    indicators,
    false
  );
  
  // Calculate exit price range (±2% from current price)
  const exitPriceRange = {
    low: crypto.price * 0.98,
    high: crypto.price * 1.02
  };
  
  // Generate recommendation with confidence context
  const recommendation = generateExitRecommendation(
    crypto.symbol,
    isActive,
    confidence,
    tradeSuccessProbability,
    indicators,
    consecutiveReadings
  );
  
  const signal: ExitZoneSignal = {
    symbol: crypto.symbol,
    name: crypto.name,
    isActive,
    exitPriceRange,
    confidence,
    strength,
    tradeSuccessProbability,
    timestamp: Date.now(),
    indicators,
    consecutiveReadings,
    recommendation,
    isProjected,
    projectedReason
  };
  
  console.log(`[Smart Confidence] ✅ ${crypto.symbol} smart LONG exit signal generated:`, {
    isActive,
    isProjected,
    confidence,
    strength,
    tradeSuccessProbability,
    consecutiveReadings,
    validIndicatorCount
  });
  
  return signal;
}

// NEW: Generate short entry zone signal with Smart Trade Confidence
export function generateShortEntrySignal(
  crypto: CryptoData,
  sparklinePrices: number[]
): ShortEntrySignal {
  console.log(`[Smart Confidence] 🎯 Generating smart SHORT entry zone signal for ${crypto.symbol}`);
  
  const indicators = checkShortEntryConditions(crypto, sparklinePrices);
  
  // Check if at least 2 out of 3 indicators are positive
  const validIndicatorCount = Object.values(indicators).filter(Boolean).length;
  const isValidSignal = validIndicatorCount >= 2;
  
  // Update consecutive readings
  const consecutiveReadings = updateConsecutiveReadings(crypto.symbol, isValidSignal, 'shortEntry');
  
  // Short entry zone is active only if we have required consecutive readings
  const isActive = consecutiveReadings >= REQUIRED_CONSECUTIVE_READINGS;
  
  // NEW: Determine if this is a projected zone
  const isProjected = !isActive && (validIndicatorCount >= 1 || consecutiveReadings > 0);
  const projectedReason = isProjected ? generateProjectedReason(indicators, consecutiveReadings, 'shortEntry') : undefined;
  
  // Calculate Smart Trade Confidence
  const { strength, tradeSuccessProbability, confidence } = calculateSmartConfidence(
    crypto,
    sparklinePrices,
    indicators,
    true
  );
  
  // Calculate short entry price range (±2% from current price)
  const entryPriceRange = {
    low: crypto.price * 0.98,
    high: crypto.price * 1.02
  };
  
  // Generate recommendation with confidence context
  const recommendation = generateShortEntryRecommendation(
    crypto.symbol,
    isActive,
    confidence,
    tradeSuccessProbability,
    indicators,
    consecutiveReadings
  );
  
  const signal: ShortEntrySignal = {
    symbol: crypto.symbol,
    name: crypto.name,
    isActive,
    entryPriceRange,
    confidence,
    strength,
    tradeSuccessProbability,
    timestamp: Date.now(),
    indicators,
    consecutiveReadings,
    recommendation,
    isProjected,
    projectedReason
  };
  
  console.log(`[Smart Confidence] ✅ ${crypto.symbol} smart SHORT entry signal generated:`, {
    isActive,
    isProjected,
    confidence,
    strength,
    tradeSuccessProbability,
    consecutiveReadings,
    validIndicatorCount
  });
  
  return signal;
}

// NEW: Generate cover exit zone signal with Smart Trade Confidence
export function generateCoverExitSignal(
  crypto: CryptoData,
  sparklinePrices: number[]
): CoverExitSignal {
  console.log(`[Smart Confidence] 🎯 Generating smart COVER exit zone signal for ${crypto.symbol}`);
  
  const indicators = checkCoverExitConditions(crypto, sparklinePrices);
  
  // Check if at least 2 out of 3 indicators are positive
  const validIndicatorCount = Object.values(indicators).filter(Boolean).length;
  const isValidSignal = validIndicatorCount >= 2;
  
  // Update consecutive readings
  const consecutiveReadings = updateConsecutiveReadings(crypto.symbol, isValidSignal, 'coverExit');
  
  // Cover exit zone is active only if we have required consecutive readings
  const isActive = consecutiveReadings >= REQUIRED_CONSECUTIVE_READINGS;
  
  // NEW: Determine if this is a projected zone
  const isProjected = !isActive && (validIndicatorCount >= 1 || consecutiveReadings > 0);
  const projectedReason = isProjected ? generateProjectedReason(indicators, consecutiveReadings, 'coverExit') : undefined;
  
  // Calculate Smart Trade Confidence
  const { strength, tradeSuccessProbability, confidence } = calculateSmartConfidence(
    crypto,
    sparklinePrices,
    indicators,
    false
  );
  
  // Calculate cover exit price range (±2% from current price)
  const exitPriceRange = {
    low: crypto.price * 0.98,
    high: crypto.price * 1.02
  };
  
  // Generate recommendation with confidence context
  const recommendation = generateCoverExitRecommendation(
    crypto.symbol,
    isActive,
    confidence,
    tradeSuccessProbability,
    indicators,
    consecutiveReadings
  );
  
  const signal: CoverExitSignal = {
    symbol: crypto.symbol,
    name: crypto.name,
    isActive,
    exitPriceRange,
    confidence,
    strength,
    tradeSuccessProbability,
    timestamp: Date.now(),
    indicators,
    consecutiveReadings,
    recommendation,
    isProjected,
    projectedReason
  };
  
  console.log(`[Smart Confidence] ✅ ${crypto.symbol} smart COVER exit signal generated:`, {
    isActive,
    isProjected,
    confidence,
    strength,
    tradeSuccessProbability,
    consecutiveReadings,
    validIndicatorCount
  });
  
  return signal;
}

function generateEntryRecommendation(
  symbol: string,
  isActive: boolean,
  confidence: string,
  tradeSuccessProbability: number,
  indicators: { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean },
  consecutiveReadings: number
): string {
  if (!isActive) {
    if (consecutiveReadings > 0) {
      return `${symbol} showing potential LONG entry signals (${tradeSuccessProbability}% success probability). Waiting for ${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings} more confirmation${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings > 1 ? 's' : ''}.`;
    }
    return `${symbol} not in LONG entry zone. Monitor for RSI < 35, bullish EMA crossover, and positive MACD.`;
  }
  
  const activeIndicators: string[] = [];
  if (indicators.rsiOversold) activeIndicators.push('oversold RSI');
  if (indicators.emaCrossover) activeIndicators.push('bullish EMA');
  if (indicators.macdPositive) activeIndicators.push('positive MACD');
  
  if (confidence === 'High') {
    return `🎯 Strong LONG buy zone active for ${symbol}! ${tradeSuccessProbability}% success probability. All indicators aligned: ${activeIndicators.join(', ')}. Consider entry with tight stop-loss.`;
  } else if (confidence === 'Medium') {
    return `⚠️ LONG buy zone active for ${symbol} with ${tradeSuccessProbability}% success probability. ${activeIndicators.join(' and ')}. Moderate confidence entry opportunity.`;
  } else {
    return `⚡ Weak LONG buy zone for ${symbol} (${tradeSuccessProbability}% success probability). Limited indicator support. Wait for stronger confirmation.`;
  }
}

function generateExitRecommendation(
  symbol: string,
  isActive: boolean,
  confidence: string,
  tradeSuccessProbability: number,
  indicators: { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean },
  consecutiveReadings: number
): string {
  if (!isActive) {
    if (consecutiveReadings > 0) {
      return `${symbol} showing potential LONG exit signals (${tradeSuccessProbability}% success probability). Waiting for ${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings} more confirmation${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings > 1 ? 's' : ''}.`;
    }
    return `${symbol} not in LONG exit zone. Monitor for RSI > 70, bearish EMA crossover, and negative MACD.`;
  }
  
  const activeIndicators: string[] = [];
  if (indicators.rsiOverbought) activeIndicators.push('overbought RSI');
  if (indicators.emaBearishCrossover) activeIndicators.push('bearish EMA');
  if (indicators.macdNegative) activeIndicators.push('negative MACD');
  
  if (confidence === 'High') {
    return `🎯 Strong LONG sell zone active for ${symbol}! ${tradeSuccessProbability}% success probability. All indicators aligned: ${activeIndicators.join(', ')}. Consider taking profits.`;
  } else if (confidence === 'Medium') {
    return `⚠️ LONG sell zone active for ${symbol} with ${tradeSuccessProbability}% success probability. ${activeIndicators.join(' and ')}. Moderate confidence exit opportunity.`;
  } else {
    return `⚡ Weak LONG sell zone for ${symbol} (${tradeSuccessProbability}% success probability). Limited indicator support. Wait for stronger confirmation.`;
  }
}

// NEW: Generate short entry recommendation
function generateShortEntryRecommendation(
  symbol: string,
  isActive: boolean,
  confidence: string,
  tradeSuccessProbability: number,
  indicators: { rsiOverbought: boolean; emaBearishCrossover: boolean; macdNegative: boolean },
  consecutiveReadings: number
): string {
  if (!isActive) {
    if (consecutiveReadings > 0) {
      return `${symbol} showing potential SHORT entry signals (${tradeSuccessProbability}% success probability). Waiting for ${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings} more confirmation${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings > 1 ? 's' : ''}.`;
    }
    return `${symbol} not in SHORT entry zone. Monitor for RSI > 70, bearish EMA crossover, and negative MACD.`;
  }
  
  const activeIndicators: string[] = [];
  if (indicators.rsiOverbought) activeIndicators.push('overbought RSI');
  if (indicators.emaBearishCrossover) activeIndicators.push('bearish EMA');
  if (indicators.macdNegative) activeIndicators.push('negative MACD');
  
  if (confidence === 'High') {
    return `🎯 Strong SHORT entry zone active for ${symbol}! ${tradeSuccessProbability}% success probability. All indicators aligned: ${activeIndicators.join(', ')}. Consider short entry with tight stop-loss.`;
  } else if (confidence === 'Medium') {
    return `⚠️ SHORT entry zone active for ${symbol} with ${tradeSuccessProbability}% success probability. ${activeIndicators.join(' and ')}. Moderate confidence short opportunity.`;
  } else {
    return `⚡ Weak SHORT entry zone for ${symbol} (${tradeSuccessProbability}% success probability). Limited indicator support. Wait for stronger confirmation.`;
  }
}

// NEW: Generate cover exit recommendation
function generateCoverExitRecommendation(
  symbol: string,
  isActive: boolean,
  confidence: string,
  tradeSuccessProbability: number,
  indicators: { rsiOversold: boolean; emaCrossover: boolean; macdPositive: boolean },
  consecutiveReadings: number
): string {
  if (!isActive) {
    if (consecutiveReadings > 0) {
      return `${symbol} showing potential COVER exit signals (${tradeSuccessProbability}% success probability). Waiting for ${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings} more confirmation${REQUIRED_CONSECUTIVE_READINGS - consecutiveReadings > 1 ? 's' : ''}.`;
    }
    return `${symbol} not in COVER exit zone. Monitor for RSI < 35, bullish EMA crossover, and positive MACD.`;
  }
  
  const activeIndicators: string[] = [];
  if (indicators.rsiOversold) activeIndicators.push('oversold RSI');
  if (indicators.emaCrossover) activeIndicators.push('bullish EMA');
  if (indicators.macdPositive) activeIndicators.push('positive MACD');
  
  if (confidence === 'High') {
    return `🎯 Strong COVER exit zone active for ${symbol}! ${tradeSuccessProbability}% success probability. All indicators aligned: ${activeIndicators.join(', ')}. Consider covering short position.`;
  } else if (confidence === 'Medium') {
    return `⚠️ COVER exit zone active for ${symbol} with ${tradeSuccessProbability}% success probability. ${activeIndicators.join(' and ')}. Moderate confidence cover opportunity.`;
  } else {
    return `⚡ Weak COVER exit zone for ${symbol} (${tradeSuccessProbability}% success probability). Limited indicator support. Wait for stronger confirmation.`;
  }
}

// Determine current trading zone with Smart Trade Confidence
export function determineTradingZone(
  crypto: CryptoData,
  sparklinePrices: number[],
  entryZone?: EntryZoneSignal,
  exitZone?: ExitZoneSignal,
  shortEntryZone?: ShortEntrySignal,
  coverExitZone?: CoverExitSignal
): TradingZone {
  // Priority: Check for active zones first
  if (entryZone?.isActive) {
    return {
      type: 'entry',
      label: 'Smart Entry Active',
      confidence: entryZone.confidence,
      tradeSuccessProbability: entryZone.tradeSuccessProbability,
      priceRange: entryZone.entryPriceRange,
      color: 'green',
      isActive: true,
      isProjected: false
    };
  }
  
  if (exitZone?.isActive) {
    return {
      type: 'exit',
      label: 'Dynamic Exit Recommended',
      confidence: exitZone.confidence,
      tradeSuccessProbability: exitZone.tradeSuccessProbability,
      priceRange: exitZone.exitPriceRange,
      color: 'red',
      isActive: true,
      isProjected: false
    };
  }
  
  if (shortEntryZone?.isActive) {
    return {
      type: 'shortEntry',
      label: 'Short Entry',
      confidence: shortEntryZone.confidence,
      tradeSuccessProbability: shortEntryZone.tradeSuccessProbability,
      priceRange: shortEntryZone.entryPriceRange,
      color: 'red',
      isActive: true,
      isProjected: false
    };
  }
  
  if (coverExitZone?.isActive) {
    return {
      type: 'coverExit',
      label: 'Cover Exit',
      confidence: coverExitZone.confidence,
      tradeSuccessProbability: coverExitZone.tradeSuccessProbability,
      priceRange: coverExitZone.exitPriceRange,
      color: 'green',
      isActive: true,
      isProjected: false
    };
  }
  
  // Check for projected zones
  if (entryZone?.isProjected) {
    return {
      type: 'entry',
      label: 'Potential Long Entry',
      confidence: entryZone.confidence,
      tradeSuccessProbability: entryZone.tradeSuccessProbability,
      priceRange: entryZone.entryPriceRange,
      color: 'green',
      isActive: false,
      isProjected: true,
      projectedReason: entryZone.projectedReason
    };
  }
  
  if (exitZone?.isProjected) {
    return {
      type: 'exit',
      label: 'Potential Long Exit',
      confidence: exitZone.confidence,
      tradeSuccessProbability: exitZone.tradeSuccessProbability,
      priceRange: exitZone.exitPriceRange,
      color: 'red',
      isActive: false,
      isProjected: true,
      projectedReason: exitZone.projectedReason
    };
  }
  
  if (shortEntryZone?.isProjected) {
    return {
      type: 'shortEntry',
      label: 'Potential Short Entry',
      confidence: shortEntryZone.confidence,
      tradeSuccessProbability: shortEntryZone.tradeSuccessProbability,
      priceRange: shortEntryZone.entryPriceRange,
      color: 'red',
      isActive: false,
      isProjected: true,
      projectedReason: shortEntryZone.projectedReason
    };
  }
  
  if (coverExitZone?.isProjected) {
    return {
      type: 'coverExit',
      label: 'Potential Cover Exit',
      confidence: coverExitZone.confidence,
      tradeSuccessProbability: coverExitZone.tradeSuccessProbability,
      priceRange: coverExitZone.exitPriceRange,
      color: 'green',
      isActive: false,
      isProjected: true,
      projectedReason: coverExitZone.projectedReason
    };
  }
  
  // Otherwise, calculate on the fly
  const entryConditions = checkEntryConditions(crypto, sparklinePrices);
  const exitConditions = checkExitConditions(crypto, sparklinePrices);
  const shortEntryConditions = checkShortEntryConditions(crypto, sparklinePrices);
  const coverExitConditions = checkCoverExitConditions(crypto, sparklinePrices);
  
  const entryCount = Object.values(entryConditions).filter(Boolean).length;
  const exitCount = Object.values(exitConditions).filter(Boolean).length;
  const shortEntryCount = Object.values(shortEntryConditions).filter(Boolean).length;
  const coverExitCount = Object.values(coverExitConditions).filter(Boolean).length;
  
  // Prioritize strongest signal
  const maxCount = Math.max(entryCount, exitCount, shortEntryCount, coverExitCount);
  
  if (maxCount >= 2) {
    if (entryCount === maxCount) {
      const { tradeSuccessProbability, confidence } = calculateSmartConfidence(
        crypto,
        sparklinePrices,
        entryConditions,
        true
      );
      
      return {
        type: 'entry',
        label: 'Smart Entry Active',
        confidence,
        tradeSuccessProbability,
        priceRange: {
          low: crypto.price * 0.98,
          high: crypto.price * 1.02
        },
        color: 'green',
        isActive: false,
        isProjected: false
      };
    }
    
    if (exitCount === maxCount) {
      const { tradeSuccessProbability, confidence } = calculateSmartConfidence(
        crypto,
        sparklinePrices,
        exitConditions,
        false
      );
      
      return {
        type: 'exit',
        label: 'Dynamic Exit Recommended',
        confidence,
        tradeSuccessProbability,
        priceRange: {
          low: crypto.price * 0.98,
          high: crypto.price * 1.02
        },
        color: 'red',
        isActive: false,
        isProjected: false
      };
    }
    
    if (shortEntryCount === maxCount) {
      const { tradeSuccessProbability, confidence } = calculateSmartConfidence(
        crypto,
        sparklinePrices,
        shortEntryConditions,
        true
      );
      
      return {
        type: 'shortEntry',
        label: 'Short Entry',
        confidence,
        tradeSuccessProbability,
        priceRange: {
          low: crypto.price * 0.98,
          high: crypto.price * 1.02
        },
        color: 'red',
        isActive: false,
        isProjected: false
      };
    }
    
    if (coverExitCount === maxCount) {
      const { tradeSuccessProbability, confidence } = calculateSmartConfidence(
        crypto,
        sparklinePrices,
        coverExitConditions,
        false
      );
      
      return {
        type: 'coverExit',
        label: 'Cover Exit',
        confidence,
        tradeSuccessProbability,
        priceRange: {
          low: crypto.price * 0.98,
          high: crypto.price * 1.02
        },
        color: 'green',
        isActive: false,
        isProjected: false
      };
    }
  }
  
  // Default to hold zone
  return {
    type: 'hold',
    label: 'Hold Zone',
    confidence: 'Medium',
    tradeSuccessProbability: 50,
    priceRange: {
      low: crypto.price * 0.97,
      high: crypto.price * 1.03
    },
    color: 'yellow',
    isActive: false,
    isProjected: false
  };
}

// Get all active entry zones (LONG)
export function getActiveEntryZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): EntryZoneSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for active LONG entry zones...');
  
  const activeZones: EntryZoneSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateEntryZoneSignal(crypto, sparkline);
    if (signal.isActive) {
      activeZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${activeZones.length} active LONG entry zones`);
  
  return activeZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all projected entry zones (LONG)
export function getProjectedEntryZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): EntryZoneSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for projected LONG entry zones...');
  
  const projectedZones: EntryZoneSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateEntryZoneSignal(crypto, sparkline);
    if (signal.isProjected && !signal.isActive) {
      projectedZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${projectedZones.length} projected LONG entry zones`);
  
  return projectedZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// Get all active exit zones (LONG)
export function getActiveExitZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): ExitZoneSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for active LONG exit zones...');
  
  const activeZones: ExitZoneSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateExitZoneSignal(crypto, sparkline);
    if (signal.isActive) {
      activeZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${activeZones.length} active LONG exit zones`);
  
  return activeZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all projected exit zones (LONG)
export function getProjectedExitZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): ExitZoneSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for projected LONG exit zones...');
  
  const projectedZones: ExitZoneSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateExitZoneSignal(crypto, sparkline);
    if (signal.isProjected && !signal.isActive) {
      projectedZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${projectedZones.length} projected LONG exit zones`);
  
  return projectedZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all active short entry zones
export function getActiveShortEntryZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): ShortEntrySignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for active SHORT entry zones...');
  
  const activeZones: ShortEntrySignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateShortEntrySignal(crypto, sparkline);
    if (signal.isActive) {
      activeZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${activeZones.length} active SHORT entry zones`);
  
  return activeZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all projected short entry zones
export function getProjectedShortEntryZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): ShortEntrySignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for projected SHORT entry zones...');
  
  const projectedZones: ShortEntrySignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateShortEntrySignal(crypto, sparkline);
    if (signal.isProjected && !signal.isActive) {
      projectedZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${projectedZones.length} projected SHORT entry zones`);
  
  return projectedZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all active cover exit zones
export function getActiveCoverExitZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): CoverExitSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for active COVER exit zones...');
  
  const activeZones: CoverExitSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateCoverExitSignal(crypto, sparkline);
    if (signal.isActive) {
      activeZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${activeZones.length} active COVER exit zones`);
  
  return activeZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// NEW: Get all projected cover exit zones
export function getProjectedCoverExitZones(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): CoverExitSignal[] {
  console.log('[Smart Confidence] 🔍 Scanning for projected COVER exit zones...');
  
  const projectedZones: CoverExitSignal[] = [];
  
  for (const crypto of cryptoData) {
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 14) {
      continue;
    }
    
    const signal = generateCoverExitSignal(crypto, sparkline);
    if (signal.isProjected && !signal.isActive) {
      projectedZones.push(signal);
    }
  }
  
  console.log(`[Smart Confidence] ✅ Found ${projectedZones.length} projected COVER exit zones`);
  
  return projectedZones.sort((a, b) => b.tradeSuccessProbability - a.tradeSuccessProbability);
}

// Store entry zone history
export function storeEntryZoneHistory(history: EntryZoneHistory): void {
  try {
    const stored = getEntryZoneHistory();
    stored.push(history);
    
    // Clean old history
    const cutoffTime = Date.now() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const cleaned = stored.filter(h => h.timestamp > cutoffTime);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    console.log(`[Smart Confidence] 💾 Stored history for ${history.symbol}`);
  } catch (error) {
    console.error('[Smart Confidence] ❌ Error storing history:', error);
  }
}

export function getEntryZoneHistory(symbol?: string): EntryZoneHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    let history: EntryZoneHistory[] = JSON.parse(stored);
    
    if (symbol) {
      history = history.filter(h => h.symbol === symbol);
    }
    
    return history;
  } catch (error) {
    console.error('[Smart Confidence] ❌ Error retrieving history:', error);
    return [];
  }
}

// Calculate entry zone accuracy
export function calculateEntryZoneAccuracy(symbol: string, days: number = 7): {
  accuracy: number;
  totalEntries: number;
  successfulEntries: number;
} {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  const history = getEntryZoneHistory(symbol).filter(h => h.timestamp > cutoffTime && h.exitPrice !== undefined);
  
  if (history.length === 0) {
    return { accuracy: 0, totalEntries: 0, successfulEntries: 0 };
  }
  
  const successfulEntries = history.filter(h => (h.profitLoss || 0) > 0).length;
  const accuracy = (successfulEntries / history.length) * 100;
  
  return {
    accuracy,
    totalEntries: history.length,
    successfulEntries
  };
}

// Get confidence color based on trade success probability
export function getConfidenceColor(probability: number): string {
  if (probability >= 70) {
    return 'green'; // High confidence
  } else if (probability >= 40) {
    return 'yellow'; // Medium confidence
  } else {
    return 'red'; // Low confidence (exit signal)
  }
}

// Get confidence badge class
export function getConfidenceBadgeClass(probability: number): string {
  if (probability >= 70) {
    return 'bg-green-600 hover:bg-green-700 text-white border-green-500';
  } else if (probability >= 40) {
    return 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500';
  } else {
    return 'bg-red-600 hover:bg-red-700 text-white border-red-500';
  }
}
