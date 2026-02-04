import { TrendingUp, TrendingDown, Bitcoin, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatLargeNumber } from '@/lib/utils';
import type { DominanceMetrics } from '@/lib/coinRankingApi';

interface DominanceMetricsProps {
  metrics: DominanceMetrics;
}

export function DominanceMetricsPanel({ metrics }: DominanceMetricsProps) {
  const formatDominance = (value: number) => value.toFixed(2) + '%';
  
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="w-6 h-6 text-primary" />
          Market Dominance Metrics
        </CardTitle>
        <CardDescription>
          BTC, ETH, and USDT dominance with Total 3 altcoin market cap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BTC Dominance */}
          <div className="space-y-2 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">BTC Dominance</span>
              <Bitcoin className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatDominance(metrics.btcDominance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bitcoin's share of total market cap
            </p>
          </div>

          {/* ETH Dominance */}
          <div className="space-y-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ETH Dominance</span>
              <Coins className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatDominance(metrics.ethDominance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ethereum's share of total market cap
            </p>
          </div>

          {/* USDT Dominance */}
          <div className="space-y-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">USDT Dominance</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatDominance(metrics.usdtDominance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tether's share of total market cap
            </p>
          </div>

          {/* Total 3 Market Cap */}
          <div className="space-y-2 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total 3 Market Cap</span>
              <TrendingDown className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${formatLargeNumber(metrics.total3MarketCap)}
            </div>
            <p className="text-xs text-muted-foreground">
              All altcoins excluding BTC & ETH
            </p>
          </div>
        </div>

        {/* Total Market Cap Summary */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Market Cap</span>
            <Badge variant="outline" className="text-base font-bold">
              ${formatLargeNumber(metrics.totalMarketCap)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
