import type { CryptoData } from './coinRankingApi';

export interface ForecastPrediction {
  timeframe: '1h' | '4h' | '1d';
  predictedChange: number; // Percentage change
  confidence: 'Low' | 'Medium' | 'High';
  interpretation: string;
  isBullish: boolean;
}

export interface CryptoForecast {
  symbol: string;
  name: string;
  currentPrice: number;
  predictions: ForecastPrediction[];
  timestamp: number;
}

export interface HistoricalForecast {
  symbol: string;
  timestamp: number;
  prediction: number;
  actual: number;
  timeframe: '1h' | '4h' | '1d';
  accuracy: number;
}

export interface ForecastVerification {
  symbol: string;
  timeframe: '1h' | '4h' | '1d';
  predictedPrice: number;
  actualPrice: number;
  predictedChange: number;
  actualChange: number;
  accuracy: number;
  timestamp: number;
}

export type SensitivityMode = 'conservative' | 'balanced' | 'aggressive';

// Sensitivity multipliers for different modes
const SENSITIVITY_MULTIPLIERS = {
  conservative: 0.6,
  balanced: 1.0,
  aggressive: 1.5
};

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

// Calculate momentum trend
function calculateMomentum(prices: number[], period: number = 10): number {
  if (prices.length < period) return 0;
  
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - period];
  
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// Generate forecast for a specific timeframe
function generateTimeframeForecast(
  crypto: CryptoData,
  sparklinePrices: number[],
  timeframe: '1h' | '4h' | '1d',
  sensitivity: SensitivityMode = 'balanced'
): ForecastPrediction {
  console.log(`[Forecast Engine] 🔮 Generating ${timeframe} forecast for ${crypto.symbol} (${sensitivity} mode)`);
  
  // Calculate technical indicators
  const rsi = crypto.rsi;
  const emaSignal = crypto.emaSignal;
  const macdHistogram = calculateMACDHistogram(sparklinePrices);
  const momentum = calculateMomentum(sparklinePrices);
  
  console.log(`[Forecast Engine] 📊 ${crypto.symbol} indicators:`, {
    rsi: rsi.toFixed(2),
    emaSignal,
    macdHistogram: macdHistogram.toFixed(4),
    momentum: momentum.toFixed(2),
    sensitivity
  });
  
  // Scoring system for prediction
  let bullishScore = 0;
  let bearishScore = 0;
  
  // RSI scoring
  if (rsi < 30) {
    bullishScore += 2; // Oversold - bullish signal
  } else if (rsi > 70) {
    bearishScore += 2; // Overbought - bearish signal
  } else if (rsi < 45) {
    bullishScore += 1;
  } else if (rsi > 55) {
    bearishScore += 1;
  }
  
  // EMA crossover scoring
  if (emaSignal === 'Bullish') {
    bullishScore += 2;
  } else {
    bearishScore += 2;
  }
  
  // MACD histogram scoring
  if (macdHistogram > 0) {
    bullishScore += 1;
  } else if (macdHistogram < 0) {
    bearishScore += 1;
  }
  
  // Momentum scoring
  if (momentum > 2) {
    bullishScore += 2;
  } else if (momentum < -2) {
    bearishScore += 2;
  } else if (momentum > 0) {
    bullishScore += 1;
  } else if (momentum < 0) {
    bearishScore += 1;
  }
  
  // Calculate prediction
  const isBullish = bullishScore > bearishScore;
  const scoreDifference = Math.abs(bullishScore - bearishScore);
  
  // Confidence based on indicator alignment
  let confidence: 'Low' | 'Medium' | 'High';
  if (scoreDifference >= 4) {
    confidence = 'High';
  } else if (scoreDifference >= 2) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }
  
  // Timeframe multipliers
  const timeframeMultipliers = {
    '1h': 0.5,
    '4h': 1.5,
    '1d': 3.0
  };
  
  // Apply sensitivity multiplier
  const sensitivityMultiplier = SENSITIVITY_MULTIPLIERS[sensitivity];
  
  // Calculate predicted change
  const baseChange = (bullishScore - bearishScore) * 0.8;
  const predictedChange = baseChange * timeframeMultipliers[timeframe] * sensitivityMultiplier;
  
  // Generate interpretation
  const interpretation = generateInterpretation(
    crypto.symbol,
    isBullish,
    confidence,
    rsi,
    momentum,
    timeframe,
    sensitivity
  );
  
  console.log(`[Forecast Engine] ✅ ${crypto.symbol} ${timeframe} forecast:`, {
    predictedChange: predictedChange.toFixed(2) + '%',
    confidence,
    isBullish,
    sensitivity
  });
  
  return {
    timeframe,
    predictedChange,
    confidence,
    interpretation,
    isBullish
  };
}

