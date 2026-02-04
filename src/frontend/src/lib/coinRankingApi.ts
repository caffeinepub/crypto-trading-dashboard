export interface CoinRankingCoin {
  uuid: string;
  symbol: string;
  name: string;
  color: string | null;
  iconUrl: string;
  marketCap: string;
  price: string;
  listedAt: number;
  tier: number;
  change: string;
  rank: number;
  sparkline: string[];
  lowVolume: boolean;
  coinrankingUrl: string;
  '24hVolume': string;
  btcPrice: string;
}

export interface CoinRankingResponse {
  status: string;
  data: {
    stats: {
      total: number;
      totalCoins: number;
      totalMarkets: number;
      totalExchanges: number;
      totalMarketCap: string;
      total24hVolume: string;
    };
    coins: CoinRankingCoin[];
  };
}

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  volume: number;
  marketCap: number;
  rsi: number;
  emaSignal: 'Bullish' | 'Bearish';
  uuid: string;
  sparkline: string[];
}

export interface DominanceMetrics {
  btcDominance: number;
  ethDominance: number;
  usdtDominance: number;
  totalMarketCap: number;
  total3MarketCap: number; // Total market cap excluding BTC and ETH
}

const COINRANKING_API_BASE = 'https://api.coinranking.com/v2';

// Updated to Top 100 cryptocurrencies only
const TOTAL_COINS_TO_FETCH = 100;
const BATCH_SIZE = 100; // Fetch all 100 coins in one request for optimal performance

