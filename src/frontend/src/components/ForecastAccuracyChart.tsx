import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistoricalForecasts, calculateForecastAccuracy, type HistoricalForecast } from '@/lib/forecastEngine';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface ForecastAccuracyChartProps {
  symbol: string;
}

export function ForecastAccuracyChart({ symbol }: ForecastAccuracyChartProps) {
  const [historyData, setHistoryData] = useState<HistoricalForecast[]>([]);
  const [accuracyScores, setAccuracyScores] = useState({
    '1h': 0,
    '4h': 0,
    '1d': 0
  });

  useEffect(() => {
    console.log(`[Forecast Accuracy] 📊 Loading history for ${symbol}`);
    const history = getHistoricalForecasts(symbol);
    setHistoryData(history);

    // Calculate accuracy for each timeframe
    const scores = {
      '1h': calculateForecastAccuracy(symbol, '1h'),
      '4h': calculateForecastAccuracy(symbol, '4h'),
      '1d': calculateForecastAccuracy(symbol, '1d')
    };
    setAccuracyScores(scores);

    console.log(`[Forecast Accuracy] ✅ Loaded ${history.length} historical forecasts`);
  }, [symbol]);

  if (historyData.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <img 
              src="/assets/generated/forecast-accuracy-chart.dim_400x300.png" 
              alt="Accuracy" 
              className="w-5 h-5"
            />
            Historical Forecast Accuracy
          </CardTitle>
          <CardDescription>Track prediction performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No historical forecast data available yet.</p>
            <p className="text-sm mt-1">Predictions will be tracked automatically over time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = historyData
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(forecast => ({
      time: new Date(forecast.timestamp).toLocaleDateString(),
      predicted: forecast.prediction,
      actual: forecast.actual,
      error: Math.abs(forecast.prediction - forecast.actual)
    }));

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'bg-green-600 text-white';
    if (accuracy >= 50) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <img 
            src="/assets/generated/forecast-accuracy-chart.dim_400x300.png" 
            alt="Accuracy" 
            className="w-5 h-5"
          />
          Historical Forecast Accuracy - {symbol}
        </CardTitle>
        <CardDescription>
          Comparing predictions vs actual price movements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accuracy Scores */}
        <div className="grid grid-cols-3 gap-3">
          {(['1h', '4h', '1d'] as const).map((timeframe) => (
            <div key={timeframe} className="p-3 rounded-lg bg-background/50 border text-center">
              <p className="text-xs text-muted-foreground mb-1">{timeframe} Accuracy</p>
              <Badge className={getAccuracyColor(accuracyScores[timeframe])}>
                {accuracyScores[timeframe].toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Accurate Predictions</span>
            </div>
            <p className="text-lg font-bold">
              {historyData.filter(f => Math.abs(f.prediction - f.actual) < 2).length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Missed Predictions</span>
            </div>
            <p className="text-lg font-bold">
              {historyData.filter(f => Math.abs(f.prediction - f.actual) >= 2).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
