import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Activity, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import type { CryptoData } from '@/lib/coinRankingApi';
import { generateCorrelationMatrix, getTopDivergences, getRotationSignals } from '@/lib/correlationAnalysis';

interface CorrelationHeatmapProps {
  data: CryptoData[];
  sparklineData: Map<string, number[]>;
}

export function CorrelationHeatmap({ data, sparklineData }: CorrelationHeatmapProps) {
  const matrix = useMemo(() => generateCorrelationMatrix(data, sparklineData), [data, sparklineData]);
  const divergences = useMemo(() => matrix ? getTopDivergences(matrix, 10) : [], [matrix]);
  const rotationSignals = useMemo(() => matrix ? getRotationSignals(matrix) : { buy: [], sell: [] }, [matrix]);

  if (!matrix) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle>Market Correlation Heatmap</CardTitle>
              <CardDescription>Bitcoin vs Altcoin correlation analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Insufficient data to generate correlation matrix.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCorrelationColor = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return correlation > 0 ? 'bg-green-600' : 'bg-red-600';
    if (abs > 0.3) return correlation > 0 ? 'bg-green-500' : 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Market Correlation Heatmap
              <Badge variant="default" className="bg-orange-600">
                BTC: ${matrix.btcPrice.toFixed(2)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Bitcoin correlation analysis - {divergences.length} divergences detected
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BTC Status */}
        <div className="p-4 rounded-lg border-2 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bitcoin 24h Change</p>
              <p className={`text-2xl font-bold ${matrix.btcChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {matrix.btcChange >= 0 ? '+' : ''}{matrix.btcChange.toFixed(2)}%
              </p>
            </div>
            {matrix.btcChange >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        {/* Rotation Signals */}
        {(rotationSignals.buy.length > 0 || rotationSignals.sell.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Rotation Signals
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  Buy Signals ({rotationSignals.buy.length})
                </p>
                <div className="space-y-1">
                  {rotationSignals.buy.slice(0, 3).map(signal => (
                    <p key={signal.symbol} className="text-xs font-mono">
                      {signal.symbol}
                    </p>
                  ))}
                  {rotationSignals.buy.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{rotationSignals.buy.length - 3} more
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  Sell Signals ({rotationSignals.sell.length})
                </p>
                <div className="space-y-1">
                  {rotationSignals.sell.slice(0, 3).map(signal => (
                    <p key={signal.symbol} className="text-xs font-mono">
                      {signal.symbol}
                    </p>
                  ))}
                  {rotationSignals.sell.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{rotationSignals.sell.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Divergences */}
        <div className="space-y-3">
          <h4 className="font-semibold">Top Divergences (Rotation Opportunities)</h4>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {divergences.map((item) => (
                <div
                  key={item.symbol}
                  className="p-3 rounded-lg border-2 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                    </div>
                    <Badge className={getCorrelationColor(item.correlation)}>
                      {item.correlation.toFixed(3)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {item.strength.replace('-', ' ')}
                    </Badge>
                    {item.divergence && (
                      <Badge variant="destructive" className="text-xs">
                        Diverging
                      </Badge>
                    )}
                    {item.convergence && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Converging
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Correlation Grid Preview */}
        <div className="space-y-3">
          <h4 className="font-semibold">Correlation Strength Distribution</h4>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="w-full h-12 rounded bg-red-600 mb-1"></div>
              <p className="text-xs text-muted-foreground">Strong -</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 rounded bg-red-500 mb-1"></div>
              <p className="text-xs text-muted-foreground">Moderate -</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 rounded bg-gray-500 mb-1"></div>
              <p className="text-xs text-muted-foreground">Weak</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 rounded bg-green-500 mb-1"></div>
              <p className="text-xs text-muted-foreground">Moderate +</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 rounded bg-green-600 mb-1"></div>
              <p className="text-xs text-muted-foreground">Strong +</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
