import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';
import { 
  calculateOptimizerMetrics, 
  generateThresholdAdjustments, 
  getLearningInsights 
} from '@/lib/aiOptimizer';

export function AIOptimizerPanel() {
  const metrics = useMemo(() => calculateOptimizerMetrics(), []);
  const adjustments = useMemo(() => generateThresholdAdjustments(), []);
  const insights = useMemo(() => getLearningInsights(), []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Trade Prediction Optimizer
              <Badge 
                variant="default" 
                className={`${
                  metrics.optimizationScore > 80 
                    ? 'bg-green-600' 
                    : metrics.optimizationScore > 60 
                    ? 'bg-yellow-600' 
                    : 'bg-red-600'
                }`}
              >
                {metrics.optimizationScore.toFixed(0)}/100
              </Badge>
            </CardTitle>
            <CardDescription>Adaptive learning engine continuously refining prediction accuracy</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border-2 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Total Signals</p>
            <p className="text-2xl font-bold">{metrics.totalSignals}</p>
          </div>
          <div className="p-4 rounded-lg border-2 bg-green-500/10 border-green-500/30">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.successfulSignals}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 bg-red-500/10 border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.failedSignals}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 bg-blue-500/10 border-blue-500/30">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.pendingSignals}
            </p>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Prediction Accuracy</span>
            <span className="text-sm font-bold">{metrics.accuracyRate.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.accuracyRate} className="h-3" />
        </div>

        {/* Learning Insights */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Learning Insights
          </h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold Adjustments */}
        {adjustments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Suggested Threshold Adjustments
            </h4>
            <div className="space-y-3">
              {adjustments.map((adjustment, index) => (
                <div key={index} className="p-4 rounded-lg border-2 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {adjustment.signalType.toUpperCase()}
                    </Badge>
                    <Badge variant="default" className="bg-green-600">
                      +{adjustment.expectedImprovement}% improvement
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{adjustment.reason}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Current: {adjustment.currentThreshold}%
                    </span>
                    <span>→</span>
                    <span className="font-semibold text-primary">
                      Suggested: {adjustment.suggestedThreshold}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {metrics.totalSignals < 10 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              ℹ️ Collecting more data to improve optimization. Check back after {10 - metrics.totalSignals} more signals.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
