import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  LineChart as LineChartIcon,
  Info
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

interface TradePerformanceMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  winStreak: number;
  lossStreak: number;
  currentStreak: number;
  bestTrade: number;
  worstTrade: number;
}

interface TimeframePerformance {
  timeframe: string;
  trades: number;
  successRate: number;
  profit: number;
}

interface SignalAccuracy {
  signalType: string;
  total: number;
  accurate: number;
  accuracy: number;
}

interface PerformanceTrend {
  date: string;
  successRate: number;
  avgConfidence: number;
  trades: number;
}

interface PerformanceAnalyticsProps {
  className?: string;
}

export function PerformanceAnalytics({ className }: PerformanceAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - will be replaced with real data from localStorage/API
  const mockMetrics: TradePerformanceMetrics = {
    totalTrades: 156,
    successfulTrades: 98,
    failedTrades: 58,
    successRate: 62.82,
    totalProfit: 12450.50,
    totalLoss: 4320.75,
    netProfit: 8129.75,
    averageProfit: 127.05,
    averageLoss: 74.50,
    profitFactor: 2.88,
    winStreak: 7,
    lossStreak: 4,
    currentStreak: 3,
    bestTrade: 850.25,
    worstTrade: -320.50
  };

  const mockTimeframeData: TimeframePerformance[] = [
    { timeframe: '1h', trades: 45, successRate: 58.5, profit: 1250.50 },
    { timeframe: '4h', trades: 67, successRate: 65.2, profit: 3420.75 },
    { timeframe: '1d', trades: 44, successRate: 68.8, profit: 3458.50 }
  ];

  const mockSignalAccuracy: SignalAccuracy[] = [
    { signalType: 'Long Entry', total: 78, accurate: 52, accuracy: 66.67 },
    { signalType: 'Long Exit', total: 78, accurate: 46, accuracy: 58.97 },
    { signalType: 'Short Entry', total: 42, accurate: 28, accuracy: 66.67 },
    { signalType: 'Cover Exit', total: 42, accurate: 24, accuracy: 57.14 }
  ];

  const mockDailyPerformance = [
    { date: 'Mon', profit: 450, trades: 12 },
    { date: 'Tue', profit: 320, trades: 8 },
    { date: 'Wed', profit: -180, trades: 15 },
    { date: 'Thu', profit: 680, trades: 18 },
    { date: 'Fri', profit: 520, trades: 14 },
    { date: 'Sat', profit: 290, trades: 10 },
    { date: 'Sun', profit: 410, trades: 11 }
  ];

  // Stage 2: Performance Trends Data
  const mockPerformanceTrends: PerformanceTrend[] = [
    { date: 'Week 1', successRate: 58, avgConfidence: 65, trades: 32 },
    { date: 'Week 2', successRate: 62, avgConfidence: 68, trades: 38 },
    { date: 'Week 3', successRate: 65, avgConfidence: 70, trades: 42 },
    { date: 'Week 4', successRate: 63, avgConfidence: 72, trades: 44 }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    console.log('[PerformanceAnalytics] Exporting performance data...');
    // Export functionality will be implemented
  };

  const COLORS = {
    success: 'hsl(var(--success))',
    destructive: 'hsl(var(--destructive))',
    primary: 'hsl(var(--primary))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted-foreground))'
  };

  // Calculate suggested adjustments based on performance trends
  const suggestedAdjustments = useMemo(() => {
    const suggestions: string[] = [];
    
    if (mockMetrics.successRate < 60) {
      suggestions.push('Consider increasing confidence thresholds to filter lower-quality signals');
    }
    
    if (mockMetrics.profitFactor < 2) {
      suggestions.push('Review exit strategies - profit factor could be improved');
    }
    
    const bestTimeframe = mockTimeframeData.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );
    suggestions.push(`Focus on ${bestTimeframe.timeframe} timeframe - showing best performance (${bestTimeframe.successRate.toFixed(1)}%)`);
    
    if (mockMetrics.currentStreak < 0) {
      suggestions.push('Consider reducing position sizes during losing streaks');
    }
    
    return suggestions;
  }, [mockMetrics, mockTimeframeData]);

  return (
    <div className={className}>
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Advanced Performance Analytics
                  <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                    Stage 2
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Track trade performance with trend analysis and optimization insights
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground">Timeframe:</span>
            {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className="min-w-[60px]"
              >
                {tf === 'all' ? 'All Time' : tf.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="analytics-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Trades</span>
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{mockMetrics.totalTrades}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {mockMetrics.successfulTrades} Won
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                    <XCircle className="w-3 h-3 mr-1" />
                    {mockMetrics.failedTrades} Lost
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="analytics-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Success Rate</span>
                  <Target className="w-4 h-4 text-success" />
                </div>
                <p className="text-3xl font-bold metric-positive">
                  {mockMetrics.successRate.toFixed(2)}%
                </p>
                <div className="mt-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                      style={{ width: `${mockMetrics.successRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="analytics-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Net Profit</span>
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <p className="text-3xl font-bold metric-positive">
                  {formatCurrency(mockMetrics.netProfit)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Profit Factor: {mockMetrics.profitFactor.toFixed(2)}x</span>
                </div>
              </CardContent>
            </Card>

            <Card className="analytics-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <p className="text-3xl font-bold">
                  {mockMetrics.currentStreak > 0 ? '+' : ''}{mockMetrics.currentStreak}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Best: {mockMetrics.winStreak}</span>
                  <span>•</span>
                  <span>Worst: -{mockMetrics.lossStreak}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeframes">Timeframes</TabsTrigger>
              <TabsTrigger value="signals">Signal Accuracy</TabsTrigger>
              <TabsTrigger value="trends">
                <div className="flex items-center gap-1">
                  Trends
                  <Badge variant="secondary" className="ml-1 text-xs">Stage 2</Badge>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              {/* Daily Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Performance (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockDailyPerformance}>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
                      <XAxis dataKey="date" stroke={COLORS.muted} />
                      <YAxis stroke={COLORS.muted} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke={COLORS.success}
                        fill="url(#profitGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Profit/Loss Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profit/Loss Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                          <p className="text-2xl font-bold metric-positive">
                            {formatCurrency(mockMetrics.totalProfit)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Loss</p>
                          <p className="text-2xl font-bold metric-negative">
                            {formatCurrency(mockMetrics.totalLoss)}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Average Win</p>
                          <p className="text-xl font-bold">{formatCurrency(mockMetrics.averageProfit)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">Average Loss</p>
                          <p className="text-xl font-bold">{formatCurrency(mockMetrics.averageLoss)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Best & Worst Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">Best Trade</span>
                        </div>
                        <p className="text-3xl font-bold metric-positive">
                          {formatCurrency(mockMetrics.bestTrade)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Long Entry on BTC • 4h timeframe
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">Worst Trade</span>
                        </div>
                        <p className="text-3xl font-bold metric-negative">
                          {formatCurrency(mockMetrics.worstTrade)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Short Entry on ETH • 1h timeframe
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeframes" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Timeframe</CardTitle>
                  <CardDescription>
                    Compare success rates and profitability across different trading timeframes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockTimeframeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
                      <XAxis dataKey="timeframe" stroke={COLORS.muted} />
                      <YAxis stroke={COLORS.muted} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="successRate" fill={COLORS.success} name="Success Rate %" />
                      <Bar dataKey="trades" fill={COLORS.primary} name="Total Trades" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockTimeframeData.map((tf) => (
                  <Card key={tf.timeframe} className="analytics-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-lg font-bold">
                          {tf.timeframe}
                        </Badge>
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Trades</span>
                          <span className="text-lg font-bold">{tf.trades}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate</span>
                          <span className="text-lg font-bold metric-positive">
                            {tf.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Profit</span>
                          <span className="text-lg font-bold metric-positive">
                            {formatCurrency(tf.profit)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="signals" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Signal Accuracy Analysis</CardTitle>
                  <CardDescription>
                    Track the accuracy of different signal types over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSignalAccuracy.map((signal) => (
                      <div key={signal.signalType} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            <span className="font-semibold">{signal.signalType}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              signal.accuracy >= 70
                                ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                : signal.accuracy >= 50
                                ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                                : 'bg-red-500/10 text-red-600 border-red-500/30'
                            }
                          >
                            {signal.accuracy.toFixed(1)}% Accurate
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{signal.total} Total Signals</span>
                          <span>•</span>
                          <span>{signal.accurate} Accurate</span>
                          <span>•</span>
                          <span>{signal.total - signal.accurate} Inaccurate</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              signal.accuracy >= 70
                                ? 'bg-green-600'
                                : signal.accuracy >= 50
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${signal.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 mt-6">
              {/* Stage 2: Performance Trends */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Performance Trends & Pattern Evolution
                        <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                          Stage 2
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Analyze performance patterns and identify improvement opportunities
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Success Rate Trend Chart */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4 text-primary" />
                      Success Rate Evolution
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={mockPerformanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
                        <XAxis dataKey="date" stroke={COLORS.muted} />
                        <YAxis stroke={COLORS.muted} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="successRate"
                          fill={COLORS.success}
                          fillOpacity={0.2}
                          stroke={COLORS.success}
                          strokeWidth={2}
                          name="Success Rate %"
                        />
                        <Line
                          type="monotone"
                          dataKey="avgConfidence"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          name="Avg Confidence %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pattern Recognition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-600">Positive Patterns</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Success rate improving over last 4 weeks (+7%)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Average confidence increasing consistently</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>4h timeframe showing strongest performance</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-semibold text-yellow-600">Areas for Improvement</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span>1h timeframe accuracy below target (58.5%)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span>Exit signal timing could be optimized</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span>Consider higher confidence thresholds for entries</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Suggested Adjustments */}
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-accent">AI-Powered Optimization Suggestions</h4>
                      </div>
                      <div className="space-y-3">
                        {suggestedAdjustments.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-sm text-foreground/90">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategy Accuracy Graph */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Strategy Accuracy Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={mockSignalAccuracy}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
                        <XAxis dataKey="signalType" stroke={COLORS.muted} />
                        <YAxis stroke={COLORS.muted} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="accuracy" fill={COLORS.primary} name="Accuracy %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Banner */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-accent mb-1">Performance Analytics - Stage 2 Complete</p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Advanced performance tracking with trend analysis, pattern recognition, and AI-powered optimization suggestions. 
                  Monitor your trading performance across multiple timeframes and signal types to continuously improve your strategy.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
