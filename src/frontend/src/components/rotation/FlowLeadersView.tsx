import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';
import type { BucketClassification, BucketName } from '@/lib/rotationBuckets';
import type { BucketMetrics } from '@/lib/rotationMetrics';
import { calculateCorrelation } from '@/lib/correlationAnalysis';

interface FlowLeadersViewProps {
  cryptoData: CryptoData[];
  bucketClassification: BucketClassification;
  bucketMetrics: BucketMetrics[];
  onCoinSelect: (coin: CryptoData) => void;
}

type SortBy = '24h' | 'volume' | 'vsBTC' | 'correlation';

interface CoinWithCorrelation extends CryptoData {
  correlation: number;
}

export function FlowLeadersView({
  cryptoData,
  bucketClassification,
  bucketMetrics,
  onCoinSelect,
}: FlowLeadersViewProps) {
  const [selectedBucket, setSelectedBucket] = useState<BucketName | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortBy>('24h');
  const [searchQuery, setSearchQuery] = useState('');

  // Get BTC sparkline for correlation calculation
  const btcSparkline = useMemo(() => {
    const btc = cryptoData.find(c => c.symbol === 'BTC');
    if (!btc || !btc.sparkline) return [];
    return btc.sparkline
      .filter(price => price !== null)
      .map(price => parseFloat(price as string));
  }, [cryptoData]);

  // Filter and sort coins
  const filteredCoins = useMemo(() => {
    let coins = cryptoData;

    // Filter by bucket
    if (selectedBucket !== 'All') {
      coins = bucketClassification[selectedBucket] || [];
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      coins = coins.filter(
        c => c.symbol.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
      );
    }

    // Calculate correlation for each coin
    const coinsWithCorrelation: CoinWithCorrelation[] = coins.map(coin => {
      const coinSparkline = coin.sparkline
        ?.filter(price => price !== null)
        .map(price => parseFloat(price as string)) || [];
      
      const correlation = btcSparkline.length > 0 && coinSparkline.length > 0
        ? calculateCorrelation(btcSparkline, coinSparkline)
        : 0;

      return { ...coin, correlation };
    });

    // Sort
    const sorted = [...coinsWithCorrelation].sort((a, b) => {
      switch (sortBy) {
        case '24h':
          return b.percentChange - a.percentChange;
        case 'volume':
          return b.volume - a.volume;
        case 'vsBTC':
          const btcChange = cryptoData.find(c => c.symbol === 'BTC')?.percentChange || 0;
          const aVsBTC = a.percentChange - btcChange;
          const bVsBTC = b.percentChange - btcChange;
          return bVsBTC - aVsBTC;
        case 'correlation':
          return Math.abs(b.correlation) - Math.abs(a.correlation);
        default:
          return 0;
      }
    });

    return sorted;
  }, [cryptoData, bucketClassification, selectedBucket, searchQuery, sortBy, btcSparkline]);

  const leaders = filteredCoins.filter(c => c.percentChange > 0).slice(0, 10);
  const laggards = filteredCoins.filter(c => c.percentChange < 0).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flow & Leaders</CardTitle>
        <CardDescription>
          Top performers and laggards with rotation signals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedBucket} onValueChange={(v) => setSelectedBucket(v as BucketName | 'All')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select bucket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Buckets</SelectItem>
              <SelectItem value="BTC">BTC</SelectItem>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="Majors">Majors</SelectItem>
              <SelectItem value="Mid-caps">Mid-caps</SelectItem>
              <SelectItem value="Micro-caps">Micro-caps</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h Change</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="vsBTC">vs BTC</SelectItem>
              <SelectItem value="correlation">Correlation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaders */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Top Leaders ({leaders.length})
          </h3>
          <div className="space-y-2">
            {leaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaders found</p>
            ) : (
              leaders.map(coin => (
                <button
                  key={coin.symbol}
                  onClick={() => onCoinSelect(coin)}
                  className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{coin.symbol}</span>
                        <span className="text-sm text-muted-foreground truncate">{coin.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Correlation: {(coin.correlation * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-success">
                        +{coin.percentChange.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${coin.price.toFixed(coin.price < 1 ? 6 : 2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Laggards */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Top Laggards ({laggards.length})
          </h3>
          <div className="space-y-2">
            {laggards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No laggards found</p>
            ) : (
              laggards.map(coin => (
                <button
                  key={coin.symbol}
                  onClick={() => onCoinSelect(coin)}
                  className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{coin.symbol}</span>
                        <span className="text-sm text-muted-foreground truncate">{coin.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Correlation: {(coin.correlation * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-destructive">
                        {coin.percentChange.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${coin.price.toFixed(coin.price < 1 ? 6 : 2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
