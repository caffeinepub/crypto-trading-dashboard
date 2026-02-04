import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp, Target, Award } from 'lucide-react';
import { formatPercentage } from '@/lib/utils';
import { 
  getJournalEntries, 
  calculateJournalAnalytics,
  syncJournalWithPositions,
  type JournalAnalytics 
} from '@/lib/tradeJournalAnalytics';
import { getClosedPositions } from '@/lib/portfolioSimulation';

export function TradeJournalAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    // Sync with closed positions
    const closedPositions = getClosedPositions();
    syncJournalWithPositions(closedPositions);
    
    // Calculate analytics
    const data = calculateJournalAnalytics();
    setAnalytics(data);
  };

  if (!analytics) return null;

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>Trade Journal Analytics</CardTitle>
            <CardDescription>Real-time performance tracking and analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </div>
            <p className="text-2xl font-bold">{analytics.totalEntries}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.winRate.toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </div>
            <p className="text-2xl font-bold">{analytics.avgConfidence.toFixed(0)}%</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Correlation</p>
            </div>
            <p className={`text-2xl font-bold ${analytics.confidenceCorrelation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.confidenceCorrelation >= 0 ? '+' : ''}{analytics.confidenceCorrelation.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Outcome Distribution */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Outcome Distribution</h3>
          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-600">
              <p className="text-sm text-muted-foreground mb-1">Wins</p>
              <p className="text-3xl font-bold text-green-600">{analytics.outcomeDistribution.wins}</p>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-600">
              <p className="text-sm text-muted-foreground mb-1">Losses</p>
              <p className="text-3xl font-bold text-red-600">{analytics.outcomeDistribution.losses}</p>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-600">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{analytics.outcomeDistribution.pending}</p>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div>
          <h3 className="text-lg font-semibold mb-3">7-Day Performance Trend</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Accuracy */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Confidence vs Accuracy</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.confidenceAccuracy}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis tickFormatter={(value) => `${value}%`} className="text-xs" />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
