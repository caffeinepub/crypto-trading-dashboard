import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rocket, TrendingUp, Activity, AlertTriangle, Sparkles } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';

interface ReadyToPumpProps {
  data: CryptoData[];
  onCoinSelect?: (coin: CryptoData) => void;
}

// Generate AI commentary for each coin
function generateAICommentary(coin: CryptoData): string {
  const { rsi, emaSignal, percentChange } = coin;
  
  // Momentum analysis
  if (rsi < 30 && emaSignal === 'Bullish') {
    return `Strong oversold bounce potential with bullish momentum building. RSI at ${rsi.toFixed(1)} suggests significant upside.`;
  }
  
  if (rsi < 35 && percentChange > 0) {
    return `Recovering from oversold conditions with positive momentum. Watch for continuation above resistance.`;
  }
  
  if (emaSignal === 'Bullish' && percentChange > 5) {
    return `Strong bullish momentum confirmed by EMA crossover. Trend likely to continue short-term.`;
  }
  
  if (rsi >= 30 && rsi < 50 && emaSignal === 'Bullish') {
    return `Building momentum from neutral zone. Early entry opportunity before breakout confirmation.`;
  }
  
  // Reversal risk analysis
  if (rsi > 70) {
    return `Overbought conditions detected. Consider waiting for pullback or reversal confirmation.`;
  }
  
  if (rsi > 65 && percentChange < 0) {
    return `Showing signs of exhaustion. Momentum weakening despite elevated RSI levels.`;
  }
  
  // Default balanced commentary
  return `Moderate pump potential with ${emaSignal.toLowerCase()} EMA signal. Monitor for confirmation signals.`;
}

export function ReadyToPump({ data, onCoinSelect }: ReadyToPumpProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate pump potential score for each coin
  const coinsWithScore = data.map(coin => {
    let score = 0;
    
    // EMA Signal (40 points)
    if (coin.emaSignal === 'Bullish') score += 40;
    
    // RSI Level (30 points)
    if (coin.rsi < 30) score += 30; // Oversold - high potential
    else if (coin.rsi >= 30 && coin.rsi < 50) score += 20; // Below neutral
    else if (coin.rsi >= 50 && coin.rsi < 70) score += 10; // Above neutral
    
    // Recent momentum (30 points)
    if (coin.percentChange > 5) score += 30;
    else if (coin.percentChange > 2) score += 20;
    else if (coin.percentChange > 0) score += 10;
    
    return { ...coin, pumpScore: score };
  });

  // Get top 5 coins with highest pump potential
  const topPumpCoins = coinsWithScore
    .filter(coin => coin.pumpScore >= 60) // Only show coins with score >= 60
    .sort((a, b) => b.pumpScore - a.pumpScore)
    .slice(0, 5);

  const handleCoinClick = (coin: CryptoData) => {
    console.log('[ReadyToPump] 🚀 Coin selected:', coin.symbol);
    onCoinSelect?.(coin);
  };

  if (topPumpCoins.length === 0) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Ready to Pump
              </CardTitle>
              <CardDescription>
                Cryptocurrencies with high pump potential based on technical indicators
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No cryptocurrencies currently showing strong pump signals.</p>
            <p className="text-sm mt-2">Check back later for opportunities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Ready to Pump
              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                {topPumpCoins.length} Opportunities
              </Badge>
            </CardTitle>
            <CardDescription>
              Top cryptocurrencies with high pump potential - click cards for detailed analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topPumpCoins.map((coin, index) => (
          <Button
            key={coin.symbol}
            variant="ghost"
            className="w-full p-5 h-auto rounded-xl border-2 border-primary/20 bg-background/50 hover:bg-background/80 hover:border-primary/40 hover:scale-[1.02] transition-all"
            onClick={() => handleCoinClick(coin)}
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{coin.symbol}</p>
                    <p className="text-sm text-muted-foreground">{coin.name}</p>
                  </div>
                </div>
                <Badge 
                  variant="default"
                  className="bg-gradient-to-r from-primary to-accent text-white font-bold px-4 py-1.5 text-base"
                >
                  {coin.pumpScore} / 100
                </Badge>
              </div>

              {/* AI Commentary */}
              <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold text-accent">AI Analysis</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {generateAICommentary(coin)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-xs text-muted-foreground">EMA Signal</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {coin.emaSignal}
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-xs text-muted-foreground">RSI (14)</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {coin.rsi.toFixed(1)}
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <TrendingUp className="w-5 h-5 text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  <p className={`text-sm font-semibold ${coin.percentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {coin.percentChange >= 0 ? '+' : ''}{coin.percentChange.toFixed(2)}%
                  </p>
                </div>
              </div>

              {coin.rsi < 30 && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Oversold condition - potential buying opportunity
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
