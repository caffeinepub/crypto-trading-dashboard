import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import { formatLargeNumber } from '@/lib/utils';
import type { DominanceMetrics } from '@/lib/coinRankingApi';

interface Total3ChartProps {
  metrics: DominanceMetrics;
}

export function Total3Chart({ metrics }: Total3ChartProps) {
  // Calculate Total 3 dominance percentage
  const total3Dominance = metrics.totalMarketCap > 0 
    ? ((metrics.total3MarketCap / metrics.totalMarketCap) * 100).toFixed(2)
    : '0.00';

  // Calculate individual components for visualization
  const btcPercentage = metrics.btcDominance;
  const ethPercentage = metrics.ethDominance;
  const total3Percentage = parseFloat(total3Dominance);

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-500" />
          Total 3 Chart - Altcoin Strength Indicator
        </CardTitle>
        <CardDescription>
          Visualizes total market cap of all altcoins excluding BTC and ETH
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Cap Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Market Cap Distribution</span>
            <span className="text-muted-foreground">Total: ${formatLargeNumber(metrics.totalMarketCap)}</span>
          </div>
          
          {/* Visual Bar Chart */}
          <div className="relative h-12 rounded-lg overflow-hidden bg-muted/30 flex">
            {/* BTC Section */}
            <div 
              className="bg-orange-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: `${btcPercentage}%` }}
              title={`BTC: ${btcPercentage.toFixed(2)}%`}
            >
              {btcPercentage > 10 && 'BTC'}
            </div>
            
            {/* ETH Section */}
            <div 
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: `${ethPercentage}%` }}
              title={`ETH: ${ethPercentage.toFixed(2)}%`}
            >
              {ethPercentage > 10 && 'ETH'}
            </div>
            
            {/* Total 3 Section */}
            <div 
              className="bg-purple-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: `${total3Percentage}%` }}
              title={`Total 3: ${total3Percentage}%`}
            >
              {total3Percentage > 10 && 'Total 3'}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-muted-foreground">BTC: {btcPercentage.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-muted-foreground">ETH: {ethPercentage.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-muted-foreground">Total 3: {total3Percentage}%</span>
            </div>
          </div>
        </div>

        {/* Total 3 Details */}
        <div className="space-y-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-purple-600 dark:text-purple-400">Total 3 Market Cap</span>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${formatLargeNumber(metrics.total3MarketCap)}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Total 3</strong> represents the combined market capitalization of all altcoins excluding Bitcoin and Ethereum.
            </p>
            <p>
              A rising Total 3 indicates increasing altcoin strength and market participation beyond the two largest cryptocurrencies.
            </p>
          </div>

          {/* Altcoin Strength Indicator */}
          <div className="pt-3 border-t border-purple-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Altcoin Market Share</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {total3Dominance}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