// Cache for historical data to minimize API requests
const historicalDataCache = new Map<string, { data: CoinHistoryPoint[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Cache for coin data to improve performance
const coinDataCache = new Map<string, { data: CoinRankingCoin[]; timestamp: number }>();
const COIN_DATA_CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache

// Cache for dominance metrics
const dominanceCache = new Map<string, { data: DominanceMetrics; timestamp: number }>();
const DOMINANCE_CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache

/**
 * Fetch coins in batches with optimized pagination
 * @param offset - Starting position for pagination
 * @param limit - Number of coins to fetch
 * @returns Array of CoinRanking coins
 */
async function fetchCoinBatch(offset: number, limit: number): Promise<CoinRankingCoin[]> {
  const startTime = performance.now();
  console.log(`[CoinRanking API] 📦 Fetching batch: offset=${offset}, limit=${limit}`);
  
  try {
    const response = await fetch(
      `${COINRANKING_API_BASE}/coins?limit=${limit}&offset=${offset}&orderBy=marketCap&orderDirection=desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.log(`[CoinRanking API] ⏱️ Batch response time: ${duration}ms`);
    console.log(`[CoinRanking API] 📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[CoinRanking API] ❌ Batch API Error: ${response.status} ${response.statusText}`);
      throw new Error(`CoinRanking API error: ${response.status} ${response.statusText}`);
    }
    
    const json: CoinRankingResponse = await response.json();
    console.log(`[CoinRanking API] ✅ Batch received: ${json.data?.coins?.length || 0} coins`);
    
    return json.data.coins || [];
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.error(`[CoinRanking API] ❌ Batch error after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Fetch Top 100 cryptocurrencies with optimized batching
 * @returns Array of CoinRanking coins
 */
export async function fetchCoinRankingCoins(): Promise<CoinRankingCoin[]> {
  const startTime = performance.now();
  console.log('[CoinRanking API] 🚀 Fetching Top 100 cryptocurrency data...');
  console.log('[CoinRanking API] 📍 Endpoint:', `${COINRANKING_API_BASE}/coins`);
  console.log('[CoinRanking API] 🎯 Target: Top', TOTAL_COINS_TO_FETCH, 'cryptocurrencies');
  
  // Check cache first
  const cacheKey = 'top100-coins';
  const cached = coinDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COIN_DATA_CACHE_DURATION) {
    const cacheAge = ((Date.now() - cached.timestamp) / 1000).toFixed(1);
    console.log(`[CoinRanking API] ⚡ Using cached data (age: ${cacheAge}s, ${cached.data.length} coins)`);
    return cached.data;
  }
  
  try {
    // Fetch all 100 coins in a single request for optimal performance
    console.log(`[CoinRanking API] 📦 Fetching all ${TOTAL_COINS_TO_FETCH} coins in single request`);
    
    const allCoins = await fetchCoinBatch(0, TOTAL_COINS_TO_FETCH);
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('[CoinRanking API] ✅ All coins fetched successfully!');
    console.log('[CoinRanking API] ⏱️ Total fetch time:', duration, 'seconds');
    console.log('[CoinRanking API] 📊 Total coins received:', allCoins.length);
    console.log('[CoinRanking API] 💰 Sample data:', allCoins.slice(0, 3).map((c: CoinRankingCoin) => ({
      rank: c.rank,
      symbol: c.symbol,
      name: c.name,
      price: c.price,
      change: c.change
    })));
    
    // Cache the results
    coinDataCache.set(cacheKey, {
      data: allCoins,
      timestamp: Date.now(),
    });
    
    return allCoins;
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error('[CoinRanking API] ❌ Error fetching coins after', duration, 'seconds');
    console.error('[CoinRanking API] 🔥 Error details:', error);
    console.error('[CoinRanking API] 📡 Network status:', navigator.onLine ? 'Online' : 'Offline');
    
    throw new Error('Unable to fetch market data: please retry.');
  }
}

/**
 * Calculate dominance metrics for BTC, ETH, USDT and Total 3 (altcoins excluding BTC and ETH)
 * @param coins - Array of CoinRanking coins
 * @returns Dominance metrics object
 */
export function calculateDominanceMetrics(coins: CoinRankingCoin[]): DominanceMetrics {
  const startTime = performance.now();
  console.log('[CoinRanking API] 📊 Calculating dominance metrics...');
  
  // Check cache first
  const cacheKey = 'dominance-metrics';
  const cached = dominanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DOMINANCE_CACHE_DURATION) {
    const cacheAge = ((Date.now() - cached.timestamp) / 1000).toFixed(1);
    console.log(`[CoinRanking API] ⚡ Using cached dominance metrics (age: ${cacheAge}s)`);
    return cached.data;
  }
  
  // Calculate total market cap
  const totalMarketCap = coins.reduce((sum, coin) => sum + parseFloat(coin.marketCap), 0);
  
  // Find BTC, ETH, and USDT
  const btc = coins.find(coin => coin.symbol === 'BTC');
  const eth = coins.find(coin => coin.symbol === 'ETH');
  const usdt = coins.find(coin => coin.symbol === 'USDT');
  
  const btcMarketCap = btc ? parseFloat(btc.marketCap) : 0;
  const ethMarketCap = eth ? parseFloat(eth.marketCap) : 0;
  const usdtMarketCap = usdt ? parseFloat(usdt.marketCap) : 0;
  
  // Calculate dominance percentages
  const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;
  const ethDominance = totalMarketCap > 0 ? (ethMarketCap / totalMarketCap) * 100 : 0;
  const usdtDominance = totalMarketCap > 0 ? (usdtMarketCap / totalMarketCap) * 100 : 0;
  
  // Calculate Total 3 (all altcoins excluding BTC and ETH)
  const total3MarketCap = totalMarketCap - btcMarketCap - ethMarketCap;
  
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);
  
  const metrics: DominanceMetrics = {
    btcDominance,
    ethDominance,
    usdtDominance,
    totalMarketCap,
    total3MarketCap,
  };
  
  console.log('[CoinRanking API] ✅ Dominance metrics calculated in', duration, 'ms:', {
    btcDominance: btcDominance.toFixed(2) + '%',
    ethDominance: ethDominance.toFixed(2) + '%',
    usdtDominance: usdtDominance.toFixed(2) + '%',
    totalMarketCap: (totalMarketCap / 1e12).toFixed(2) + 'T',
    total3MarketCap: (total3MarketCap / 1e12).toFixed(2) + 'T',
  });
  
  // Cache the results
  dominanceCache.set(cacheKey, {
    data: metrics,
    timestamp: Date.now(),
  });
  
  return metrics;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral RSI for insufficient data
  }

  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) {
    return 100;
  }
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) {
    return 0;
  }
  
  if (prices.length < period) {
    return prices[prices.length - 1];
  }

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Process coins in batches to calculate technical indicators
 * @param coins - Array of CoinRanking coins
 * @param batchSize - Number of coins to process per batch
 * @returns Array of CryptoData with indicators
 */
