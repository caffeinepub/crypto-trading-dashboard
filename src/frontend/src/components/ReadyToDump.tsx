import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, Activity, AlertTriangle, Sparkles } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';

interface ReadyToDumpProps {
  data: CryptoData[];
  onCoinSelect?: (coin: CryptoData) => void;
}

type Timeframe = '1h' | '4h' | '1d' | '7d';

// Generate AI commentary for dump potential
function generateDumpCommentary(coin: CryptoData): string {
  const { rsi, emaSignal, percentChange } = coin;
  
  // Overbought analysis
  if (rsi > 70 && emaSignal === 'Bearish') {
    return `Strong overbought reversal potential with bearish momentum building. RSI at ${rsi.toFixed(1)} suggests significant downside.`;
  }
  
  if (rsi > 65 && percentChange < 0) {
    return `Showing signs of exhaustion from overbought levels. Momentum weakening with negative price action.`;
  }
  
  if (emaSignal === 'Bearish' && percentChange < -5) {
    return `Strong bearish momentum confirmed by EMA crossover. Downtrend likely to continue short-term.`;
  }
  
  if (rsi >= 50 && rsi < 70 && emaSignal === 'Bearish') {
    return `Building bearish momentum from elevated levels. Early short entry opportunity before breakdown confirmation.`;
  }
  
  // Reversal risk analysis
  if (rsi < 30) {
    return `Oversold conditions detected. Consider waiting for bounce or reversal confirmation before shorting.`;
  }
  
  if (rsi < 35 && percentChange > 0) {
    return `Recovering from oversold conditions. Short entry risk elevated due to potential bounce.`;
  }
  
  // Default balanced commentary
  return `Moderate dump potential with ${emaSignal.toLowerCase()} EMA signal. Monitor for confirmation signals.`;
}

export function ReadyToDump({ data, onCoinSelect }: ReadyToDumpProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate dump potential score for each coin
  const coinsWithScore = data.map(coin => {
    let score = 0;
    
    // EMA Signal (40 points)
    if (coin.emaSignal === 'Bearish') score += 40;
    
    // RSI Level (30 points)
    if (coin.rsi > 70) score += 30; // Overbought - high dump potential
    else if (coin.rsi >= 50 && coin.rsi <= 70) score += 20; // Above neutral
    else if (coin.rsi >= 30 && coin.rsi < 50) score += 10; // Below neutral
    
    // Recent momentum (30 points)
    if (coin.percentChange < -5) score += 30;
    else if (coin.percentChange < -2) score += 20;
    else if (coin.percentChange < 0) score += 10;
    
    return { ...coin, dumpScore: score };
  });

  // Get top 5 coins with highest dump potential
  const topDumpCoins = coinsWithScore
    .filter(coin => coin.dumpScore >= 60) // Only show coins with score >= 60
    .sort((a, b) => b.dumpScore - a.dumpScore)
    .slice(0, 5);

  const handleCoinClick = (coin: CryptoData) => {
    console.log('[ReadyToDump] 🔻 Coin selected:', coin.symbol);
    onCoinSelect?.(coin);
  };

  const timeframes: Timeframe[] = ['1h', '4h', '1d', '7d'];

  if (topDumpCoins.length === 0) {
    return (
      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-orange-500">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Ready to Dump
              </CardTitle>
              <CardDescription>
                Cryptocurrencies with high dump potential based on technical indicators
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={selectedTimeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf)}
                  className="min-w-[50px]"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No cryptocurrencies currently showing strong dump signals.</p>
            <p className="text-sm mt-2">Check back later for short opportunities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-orange-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-orange-500">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Ready to Dump
              <Badge variant="destructive" className="bg-gradient-to-r from-destructive to-orange-500">
                {topDumpCoins.length} Opportunities
              </Badge>
            </CardTitle>
            <CardDescription>
              Top cryptocurrencies with high dump potential - click cards for detailed analysis
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className="min-w-[50px]"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topDumpCoins.map((coin, index) => (
          <Button
            key={coin.symbol}
            variant="ghost"
            className="w-full p-5 h-auto rounded-xl border-2 border-destructive/20 bg-background/50 hover:bg-background/80 hover:border-destructive/40 hover:scale-[1.02] transition-all"
            onClick={() => handleCoinClick(coin)}
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-destructive to-orange-500 text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{coin.symbol}</p>
                    <p className="text-sm text-muted-foreground">{coin.name}</p>
                  </div>
                </div>
                <Badge 
                  variant="destructive"
                  className="bg-gradient-to-r from-destructive to-orange-500 text-white font-bold px-4 py-1.5 text-base"
                >
                  {coin.dumpScore} / 100
                </Badge>
              </div>

              {/* AI Commentary */}
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">AI Analysis</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {generateDumpCommentary(coin)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mb-1" />
                  <p className="text-xs text-muted-foreground">EMA Signal</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {coin.emaSignal}
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-1" />
                  <p className="text-xs text-muted-foreground">RSI (14)</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {coin.rsi.toFixed(1)}
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <TrendingDown className="w-5 h-5 text-destructive mb-1" />
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  <p className={`text-sm font-semibold ${coin.percentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {coin.percentChange >= 0 ? '+' : ''}{coin.percentChange.toFixed(2)}%
                  </p>
                </div>
              </div>

              {coin.rsi > 70 && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Overbought condition - potential short opportunity
                  </p>
                </div>
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
