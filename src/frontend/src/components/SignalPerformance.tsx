import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SignalPerformanceProps {
  data: CryptoData[];
  onCoinSelect?: (coin: CryptoData) => void;
}

type SignalCategory = 'Bullish EMA' | 'Bearish EMA' | 'RSI Oversold' | 'RSI Overbought';
type TimeframeFilter = '1h' | '4h' | '24h' | '7d' | '30d';

export function SignalPerformance({ data, onCoinSelect }: SignalPerformanceProps) {
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory | null>(null);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('24h');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate signal performance metrics
  const bullishEMA = data.filter(coin => coin.emaSignal === 'Bullish');
  const bearishEMA = data.filter(coin => coin.emaSignal === 'Bearish');
  const oversoldRSI = data.filter(coin => coin.rsi < 30);
  const overboughtRSI = data.filter(coin => coin.rsi > 70);

  const avgBullishChange = bullishEMA.length > 0
    ? bullishEMA.reduce((sum, coin) => sum + coin.percentChange, 0) / bullishEMA.length
    : 0;

  const avgBearishChange = bearishEMA.length > 0
    ? bearishEMA.reduce((sum, coin) => sum + coin.percentChange, 0) / bearishEMA.length
    : 0;

  const avgOversoldChange = oversoldRSI.length > 0
    ? oversoldRSI.reduce((sum, coin) => sum + coin.percentChange, 0) / oversoldRSI.length
    : 0;

  const avgOverboughtChange = overboughtRSI.length > 0
    ? overboughtRSI.reduce((sum, coin) => sum + coin.percentChange, 0) / overboughtRSI.length
    : 0;

  const bullishSuccessRate = bullishEMA.length > 0
    ? (bullishEMA.filter(coin => coin.percentChange > 0).length / bullishEMA.length) * 100
    : 0;

  const bearishSuccessRate = bearishEMA.length > 0
    ? (bearishEMA.filter(coin => coin.percentChange < 0).length / bearishEMA.length) * 100
    : 0;

  const signals = [
    {
      name: 'Bullish EMA' as SignalCategory,
      icon: TrendingUp,
      count: bullishEMA.length,
      avgChange: avgBullishChange,
      successRate: bullishSuccessRate,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      coins: bullishEMA,
    },
    {
      name: 'Bearish EMA' as SignalCategory,
      icon: TrendingDown,
      count: bearishEMA.length,
      avgChange: avgBearishChange,
      successRate: bearishSuccessRate,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      coins: bearishEMA,
    },
    {
      name: 'RSI Oversold' as SignalCategory,
      icon: Activity,
      count: oversoldRSI.length,
      avgChange: avgOversoldChange,
      successRate: oversoldRSI.length > 0 ? (oversoldRSI.filter(coin => coin.percentChange > 0).length / oversoldRSI.length) * 100 : 0,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      coins: oversoldRSI,
    },
    {
      name: 'RSI Overbought' as SignalCategory,
      icon: Activity,
      count: overboughtRSI.length,
      avgChange: avgOverboughtChange,
      successRate: overboughtRSI.length > 0 ? (overboughtRSI.filter(coin => coin.percentChange < 0).length / overboughtRSI.length) * 100 : 0,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      coins: overboughtRSI,
    },
  ];

  const handleCategoryClick = (category: SignalCategory) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleCoinClick = (coin: CryptoData) => {
    setDialogOpen(false);
    onCoinSelect?.(coin);
  };

  const selectedSignal = signals.find(s => s.name === selectedCategory);

  const getTimeframeLabel = (timeframe: TimeframeFilter) => {
    switch (timeframe) {
      case '1h':
        return '1 Hour';
      case '4h':
        return '4 Hours';
      case '24h':
        return '24 Hours';
      case '7d':
        return '7 Days';
      case '30d':
        return '30 Days';
      default:
        return timeframe;
    }
  };

  return (
    <>
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Signal Performance
              </CardTitle>
              <CardDescription>
                Performance metrics for trading signals - click to view coins
              </CardDescription>
            </div>
            <Select value={timeframeFilter} onValueChange={(v) => setTimeframeFilter(v as TimeframeFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {signals.map((signal) => (
            <Button
              key={signal.name}
              variant="ghost"
              className={`w-full p-4 h-auto rounded-lg border ${signal.bgColor} ${signal.borderColor} hover:scale-[1.02] transition-all`}
              onClick={() => handleCategoryClick(signal.name)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <signal.icon className={`w-5 h-5 ${signal.color}`} />
                    <span className="font-semibold">{signal.name}</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {signal.count} signals
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg {getTimeframeLabel(timeframeFilter)} Change</p>
                    <p className={`text-lg font-bold ${signal.avgChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {signal.avgChange >= 0 ? '+' : ''}{signal.avgChange.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-lg font-bold">
                      {signal.successRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Coins Dialog with Scrollable List */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] modal-solid-bg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSignal && <selectedSignal.icon className={`w-5 h-5 ${selectedSignal.color}`} />}
              {selectedCategory} - Triggered Coins
            </DialogTitle>
            <DialogDescription>
              Cryptocurrencies currently showing {selectedCategory} signals ({getTimeframeLabel(timeframeFilter)})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {selectedSignal?.coins.map((coin) => (
                <Button
                  key={coin.symbol}
                  variant="ghost"
                  className="w-full p-4 h-auto rounded-lg border hover:bg-accent/50 transition-colors"
                  onClick={() => handleCoinClick(coin)}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-lg">{coin.symbol}</p>
                        <p className="text-sm text-muted-foreground text-left">{coin.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">
                        ${coin.price.toFixed(coin.price >= 1 ? 2 : 6)}
                      </p>
                      <p className={`text-sm font-bold ${coin.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {coin.percentChange >= 0 ? '+' : ''}{coin.percentChange.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        RSI: {coin.rsi.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
