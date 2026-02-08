import type { CryptoData } from './coinRankingApi';

export interface CorrelationData {
  symbol: string;
  name: string;
  correlation: number;
  divergence: number;
  convergence: number;
  rotationSignal: 'Strong Divergence' | 'Moderate Divergence' | 'Convergence' | 'Neutral';
}

export interface CorrelationMatrix {
  btcPrice: number;
  btcChange: number;
  correlations: Array<{
    symbol: string;
    name: string;
    correlation: number;
    strength: string;
    divergence: boolean;
    convergence: boolean;
  }>;
}

export interface RotationSignals {
  buy: Array<{ symbol: string; name: string }>;
  sell: Array<{ symbol: string; name: string }>;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Generate correlation matrix comparing all coins to Bitcoin
 */
export function generateCorrelationMatrix(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): CorrelationMatrix | null {
  const btc = cryptoData.find(c => c.symbol === 'BTC');
  const btcSparkline = sparklineData.get('BTC');

  if (!btc || !btcSparkline || btcSparkline.length === 0) {
    return null;
  }

  const correlations = cryptoData
    .filter(coin => coin.symbol !== 'BTC')
    .map(coin => {
      const coinSparkline = sparklineData.get(coin.symbol);
      if (!coinSparkline || coinSparkline.length === 0) {
        return null;
      }

      const correlation = calculateCorrelation(btcSparkline, coinSparkline);
      const absCorr = Math.abs(correlation);

      let strength = 'weak';
      if (absCorr > 0.7) strength = correlation > 0 ? 'strong-positive' : 'strong-negative';
      else if (absCorr > 0.3) strength = correlation > 0 ? 'moderate-positive' : 'moderate-negative';

      const divergence = absCorr < 0.5 && 
                        ((btc.percentChange > 0 && coin.percentChange < 0) || 
                         (btc.percentChange < 0 && coin.percentChange > 0));

      const convergence = absCorr > 0.7 &&
                         ((btc.percentChange > 0 && coin.percentChange > 0) ||
                          (btc.percentChange < 0 && coin.percentChange < 0));

      return {
        symbol: coin.symbol,
        name: coin.name,
        correlation,
        strength,
        divergence,
        convergence,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    btcPrice: btc.price,
    btcChange: btc.percentChange,
    correlations,
  };
}

/**
 * Get top divergences from correlation matrix
 */
export function getTopDivergences(
  matrix: CorrelationMatrix,
  limit: number = 10
): Array<{
  symbol: string;
  name: string;
  correlation: number;
  strength: string;
  divergence: boolean;
  convergence: boolean;
}> {
  return matrix.correlations
    .filter(item => item.divergence || Math.abs(item.correlation) < 0.5)
    .sort((a, b) => Math.abs(a.correlation) - Math.abs(b.correlation))
    .slice(0, limit);
}

/**
 * Get rotation signals from correlation matrix
 */
export function getRotationSignals(matrix: CorrelationMatrix): RotationSignals {
  const buy: Array<{ symbol: string; name: string }> = [];
  const sell: Array<{ symbol: string; name: string }> = [];

  matrix.correlations.forEach(item => {
    // Buy signal: diverging from BTC when BTC is down
    if (item.divergence && matrix.btcChange < 0) {
      buy.push({ symbol: item.symbol, name: item.name });
    }
    // Sell signal: diverging from BTC when BTC is up
    else if (item.divergence && matrix.btcChange > 0) {
      sell.push({ symbol: item.symbol, name: item.name });
    }
  });

  return { buy, sell };
}

/**
 * Analyze correlation between Bitcoin and altcoins
 */
export function analyzeCorrelation(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): CorrelationData[] {
  const btcSparkline = sparklineData.get('BTC');
  
  if (!btcSparkline || btcSparkline.length === 0) {
    return [];
  }

  const correlationData: CorrelationData[] = [];

  cryptoData.forEach(coin => {
    if (coin.symbol === 'BTC') return;

    const coinSparkline = sparklineData.get(coin.symbol);
    if (!coinSparkline || coinSparkline.length === 0) return;

    const correlation = calculateCorrelation(btcSparkline, coinSparkline);
    
    // Calculate divergence (negative correlation or low correlation with opposite price movement)
    const btcChange = cryptoData.find(c => c.symbol === 'BTC')?.percentChange || 0;
    const divergence = Math.abs(correlation) < 0.5 && 
                      ((btcChange > 0 && coin.percentChange < 0) || 
                       (btcChange < 0 && coin.percentChange > 0))
                      ? Math.abs(coin.percentChange - btcChange)
                      : 0;

    // Calculate convergence (high correlation with similar price movement)
    const convergence = Math.abs(correlation) > 0.7 &&
                       ((btcChange > 0 && coin.percentChange > 0) ||
                        (btcChange < 0 && coin.percentChange < 0))
                       ? Math.abs(correlation)
                       : 0;

    // Determine rotation signal
    let rotationSignal: CorrelationData['rotationSignal'] = 'Neutral';
    if (divergence > 5) {
      rotationSignal = 'Strong Divergence';
    } else if (divergence > 2) {
      rotationSignal = 'Moderate Divergence';
    } else if (convergence > 0.8) {
      rotationSignal = 'Convergence';
    }

    correlationData.push({
      symbol: coin.symbol,
      name: coin.name,
      correlation,
      divergence,
      convergence,
      rotationSignal,
    });
  });

  return correlationData.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));
}

/**
 * Detect rotation timing signals based on correlation patterns
 */
export function detectRotationSignals(correlationData: CorrelationData[]): {
  strongDivergence: CorrelationData[];
  moderateDivergence: CorrelationData[];
  convergence: CorrelationData[];
} {
  return {
    strongDivergence: correlationData.filter(d => d.rotationSignal === 'Strong Divergence'),
    moderateDivergence: correlationData.filter(d => d.rotationSignal === 'Moderate Divergence'),
    convergence: correlationData.filter(d => d.rotationSignal === 'Convergence'),
  };
}
