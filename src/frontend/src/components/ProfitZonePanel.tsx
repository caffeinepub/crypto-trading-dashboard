import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import type { CryptoData } from '@/lib/coinRankingApi';
import { getTopProfitOpportunities } from '@/lib/profitZones';
import { formatCurrency } from '@/lib/utils';

interface ProfitZonePanelProps {
  data: CryptoData[];
  sparklineData: Map<string, number[]>;
}

export function ProfitZonePanel({ data, sparklineData }: ProfitZonePanelProps) {
  const profitOpportunities = useMemo(() => 
    getTopProfitOpportunities(data, sparklineData, 10),
    [data, sparklineData]
  );

  if (profitOpportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Profit Zone Analysis</CardTitle>
              <CardDescription>Historical ROI zones and probability analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Insufficient data to calculate profit zones.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Profit Zone Analysis
              <Badge variant="default" className="bg-green-600">
                {profitOpportunities.length} Opportunities
              </Badge>
            </CardTitle>
            <CardDescription>
              Historical ROI zones with probability-based profit projections
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {profitOpportunities.map((zone) => (
              <div
                key={zone.symbol}
                className="p-4 rounded-lg border-2 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">{zone.symbol}</p>
                    <p className="text-sm text-muted-foreground">{zone.name}</p>
                  </div>
                  <Badge
                    variant="default"
                    className={`${
                      zone.successProbability >= 70
                        ? 'bg-green-600'
                        : zone.successProbability >= 50
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {zone.successProbability.toFixed(0)}% Success
                  </Badge>
                </div>

                {/* Current Price */}
                <div className="mb-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-xl font-bold">{formatCurrency(zone.currentPrice)}</p>
                </div>

                {/* Expected Profit Range */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Expected Profit Range
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-center">
                      <p className="text-xs text-muted-foreground">Low</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        +{zone.expectedProfitRange.low.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-green-500/20 border border-green-500/40 text-center">
                      <p className="text-xs text-muted-foreground">Mid</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        +{zone.expectedProfitRange.mid.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-green-500/30 border border-green-500/50 text-center">
                      <p className="text-xs text-muted-foreground">High</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        +{zone.expectedProfitRange.high.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* ROI Probability by Timeframe */}
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    ROI Probability by Timeframe
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Short (1-7d)</span>
                        <span className="font-semibold">{zone.roiProbability.short.toFixed(0)}%</span>
                      </div>
                      <Progress value={zone.roiProbability.short} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Medium (7-30d)</span>
                        <span className="font-semibold">{zone.roiProbability.medium.toFixed(0)}%</span>
                      </div>
                      <Progress value={zone.roiProbability.medium} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Long (30d+)</span>
                        <span className="font-semibold">{zone.roiProbability.long.toFixed(0)}%</span>
                      </div>
                      <Progress value={zone.roiProbability.long} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Risk-Reward Ratio */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Risk-Reward Ratio
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    1:{zone.riskRewardRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