function generateInterpretation(
  symbol: string,
  isBullish: boolean,
  confidence: string,
  rsi: number,
  momentum: number,
  timeframe: string,
  sensitivity: SensitivityMode
): string {
  const direction = isBullish ? 'upward' : 'downward';
  const trend = isBullish ? 'bullish' : 'bearish';
  const modeText = sensitivity === 'conservative' ? 'cautious' : sensitivity === 'aggressive' ? 'strong' : '';
  
  if (confidence === 'High') {
    if (isBullish) {
      if (rsi < 30) {
        return `${symbol} showing ${modeText} oversold bounce potential with ${trend} momentum likely to continue ${direction}.`;
      } else if (momentum > 5) {
        return `${symbol} momentum likely to continue ${direction} with ${modeText} technical support.`;
      } else {
        return `${symbol} displaying ${modeText} ${trend} signals across multiple indicators for ${timeframe}.`;
      }
    } else {
      if (rsi > 70) {
        return `${symbol} showing short-term exhaustion with overbought conditions suggesting ${modeText} ${direction} correction.`;
      } else if (momentum < -5) {
        return `${symbol} experiencing ${modeText} ${direction} pressure with technical indicators aligned.`;
      } else {
        return `${symbol} showing ${modeText} ${trend} signals with high probability of ${direction} movement.`;
      }
    }
  } else if (confidence === 'Medium') {
    if (isBullish) {
      return `${symbol} showing moderate ${trend} potential with some positive technical indicators (${sensitivity} mode).`;
    } else {
      return `${symbol} displaying moderate ${trend} signals suggesting potential ${direction} movement (${sensitivity} mode).`;
    }
  } else {
    return `${symbol} showing mixed signals with uncertain ${direction} bias for ${timeframe} (${sensitivity} mode).`;
  }
}

// Generate complete forecast for a cryptocurrency
export function generateCryptoForecast(
  crypto: CryptoData,
  sparklinePrices: number[],
  sensitivity: SensitivityMode = 'balanced'
): CryptoForecast {
  console.log(`[Forecast Engine] 🚀 Generating complete forecast for ${crypto.symbol} (${sensitivity} mode)`);
  
  const predictions: ForecastPrediction[] = [
    generateTimeframeForecast(crypto, sparklinePrices, '1h', sensitivity),
    generateTimeframeForecast(crypto, sparklinePrices, '4h', sensitivity),
    generateTimeframeForecast(crypto, sparklinePrices, '1d', sensitivity)
  ];
  
  return {
    symbol: crypto.symbol,
    name: crypto.name,
    currentPrice: crypto.price,
    predictions,
    timestamp: Date.now()
  };
}

// Store and retrieve historical forecasts from localStorage
const STORAGE_KEY = 'crypto_forecast_history';
const VERIFICATION_KEY = 'crypto_forecast_verification';
const MAX_HISTORY_DAYS = 7;

export function storeHistoricalForecast(forecast: HistoricalForecast): void {
  try {
    const history = getHistoricalForecasts();
    history.push(forecast);
    
    // Clean old forecasts (older than MAX_HISTORY_DAYS)
    const cutoffTime = Date.now() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const cleanedHistory = history.filter(f => f.timestamp > cutoffTime);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedHistory));
    console.log(`[Forecast Engine] 💾 Stored historical forecast for ${forecast.symbol}`);
  } catch (error) {
    console.error('[Forecast Engine] ❌ Error storing historical forecast:', error);
  }
}

