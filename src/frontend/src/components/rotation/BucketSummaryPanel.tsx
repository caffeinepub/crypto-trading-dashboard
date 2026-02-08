import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BucketMetrics } from '@/lib/rotationMetrics';
import type { BucketClassification } from '@/lib/rotationBuckets';

interface BucketSummaryPanelProps {
  bucketMetrics: BucketMetrics[];
  bucketClassification: BucketClassification;
}

export function BucketSummaryPanel({ bucketMetrics, bucketClassification }: BucketSummaryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Bucket Performance
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm font-semibold mb-2">Bucket Classification Rule:</p>
                    <p className="text-xs">{bucketClassification.rule}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              24h performance and relative strength by market segment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {bucketMetrics.map(bucket => {
            const isPositive = bucket.performance24h > 0;
            const isNeutral = Math.abs(bucket.performance24h) < 0.5;
            const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={bucket.bucket}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{bucket.bucket}</h3>
                  <Icon className={`h-4 w-4 ${isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive'}`} />
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">24h Change</p>
                    <p className={`text-lg font-bold ${isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive'}`}>
                      {bucket.performance24h > 0 ? '+' : ''}{bucket.performance24h.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">vs BTC</p>
                    <p className={`text-sm font-semibold ${bucket.relativePerformanceVsBTC > 0 ? 'text-success' : bucket.relativePerformanceVsBTC < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {bucket.relativePerformanceVsBTC > 0 ? '+' : ''}{bucket.relativePerformanceVsBTC.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Breadth</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${bucket.breadth}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{bucket.breadth.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
