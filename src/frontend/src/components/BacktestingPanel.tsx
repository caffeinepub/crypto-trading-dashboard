import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { runBacktest, getBacktestResults, PREDEFINED_STRATEGIES, type BacktestResults } from '@/lib/backtesting';
import type { CryptoData } from '@/lib/coinRankingApi';

interface BacktestingPanelProps {
  cryptoData: CryptoData[];
  sparklineData: Map<string, number[]>;
}

export function BacktestingPanel({ cryptoData, sparklineData }: BacktestingPanelProps) {
  const [selectedStrategy, setSelectedStrategy] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [historicalResults] = useState<BacktestResults[]>(getBacktestResults());

  const handleRunBacktest = async () => {
    setIsRunning(true);
    
    // Prepare historical data from sparklines
    const historicalData = new Map<string, Array<{ price: number; time: number }>>();
    sparklineData.forEach((prices, symbol) => {
      const data = prices.map((price, index) => ({
        price,
        time: Date.now() - (prices.length - index) * 3600000, // Hourly data
      }));
      historicalData.set(symbol, data);
    });

    const strategy = PREDEFINED_STRATEGIES[selectedStrategy];
    const backtestResults = runBacktest(strategy, historicalData);
    
    setResults(backtestResults);
    setIsRunning(false);
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Historical Backtesting</CardTitle>
              <CardDescription>Test strategies against historical data</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Selection */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Select Strategy</label>
            <Select value={selectedStrategy.toString()} onValueChange={(v) => setSelectedStrategy(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_STRATEGIES.map((strategy, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRunBacktest} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Backtest'}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <p className="text-2xl font-bold">{results.winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.winningTrades}W / {results.losingTrades}L
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Avg Gain</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(results.avgGain)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-muted-foreground">Avg Loss</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatPercentage(results.avgLoss)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {results.maxDrawdown.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Equity Curve */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Equity Curve</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(time) => new Date(time).toLocaleDateString()}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(time) => new Date(time).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trade History */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Trades</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {results.trades.slice(-10).reverse().map((trade, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={trade.type === 'win' ? 'default' : 'destructive'}>
                            {trade.symbol}
                          </Badge>
                          <div className="text-sm">
                            <p className="font-mono">{formatCurrency(trade.entryPrice)} → {formatCurrency(trade.exitPrice)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${trade.type === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(trade.roi)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