export function getHistoricalForecasts(symbol?: string): HistoricalForecast[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: HistoricalForecast[] = JSON.parse(stored);
    
    if (symbol) {
      return history.filter(f => f.symbol === symbol);
    }
    
    return history;
  } catch (error) {
    console.error('[Forecast Engine] ❌ Error retrieving historical forecasts:', error);
    return [];
  }
}

export function calculateForecastAccuracy(symbol: string, timeframe: '1h' | '4h' | '1d'): number {
  const history = getHistoricalForecasts(symbol).filter(f => f.timeframe === timeframe);
  
  if (history.length === 0) return 0;
  
  const accuracies = history.map(f => f.accuracy);
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  
  console.log(`[Forecast Engine] 📊 ${symbol} ${timeframe} accuracy:`, avgAccuracy.toFixed(1) + '%');
  
  return avgAccuracy;
}

// Forecast Verification Functions
export function storeForecastVerification(verification: ForecastVerification): void {
  try {
    const verifications = getForecastVerifications();
    verifications.push(verification);
    
    // Clean old verifications (older than MAX_HISTORY_DAYS)
    const cutoffTime = Date.now() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const cleanedVerifications = verifications.filter(v => v.timestamp > cutoffTime);
    
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(cleanedVerifications));
    console.log(`[Forecast Verification] 💾 Stored verification for ${verification.symbol} ${verification.timeframe}`);
  } catch (error) {
    console.error('[Forecast Verification] ❌ Error storing verification:', error);
  }
}

export function getForecastVerifications(symbol?: string, timeframe?: '1h' | '4h' | '1d'): ForecastVerification[] {
  try {
    const stored = localStorage.getItem(VERIFICATION_KEY);
    if (!stored) return [];
    
    let verifications: ForecastVerification[] = JSON.parse(stored);
    
    if (symbol) {
      verifications = verifications.filter(v => v.symbol === symbol);
    }
    
    if (timeframe) {
      verifications = verifications.filter(v => v.timeframe === timeframe);
    }
    
    return verifications;
  } catch (error) {
    console.error('[Forecast Verification] ❌ Error retrieving verifications:', error);
    return [];
  }
}

export function verifyForecast(
  symbol: string,
  timeframe: '1h' | '4h' | '1d',
  predictedChange: number,
  currentPrice: number,
  previousPrice: number
): ForecastVerification {
  const actualChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const error = Math.abs(predictedChange - actualChange);
  const accuracy = Math.max(0, 100 - (error * 10)); // 10% error = 0% accuracy
  
  const verification: ForecastVerification = {
    symbol,
    timeframe,
    predictedPrice: previousPrice * (1 + predictedChange / 100),
    actualPrice: currentPrice,
    predictedChange,
    actualChange,
    accuracy,
    timestamp: Date.now()
  };
  
  console.log(`[Forecast Verification] ✅ Verified ${symbol} ${timeframe}:`, {
    predicted: predictedChange.toFixed(2) + '%',
    actual: actualChange.toFixed(2) + '%',
    accuracy: accuracy.toFixed(1) + '%'
  });
  
  // Store verification
  storeForecastVerification(verification);
  
  // Also store as historical forecast
  const historicalForecast: HistoricalForecast = {
    symbol,
    timestamp: Date.now(),
    prediction: predictedChange,
    actual: actualChange,
    timeframe,
    accuracy
  };
  storeHistoricalForecast(historicalForecast);
  
  return verification;
}

export function getAccuracySummary(symbol: string, days: number = 7): {
  overall: number;
  byTimeframe: { '1h': number; '4h': number; '1d': number };
  totalPredictions: number;
} {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  const verifications = getForecastVerifications(symbol).filter(v => v.timestamp > cutoffTime);
  
  if (verifications.length === 0) {
    return {
      overall: 0,
      byTimeframe: { '1h': 0, '4h': 0, '1d': 0 },
      totalPredictions: 0
    };
  }
  
  const overall = verifications.reduce((sum, v) => sum + v.accuracy, 0) / verifications.length;
  
  const byTimeframe = {
    '1h': calculateForecastAccuracy(symbol, '1h'),
    '4h': calculateForecastAccuracy(symbol, '4h'),
    '1d': calculateForecastAccuracy(symbol, '1d')
  };
  
  return {
    overall,
    byTimeframe,
    totalPredictions: verifications.length
  };
}
