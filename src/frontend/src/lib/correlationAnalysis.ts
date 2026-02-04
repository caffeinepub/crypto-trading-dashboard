import type { CryptoData } from './coinRankingApi';

export interface CorrelationData {
  symbol: string;
  name: string;
  correlation: number; // -1 to 1
  strength: 'strong-positive' | 'moderate-positive' | 'weak' | 'moderate-negative' | 'strong-negative';
  divergence: boolean;
  convergence: boolean;
  trend: 'increasing' | 'decreasing' | 'stable';
  rotationSignal: 'buy' | 'sell' | 'hold';
}

export interface CorrelationMatrix {
  btcPrice: number;
  btcChange: number;
  correlations: CorrelationData[];
  timestamp: number;
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const xSlice = x.slice(-n);
  const ySlice = y.slice(-n);
  
  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  if (denomX === 0 || denomY === 0) return 0;
  
  return numerator / Math.sqrt(denomX * denomY);
}

// Determine correlation strength
function getCorrelationStrength(correlation: number): 'strong-positive' | 'moderate-positive' | 'weak' | 'moderate-negative' | 'strong-negative' {
  const abs = Math.abs(correlation);
  
  if (correlation > 0.7) return 'strong-positive';
  if (correlation > 0.3) return 'moderate-positive';
  if (correlation < -0.7) return 'strong-negative';
  if (correlation < -0.3) return 'moderate-negative';
  return 'weak';
}

// Detect divergence (altcoin moving opposite to BTC)
function detectDivergence(
  btcChange: number,
  altcoinChange: number,
  correlation: number
): boolean {
  // Divergence: BTC and altcoin moving in opposite directions with weak correlation
  const oppositeDirection = (btcChange > 0 && altcoinChange < 0) || (btcChange < 0 && altcoinChange > 0);
  const weakCorrelation = Math.abs(correlation) < 0.3;
  
  return oppositeDirection && weakCorrelation;
}

// Detect convergence (altcoin aligning with BTC)
function detectConvergence(
  btcChange: number,
  altcoinChange: number,
  correlation: number
): boolean {
  // Convergence: BTC and altcoin moving in same direction with strong correlation
  const sameDirection = (btcChange > 0 && altcoinChange > 0) || (btcChange < 0 && altcoinChange < 0);
  const strongCorrelation = Math.abs(correlation) > 0.7;
  
  return sameDirection && strongCorrelation;
}

// Generate rotation signal
function generateRotationSignal(
  correlation: number,
  divergence: boolean,
  convergence: boolean,
  btcChange: number,
  altcoinChange: number
): 'buy' | 'sell' | 'hold' {
  // Strong divergence with BTC up and altcoin down = potential buy
  if (divergence && btcChange > 0 && altcoinChange < 0) {
    return 'buy';
  }
  
  // Strong divergence with BTC down and altcoin up = potential sell
  if (divergence && btcChange < 0 && altcoinChange > 0) {
    return 'sell';
  }
  
  // Convergence with strong positive correlation = follow BTC
  if (convergence && correlation > 0.7) {
    return btcChange > 0 ? 'buy' : 'sell';
  }
  
  return 'hold';
}

// Analyze correlation for a single cryptocurrency
export function analyzeCorrelation(
  btcData: CryptoData,
  btcSparkline: number[],
  altcoinData: CryptoData,
  altcoinSparkline: number[]
): CorrelationData {
  console.log(`[Correlation] 📊 Analyzing ${altcoinData.symbol} vs BTC...`);
  
  // Calculate correlation
  const correlation = calculateCorrelation(btcSparkline, altcoinSparkline);
  const strength = getCorrelationStrength(correlation);
  
  // Detect divergence and convergence
  const divergence = detectDivergence(btcData.percentChange, altcoinData.percentChange, correlation);
  const convergence = detectConvergence(btcData.percentChange, altcoinData.percentChange, correlation);
  
  // Determine trend (simplified - would need historical correlation data for accurate trend)
  const trend: 'increasing' | 'decreasing' | 'stable' = 
    correlation > 0.5 ? 'increasing' : correlation < -0.5 ? 'decreasing' : 'stable';
  
  // Generate rotation signal
  const rotationSignal = generateRotationSignal(
    correlation,
    divergence,
    convergence,
    btcData.percentChange,
    altcoinData.percentChange
  );
  
  console.log(`[Correlation] ✅ ${altcoinData.symbol} correlation: ${correlation.toFixed(3)}, strength: ${strength}`);
  
  return {
    symbol: altcoinData.symbol,
    name: altcoinData.name,
    correlation,
    strength,
    divergence,
    convergence,
    trend,
    rotationSignal
  };
}

// Generate correlation matrix for all cryptocurrencies
export function generateCorrelationMatrix(
  cryptoData: CryptoData[],
  sparklineData: Map<string, number[]>
): CorrelationMatrix | null {
  console.log('[Correlation] 🔍 Generating correlation matrix...');
  
  // Find BTC data
  const btcData = cryptoData.find(c => c.symbol === 'BTC');
  const btcSparkline = sparklineData.get('BTC');
  
  if (!btcData || !btcSparkline) {
    console.warn('[Correlation] ⚠️ BTC data not found');
    return null;
  }
  
  const correlations: CorrelationData[] = [];
  
  for (const crypto of cryptoData) {
    if (crypto.symbol === 'BTC') continue; // Skip BTC itself
    
    const sparkline = sparklineData.get(crypto.symbol);
    if (!sparkline || sparkline.length < 10) continue;
    
    const correlationData = analyzeCorrelation(btcData, btcSparkline, crypto, sparkline);
    correlations.push(correlationData);
  }
  
  console.log(`[Correlation] ✅ Generated correlation matrix with ${correlations.length} entries`);
  
  return {
    btcPrice: btcData.price,
    btcChange: btcData.percentChange,
    correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
    timestamp: Date.now()
  };
}

// Get top divergence opportunities
export function getTopDivergences(matrix: CorrelationMatrix, limit: number = 10): CorrelationData[] {
  return matrix.correlations
    .filter(c => c.divergence)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, limit);
}

// Get top convergence opportunities
export function getTopConvergences(matrix: CorrelationMatrix, limit: number = 10): CorrelationData[] {
  return matrix.correlations
    .filter(c => c.convergence)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, limit);
}

// Get rotation signals
export function getRotationSignals(matrix: CorrelationMatrix): {
  buy: CorrelationData[];
  sell: CorrelationData[];
} {
  const buy = matrix.correlations.filter(c => c.rotationSignal === 'buy');
  const sell = matrix.correlations.filter(c => c.rotationSignal === 'sell');
  
  return { buy, sell };
}
