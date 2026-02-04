import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { getForecastVerifications, getAccuracySummary, type ForecastVerification } from '@/lib/forecastEngine';
import type { CryptoData } from '@/lib/coinRankingApi';

interface ForecastVerificationToolProps {
  data: CryptoData[];
  selectedSymbol?: string;
}

export function ForecastVerificationTool({ data, selectedSymbol }: ForecastVerificationToolProps) {
  const [symbol, setSymbol] = useState<string>(selectedSymbol || 'BTC');
  const [verifications, setVerifications] = useState<ForecastVerification[]>([]);
  const [accuracySummary, setAccuracySummary] = useState<{
    overall: number;
    byTimeframe: { '1h': number; '4h': number; '1d': number };
    totalPredictions: number;
  }>({ overall: 0, byTimeframe: { '1h': 0, '4h': 0, '1d': 0 }, totalPredictions: 0 });

  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    console.log(`[Forecast Verification] 📊 Loading verifications for ${symbol}`);
    const allVerifications = getForecastVerifications(symbol);
    setVerifications(allVerifications);
    
    const summary = getAccuracySummary(symbol, 7);
    setAccuracySummary(summary);
    
    console.log(`[Forecast Verification] ✅ Loaded ${allVerifications.length} verifications`);
  }, [symbol]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 70) return 'bg-green-600 text-white hover:bg-green-700';
    if (accuracy >= 50) return 'bg-yellow-600 text-white hover:bg-yellow-700';
    return 'bg-red-600 text-white hover:bg-red-700';
  };

  // Prepare chart data
  const chartData = verifications
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-20) // Last 20 verifications
    .map(v => ({
      time: new Date(v.timestamp).toLocaleDateString(),
      predicted: v.predictedChange,
      actual: v.actualChange,
      accuracy: v.accuracy,
      timeframe: v.timeframe
    }));

  // Accuracy by timeframe chart data
  const timeframeData = [
    { timeframe: '1 Hour', accuracy: accuracySummary.byTimeframe['1h'] },
    { timeframe: '4 Hours', accuracy: accuracySummary.byTimeframe['4h'] },
    { timeframe: '1 Day', accuracy: accuracySummary.byTimeframe['1d'] }
  ];

  if (verifications.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <img 
              src="/assets/generated/forecast-verification-dashboard.dim_800x600.png" 
              alt="Verification" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <CardTitle className="text-lg">Forecast Verification Tool</CardTitle>
              <CardDescription>Compare AI predictions vs actual price movements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No verification data available yet.</p>
            <p className="text-sm mt-1">Forecasts will be automatically verified as new data arrives.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/generated/forecast-verification-dashboard.dim_800x600.png" 
              alt="Verification" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <CardTitle className="text-lg">Forecast Verification Tool</CardTitle>
              <CardDescription>Real-time accuracy tracking and performance analysis</CardDescription>
            </div>
          </div>
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.slice(0, 20).map((crypto) => (
                <SelectItem key={crypto.symbol} value={crypto.symbol}>
                  {crypto.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Accuracy Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Overall Accuracy</span>
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(accuracySummary.overall)}`}>
              {accuracySummary.overall.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </div>
          
          {(['1h', '4h', '1d'] as const).map((timeframe) => (
            <div key={timeframe} className="p-4 rounded-lg bg-background/60 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{timeframe} Forecast</span>
                {accuracySummary.byTimeframe[timeframe] >= 70 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <Badge className={getAccuracyBadgeColor(accuracySummary.byTimeframe[timeframe])}>
                {accuracySummary.byTimeframe[timeframe].toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>

        {/* Accuracy by Timeframe Chart */}
        <div className="p-4 rounded-lg bg-background/50 border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <img 
              src="/assets/generated/forecast-accuracy-chart.dim_400x300.png" 
              alt="Chart" 
              className="w-5 h-5"
            />
            Accuracy by Timeframe
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeframeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="timeframe" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                />
                <Bar 
                  dataKey="accuracy" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predicted vs Actual Chart */}
        <div className="p-4 rounded-lg bg-background/50 border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Predicted vs Actual Price Changes
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Change (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'predicted' ? 'Predicted' : 'Actual'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Predicted"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="Actual"
                  dot={{ fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Verifications */}
        <div className="p-4 rounded-lg bg-background/50 border">
          <h3 className="text-sm font-semibold mb-4">Recent Verifications</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {verifications.slice(-10).reverse().map((v, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg bg-background/80 border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {v.timeframe}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Predicted: {v.predictedChange > 0 ? '+' : ''}{v.predictedChange.toFixed(2)}% | 
                      Actual: {v.actualChange > 0 ? '+' : ''}{v.actualChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.accuracy >= 70 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : v.accuracy >= 50 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Badge className={getAccuracyBadgeColor(v.accuracy)}>
                    {v.accuracy.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">High Accuracy (≥70%)</span>
            </div>
            <p className="text-lg font-bold">
              {verifications.filter(v => v.accuracy >= 70).length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Low Accuracy (&lt;50%)</span>
            </div>
            <p className="text-lg font-bold">
              {verifications.filter(v => v.accuracy < 50).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
