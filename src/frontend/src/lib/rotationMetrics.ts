import type { BucketClassification, BucketName } from './rotationBuckets';
import type { DominanceMetrics } from './coinRankingApi';

export interface BucketMetrics {
  bucket: BucketName;
  performance24h: number; // Weighted average 24h change
  relativePerformanceVsBTC: number; // Performance relative to BTC
  volumeTrend: number; // Volume momentum proxy
  breadth: number; // % of coins in bucket that are positive
  momentum: number; // Momentum score (0-100)
}

/**
 * Calculate aggregate metrics for each rotation bucket
 */
export function calculateBucketMetrics(
  classification: BucketClassification,
  dominanceMetrics: DominanceMetrics
): BucketMetrics[] {
  const buckets: BucketName[] = ['BTC', 'ETH', 'Majors', 'Mid-caps', 'Micro-caps'];
  const btcPerformance = classification.BTC[0]?.percentChange || 0;

  return buckets.map(bucket => {
    const coins = classification[bucket];
    
    if (coins.length === 0) {
      return {
        bucket,
        performance24h: 0,
        relativePerformanceVsBTC: 0,
        volumeTrend: 0,
        breadth: 0,
        momentum: 0,
      };
    }

    // Calculate weighted average performance (by market cap)
    const totalMarketCap = coins.reduce((sum, c) => sum + c.marketCap, 0);
    const weightedPerformance = coins.reduce((sum, c) => {
      const weight = c.marketCap / totalMarketCap;
      return sum + (c.percentChange * weight);
    }, 0);

    // Calculate relative performance vs BTC
    const relativePerformanceVsBTC = weightedPerformance - btcPerformance;

    // Volume trend proxy (weighted average volume change)
    const volumeTrend = coins.reduce((sum, c) => {
      const weight = c.marketCap / totalMarketCap;
      return sum + (c.volume * weight);
    }, 0);

    // Breadth: percentage of coins with positive 24h change
    const positiveCoins = coins.filter(c => c.percentChange > 0).length;
    const breadth = (positiveCoins / coins.length) * 100;

    // Momentum score: combination of performance, breadth, and RSI
    const avgRSI = coins.reduce((sum, c) => sum + c.rsi, 0) / coins.length;
    const momentum = Math.min(100, Math.max(0, 
      (weightedPerformance * 2) + (breadth * 0.3) + ((avgRSI - 50) * 0.5)
    ));

    return {
      bucket,
      performance24h: weightedPerformance,
      relativePerformanceVsBTC,
      volumeTrend,
      breadth,
      momentum,
    };
  });
}
