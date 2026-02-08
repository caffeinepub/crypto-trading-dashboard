import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BucketSummaryPanel } from './BucketSummaryPanel';
import { RotationPhasePanel } from './RotationPhasePanel';
import { FlowLeadersView } from './FlowLeadersView';
import { classifyIntoBuckets, type BucketClassification } from '@/lib/rotationBuckets';
import { calculateBucketMetrics, type BucketMetrics } from '@/lib/rotationMetrics';
import { inferRotationPhase, type RotationPhase } from '@/lib/rotationPhase';
import type { CryptoData, DominanceMetrics } from '@/lib/coinRankingApi';

interface RotationRadarDashboardProps {
  cryptoData: CryptoData[];
  dominanceMetrics: DominanceMetrics | null;
  onCoinSelect: (coin: CryptoData) => void;
}

export function RotationRadarDashboard({
  cryptoData,
  dominanceMetrics,
  onCoinSelect,
}: RotationRadarDashboardProps) {
  // Classify coins into buckets
  const bucketClassification = useMemo<BucketClassification | null>(() => {
    if (!cryptoData || cryptoData.length === 0) return null;
    return classifyIntoBuckets(cryptoData);
  }, [cryptoData]);

  // Calculate bucket metrics
  const bucketMetrics = useMemo<BucketMetrics[] | null>(() => {
    if (!bucketClassification || !dominanceMetrics) return null;
    return calculateBucketMetrics(bucketClassification, dominanceMetrics);
  }, [bucketClassification, dominanceMetrics]);

  // Infer rotation phase
  const rotationPhase = useMemo<RotationPhase | null>(() => {
    if (!bucketMetrics || !dominanceMetrics) return null;
    return inferRotationPhase(bucketMetrics, dominanceMetrics);
  }, [bucketMetrics, dominanceMetrics]);

  // Loading state
  if (!cryptoData || cryptoData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Rotation Radar</CardTitle>
          <CardDescription>Loading market rotation data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (!bucketClassification || !bucketMetrics || !dominanceMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Rotation Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient data to calculate rotation metrics. Please refresh or try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Introduction Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Market Rotation Radar
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Track capital flows between BTC, ETH, and altcoin segments to identify rotation opportunities and market phases.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Real-time analysis of capital rotation across crypto market segments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rotation Phase */}
      <RotationPhasePanel phase={rotationPhase} />

      {/* Bucket Summary */}
      <BucketSummaryPanel
        bucketMetrics={bucketMetrics}
        bucketClassification={bucketClassification}
      />

      {/* Flow & Leaders */}
      <FlowLeadersView
        cryptoData={cryptoData}
        bucketClassification={bucketClassification}
        bucketMetrics={bucketMetrics}
        onCoinSelect={onCoinSelect}
      />
    </div>
  );
}
