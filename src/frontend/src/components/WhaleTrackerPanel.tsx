import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Activity, Waves } from 'lucide-react';
import { useMemo } from 'react';
import type { CryptoData } from '@/lib/coinRankingApi';
import { getTopWhaleActivity, detectWhaleMovements, storeWhaleMovement, type WhaleActivity } from '@/lib/whaleTracker';

interface WhaleTrackerPanelProps {
  data: CryptoData[];
  sparklineData: Map<string, number[]>;
}

export function WhaleTrackerPanel({ data, sparklineData }: WhaleTrackerPanelProps) {
  const whaleActivities = useMemo(() => {
    // Detect and store new whale movements
    for (const crypto of data) {
      const sparkline = sparklineData.get(crypto.symbol);
      if (!sparkline) continue;
      
      const movement = detectWhaleMovements(crypto, sparkline);
      if (movement) {
        storeWhaleMovement(movement);
      }
    }
    
    return getTopWhaleActivity(data, sparklineData, 10);
  }, [data, sparklineData]);

  if (whaleActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Waves className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Smart Money Tracker</CardTitle>
              <CardDescription>Monitor large wallet movements and accumulation patterns</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No significant whale activity detected at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Waves className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Smart Money Tracker
              <Badge variant="default" className="bg-blue-600">
                {whaleActivities.length} Active
              </Badge>
            </CardTitle>
            <CardDescription>Large wallet movements and accumulation/distribution patterns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {whaleActivities.map((activity) => (
              <div
                key={activity.symbol}
                className="p-4 rounded-lg border-2 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">{activity.symbol}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                  <Badge
                    variant={activity.netFlow === 'accumulation' ? 'default' : 'destructive'}
                    className={activity.netFlow === 'accumulation' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                    }
                  >
                    {activity.netFlow === 'accumulation' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {activity.netFlow.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        Accumulation
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {activity.accumulationScore.toFixed(0)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Distribution
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {activity.distributionScore.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {activity.recentMovements.length} movements (7d)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Trend: {activity.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
