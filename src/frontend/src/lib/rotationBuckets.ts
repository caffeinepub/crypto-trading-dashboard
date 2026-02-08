import type { CryptoData } from './coinRankingApi';

export type BucketName = 'BTC' | 'ETH' | 'Majors' | 'Mid-caps' | 'Micro-caps';

export interface BucketClassification {
  BTC: CryptoData[];
  ETH: CryptoData[];
  Majors: CryptoData[];
  'Mid-caps': CryptoData[];
  'Micro-caps': CryptoData[];
  rule: string;
}

/**
 * Classify cryptocurrencies into rotation buckets using deterministic rules
 * based on market cap ordering (since rank is not available in CryptoData).
 * 
 * Rule:
 * - BTC: Bitcoin only
 * - ETH: Ethereum only
 * - Majors: Top 3-10 by market cap (excluding BTC/ETH)
 * - Mid-caps: Top 11-30 by market cap
 * - Micro-caps: Top 31-100 by market cap
 */
export function classifyIntoBuckets(cryptoData: CryptoData[]): BucketClassification {
  // Sort by market cap descending
  const sorted = [...cryptoData].sort((a, b) => b.marketCap - a.marketCap);

  const BTC: CryptoData[] = [];
  const ETH: CryptoData[] = [];
  const Majors: CryptoData[] = [];
  const MidCaps: CryptoData[] = [];
  const MicroCaps: CryptoData[] = [];

  // First pass: extract BTC and ETH
  const btcCoin = sorted.find(c => c.symbol === 'BTC');
  const ethCoin = sorted.find(c => c.symbol === 'ETH');

  if (btcCoin) BTC.push(btcCoin);
  if (ethCoin) ETH.push(ethCoin);

  // Remove BTC and ETH from sorted list
  const remaining = sorted.filter(c => c.symbol !== 'BTC' && c.symbol !== 'ETH');

  // Classify remaining coins by position
  remaining.forEach((coin, index) => {
    const position = index + 1; // 1-indexed position after BTC/ETH
    if (position <= 8) {
      Majors.push(coin);
    } else if (position <= 28) {
      MidCaps.push(coin);
    } else {
      MicroCaps.push(coin);
    }
  });

  const rule = 'BTC: Bitcoin only | ETH: Ethereum only | Majors: Top 3-10 by market cap | Mid-caps: Top 11-30 | Micro-caps: Top 31-100';

  return {
    BTC,
    ETH,
    Majors,
    'Mid-caps': MidCaps,
    'Micro-caps': MicroCaps,
    rule,
  };
}
