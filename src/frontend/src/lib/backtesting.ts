// Historical Backtesting System
// Tests trading strategies against historical market data

import type { CryptoData } from './coinRankingApi';

export interface BacktestStrategy {
  name: string;
  entryCondition: (data: CryptoData, history: number[]) => boolean;
  exitCondition: (data: CryptoData, history: number[], entryPrice: number) => boolean;
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
}

export interface BacktestTrade {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  roi: number;
  type: 'win' | 'loss';
}

export interface BacktestResults {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgGain: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  equityCurve: Array<{ time: number; value: number }>;
  trades: BacktestTrade[];
}

const STORAGE_KEY_RESULTS = 'backtesting_results';

// Get stored backtest results
export function getBacktestResults(): BacktestResults[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RESULTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Backtesting] Error loading results:', error);
    return [];
  }
}

// Save backtest results
export function saveBacktestResults(results: BacktestResults): void {
  try {
    const stored = getBacktestResults();
    stored.push(results);
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(stored));
    console.log('[Backtesting] Saved results:', results.strategyName);
  } catch (error) {
    console.error('[Backtesting] Error saving results:', error);
  }
}

// Run backtest
export function runBacktest(
  strategy: BacktestStrategy,
  historicalData: Map<string, Array<{ price: number; time: number }>>,
  initialCapital: number = 10000
): BacktestResults {
  console.log('[Backtesting] Running backtest for:', strategy.name);

  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ time: number; value: number }> = [];
  let capital = initialCapital;
  let maxCapital = initialCapital;
  let maxDrawdown = 0;

  // Simulate trading for each cryptocurrency
  historicalData.forEach((priceHistory, symbol) => {
    let inPosition = false;
    let entryPrice = 0;
    let entryTime = 0;

    for (let i = 20; i < priceHistory.length; i++) {
      const currentData: CryptoData = {
        uuid: symbol,
        symbol,
        name: symbol,
        price: priceHistory[i].price,
        percentChange: 0,
        marketCap: 0,
        volume: 0,
        sparkline: priceHistory.slice(Math.max(0, i - 20), i).map(p => p.price.toString()),
        rsi: 50,
        emaSignal: 'Bullish',
      };

      const history = priceHistory.slice(Math.max(0, i - 20), i).map(p => p.price);

      if (!inPosition) {
        // Check entry condition
        if (strategy.entryCondition(currentData, history)) {
          inPosition = true;
          entryPrice = priceHistory[i].price;
          entryTime = priceHistory[i].time;
        }
      } else {
        // Check exit condition
        const shouldExit = strategy.exitCondition(currentData, history, entryPrice);
        const stopLossHit = strategy.stopLoss && 
          (priceHistory[i].price <= entryPrice * (1 - strategy.stopLoss / 100));
        const takeProfitHit = strategy.takeProfit && 
          (priceHistory[i].price >= entryPrice * (1 + strategy.takeProfit / 100));

        if (shouldExit || stopLossHit || takeProfitHit) {
          const exitPrice = priceHistory[i].price;
          const pnl = (exitPrice - entryPrice) * (capital * 0.1 / entryPrice); // 10% position size
          const roi = ((exitPrice - entryPrice) / entryPrice) * 100;

          trades.push({
            symbol,
            entryPrice,
            exitPrice,
            entryTime,
            exitTime: priceHistory[i].time,
            pnl,
            roi,
            type: pnl > 0 ? 'win' : 'loss',
          });

          capital += pnl;
          maxCapital = Math.max(maxCapital, capital);
          const drawdown = ((maxCapital - capital) / maxCapital) * 100;
          maxDrawdown = Math.max(maxDrawdown, drawdown);

          equityCurve.push({ time: priceHistory[i].time, value: capital });

          inPosition = false;
        }
      }
    }
  });

  // Calculate statistics
  const winningTrades = trades.filter(t => t.type === 'win');
  const losingTrades = trades.filter(t => t.type === 'loss');
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  const avgGain = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.roi, 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + t.roi, 0) / losingTrades.length 
    : 0;
  const totalReturn = ((capital - initialCapital) / initialCapital) * 100;

  // Calculate Sharpe Ratio (simplified)
  const returns = trades.map(t => t.roi);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdDev = returns.length > 0 
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    : 0;
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  const results: BacktestResults = {
    strategyName: strategy.name,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    avgGain,
    avgLoss,
    maxDrawdown,
    sharpeRatio,
    totalReturn,
    equityCurve,
    trades,
  };

  console.log('[Backtesting] Completed:', results);
  return results;
}

// Calculate EMA from price history
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

// Predefined strategies
export const PREDEFINED_STRATEGIES: BacktestStrategy[] = [
  {
    name: 'RSI Oversold/Overbought',
    entryCondition: (data) => (data.rsi || 50) < 30,
    exitCondition: (data) => (data.rsi || 50) > 70,
  },
  {
    name: 'EMA Crossover',
    entryCondition: (data, history) => {
      if (history.length < 26) return false;
      const ema12 = calculateEMA(history, 12);
      const ema26 = calculateEMA(history, 26);
      return ema12 > ema26;
    },
    exitCondition: (data, history) => {
      if (history.length < 26) return false;
      const ema12 = calculateEMA(history, 12);
      const ema26 = calculateEMA(history, 26);
      return ema12 < ema26;
    },
  },
  {
    name: 'Momentum with Stop Loss',
    entryCondition: (data) => data.percentChange > 5,
    exitCondition: (data, history, entryPrice) => data.price < entryPrice * 0.95,
    stopLoss: 5,
    takeProfit: 15,
  },
];