async function processCoinBatches(coins: CoinRankingCoin[], batchSize: number = 50): Promise<CryptoData[]> {
  console.log(`[Processing] 🔄 Processing ${coins.length} coins in batches of ${batchSize}`);
  
  const results: CryptoData[] = [];
  const numBatches = Math.ceil(coins.length / batchSize);
  
  for (let i = 0; i < numBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, coins.length);
    const batch = coins.slice(start, end);
    
    console.log(`[Processing] 📦 Processing batch ${i + 1}/${numBatches} (${batch.length} coins)`);
    
    const batchResults = batch.map((coin) => {
      try {
        // Use sparkline data for technical indicators
        const sparklinePrices = coin.sparkline
          .filter(price => price !== null)
          .map(price => parseFloat(price as string));
        
        if (sparklinePrices.length < 14) {
          // Return data with default indicators for insufficient data
          return {
            symbol: coin.symbol,
            name: coin.name,
            price: parseFloat(coin.price),
            percentChange: parseFloat(coin.change),
            volume: parseFloat(coin['24hVolume']),
            marketCap: parseFloat(coin.marketCap),
            rsi: 50, // Neutral RSI
            emaSignal: parseFloat(coin.change) > 0 ? 'Bullish' : 'Bearish' as 'Bullish' | 'Bearish',
            uuid: coin.uuid,
            sparkline: coin.sparkline,
          };
        }
        
        const rsi = calculateRSI(sparklinePrices, 14);
        const ema12 = calculateEMA(sparklinePrices, 12);
        const ema26 = calculateEMA(sparklinePrices, 26);
        
        const emaSignal = ema12 > ema26 ? 'Bullish' : 'Bearish';
        
        return {
          symbol: coin.symbol,
          name: coin.name,
          price: parseFloat(coin.price),
          percentChange: parseFloat(coin.change),
          volume: parseFloat(coin['24hVolume']),
          marketCap: parseFloat(coin.marketCap),
          rsi,
          emaSignal,
          uuid: coin.uuid,
          sparkline: coin.sparkline,
        };
      } catch (error) {
        console.error(`[Processing] ❌ Error processing ${coin.symbol}:`, error);
        return null;
      }
    });
    
    results.push(...batchResults.filter((data): data is CryptoData => data !== null));
    
    // Small delay between batches to prevent UI blocking
    if (i < numBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  console.log(`[Processing] ✅ Batch processing complete: ${results.length} valid results`);
  return results;
}

export async function fetchCryptoDataWithIndicators(): Promise<CryptoData[]> {
  const overallStartTime = performance.now();
  console.log('\n========================================');
  console.log('[CoinRanking Integration] 🚀 Starting Top 100 data fetch cycle');
  console.log('[CoinRanking Integration] ⏰ Timestamp:', new Date().toISOString());
  console.log('========================================\n');
  
  try {
    const coins = await fetchCoinRankingCoins();
    console.log('[CoinRanking Integration] ✅ Coins fetched successfully:', coins.length);
    
    // Process coins in batches for optimal performance
    const validResults = await processCoinBatches(coins, 50);
    
    const overallEndTime = performance.now();
    const totalDuration = ((overallEndTime - overallStartTime) / 1000).toFixed(2);
    
    console.log('\n========================================');
    console.log('[CoinRanking Integration] ✅ Top 100 data fetch cycle complete!');
    console.log('[CoinRanking Integration] ⏱️ Total duration:', totalDuration, 'seconds');
    console.log('[CoinRanking Integration] 📊 Valid results:', validResults.length, '/', coins.length);
    console.log('[CoinRanking Integration] 📈 Top gainers:', validResults.filter(d => d.percentChange > 0).length);
    console.log('[CoinRanking Integration] 📉 Top losers:', validResults.filter(d => d.percentChange < 0).length);
    console.log('[CoinRanking Integration] 🟢 Bullish signals:', validResults.filter(d => d.emaSignal === 'Bullish').length);
    console.log('[CoinRanking Integration] 🔴 Bearish signals:', validResults.filter(d => d.emaSignal === 'Bearish').length);
    console.log('========================================\n');
    
    return validResults;
  } catch (error) {
    const overallEndTime = performance.now();
    const totalDuration = ((overallEndTime - overallStartTime) / 1000).toFixed(2);
    
    console.error('\n========================================');
    console.error('[CoinRanking Integration] ❌ FATAL ERROR after', totalDuration, 'seconds');
    console.error('[CoinRanking Integration] 🔥 Error:', error);
    console.error('[CoinRanking Integration] 📡 Network:', navigator.onLine ? 'Online' : 'Offline');
    console.error('========================================\n');
    
    throw error;
  }
}

// Historical price data structures
export interface CoinHistoryPoint {
  price: number;
  timestamp: number;
}

export interface CoinHistoryResponse {
  status: string;
  data: {
    change: number;
    history: Array<{
      price: string;
      timestamp: number;
    }>;
  };
}

/**
 * Fetch historical price data for a specific coin from CoinRanking API
 * @param coinUuid - The unique identifier for the coin
 * @param timePeriod - Time period for history (24h or 7d)
 * @returns Array of historical price points with timestamps
 */
export async function fetchCoinHistory(
  coinUuid: string,
  timePeriod: '24h' | '7d' = '24h'
): Promise<CoinHistoryPoint[]> {
  const cacheKey = `${coinUuid}-${timePeriod}`;
  const startTime = performance.now();
  
  console.log(`[CoinRanking History] 📈 Fetching ${timePeriod} history for coin UUID: ${coinUuid}`);
  
  // Check cache first
  const cached = historicalDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    const cacheAge = ((Date.now() - cached.timestamp) / 1000).toFixed(1);
    console.log(`[CoinRanking History] ⚡ Using cached data (age: ${cacheAge}s)`);
    return cached.data;
  }
  
  try {
    const response = await fetch(
      `${COINRANKING_API_BASE}/coin/${coinUuid}/history?timePeriod=${timePeriod}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.log(`[CoinRanking History] ⏱️ Response time: ${duration}ms`);
    console.log(`[CoinRanking History] 📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[CoinRanking History] ❌ API Error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch history: ${response.status}`);
    }
    
    const json: CoinHistoryResponse = await response.json();
    
    if (!json.data?.history || json.data.history.length === 0) {
      console.warn(`[CoinRanking History] ⚠️ No history data available`);
      return [];
    }
    
    const historyPoints: CoinHistoryPoint[] = json.data.history
      .filter(point => point.price !== null)
      .map(point => ({
        price: parseFloat(point.price),
        timestamp: point.timestamp * 1000, // Convert to milliseconds
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure chronological order
    
    console.log(`[CoinRanking History] ✅ History points: ${historyPoints.length}`);
    
    if (historyPoints.length > 0) {
      const priceRange = {
        min: Math.min(...historyPoints.map(p => p.price)),
        max: Math.max(...historyPoints.map(p => p.price)),
        first: historyPoints[0].price,
        last: historyPoints[historyPoints.length - 1].price,
      };
      console.log(`[CoinRanking History] 📊 Price range:`, {
        min: priceRange.min.toFixed(2),
        max: priceRange.max.toFixed(2),
        first: priceRange.first.toFixed(2),
        last: priceRange.last.toFixed(2),
        change: ((priceRange.last - priceRange.first) / priceRange.first * 100).toFixed(2) + '%',
      });
    }
    
    // Cache the result
    historicalDataCache.set(cacheKey, {
      data: historyPoints,
      timestamp: Date.now(),
    });
    
    return historyPoints;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.error(`[CoinRanking History] ❌ Error after ${duration}ms:`, error);
    console.error(`[CoinRanking History] 📡 Network status:`, navigator.onLine ? 'Online' : 'Offline');
    
    // Return empty array on error to allow graceful degradation
    return [];
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  console.log('[CoinRanking API] 🗑️ Clearing all caches');
  historicalDataCache.clear();
  coinDataCache.clear();
  dominanceCache.clear();
}

/**
 * Clear the historical data cache
 */
export function clearHistoryCache(): void {
  console.log('[CoinRanking History] 🗑️ Clearing history cache');
  historicalDataCache.clear();
}
